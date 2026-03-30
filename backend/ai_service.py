import os
import json
from openai import OpenAI

# ✅ Load API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is required in environment")

client = OpenAI(api_key=OPENAI_API_KEY)

MODEL_NAME = "gpt-4o-mini"

# ✅ SYSTEM PROMPT
SYSTEM_PROMPT = """You are an expert technical interviewer with 15+ years of experience.

Generate smart interview questions based on resume.

Return ONLY JSON:
{
  "question": "...",
  "category": "technical|behavioral|project",
  "difficulty": "easy|medium|hard"
}
"""

# ✅ QUESTION GENERATION
def generate_interview_question(resume_text: str, question_count: int = 1) -> dict:
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Resume:\n{resume_text}\n\nQuestion #{question_count}"}
            ],
            temperature=0.7,
            max_tokens=300,
        )

        text = response.choices[0].message.content

        try:
            data = json.loads(text)
        except:
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
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "Give feedback on interview answer."},
                {"role": "user", "content": f"""
Resume: {resume_text}

Question: {question}
Answer: {user_response}

Give feedback + score out of 10.
"""}
            ],
            temperature=0.7,
            max_tokens=300,
        )

        return {
            "success": True,
            "feedback": response.choices[0].message.content
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

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "Create interview summary"},
                {"role": "user", "content": f"""
Resume:
{resume_text}

Q&A:
{qa_text}

Give:
- Score
- Strengths
- Weakness
- Final verdict
"""}
            ],
            temperature=0.7,
            max_tokens=500,
        )

        return {
            "success": True,
            "summary": response.choices[0].message.content
        }

    except Exception as e:
        print("SUMMARY ERROR:", e)
        return {"success": False, "error": str(e)}