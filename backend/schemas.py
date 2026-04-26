from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional, Any
import json # For parsing JSON strings in the ResumeResponse schema

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    email_notifications: bool = True
    newsletter_enabled: bool = False
    profile_public: bool = True
    two_factor_enabled: bool = False
    dark_mode_preference: bool = True
    data_export_enabled: bool = True
    language: str = "English"
    region: str = "India"
    email_verified: bool = False
    password_last_changed_at: Optional[datetime] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    date_of_birth: Optional[str] = None
    government_id_type: Optional[str] = None
    government_id_number: Optional[str] = None
    college_name: Optional[str] = None
    school_name: Optional[str] = None
    highest_qualification: Optional[str] = None
    profession: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    bio: Optional[str] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str


class UserSettingsUpdate(BaseModel):
    name: Optional[str] = None
    email_notifications: Optional[bool] = None
    newsletter_enabled: Optional[bool] = None
    profile_public: Optional[bool] = None
    two_factor_enabled: Optional[bool] = None
    dark_mode_preference: Optional[bool] = None
    data_export_enabled: Optional[bool] = None
    language: Optional[str] = None
    region: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    date_of_birth: Optional[str] = None
    government_id_type: Optional[str] = None
    government_id_number: Optional[str] = None
    college_name: Optional[str] = None
    school_name: Optional[str] = None
    highest_qualification: Optional[str] = None
    profession: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    bio: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    email: EmailStr
    current_password: str
    new_password: str


class TestEmailRequest(BaseModel):
    recipient_email: Optional[EmailStr] = None


class VerifyEmailCodeRequest(BaseModel):
    code: str


class VerifyEmailSendRequest(BaseModel):
    recipient_email: Optional[EmailStr] = None

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
    problem_solving_score: int
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