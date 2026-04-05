from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional, Any
import json

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    extracted_text: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    skills: Optional[str] = None
    parsed_data: Optional[Any] = None
    created_at: datetime
    
    @field_validator("parsed_data", mode="before")
    def parse_data(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                pass
        return v
    
    class Config:
        from_attributes = True

class InterviewHistoryResponse(BaseModel):
    id: int
    user_id: int
    resume_id: Optional[int] = None
    questions: Optional[str] = None
    answers: Optional[str] = None
    per_question_feedback: Optional[str] = None
    technical_score: int
    communication_score: int
    body_language_score: int
    final_score: int
    final_feedback: Optional[str] = None
    body_language_feedback: Optional[str] = None
    completed_at: datetime
    
    class Config:
        from_attributes = True

class HumanBookingCreate(BaseModel):
    domain: str
    experience_level: str
    preferred_date: str
    preferred_time: str
    duration: str
    notes: Optional[str] = None

class HumanBookingResponse(HumanBookingCreate):
    id: int
    user_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
