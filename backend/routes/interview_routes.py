from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
import json
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
    questions: str
    answers: str
    per_question_feedback: str
    technical_score: int
    communication_score: int
    body_language_score: int
    final_score: int
    final_feedback: str
    body_language_feedback: str

class ChatMessageRequest(BaseModel):
    message: str

router = APIRouter(tags=["interview"])


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

    res = generate_initial_questions(parsed_data, request.mode)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))

    return res["data"]


class EvaluateDynamicRequest(BaseModel):
    question: str
    answer: str
    difficulty: str
    history: List[dict]

@router.post("/evaluate-dynamic")
def evaluate_dynamic(
    request: EvaluateDynamicRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    res = evaluate_and_generate_followup(request.question, request.history, request.answer, request.difficulty)
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


@router.post("/history")
def create_interview_history(
    request: CreateHistoryRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    record = models.InterviewHistory(
        user_id=current_user.id,
        resume_id=request.resume_id,
        questions=request.questions,
        answers=request.answers,
        per_question_feedback=request.per_question_feedback,
        technical_score=request.technical_score,
        communication_score=request.communication_score,
        body_language_score=request.body_language_score,
        final_score=request.final_score,
        final_feedback=request.final_feedback,
        body_language_feedback=request.body_language_feedback
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


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