from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

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
    created_at: datetime
    
    class Config:
        from_attributes = True

class InterviewHistoryResponse(BaseModel):
    id: int
    user_id: int
    score: int
    feedback: str
    created_at: datetime
    
    class Config:
        from_attributes = True
