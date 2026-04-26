import os
import json
import time
import re
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from google import genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_ID = "gemini-2.5-flash"

TRANSIENT_MARKERS = (
    "503",
    "UNAVAILABLE",
    "high demand",
    "429",
    "RESOURCE_EXHAUSTED",
    "deadline",
    "timeout",
)

LOW_SIGNAL_PATTERNS = (
    "i don't know",
    "i dont know",
    "don't know",
    "dont know",
    "not sure",
    "no idea",
    "i don't understand",
    "i dont understand",
    "did not understand",
    "didn't understand",
    "cannot answer",
    "can't answer",
    "skip",
)

GENERIC_STOPWORDS = {
    "know", "understand", "thing", "things", "stuff", "there", "their", "about", "because",
    "would", "could", "should", "where", "which", "while", "what", "when", "with", "used",
    "using", "into", "from", "that", "this", "have", "been", "were", "your", "ours", "also",
    "just", "very", "really", "more", "some", "many", "much", "than", "then", "able", "need",
}

CODING_PROFILE_STRONG_KEYWORDS = {
    "dsa",
    "data structure",
    "data structures",
    "algorithm",
    "algorithms",
    "competitive programming",
    "leetcode",
    "codeforces",
    "hackerrank",
}

CODING_PROFILE_WEAK_KEYWORDS = {
    "binary search",
    "dynamic programming",
    "recursion",
    "backtracking",
    "greedy",
    "graph",
    "tree",
    "linked list",
    "stack",
    "queue",
    "hashmap",
    "hash map",
    "sliding window",
    "two pointers",
    "time complexity",
    "space complexity",
}

CODING_QUESTION_MARKERS = {
    "algorithm",
    "data structure",
    "complexity",
    "code",
    "implement",
    "optimize",
    "time complexity",
    "space complexity",
    "pseudocode",
}


def _is_transient_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(marker.lower() in message for marker in TRANSIENT_MARKERS)


def _generate_content_with_retry(prompt: str, max_attempts: int = 3, per_attempt_timeout: int = 8):
    if client is None:
        raise RuntimeError("GEMINI client is not initialized")

    last_error = None
    for attempt in range(1, max_attempts + 1):
        executor = ThreadPoolExecutor(max_workers=1)
        try:
            future = executor.submit(
                client.models.generate_content,
                model=MODEL_ID,
                contents=prompt,
            )
            return future.result(timeout=per_attempt_timeout)
        except FutureTimeoutError:
            last_error = RuntimeError(
                f"Gemini request timeout after {per_attempt_timeout}s (attempt {attempt}/{max_attempts})"
            )
        except Exception as exc:
            last_error = exc
            if not _is_transient_error(exc):
                break
        finally:
            executor.shutdown(wait=False, cancel_futures=True)

        if attempt < max_attempts:
            # Exponential backoff for temporary model load spikes.
            time.sleep(min(2 ** (attempt - 1), 4))

    raise last_error or RuntimeError("Gemini request failed")

def clean_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"): text = text[7:]
    if text.startswith("```"): text = text[3:]
    if text.endswith("```"): text = text[:-3]
    return text.strip()


def _extract_resume_skills(resume_parsed_data: dict, max_items: int = 12) -> list:
    if not isinstance(resume_parsed_data, dict):
        return []

    candidates = []

    technical = resume_parsed_data.get("technical_skills")
    if isinstance(technical, list):
        candidates.extend([str(item).strip() for item in technical if str(item).strip()])

    generic_skills = resume_parsed_data.get("skills")
    if isinstance(generic_skills, list):
        candidates.extend([str(item).strip() for item in generic_skills if str(item).strip()])
    elif isinstance(generic_skills, str):
        candidates.extend([s.strip() for s in re.split(r"[,/|]", generic_skills) if s.strip()])

    projects = resume_parsed_data.get("projects")
    if isinstance(projects, list):
        for project in projects:
            candidates.extend(_safe_words(project))

    normalized = []
    seen = set()
    for item in candidates:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(item)
        if len(normalized) >= max_items:
            break

    return normalized


def _detect_coding_profile(resume_parsed_data: dict | None = None, skill_context: list | None = None) -> bool:
    parsed = resume_parsed_data if isinstance(resume_parsed_data, dict) else {}
    texts = []

    for key in ["summary", "skills", "technical_skills", "projects", "experience"]:
        value = parsed.get(key)
        if isinstance(value, list):
            texts.extend([str(item) for item in value if str(item).strip()])
        elif isinstance(value, dict):
            texts.append(json.dumps(value))
        elif isinstance(value, str) and value.strip():
            texts.append(value)

    if isinstance(skill_context, list):
        texts.extend([str(item) for item in skill_context if str(item).strip()])

    combined = " ".join(texts).lower()
    if not combined.strip():
        return False

    if any(keyword in combined for keyword in CODING_PROFILE_STRONG_KEYWORDS):
        return True

    weak_hits = sum(1 for keyword in CODING_PROFILE_WEAK_KEYWORDS if keyword in combined)
    return weak_hits >= 2


def _looks_like_coding_question(question_text: str) -> bool:
    normalized = str(question_text or "").strip().lower()
    if not normalized:
        return False
    return any(marker in normalized for marker in CODING_QUESTION_MARKERS)


def _normalize_difficulty(value: str) -> str:
    raw = str(value or "").strip().lower()
    if raw in {"easy", "beginner", "basic", "low"}:
        return "Easy"
    if raw in {"hard", "advanced", "expert", "high"}:
        return "Hard"
    return "Medium"


def _safe_words(text: str) -> list:
    return [w for w in re.findall(r"[a-zA-Z][a-zA-Z0-9_+-]*", str(text or "")) if len(w) > 3]


def _clean_word_list(words: list) -> list:
    cleaned = []
    for word in words:
        token = str(word or "").strip()
        if not token:
            continue
        lowered = token.lower()
        if lowered in GENERIC_STOPWORDS:
            continue
        cleaned.append(token)
    return cleaned


def _is_low_signal_answer(answer: str) -> bool:
    normalized = " ".join(str(answer or "").lower().split())
    if not normalized:
        return True
    if any(pattern in normalized for pattern in LOW_SIGNAL_PATTERNS):
        return True
    return len(normalized.split()) < 8


def _estimate_scores(answer: str, question: str = "", skill_context: list | None = None) -> dict:
    text = str(answer or "").strip()
    words = text.split()
    word_count = len(words)
    lowered_text = text.lower()
    has_structure = any(marker in lowered_text for marker in ["first", "then", "because", "therefore", "result", "finally", "after", "before"])
    has_metric = bool(re.search(r"\b\d+\b|%|ms|sec|x\b", lowered_text))
    has_uncertainty_phrase = any(pattern in lowered_text for pattern in LOW_SIGNAL_PATTERNS)

    answer_tokens = [token.lower() for token in _clean_word_list(_safe_words(text))]
    unique_tokens = set(answer_tokens)

    question_tokens = set(token.lower() for token in _clean_word_list(_safe_words(question)))

    skill_tokens = set()
    for skill in (skill_context or []):
        skill_word_tokens = _clean_word_list(_safe_words(skill))
        if skill_word_tokens:
            for token in skill_word_tokens:
                skill_tokens.add(token.lower())
        else:
            skill_text = str(skill or "").strip().lower()
            if skill_text:
                skill_tokens.add(skill_text)

    overlap_with_question = len(unique_tokens.intersection(question_tokens))
    overlap_with_skills = len(unique_tokens.intersection(skill_tokens))
    sentence_count = max(1, len([segment for segment in re.split(r"[.!?]+", text) if segment.strip()]))
    low_signal = _is_low_signal_answer(text)

    if low_signal:
        technical = 34 + min(12, overlap_with_skills * 4) + min(8, overlap_with_question * 2) + (2 if has_metric else 0)
        communication = 36 + min(12, word_count * 2) + (3 if sentence_count >= 2 else 0) - (4 if has_uncertainty_phrase else 0)
        problem_solving = 33 + min(12, overlap_with_question * 2) + (4 if has_structure else 0) + (2 if has_metric else 0)
        confidence = 32 + min(14, word_count * 2) - (6 if has_uncertainty_phrase else 0)

        return {
            "technical_score": _clamp_score(technical, 42),
            "communication_score": _clamp_score(communication, 48),
            "problem_solving_score": _clamp_score(problem_solving, 44),
            "confidence_score": _clamp_score(confidence, 46),
        }

    base = 58
    length_bonus = min(24, max(0, word_count - 10) // 2)
    structure_bonus = 8 if has_structure else 0
    metric_bonus = 6 if has_metric else 0
    relevance_bonus = min(8, overlap_with_question * 2) + min(8, overlap_with_skills * 2)
    clarity_bonus = min(6, max(0, len(unique_tokens) - 6) // 3)

    technical = min(92, base + length_bonus + metric_bonus + relevance_bonus)
    communication = min(92, base + length_bonus + structure_bonus + clarity_bonus)
    problem_solving = min(92, base + length_bonus + structure_bonus + metric_bonus + relevance_bonus)
    confidence = min(92, base + length_bonus + (4 if word_count >= 20 else 0) + min(4, sentence_count))

    return {
        "technical_score": int(technical),
        "communication_score": int(communication),
        "problem_solving_score": int(problem_solving),
        "confidence_score": int(confidence),
    }


def _clamp_score(value, default: int) -> int:
    try:
        return max(0, min(100, int(value)))
    except Exception:
        return default


def _build_reliable_feedback(question: str, answer: str, difficulty: str, skill_anchor: str | None = None) -> str:
    normalized_difficulty = _normalize_difficulty(difficulty)
    ans = str(answer or "").strip()
    word_count = len(ans.split())
    anchor = str(skill_anchor or "").strip()
    question_hint = str(question or "").strip()

    if _is_low_signal_answer(ans):
        if anchor:
            return (
                f"Your answer shows uncertainty. Give a basic explanation of {anchor} first, then describe one real example from your resume where you used it."
            )
        return "Your answer is too brief or unclear. Start with a simple definition, then add one project example and the final result."

    if word_count < 20:
        return "Good start. Add the exact steps you followed, why you chose that approach, and one measurable outcome."

    if normalized_difficulty == "Hard":
        return "Good attempt. To improve for hard level, include edge cases, trade-offs, and how your solution scales under higher load."

    if normalized_difficulty == "Medium":
        return "Reasonable answer. Strengthen it by comparing one alternative approach and explaining why your final choice was better."

    if anchor:
        return f"Clear answer. For easy level, keep it simple and add a concrete example of how you applied {anchor} in a project."

    if question_hint:
        return "Clear answer. Improve it by linking your explanation directly to the question and adding one concise project example."

    return "Clear answer. Add one concrete example and one measurable impact to make it stronger."


def _extract_focus_keyword(question: str, answer: str, context_history: list) -> str:
    answer_words = _clean_word_list(_safe_words(answer))
    question_words = set(w.lower() for w in _safe_words(question))

    for word in answer_words:
      if word.lower() not in question_words:
          return word

    if answer_words:
        return answer_words[0]

    if context_history:
        prev_answer = str(context_history[-1].get("a") or "")
        prev_words = _clean_word_list(_safe_words(prev_answer))
        if prev_words:
            return prev_words[0]

    question_words_clean = _clean_word_list(_safe_words(question))
    if question_words_clean:
        return question_words_clean[0]

    return "your project approach"


def _select_initial_fallback(mode: str, resume_parsed_data: dict, difficulty: str) -> dict:
    normalized_mode = str(mode or "").strip().lower()
    skills = _extract_resume_skills(resume_parsed_data)
    coding_profile = _detect_coding_profile(resume_parsed_data, skills)
    primary_skill = skills[0] if isinstance(skills, list) and skills else None
    skill_hint = str(primary_skill or "a core technology from your resume").strip()
    diff = _normalize_difficulty(difficulty)

    if normalized_mode == "coding":
        return {
            "question": f"[{diff}] In {skill_hint}, explain one problem you solved recently, your algorithm choice, and its time-space complexity.",
            "concept_tested": "Coding Depth & Complexity Analysis"
        }

    if normalized_mode == "hr":
        return {
            "question": f"[{diff}] Describe a high-stakes project conflict where you used {skill_hint}. How did you align stakeholders, what decision did you drive, and what measurable outcome followed?",
            "concept_tested": "Corporate Communication, Ownership & Stakeholder Management"
        }

    if normalized_mode == "technical":
        if coding_profile:
            return {
                "question": f"[{diff}] Using {skill_hint}, explain one algorithmic problem you solved, why you chose that approach, and its time-space complexity with trade-offs.",
                "concept_tested": "Coding Depth, DSA Reasoning & Trade-off Analysis"
            }
        return {
            "question": f"[{diff}] Pick one project where you used {skill_hint}. What was the toughest technical challenge and how did you resolve it?",
            "concept_tested": "Technical Problem Solving"
        }

    if normalized_mode == "mixed":
        if coding_profile:
            return {
                "question": f"[{diff}] In a project where you used {skill_hint}, discuss one algorithmic problem you solved, its complexity, and how you explained the technical trade-offs to business stakeholders.",
                "concept_tested": "Corporate Communication + Coding Problem Solving"
            }
        return {
            "question": f"[{diff}] Tell me about one project where you used {skill_hint}, handled cross-team expectations, and resolved a difficult technical trade-off.",
            "concept_tested": "Corporate Behavior + Technical Execution"
        }

    return {
        "question": f"[{diff}] Walk me through one project where you used {skill_hint} and faced a difficult engineering tradeoff.",
        "concept_tested": "Problem Solving & Experience"
    }


def _build_dynamic_fallback(
    question: str,
    answer: str,
    context_history: list,
    current_difficulty: str,
    skill_context: list | None = None,
    interview_mode: str = "Mixed",
    coding_profile: bool | None = None,
) -> dict:
    difficulty = _normalize_difficulty(current_difficulty)
    normalized_mode = str(interview_mode or "Mixed").strip().lower()
    available_skills = [str(s).strip() for s in (skill_context or []) if str(s).strip()]
    profile_has_coding = _detect_coding_profile(skill_context=available_skills) if coding_profile is None else bool(coding_profile)
    if available_skills:
        focus = available_skills[(len(context_history) if context_history else 0) % len(available_skills)]
    else:
        focus = _extract_focus_keyword(question, answer, context_history)
    turn = len(context_history) + 1

    estimated_scores = _estimate_scores(answer, question=question, skill_context=available_skills)
    feedback = _build_reliable_feedback(
        question=question,
        answer=answer,
        difficulty=difficulty,
        skill_anchor=available_skills[0] if available_skills else None,
    )

    corporate_followups = [
        f"Describe a situation where you had to align stakeholders around {focus}. How did you communicate your decision and outcome?",
        "Tell me about a difficult ownership decision you made under ambiguity and what business impact it created.",
        "How would you handle pushback from a product manager when engineering constraints affect delivery timelines?",
    ]

    if difficulty == "Easy":
        coding_followups = [
            f"Can you explain the basic algorithm behind {focus} and where you used it?",
            f"What is the time and space complexity of your approach for {focus}?",
            "If your first code attempt fails on edge cases, how would you debug and improve it?",
        ]
        technical_followups = [
            f"Can you explain {focus} in simpler terms and where you used it?",
            f"What common mistake happens with {focus}, and how would you avoid it?",
            "Can you share a small example where your first approach failed and what you changed?",
        ]
    elif difficulty == "Hard":
        coding_followups = [
            f"For {focus}, what alternative algorithm did you compare, and why was your final choice better at scale?",
            f"If traffic grows 10x, how would you optimize code and data structures around {focus}?",
            "Which edge cases or constraints could break your solution, and how would you redesign to harden it?",
        ]
        technical_followups = [
            f"What trade-offs did you evaluate around {focus}, and why was your final choice best?",
            f"If load increases 10x, how would you redesign the part related to {focus}?",
            "What edge cases would break your current solution, and how would you harden it?",
        ]
    else:
        coding_followups = [
            f"Can you walk through a code-level approach for {focus} and its complexity?",
            "What alternative data structure would you consider here and why?",
            "How did you validate correctness and runtime performance before finalizing the implementation?",
        ]
        technical_followups = [
            f"Can you elaborate on {focus} and the key design decision behind it?",
            "What alternative approach did you consider, and why did you reject it?",
            "How did you validate correctness and performance before finalizing your solution?",
        ]

    if normalized_mode == "hr":
        followups = corporate_followups
    elif normalized_mode == "mixed":
        if profile_has_coding:
            followups = coding_followups if turn % 2 == 0 else corporate_followups
        else:
            followups = technical_followups if turn % 2 == 0 else corporate_followups
    elif normalized_mode == "coding" or profile_has_coding:
        followups = coding_followups
    else:
        followups = technical_followups

    follow_up_question = followups[(turn - 1) % len(followups)]

    return {
        "technical_score": estimated_scores["technical_score"],
        "communication_score": estimated_scores["communication_score"],
        "problem_solving_score": estimated_scores["problem_solving_score"],
        "confidence_score": estimated_scores["confidence_score"],
        "feedback": f"{feedback} (Note: AI micro-feedback unavailable due to temporary service limits.)",
        "follow_up_question": follow_up_question,
        "next_difficulty": difficulty,
    }

def generate_initial_questions(resume_parsed_data: dict, mode: str, difficulty: str) -> dict:
    normalized_difficulty = _normalize_difficulty(difficulty)
    skill_pool = _extract_resume_skills(resume_parsed_data)
    coding_profile = _detect_coding_profile(resume_parsed_data, skill_pool)
    skills_text = ", ".join(skill_pool) if skill_pool else "No explicit skills detected"

    prompt = f"""You are an Expert Technical Interviewer.
The user has selected the '{mode}' interview mode. 
Selected interview difficulty level: {normalized_difficulty}
Here is their parsed resume data: {json.dumps(resume_parsed_data)}
Detected resume skills/topics (highest priority): {skills_text}
Coding profile hint (True means resume strongly indicates DSA/coding focus): {coding_profile}

Analyze their skills, projects, and experience.
Generate 1 initial interview question that is highly personalized to their profile.
CRITICAL RULES:
- The question MUST be based on at least one skill/topic from detected resume skills/topics.
- Do NOT ask generic questions unrelated to those skills.
- Tune the depth strictly to the selected difficulty: Easy = fundamentals, Medium = applied reasoning, Hard = edge cases/trade-offs/system depth.
- The question must mention or clearly imply the chosen skill/topic from the resume.
- Keep the tone corporate-level and realistic for strong company interviews.
- If mode is HR, ask corporate behavioral themes like ownership, stakeholder management, conflict resolution, or decision-making under ambiguity.
- If coding profile hint is True and mode is Technical or Mixed, ask a coding/DSA-focused question and explicitly include time-space complexity or algorithm/data-structure trade-offs.
- If mode is Mixed, prefer blending business communication and technical depth in one realistic scenario.
If it's 'Technical' or 'Coding', pick a programming language from their skills (e.g. C++, Python, React) and ask a deep technical concept.
If it's 'HR', ask about their teamwork, conflicts, or project outcomes.

Return ONLY a valid JSON:
{{
  "question": "...",
  "concept_tested": "...",
  "skill_anchor": "...",
  "difficulty": "Easy|Medium|Hard"
}}
"""
    try:
        res = _generate_content_with_retry(prompt, max_attempts=3, per_attempt_timeout=5)
        print("Google GenAI raw initial response:", res.text)
        data = json.loads(clean_json(res.text))
        data["difficulty"] = _normalize_difficulty(data.get("difficulty") or normalized_difficulty)
        if not str(data.get("skill_anchor") or "").strip():
            data["skill_anchor"] = skill_pool[0] if skill_pool else "resume project"
        data["skill_context"] = skill_pool
        data["coding_profile"] = coding_profile
        return {"success": True, "data": data}
    except Exception as e:
        print("GENERATE INITIAL Q ERROR:", e)
        fallback_data = _select_initial_fallback(mode, resume_parsed_data, normalized_difficulty)
        fallback_data["skill_anchor"] = skill_pool[0] if skill_pool else "resume project"
        fallback_data["difficulty"] = normalized_difficulty
        fallback_data["skill_context"] = skill_pool
        fallback_data["coding_profile"] = coding_profile
        return {"success": True, "data": fallback_data}

def evaluate_and_generate_followup(
    question: str,
    context_history: list,
    user_answer_text: str,
    current_difficulty: str,
    skill_context: list | None = None,
    interview_mode: str = "Mixed",
) -> dict:
    history_str = "\n".join([f"Q: {h['q']}\nA: {h['a']}" for h in context_history])
    question_count = len(context_history) + 1
    normalized_difficulty = _normalize_difficulty(current_difficulty)
    normalized_mode = str(interview_mode or "Mixed").strip().lower()
    available_skills = [str(s).strip() for s in (skill_context or []) if str(s).strip()]
    coding_profile = _detect_coding_profile(skill_context=available_skills)
    skill_context_text = ", ".join(available_skills) if available_skills else "Not provided"
    
    prompt = f"""You are an Expert Interviewer evaluating an answer and dynamically guiding the conversation.

Past Context:
{history_str}

Current Question: {question}
Candidate's Answer: {user_answer_text}
Current Difficulty Level: {normalized_difficulty}
Question Number in Session: {question_count}
Resume Skill Context (must stay within this): {skill_context_text}
Interview Mode: {normalized_mode}
Coding profile hint based on resume skills: {coding_profile}

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
- Follow-up question MUST stay tied to resume skill context whenever provided. Do not ask off-resume generic questions.
- Respect difficulty in follow-up depth: Easy=fundamental, Medium=applied, Hard=optimization/trade-offs.
- Keep interview quality at corporate level (clear, realistic, and business-aware prompts).
- If Interview Mode is HR, prefer ownership, stakeholder management, execution, and conflict resolution style questions.
- If coding profile hint is True and Interview Mode is not HR, prioritize coding/DSA follow-up with algorithm choice, complexity, or implementation trade-offs.
- If Interview Mode is Mixed, alternate between corporate-behavioral and technical/coding depth across turns.

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
        res = _generate_content_with_retry(prompt, max_attempts=2, per_attempt_timeout=6)
        data = json.loads(clean_json(res.text))
        estimated_scores = _estimate_scores(user_answer_text, question=question, skill_context=available_skills)

        data["next_difficulty"] = _normalize_difficulty(data.get("next_difficulty") or normalized_difficulty)
        data["technical_score"] = _clamp_score(data.get("technical_score"), estimated_scores["technical_score"])
        data["communication_score"] = _clamp_score(data.get("communication_score"), estimated_scores["communication_score"])
        data["problem_solving_score"] = _clamp_score(data.get("problem_solving_score"), estimated_scores["problem_solving_score"])
        data["confidence_score"] = _clamp_score(data.get("confidence_score"), estimated_scores["confidence_score"])

        follow_up_question = str(data.get("follow_up_question") or "").strip()
        if not follow_up_question or follow_up_question.lower() == str(question or "").strip().lower():
            data["follow_up_question"] = _build_dynamic_fallback(
                question=question,
                answer=user_answer_text,
                context_history=context_history,
                current_difficulty=normalized_difficulty,
                skill_context=available_skills,
                interview_mode=normalized_mode,
                coding_profile=coding_profile,
            )["follow_up_question"]
        elif coding_profile and normalized_mode != "hr" and not _looks_like_coding_question(follow_up_question):
            # Enforce coding depth for coding-heavy resumes in non-HR modes.
            data["follow_up_question"] = _build_dynamic_fallback(
                question=question,
                answer=user_answer_text,
                context_history=context_history,
                current_difficulty=normalized_difficulty,
                skill_context=available_skills,
                interview_mode=normalized_mode,
                coding_profile=True,
            )["follow_up_question"]

        ai_feedback = str(data.get("feedback") or "").strip()
        if not ai_feedback or len(ai_feedback.split()) < 6 or _is_low_signal_answer(user_answer_text):
            data["feedback"] = _build_reliable_feedback(
                question=question,
                answer=user_answer_text,
                difficulty=normalized_difficulty,
                skill_anchor=available_skills[0] if available_skills else None,
            )

        return {"success": True, "data": data}
    except Exception as e:
        print("GENERATE FOLLOWUP ERROR:", e)
        fallback_data = _build_dynamic_fallback(
            question=question,
            answer=user_answer_text,
            context_history=context_history,
            current_difficulty=normalized_difficulty,
            skill_context=available_skills,
            interview_mode=normalized_mode,
            coding_profile=coding_profile,
        )
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
        res = _generate_content_with_retry(prompt, max_attempts=2, per_attempt_timeout=8)
        data = json.loads(clean_json(res.text))
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}