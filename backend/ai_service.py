import os
import json
import google.generativeai as genai

# ✅ Load API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is missing from environment. AI features will fail.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# Use gemini-flash-latest as the default model
model = genai.GenerativeModel("gemini-flash-latest")

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
        
        response = model.generate_content(prompt)
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
        response = model.generate_content(prompt)

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
        response = model.generate_content(prompt)

        return {
            "success": True,
            "summary": response.text
        }

    except Exception as e:
        print("SUMMARY ERROR:", e)
        return {"success": False, "error": str(e)}

# ✅ CHATBOT HELPER
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
        response = model.generate_content(prompt)

        return {
            "success": True,
            "reply": response.text
        }
    except Exception as e:
        print("ERROR:", e)
        return {"success": False, "error": str(e)}