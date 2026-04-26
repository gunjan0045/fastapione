# AI Interview Coach - Comprehensive Knowledge Base

This document provides a detailed overview of the "AI Interview Coach" project, explaining the architecture, workflows, and the technical implementation of each functional module.

## 1. Project Overview
**AI Interview Coach** is a modern web application designed to help users prepare for professional interviews. It leverages Generative AI (Google Gemini 2.5 Flash) to parse resumes, generate domain-specific questions, provide real-time feedback on user responses, evaluate body language via webcam feeds, and generate a final structured feedback report.

## 2. Technical Stack
The platform uses a modern decoupled architecture:

### Frontend Stack
* **Framework:** React 19 combined with Vite.
* **Routing:** `react-router-dom` (Version 7) handles client-side route transitions and protected routes.
* **Styling & UI:** 
  * Tailwind CSS v4 (via `@tailwindcss/vite`) for responsive and utility-first styling.
  * Custom `AnimatedBackground` for a premium, interactive UI context. Include seamless support for Light/Dark modes using customized Context API (`ThemeContext`).
  * `lucide-react` for iconography.
  * `framer-motion` for complex keyframe micro-animations and page transitions to make the UI feel alive.
* **Special Inputs:** 
  * `@monaco-editor/react` integrated for live coding interview sessions.
  * `recharts` for rendering data visualizations in the User Dashboard.
* **Communication:** `axios` performs standardized CORS-enabled requests to the backend.

### Backend Stack
* **Framework:** FastAPI (Python 3.x), chosen for its asynchronous capability and speed.
* **Database & ORM:** SQLite (`sql_app.db`, `interview_coach.db`) integrated with SQLAlchemy as the ORM, with basic SQLite thread pooling options (`check_same_thread=False`). Pydantic for rigid request/response data validation.
* **Authentication:** Stateless structure using PyJWT (JSON Web Tokens). Passwords hashed natively using `bcrypt`.
* **AI Service Integration:** Native `google-genai` Python SDK executing calls against the `gemini-2.5-flash` model. 
* **PDF Handling:** `PyMuPDF` parses uploaded user resumes so they can be securely transmitted into the AI prompts.

## 3. Core Modules: "What works and How it works"

The application flows are segmented efficiently to provide a seamless user pipeline:

### 3.1 Authentication & Session Management
* **How it works:** 
  1. The user provides an email and password. 
  2. In `/auth/register`, passwords are salted and hashed via the `bcrypt` algorithm. 
  3. `FastAPI` injects `OAuth2PasswordBearer` to safeguard routes. `/auth/login` validates the user and assigns an access token expiring in 1 week.
  4. The frontend intercepts all calls returning 401s and utilizes the `AuthContext` component to manage login states, redirecting unauthenticated traffic using the `<ProtectedRoute/>` wrapper component.

### 3.2 Automated AI Resume Parsing
* **How it works:** 
  1. A candidate uploads a PDF resume from the Dashboard or Setup phase.
  2. The FastApi router `/resume/upload` uses `PyMuPDF` to read raw text from the file mapping.
  3. The `ai_service.py` component submits the extracted text array, appending a strict system prompt (`RESUME_PARSER_PROMPT`). 
  4. The Gemini Flash model reads the unstructured data and converts it into a universally formatted JSON schema including Name, Email, Skills, Past Experience, and Education.
  5. The structured data is securely captured within the `resumes` table.

### 3.3 Dynamic Mock Interview Flow
This is the central pillar of the application.
* **How it works:**
  1. **Initialization:** The user selects a parsed resume. `interview_engine.py` calls the LLM using the `SYSTEM_PROMPT` to formulate distinct technical or behavioral questions dynamically tailored purely to the user's skillset.
  2. **Recording & Interaction:** The frontend accesses the user's Webcam and Microphone. As questions populate, the user speaks answers or writes code (if it's a technical coding scenario utilizing `monaco-editor`).
  3. **Body Language Evaluation:** Real-time frames are captured from the active `<video>` DOM element, transpiled to base64 encoding, and transmitted via WebSocket/API. Gemini's Vision models intercept these binary image inputs against prompt constraints checking for eye-contact and posture.
  4. **Micro-Feedback Pipeline:** Every answer receives immediate encouraging textual feedback processed by `generate_feedback()`, giving the user a chance to pivot or iterate.

### 3.4 Summary and Scoring Generation
* **How it works:** 
  1. Once the interview queue completes, `/interview/complete` triggers.
  2. The entirety of the Questions & Answers is formatted collectively and pushed to `generate_interview_summary()`.
  3. The LLM processes everything collectively, outputting a composite score out of 100 alongside structured arrays for **Strengths** and **Areas to Improve**. 
  4. This artifact is stored within the `interview_history` SQLAlchemy Model schema and presented aesthetically using Recharts inside the Dashboard so candidates can track chronological improvements.

### 3.5 AI Conversational CoachBot
* **How it works:** A secondary overlay bot exists for site navigation or interview tips. Functionally, it relies on `generate_chat_response`, carrying fixed context detailing the site's capability so it serves accurately aligned Customer Support.

### 3.6 Human Booking Portal
* **How it works:** Users have the option to schedule a peer-to-peer or expert 1-on-1 interview. They submit parameters (Experience Level, Scheduled Time). The data stores in the `human_bookings` table waiting for a backend admin clearance protocol.

## 4. Key Implementation Patterns & Features
* **CORS Middleware Mitigation:** Heavily configured Origins on FastAPI main startup so React's `localhost:5173` successfully accesses `localhost:8000`.
* **Prompt Engineering Safeguards:** Python function parsers explicitly employ `.strip().replace("```json")` mapping rules. AI services occasionally leak markdown wrappers despite instruction, so backend functions natively sanitize responses to prevent frontend fatal `JSONDecodeErrors`.
* **Database Relational Models:** `User` has a One-to-Many dependency with `Resume` and `InterviewHistory`. `ForeignKey` constraints cleanly associate interview iterations strictly with specific chronological resume snapshots. 

## 5. Deployment / Execution
Presently configured for standard local runtime:
* **Terminal 1:** `uvicorn main:app --reload` (Launches FastAPI Backend on port 8000)
* **Terminal 2:** `npm run dev` (Launches Vite Dev Server on port 5173)

---
*Created dynamically for application visibility and analysis.*
