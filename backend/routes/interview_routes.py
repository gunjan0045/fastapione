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
from ai_service import generate_interview_question, generate_feedback, generate_interview_summary, generate_chat_response

# ✅ Pydantic models
class GetQuestionRequest(BaseModel):
    resume_id: int
    question_number: int = 1

class SubmitAnswerRequest(BaseModel):
    resume_id: int
    question: str
    answer: str

class InterviewSummaryRequest(BaseModel):
    resume_id: int
    questions_and_answers: List[dict]

class CreateHistoryRequest(BaseModel):
    score: int
    feedback: str

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
        score=request.score,
        feedback=request.feedback
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