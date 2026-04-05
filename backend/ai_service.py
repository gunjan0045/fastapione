import os
import json
from google import genai

# ✅ Load API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = None
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is missing from environment. AI features will fail.")
else:
    client = genai.Client(api_key=GEMINI_API_KEY)

# Use gemini-2.5-flash as the default model
MODEL_ID = "gemini-2.5-flash"

# ✅ SYSTEM PROMPT
SYSTEM_PROMPT = """You are an expert technical interviewer with 15+ years of experience.

Generate smart interview questions based on resume.

Return ONLY JSON without markdown formatting:
{
  "question": "...",
  "category": "technical|behavioral|project",
  "difficulty": "easy|medium|hard"
}
"""

def clean_json_response(text: str) -> str:
    # Some models return ```json ... ``` tags. Clean them up.
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

# ✅ QUESTION GENERATION
def generate_interview_question(resume_text: str, question_count: int = 1) -> dict:
    try:
        prompt = f"{SYSTEM_PROMPT}\n\nResume:\n{resume_text}\n\nQuestion #{question_count}"
        
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )
        text = clean_json_response(response.text)

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            data = {
                "question": text,
                "category": "general",
                "difficulty": "medium"
            }

        return {
            "success": True,
            "question": data.get("question"),
            "category": data.get("category"),
            "difficulty": data.get("difficulty")
        }

    except Exception as e:
        print("ERROR:", e)  # 🔥 IMPORTANT
        return {"success": False, "error": str(e)}


# ✅ RESUME PARSING (NEW)
RESUME_PARSER_PROMPT = """Role: You are a Professional Resume Parser. Your task is to analyze the uploaded resume and extract every single detail into a structured format.

Step 1: Structural Analysis (Markdown conversion)
Read the text and identify headings (Name, Contact, Education, Skills, Projects, Experience). Mentally organize them.

Step 2: Detail Extraction
Extract the following precisely:
- Candidate Name: Top-most prominent name.
- Contact Info: Extract Email, Phone, LinkedIn, and GitHub URL. Address/Location if present.
- Technical Skills: Every programming language, framework, and tool mentioned.
- Personal Skills: Soft skills like Leadership, Communication, etc.
- Experience: Role, Company, Duration, and a detailed description.
- Education: Degree, Institution, and Year.
- Projects: Each project title and its detailed description.
- Certifications, Achievements, and Languages.

Step 3: Output Formatting
Provide the data in a clean, strictly formatted JSON object. If a section is missing in the resume, return an empty array [] or empty string "".
Do not miss any bullet point or detail. Every single word from the resume must be categorized.

You MUST return EXACTLY this JSON structure and nothing else. No markdown wrappers.
{
  "name": "",
  "email": "",
  "phone": "",
  "address": "",
  "linkedin": "",
  "github": "",
  "summary": "",
  "technical_skills": ["",""],
  "personal_skills": ["",""],
  "experience": [
    {"title": "", "company": "", "date": "", "description": ""}
  ],
  "education": [
    {"degree": "", "institution": "", "date": ""}
  ],
  "projects": ["", ""],
  "certifications": ["", ""],
  "achievements": ["", ""],
  "languages": ["", ""]
}
"""

def parse_resume_with_ai(resume_text: str) -> dict:
    try:
        prompt = f"{RESUME_PARSER_PROMPT}\n\nRESUME TEXT:\n{resume_text}"
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )
        text = clean_json_response(response.text)

        try:
            data = json.loads(text)
            return {"success": True, "data": data}
        except json.JSONDecodeError:
            print("FAILED TO PARSE JSON FROM Gemini:", text)
            return {"success": False, "error": "Invalid JSON mapping from AI"}
            
    except Exception as e:
        print("PARSE ERROR:", e)
        return {"success": False, "error": str(e)}


# ✅ FEEDBACK (FIXED)
def generate_feedback(resume_text: str, question: str, user_response: str) -> dict:
    try:
        prompt = f"""You are a friendly, encouraging interview coach.

Resume: {resume_text}

Question: {question}
Answer: {user_response}

Please give feedback on the answer. You MUST follow these rules exactly:
1. Use extremely simple, beginner-friendly words.
2. Provide feedback line-by-line using short bullet points.
3. Do not use tricky technical jargon or long paragraphs.
4. Conclude with a clear score out of 10.
"""
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )

        return {
            "success": True,
            "feedback": response.text
        }

    except Exception as e:
        print("FEEDBACK ERROR:", e)
        return {"success": False, "error": str(e)}

 
# ✅ SUMMARY (FIXED)
def generate_interview_summary(resume_text: str, questions_and_answers: list) -> dict:
    try:
        qa_text = "\n".join([
            f"Q: {qa['question']}\nA: {qa['answer']}"
            for qa in questions_and_answers
        ])

        prompt = f"""You are a friendly, encouraging interview coach summarizing a mock interview.

Resume:
{resume_text}

Q&A:
{qa_text}

Please provide a clear interview summary. You MUST follow these rules exactly:
1. Use extremely simple, beginner-friendly words. Do not use tricky technical jargon.
2. Present everything using clear, short bullet points.
3. Your summary must include exactly these sections:
   - Your Score (out of 100)
   - Your Strengths (bullet points)
   - Areas to Improve (bullet points, very polite)
   - Final Verdict (one simple, encouraging sentence)
"""
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )

        return {
            "success": True,
            "summary": response.text
        }

    except Exception as e:
        print("SUMMARY ERROR:", e)
        return {"success": False, "error": str(e)}

# ✅ CHATBOT HELPERguloyugliu
def generate_chat_response(user_message: str) -> dict:
    try:
        prompt = f"""You are 'CoachBot', the automated conversational assistant for the 'AI Interview Coach' web application.
Your goal is to politely and correctly answer the user's questions about how to use this interviewing website.

Context about the app:
- Users can upload their Resume (PDF).
- Users can start an AI Mock interview with their webcam and microphone.
- The AI will act like an expert technical interviewer, ask questions, and give real-time feedback.
- At the end, a summary and overall score out of 100 is given.
- Users can manage multiple resumes and track their scores on the Dashboard.

Rules for your response:
1. Act like a helpful, slightly formal but friendly Amazon-style Customer Support Bot.
2. Keep your answers brief, clean, and nicely formatted (use bullet points if needed).
3. Do not invent features that don't exist.

User's Query: {user_message}
"""
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )

        return {
            "success": True,
            "reply": response.text
        }
    except Exception as e:
        print("ERROR:", e)
        return {"success": False, "error": str(e)}

# ✅ BODY LANGUAGE EVALUATOR
def evaluate_body_language_frame(base64_image_data: str) -> dict:
    try:
        import base64
        # Google GenAI accepts binary data directly for inline data
        image_bytes = base64.b64decode(base64_image_data)
        
        prompt = """Analyze the candidate's body language in this interview frame.
        Check for:
        1. Eye contact (Is the person looking at the camera/screen or looking away?)
        2. Posture (Are they sitting upright, slouching, leaning too close?)
        3. Face visibility (Is the face clearly visible?)
        
        Provide a body_language_score from 0 to 100 representing their strict professional appearance.
        Provide a 1-sentence specific feedback (e.g., 'You maintained good eye contact' or 'Try to look more at the camera.').

        Return STRICTLY JSON without markdown:
        {
            "body_language_score": 85,
            "feedback": "You maintained good eye contact but looked away slightly."
        }
        """
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[
                {"mime_type": "image/jpeg", "data": image_bytes},
                prompt
            ]
        )
        data = json.loads(clean_json_response(response.text))
        return {"success": True, "data": data}
    except Exception as e:
        print("BODY LANGUAGE ERROR:", e)
        return {"success": False, "error": str(e)}