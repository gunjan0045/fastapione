from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
import json
import re
import cv2
import numpy as np
import base64

from database import get_db
import models
import schemas
from auth import get_current_user, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
from typing import List
from pydantic import BaseModel
from ai_service import generate_interview_question, generate_feedback, generate_interview_summary, generate_chat_response, evaluate_body_language_frame
from interview_engine import generate_initial_questions, evaluate_and_generate_followup, analyze_submitted_code
from pdf_report import build_feedback_pdf
from notification_service import send_interview_report_email

# ✅ Pydantic models
class GetQuestionRequest(BaseModel):
    resume_id: int
    question_number: int = 1

class EvaluateBodyLanguageRequest(BaseModel):
    frame_base64: str

class SubmitAnswerRequest(BaseModel):
    resume_id: int
    question: str
    answer: str

class InterviewSummaryRequest(BaseModel):
    resume_id: int
    questions_and_answers: List[dict]

class CreateHistoryRequest(BaseModel):
    resume_id: int
    questions: str = "[]"
    answers: str = "[]"
    per_question_feedback: str = "[]"
    technical_score: int = 0
    communication_score: int = 0
    problem_solving_score: int = 0
    body_language_score: int = 0
    final_score: int = 0
    final_feedback: str = ""
    body_language_feedback: str = ""

class ChatMessageRequest(BaseModel):
    message: str

router = APIRouter(tags=["interview"])


def _clamp_score(value, fallback: int = 50) -> int:
    try:
        return max(0, min(100, int(round(float(value)))))
    except Exception:
        return fallback


def _average_score(entries: list, key: str):
    values = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        raw_value = entry.get(key)
        try:
            numeric = float(raw_value)
        except Exception:
            continue
        if numeric < 0 or numeric > 100:
            continue
        values.append(numeric)

    if not values:
        return None
    return int(round(sum(values) / len(values)))


def _build_history_payload(record, current_user, resume):
    question_count = 0
    try:
        parsed_questions = json.loads(record.questions or "[]")
        if isinstance(parsed_questions, list):
            question_count = len(parsed_questions)
    except Exception:
        question_count = 0

    estimated_minutes = max(4, question_count * 2) if question_count else 0

    return {
        "id": record.id,
        "user_id": record.user_id,
        "resume_id": record.resume_id,
        "candidate_name": current_user.name,
        "candidate_email": current_user.email,
        "interview_title": f"Interview Session #{record.id}",
        "resume_filename": getattr(resume, "filename", None),
        "domain_hint": " ".join([
            getattr(resume, "filename", "") or "",
            getattr(resume, "skills", "") or "",
            getattr(resume, "parsed_data", "") or "",
            record.questions or "",
        ]),
        "session_duration": f"~{estimated_minutes} minutes" if estimated_minutes else "Not available",
        "questions": record.questions,
        "answers": record.answers,
        "per_question_feedback": record.per_question_feedback,
        "technical_score": record.technical_score,
        "communication_score": record.communication_score,
        "problem_solving_score": getattr(record, "problem_solving_score", 0) or 0,
        "body_language_score": record.body_language_score,
        "final_score": record.final_score,
        "final_feedback": record.final_feedback,
        "body_language_feedback": record.body_language_feedback,
        "completed_at": record.completed_at,
    }


def _send_interview_report_email_task(recipient_email: str, candidate_name: str, history_payload: dict) -> None:
    try:
        pdf_bytes = build_feedback_pdf(dict(history_payload))
    except Exception as exc:
        print(f"[Interview] Failed to build report PDF for email: {exc}")
        return

    try:
        sent = send_interview_report_email(recipient_email, candidate_name, history_payload, pdf_bytes)
        if not sent:
            print(f"[Interview] Report email could not be sent to {recipient_email}")
    except Exception as exc:
        print(f"[Interview] Report email task failed for {recipient_email}: {exc}")


# ✅ FIX: Lazy MediaPipe Loader
def get_face_mesh():
    import mediapipe as mp
    mp_face_mesh = mp.solutions.face_mesh
    return mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )


# ---------------- EXPERT BOOKING ----------------

@router.post("/book-expert")
def book_expert(
    request: schemas.HumanBookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    booking = models.HumanBooking(
        user_id=current_user.id,
        domain=request.domain,
        experience_level=request.experience_level,
        preferred_date=request.preferred_date,
        preferred_time=request.preferred_time,
        duration=request.duration,
        notes=request.notes
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return {"success": True, "booking_id": booking.id}


# ---------------- DYNAMIC AI INTERVIEW ENGINE ----------------

class StartDynamicRequest(BaseModel):
    resume_id: int
    mode: str
    difficulty: str = "Medium"

@router.post("/start-dynamic")
def start_dynamic_interview(
    request: StartDynamicRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == request.resume_id,
        models.Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    parsed_data = {}
    if resume.parsed_data:
        try:
            parsed_data = json.loads(resume.parsed_data)
        except Exception:
            pass

    res = generate_initial_questions(parsed_data, request.mode, request.difficulty)
    if not res.get("success"):
        detail = str(res.get("error") or "Unable to generate initial question")
        lowered = detail.lower()
        if "503" in lowered or "unavailable" in lowered or "high demand" in lowered:
            raise HTTPException(status_code=503, detail=detail)
        if "resume" in lowered and "not found" in lowered:
            raise HTTPException(status_code=404, detail=detail)
        raise HTTPException(status_code=500, detail=detail)

    return res["data"]


class EvaluateDynamicRequest(BaseModel):
    question: str
    answer: str
    difficulty: str
    history: List[dict]
    skill_context: List[str] = []
    mode: str = "Mixed"

@router.post("/evaluate-dynamic")
def evaluate_dynamic(
    request: EvaluateDynamicRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    res = evaluate_and_generate_followup(
        request.question,
        request.history,
        request.answer,
        request.difficulty,
        request.skill_context,
        request.mode,
    )
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))

    return res["data"]


class EvaluateCodeRequest(BaseModel):
    question: str
    language: str
    code: str

@router.post("/evaluate-code")
def evaluate_code(
    request: EvaluateCodeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    res = analyze_submitted_code(request.question, request.language, request.code)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))

    return res["data"]


@router.post("/evaluate-body-language")
def evaluate_body_language(
    request: EvaluateBodyLanguageRequest,
    current_user: models.User = Depends(get_current_user)
):
    res = evaluate_body_language_frame(request.frame_base64)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))

    return res["data"]


# ---------------- HISTORY ----------------

@router.get("/history", response_model=List[schemas.InterviewHistoryResponse])
def get_interview_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.InterviewHistory).filter(
        models.InterviewHistory.user_id == current_user.id
    ).order_by(models.InterviewHistory.id.desc()).all()


@router.get("/history/{history_id}", response_model=schemas.InterviewHistoryResponse)
def get_single_interview_history(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    record = db.query(models.InterviewHistory).filter(
        models.InterviewHistory.user_id == current_user.id,
        models.InterviewHistory.id == history_id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    return record


@router.post("/history")
def create_interview_history(
    request: CreateHistoryRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    feedback_items = []
    try:
        parsed_feedback = json.loads(request.per_question_feedback or "[]")
        if isinstance(parsed_feedback, list):
            feedback_items = parsed_feedback
    except Exception:
        feedback_items = []

    technical_score = _average_score(feedback_items, "technical_score")
    communication_score = _average_score(feedback_items, "communication_score")
    problem_solving_score = _average_score(feedback_items, "problem_solving_score")

    if technical_score is None:
        technical_score = _clamp_score(request.technical_score, fallback=50)
    if communication_score is None:
        communication_score = _clamp_score(request.communication_score, fallback=50)
    if problem_solving_score is None:
        problem_solving_score = _clamp_score(request.problem_solving_score, fallback=50)

    body_language_score = _clamp_score(request.body_language_score, fallback=50)
    confidence_score = _average_score(feedback_items, "confidence_score")
    if confidence_score is None:
        confidence_score = 50

    final_score = int(round(
        (technical_score * 0.4) +
        (communication_score * 0.2) +
        (problem_solving_score * 0.2) +
        (confidence_score * 0.1) +
        (body_language_score * 0.1)
    ))

    record = models.InterviewHistory(
        user_id=current_user.id,
        resume_id=request.resume_id,
        questions=request.questions,
        answers=request.answers,
        per_question_feedback=request.per_question_feedback,
        technical_score=technical_score,
        communication_score=communication_score,
        problem_solving_score=problem_solving_score,
        body_language_score=body_language_score,
        final_score=final_score,
        final_feedback=request.final_feedback,
        body_language_feedback=request.body_language_feedback
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    resume = db.query(models.Resume).filter(
        models.Resume.id == record.resume_id,
        models.Resume.user_id == current_user.id
    ).first() if record.resume_id else None

    if current_user.email and current_user.email_notifications:
        history_payload = _build_history_payload(record, current_user, resume)
        background_tasks.add_task(
            _send_interview_report_email_task,
            current_user.email,
            current_user.name,
            history_payload,
        )

    return record


@router.delete("/history/{history_id}")
def delete_interview_history(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    record = db.query(models.InterviewHistory).filter(
        models.InterviewHistory.id == history_id,
        models.InterviewHistory.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Interview session not found")

    db.delete(record)
    db.commit()
    return {"success": True}


@router.get("/history/{history_id}/pdf")
def download_interview_history_pdf(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    record = db.query(models.InterviewHistory).filter(
        models.InterviewHistory.id == history_id,
        models.InterviewHistory.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Interview session not found")

    resume = db.query(models.Resume).filter(
        models.Resume.id == record.resume_id,
        models.Resume.user_id == current_user.id
    ).first() if record.resume_id else None

    history = _build_history_payload(record, current_user, resume)

    pdf_bytes = build_feedback_pdf(history)
    filename = f"interview-feedback-{history_id}.pdf"

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.post("/chat")
def chat_with_bot(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = generate_chat_response(request.message)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    return {"success": True, "reply": result.get("reply")}


# ---------------- AI QUESTIONS ----------------

@router.post("/question/generate")
async def get_interview_question(
    request: GetQuestionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == request.resume_id,
        models.Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.extracted_text:
        raise HTTPException(status_code=400, detail="Resume text not extracted")

    result = generate_interview_question(
        resume_text=resume.extracted_text,
        question_count=request.question_number
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))

    return {
        "success": True,
        "question": result.get("question"),
        "category": result.get("category"),
        "difficulty": result.get("difficulty")
    }


@router.post("/answer/feedback")
async def submit_answer(
    request: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == request.resume_id,
        models.Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    result = generate_feedback(
        resume_text=resume.extracted_text,
        question=request.question,
        user_response=request.answer
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))

    return {"success": True, "feedback": result.get("feedback")}


@router.post("/summary")
async def get_interview_summary(
    request: InterviewSummaryRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == request.resume_id,
        models.Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    result = generate_interview_summary(
        resume_text=resume.extracted_text,
        questions_and_answers=request.questions_and_answers
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))

    return {"success": True, "summary": result.get("summary")}


# ---------------- WEBSOCKET ----------------

async def get_current_user_ws(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        return None

    return db.query(models.User).filter(models.User.email == email).first()


@router.websocket("/ws")
async def interview_websocket(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    await websocket.accept()

    user = await get_current_user_ws(token, db)
    if not user:
        await websocket.close(code=1008)
        return

    face_mesh = get_face_mesh()  # ✅ YAHI INIT HOGA AB

    try:
        frame_counter = 0

        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)

            if payload.get("type") == "video_frame":
                frame_counter += 1

                if frame_counter % 15 == 0:
                    frame_data = payload.get("frame", "").split(",")[1]

                    img_bytes = base64.b64decode(frame_data)
                    np_arr = np.frombuffer(img_bytes, np.uint8)
                    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                    if img is not None:
                        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                        results = face_mesh.process(rgb)

                        if results.multi_face_landmarks:
                            pass

    except WebSocketDisconnect:
        pass