from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from database import Base
import datetime

# ✅ USER MODEL
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ✅ RESUME MODEL
class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    
    # 🔥 Proper foreign key relation
    user_id = Column(Integer, ForeignKey("users.id"), index=True)

    filename = Column(String, nullable=False)
    extracted_text = Column(Text)   # 👈 long text ke liye Text use karo

    # Parsed details
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    skills = Column(Text, nullable=True)  # 👈 better than String

    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ✅ INTERVIEW HISTORY
class InterviewHistory(Base):
    __tablename__ = "interview_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)

    score = Column(Integer)
    feedback = Column(Text)  # 👈 long feedback ke liye Text

    created_at = Column(DateTime, default=datetime.datetime.utcnow)