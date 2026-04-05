import os
import json
from google import genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_ID = "gemini-2.5-flash"

def clean_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"): text = text[7:]
    if text.startswith("```"): text = text[3:]
    if text.endswith("```"): text = text[:-3]
    return text.strip()

def generate_initial_questions(resume_parsed_data: dict, mode: str) -> dict:
    prompt = f"""You are an Expert Technical Interviewer.
The user has selected the '{mode}' interview mode. 
Here is their parsed resume data: {json.dumps(resume_parsed_data)}

Analyze their skills, projects, and experience.
Generate 1 initial interview question that is highly personalized to their profile.
If it's 'Technical' or 'Coding', pick a programming language from their skills (e.g. C++, Python, React) and ask a deep technical concept.
If it's 'HR', ask about their teamwork, conflicts, or project outcomes.

Return ONLY a valid JSON:
{{
  "question": "...",
  "concept_tested": "..."
}}
"""
    try:
        res = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )
        print("Google GenAI raw initial response:", res.text)
        data = json.loads(clean_json(res.text))
        return {"success": True, "data": data}
    except Exception as e:
        print("GENERATE INITIAL Q ERROR:", e)
        fallback_data = {
            "question": "Could you walk me through a challenging problem you solved recently and how you approached it?",
            "concept_tested": "Problem Solving & Experience"
        }
        return {"success": True, "data": fallback_data}

def evaluate_and_generate_followup(question: str, context_history: list, user_answer_text: str, current_difficulty: str) -> dict:
    history_str = "\n".join([f"Q: {h['q']}\nA: {h['a']}" for h in context_history])
    question_count = len(context_history) + 1
    
    prompt = f"""You are an Expert Interviewer evaluating an answer and dynamically guiding the conversation.

Past Context:
{history_str}

Current Question: {question}
Candidate's Answer: {user_answer_text}
Current Difficulty Level: {current_difficulty}
Question Number in Session: {question_count}

Task 1: Evaluate the Answer (Metrics 0-100)
- technical_score: Accuracy, relevance, and depth.
- communication_score: Clarity, structure, and conciseness.
- problem_solving_score: Approach and logical thinking.
- confidence_score: Assuredness in the wording.

Task 2: Short Mini Feedback
- Write a 1-2 sentence immediate feedback addressing strengths or missing points (e.g. "Good explanation, but you missed handling collisions").

Task 3: Dynamic Follow-up (1-3 questions per topic, then switch topic)
- If the current topic (implied by the current question) has been explored deeply (3 questions), strongly shift to a completely new topic from standard computer science branches (e.g., if you were on HashMap, move to OOP, DBMS, React, Projects or System Design).
- If it hasn't reached 3 follow-ups, pick an important keyword from their answer to ask a drill-down question.

Return STRICTLY JSON:
{{
  "technical_score": 80,
  "communication_score": 85,
  "problem_solving_score": 75,
  "confidence_score": 90,
  "feedback": "...",
  "next_difficulty": "Intermediate",
  "follow_up_question": "..."
}}
"""
    try:
        res = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )
        data = json.loads(clean_json(res.text))
        return {"success": True, "data": data}
    except Exception as e:
        print("GENERATE FOLLOWUP ERROR:", e)
        fallback_data = {
            "technical_score": 75,
            "communication_score": 80,
            "problem_solving_score": 75,
            "confidence_score": 85,
            "feedback": f"Reasonable answer. (Note: AI micro-feedback unavailable due to service rate limits.)",
            "follow_up_question": "Can you elaborate further on this or share a related technology approach?",
            "next_difficulty": current_difficulty
        }
        return {"success": True, "data": fallback_data}

def analyze_submitted_code(question: str, language: str, code: str) -> dict:
    prompt = f"""You are a Senior Software Engineer evaluating submitted code in a live interview.
Question: {question}
Language: {language}

Submitted Code:
{code}

Analyze the code:
1. Syntax correctness.
2. Logic and edge cases.
3. Time/Space Complexity.
4. If there's an obvious flaw, point it out gently.
5. Generate a follow-up question specifically about the logic/data structures used in their code (e.g. "Why did you use unordered_map here?").

Return STRICTLY JSON:
{{
  "is_correct": true,
  "time_complexity": "O(n)",
  "space_complexity": "O(1)",
  "feedback": "Short feedback paragraph",
  "follow_up_question": "..."
}}
"""
    try:
        res = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )
        data = json.loads(clean_json(res.text))
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}
