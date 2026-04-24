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


SECTION_ALIASES = {
    "summary": ["summary", "career objective", "objective", "profile", "about"],
    "technical_skills": ["technical skills", "skills", "skill set", "technologies", "technical expertise"],
    "personal_skills": ["personal skills", "soft skills", "interpersonal skills"],
    "experience": ["experience", "work experience", "professional experience", "employment history"],
    "education": ["education", "academic background", "qualification"],
    "projects": ["projects", "project work", "academic projects"],
    "certifications": ["certifications", "certificate", "certificates"],
    "achievements": ["achievements", "awards", "accomplishments"],
    "languages": ["languages", "language"],
    "personal_details": ["personal details"],
}

EXACT_HEADING_MAP = {
    "job objective": "summary",
    "objective": "summary",
    "career objective": "summary",
    "profile": "summary",
    "about": "summary",
    "workexperience": "experience",
    "work experience": "experience",
    "experience": "experience",
    "personal details": "personal_details",
    "academic qualification": "education",
    "education": "education",
    "computer skill": "technical_skills",
    "computer skills": "technical_skills",
    "technical skills": "technical_skills",
    "personal skill": "personal_skills",
    "personal skills": "personal_skills",
    "language known": "languages",
    "languages": "languages",
    "projects": "projects",
    "project": "projects",
    "certification": "certifications",
    "certifications": "certifications",
    "achievement": "achievements",
    "achievements": "achievements",
}


def _split_text_lines(text: str):
    return [line.strip() for line in (text or '').replace('\r\n', '\n').split('\n') if line.strip()]


def _normalize_item_list(value):
    if isinstance(value, list):
        normalized = []
        for item in value:
            normalized.extend(_normalize_item_list(item))
        return normalized
    if isinstance(value, str) and value.strip():
        parts = [part.strip() for part in re.split(r'[,\n;•|/]', value) if part.strip()]
        split_parts = []
        for part in parts:
            if ' and ' in part.lower():
                split_parts.extend([piece.strip() for piece in re.split(r'\band\b', part, flags=re.IGNORECASE) if piece.strip()])
            else:
                split_parts.append(part)
        return [part for part in split_parts if part]
    return []


def _looks_like_heading(line: str) -> bool:
    stripped = re.sub(r'[:\-–—]+$', '', line).strip()
    normalized = stripped.lower()
    if normalized in EXACT_HEADING_MAP:
        return True

    words = stripped.split()
    if 1 <= len(words) <= 5 and stripped.upper() == stripped:
        return True

    if len(words) <= 4 and stripped.istitle() and not re.search(r'[.!?]', stripped):
        return True

    return False


def _detect_section_key(line: str):
    normalized = re.sub(r'[:\-–—]+$', '', line).strip().lower()
    if normalized in EXACT_HEADING_MAP:
        return EXACT_HEADING_MAP[normalized]
    for key, aliases in SECTION_ALIASES.items():
        if any(normalized == alias or normalized.startswith(alias + ' ') for alias in aliases):
            return key
    return None


def _parse_resume_sections(text: str):
    lines = _split_text_lines(text)
    sections = {key: [] for key in SECTION_ALIASES}
    current_key = None

    for line in lines:
        heading_key = _detect_section_key(line)
        if _looks_like_heading(line) and heading_key:
            current_key = heading_key
            continue

        if _looks_like_heading(line) and not heading_key:
            current_key = None
            continue

        if current_key:
            sections[current_key].append(line)

    return sections


def _extract_list_from_section(section_lines):
    items = []
    for raw_line in section_lines:
        line = raw_line.strip().lstrip('-*•').strip()
        if not line:
            continue
        if len(line) > 2:
            items.append(line)
    return items


def _extract_personal_skills(text: str):
    candidate_words = [
        'communication', 'teamwork', 'leadership', 'adaptability', 'problem solving', 'hardworking',
        'honest', 'creative', 'fast learner', 'collaboration', 'critical thinking', 'time management'
    ]
    lowered = (text or '').lower()
    found = []
    for word in candidate_words:
        if word in lowered:
            found.append(word.title())
    return found


def _extract_personal_details(text: str):
    lines = _split_text_lines(text)
    details = {}

    for idx, raw_line in enumerate(lines):
        line = raw_line.strip()
        lowered = line.lower()
        if 'language known' in lowered:
            value = _next_non_heading_value(lines, idx + 1)
            if value:
                details['languages'] = _normalize_item_list(value)
        elif 'hobbies' in lowered:
            value = _next_non_heading_value(lines, idx + 1)
            if value:
                details['hobbies'] = _normalize_item_list(value)
        elif 'present address' in lowered:
            value = _next_non_heading_value(lines, idx + 1)
            if value:
                details['address'] = value.lstrip(':').strip()
        elif 'email id' in lowered:
            match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', line)
            if match:
                details['email'] = match.group(0)

    return details


def _next_non_heading_value(lines, start_index: int):
    for idx in range(start_index, len(lines)):
        candidate = lines[idx].strip()
        if not candidate:
            continue
        if _looks_like_heading(candidate):
            return ''
        if candidate.startswith(':'):
            return candidate.lstrip(':').strip()
        return candidate
    return ''


def _extract_social_links(text: str):
    linkedin_match = re.search(r'https?://(?:www\.)?linkedin\.com/[^\s)]+', text or '', re.IGNORECASE)
    github_match = re.search(r'https?://(?:www\.)?github\.com/[^\s)]+', text or '', re.IGNORECASE)
    return {
        'linkedin': linkedin_match.group(0) if linkedin_match else '',
        'github': github_match.group(0) if github_match else '',
    }


def _build_fallback_parsed_data(text: str, profile: dict, skills: list[str]):
    sections = _parse_resume_sections(text)
    social_links = _extract_social_links(text)
    lines = _split_text_lines(text)
    personal_details = _extract_personal_details(text)

    experience = []
    for item in _extract_list_from_section(sections['experience']):
        experience.append({"title": item, "company": "", "date": "", "description": item})
    if not experience:
        for line in sections['experience']:
            if line.strip().lower() == 'fresher':
                experience.append({"title": "Fresher", "company": "", "date": "", "description": "Fresher"})
    if not experience and any('fresher' in line.lower() for line in lines):
        experience.append({"title": "Fresher", "company": "", "date": "", "description": "Fresher"})

    education = []
    for item in _extract_list_from_section(sections['education']):
        education.append({"degree": item, "institution": "", "date": ""})
    if not education:
        for line in sections['education']:
            if line.strip():
                education.append({"degree": line.strip(), "institution": "", "date": ""})

    projects = _extract_list_from_section(sections['projects'])
    certifications = _extract_list_from_section(sections['certifications'])
    achievements = _extract_list_from_section(sections['achievements'])
    languages = _extract_list_from_section(sections['languages'])
    if not languages and personal_details.get('languages'):
        languages = personal_details['languages']

    technical_skills = _normalize_item_list(skills)
    if not technical_skills:
        technical_skills = _extract_list_from_section(sections['technical_skills'])
    if not technical_skills:
        for item in _extract_list_from_section(sections['technical_skills']):
            technical_skills.extend(_normalize_item_list(item))
        technical_skills = list(dict.fromkeys([skill for skill in technical_skills if skill]))

    if not technical_skills:
        tech_text = ' '.join(sections['technical_skills'])
        for token in re.split(r'[,/&]|\band\b', tech_text, flags=re.IGNORECASE):
            token = token.strip()
            if token and len(token) > 1 and token.lower() not in {'programming language', 'currently working on'}:
                technical_skills.append(token)
        technical_skills = list(dict.fromkeys([skill for skill in technical_skills if skill]))

    technical_skills = list(dict.fromkeys([skill for skill in _normalize_item_list(technical_skills) if skill]))

    summary = ' '.join(_extract_list_from_section(sections['summary'])[:3])
    if not summary and sections['summary']:
        summary = ' '.join(sections['summary'][:3]).strip()
    if not summary and lines:
        summary = lines[0]

    personal_skills = _extract_personal_skills(text)
    if not personal_skills:
        personal_skills = _extract_list_from_section(sections['personal_skills'])[:8]

    return {
        'name': profile.get('name') or (lines[0] if lines else ''),
        'email': profile.get('email') or personal_details.get('email') or '',
        'phone': profile.get('phone') or '',
        'address': profile.get('address') or personal_details.get('address') or '',
        'linkedin': social_links['linkedin'],
        'github': social_links['github'],
        'summary': summary,
        'technical_skills': technical_skills,
        'personal_skills': personal_skills,
        'experience': experience,
        'education': education,
        'projects': projects,
        'certifications': certifications,
        'achievements': achievements,
        'languages': languages,
    }


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
        fallback_data = _build_fallback_parsed_data(text, profile, skills)
        parsed_json = json.dumps(fallback_data)

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

    payload = []
    for resume in resumes:
        profile = {
            'name': resume.name,
            'email': resume.email,
            'phone': resume.phone,
            'address': resume.address,
        }
        skills = _normalize_item_list(resume.skills)
        if not skills:
            skills = []

        parsed_data = resume.parsed_data
        if not parsed_data:
            parsed_data = _build_fallback_parsed_data(resume.extracted_text or '', profile, skills)
        elif isinstance(parsed_data, str):
            try:
                parsed_data = json.loads(parsed_data)
            except Exception:
                parsed_data = _build_fallback_parsed_data(resume.extracted_text or '', profile, skills)

        payload.append({
            'id': resume.id,
            'user_id': resume.user_id,
            'filename': resume.filename,
            'extracted_text': resume.extracted_text,
            'name': resume.name,
            'email': resume.email,
            'phone': resume.phone,
            'address': resume.address,
            'skills': resume.skills,
            'parsed_data': parsed_data,
            'created_at': resume.created_at,
        })

    return payload

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