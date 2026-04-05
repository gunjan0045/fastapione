from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import fitz  # PyMuPDF
import spacy
import re

from database import get_db
import models
import schemas
import schemas
from auth import get_current_user
from typing import List
import json
from ai_service import parse_resume_with_ai

# ❗ REMOVE prefix here (main.py already handles it)
router = APIRouter()

# ✅ Load spacy model safely
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = None


# ✅ Extract basic profile
def extract_profile_from_text(text: str):
    normalized = text.replace("\r\n", "\n")
    lines = [l.strip() for l in normalized.split("\n") if l.strip()]

    email = None
    phone = None
    address = None
    name = None

    # Email
    email_match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", normalized)
    if email_match:
        email = email_match.group(0)

    # Phone
    phone_match = re.search(r"(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}", normalized)
    if phone_match:
        phone = phone_match.group(0)

    # Address
    for line in lines:
        if re.search(r"\b(street|road|avenue|lane|drive|city|zip)\b", line, re.IGNORECASE):
            address = line
            break

    # Name (first valid line)
    for line in lines:
        if email and email in line:
            continue
        if phone and phone in line:
            continue
        if len(line) <= 100:
            name = line
            break

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "address": address
    }


# ✅ Upload Resume
@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validate file
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Read PDF
    try:
        contents = await file.read()
        doc = fitz.open(stream=contents, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading PDF: {str(e)}")
    
    # ✅ Call new structured AI parsing
    parsing_result = parse_resume_with_ai(text)
    
    parsed_json = None
    if parsing_result.get("success"):
        data = parsing_result["data"]
        parsed_json = json.dumps(data)
        
        # Hydrate profile
        profile = {
            "name": data.get("name"),
            "email": data.get("email"),
            "phone": data.get("phone"),
            "address": data.get("address")
        }
        
        # Hydrate arbitrary basic skills for the short dashboard cards
        raw_skills = data.get("technical_skills", [])
        if isinstance(raw_skills, list):
            skills = list(set([s if isinstance(s, str) else str(s) for s in raw_skills]))[:15]
        else:
            skills = []
    else:
        print("Fallback to basic extraction due to AI failure")
        profile = extract_profile_from_text(text)
        skills = []
        if nlp:
            doc_nlp = nlp(text)
            for ent in doc_nlp.ents:
                if ent.label_ in ["ORG", "PRODUCT"]:
                    skills.append(ent.text.strip())
        skills = list(set(skills))[:15]

    # Save to DB
    resume_record = models.Resume(
        user_id=current_user.id,
        filename=file.filename,
        extracted_text=text,
        name=profile.get("name"),
        email=profile.get("email"),
        phone=profile.get("phone"),
        address=profile.get("address"),
        skills=",".join(skills) if skills else "",
        parsed_data=parsed_json
    )

    db.add(resume_record)
    db.commit()
    db.refresh(resume_record)

    return {
        "message": "Resume uploaded successfully ✅",
        "resume_id": resume_record.id,
        "skills": skills,
        "profile": profile
    }


# ✅ Get resumes
@router.get("/", response_model=List[schemas.ResumeResponse])
def get_resumes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resumes = db.query(models.Resume).filter(
        models.Resume.user_id == current_user.id
    ).all()

    return resumes

# ✅ Delete resume
@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    db.delete(resume)
    db.commit()

    return {"message": "Resume deleted successfully"}