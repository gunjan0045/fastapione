# AI Interview Coach - Complete Technical Overview

---

## 🎯 **Project Purpose**

**AI Interview Coach** is a full-stack web application that helps users prepare for professional interviews using AI-powered mock interviews, real-time feedback, and body language analysis. It combines resume parsing, dynamic question generation, live video feedback, and comprehensive scoring to provide users with actionable insights for interview preparation.

### Key Objectives:
- Parse user resumes using AI to extract key information
- Generate domain-specific interview questions tailored to user skills
- Conduct mock interviews with voice dictation and video recording
- Provide real-time feedback on answers and body language
- Generate comprehensive performance reports with scores

---

## 🏗️ **Architecture Overview**

The application follows a **modern decoupled architecture** with:
- **Frontend:** React 19 + Vite (Separate SPA running on port 5173)
- **Backend:** FastAPI + SQLite (REST API running on port 8000)
- **Communication:** CORS-enabled HTTP/Axios for frontend-backend interaction
- **AI Engine:** Google Gemini 2.5 Flash for all intelligent processing
- **Database:** SQLite with SQLAlchemy ORM

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER (Port 5173)               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           React 19 + Vite Frontend                   │  │
│  │  - Router (react-router-dom)                         │  │
│  │  - State Management (Context API)                    │  │
│  │  - UI Components (Tailwind CSS + Framer Motion)      │  │
│  │  - WebGL (Three.js for hero orb)                     │  │
│  │  - Code Editor (Monaco Editor)                       │  │
│  │  - Charts (Recharts)                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────┬───────────────────────────────────────────────┘
               │ HTTP/Axios + CORS
               ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              FastAPI Application                     │  │
│  │  - Routes: /auth /resume /interview                  │  │
│  │  - Middleware: CORS, Auth (JWT)                      │  │
│  │  - Database: SQLAlchemy ORM                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│    ┌─────────────────────┼─────────────────────┐            │
│    │                     │                     │            │
│    ▼                     ▼                     ▼            │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────┐    │
│  │  SQLite  │    │ AI Service   │    │ PDF Parser     │    │
│  │Database  │    │(Gemini 2.5)  │    │(PyMuPDF)       │    │
│  │          │    │              │    │                │    │
│  │- Users   │    │- Q Generate  │    │- Extract Text  │    │
│  │- Resumes │    │- Feedback    │    │- Skills Parse  │    │
│  │- History │    │- Scoring     │    │                │    │
│  │- Bookings│    │              │    │                │    │
│  └──────────┘    └──────────────┘    └────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 **Technology Stack**

### **Frontend Stack**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.4 | Core UI framework |
| **Vite** | 8.0.1 | Build tool & dev server |
| **React Router DOM** | 7.13.2 | Client-side routing & protected routes |
| **Tailwind CSS** | 4.2.2 | Utility-first styling framework |
| **Framer Motion** | 12.38.0 | Advanced animations & page transitions |
| **Axios** | 1.13.6 | HTTP client for API requests |
| **Monaco Editor** | 4.7.0 | Code editor for coding interviews |
| **Recharts** | 3.8.1 | Data visualization in dashboards |
| **Three.js** | 0.179.1 | 3D graphics (hero orb animation) |
| **Lucide React** | 1.7.0 | Icon library |
| **Context API** | - | State management (Theme, Auth) |

### **Backend Stack**

| Technology | Purpose |
|-----------|---------|
| **FastAPI** | Async REST API framework |
| **Python 3.x** | Language |
| **SQLite** | Lightweight SQL database |
| **SQLAlchemy** | ORM for database operations |
| **Pydantic** | Request/response validation |
| **PyJWT** | JSON Web Token authentication |
| **bcrypt** | Password hashing & verification |
| **google-genai** | Gemini 2.5 Flash AI SDK |
| **PyMuPDF (fitz)** | PDF parsing & text extraction |
| **python-multipart** | Form data handling |
| **uvicorn** | ASGI server |

---

## 🎨 **Frontend Structure & Components**

### **Folder Organization**

```
frontend/
├── src/
│   ├── App.jsx                    # Main app router & layout
│   ├── App.css                    # Global styles
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Base CSS
│   │
│   ├── components/                # Reusable React components
│   │   ├── Navbar.jsx             # Top navigation bar
│   │   ├── ProtectedRoute.jsx     # Auth guard wrapper
│   │   ├── AnimatedBackground.jsx # Particle effect background
│   │   ├── ParticlesBackground.jsx # Canvas-based dotted particles
│   │   ├── ThreeHeroOrb.jsx       # 3D orb using Three.js
│   │   ├── CodingInterviewPanel.jsx # Code editor for coding questions
│   │   ├── InterviewInstructionsModal.jsx # Setup modal
│   │   ├── Chatbot.jsx            # AI assistant chat overlay
│   │   ├── ResumeCard.jsx         # Resume display card
│   │   ├── ResumeDetailsModal.jsx # Resume details popup
│   │   ├── ThemeToggle.jsx        # Dark/Light mode toggle
│   │   ├── FeatureCard.jsx        # Feature card component
│   │   ├── StatCard.jsx           # Statistics display
│   │   ├── Background.jsx         # Static background
│   │   └── Footer.jsx             # Footer component
│   │
│   ├── pages/                     # Full page components
│   │   ├── Home.jsx               # Landing page (/)
│   │   ├── Login.jsx              # User login (/login)
│   │   ├── Register.jsx           # User signup (/register)
│   │   ├── Dashboard.jsx          # Main dashboard (/dashboard)
│   │   ├── Profile.jsx            # User profile (/profile)
│   │   ├── Settings.jsx           # User settings (/settings)
│   │   ├── Interview.jsx          # Live interview (/interview/setup)
│   │   ├── InterviewSelection.jsx # Mode selection (/interview)
│   │   ├── InterviewFeedback.jsx  # Results page (/feedback/:id)
│   │   ├── HumanInterviewBooking.jsx # Expert booking (/interview/book-expert)
│   │   ├── About.jsx              # About page (/about)
│   │   ├── Features.jsx           # Features showcase (/features)
│   │   ├── Contact.jsx            # Contact page (/contact)
│   │   ├── OAuthCallback.jsx      # OAuth redirect handler
│   │   └── PasswordChangeResult.jsx # Password reset result
│   │
│   ├── context/                   # React Context for state
│   │   ├── AuthContext.jsx        # User auth state (login/logout)
│   │   └── ThemeContext.jsx       # Dark/Light theme state
│   │
│   ├── utils/                     # Utility functions
│   │   └── api.js                 # Axios instance + API calls
│   │
│   └── assets/                    # Images & static files
│
├── public/                        # Static assets
├── vite.config.js                 # Vite configuration
├── eslint.config.js               # ESLint rules
├── tailwind.config.js             # Tailwind customization
├── package.json                   # Dependencies
└── index.html                     # HTML entry point
```

### **Key Frontend Features**

1. **Authentication System**
   - Login/Register with email & password
   - JWT token storage in localStorage
   - ProtectedRoute wrapper for private pages
   - Auto logout on 401 response

2. **Interview Page (Interview.jsx)**
   - Web Speech Recognition API for voice input
   - Continuous dictation with pause/resume
   - Real-time transcript accumulation (3-layer text system)
   - Video capture with body language analysis
   - Monaco Editor for coding questions
   - Speech Synthesis API for AI voice
   - Retry logic with loop-based iteration (prevents state deadlock)
   - 35-second frontend timeout for slow AI responses

3. **Dashboard (Dashboard.jsx)**
   - Recharts visualization of interview history
   - Performance metrics display
   - Resume management
   - Interview statistics

4. **UI/UX Features**
   - Three.js animated hero orb
   - Framer Motion page transitions
   - Canvas-based particle background
   - Dark/Light mode toggle
   - Responsive Tailwind CSS design
   - Custom animated backgrounds

---

## ⚙️ **Backend Structure & API**

### **Folder Organization**

```
backend/
├── main.py                # FastAPI app entry point
├── models.py              # SQLAlchemy database models
├── database.py            # SQLite connection & session
├── schemas.py             # Pydantic request/response models
├── auth.py                # Password hashing & JWT utils
├── interview_engine.py    # AI question generation & scoring
├── ai_service.py          # Gemini API wrapper
├── pdf_report.py          # PDF generation for reports
├── notification_service.py # Email notifications
├── routes/
│   ├── __init__.py
│   ├── auth_routes.py     # /auth endpoints
│   ├── resume_routes.py   # /resume endpoints
│   └── interview_routes.py # /interview endpoints
├── .env                   # Environment variables
├── requirements.txt       # Python dependencies
└── pyrightconfig.json     # Static type checker config
```

### **Database Models**

#### **1. User Model**
```python
- id (Primary Key)
- name, email (unique), hashed_password
- Preferences:
  - email_notifications, newsletter_enabled, profile_public
  - two_factor_enabled, dark_mode_preference
  - data_export_enabled
- Profile:
  - language, region, phone, address, city, state, country
  - date_of_birth, government_id_type
  - college_name, highest_qualification, profession
  - linkedin_url, github_url, portfolio_url, bio
- Security:
  - email_verified, email_verification_code
  - password_last_changed_at, previous_hashed_password
  - password_recovery_token
- created_at
```

#### **2. Resume Model**
```python
- id (Primary Key)
- user_id (Foreign Key → User)
- filename, extracted_text
- Parsed fields:
  - name, email, phone, address
  - skills (Text)
  - parsed_data (Full JSON from Gemini)
- created_at
```

#### **3. InterviewHistory Model**
```python
- id (Primary Key)
- user_id (Foreign Key → User)
- resume_id (Foreign Key → Resume)
- questions (JSON string)
- answers (JSON string)
- per_question_feedback (JSON string)
- Scoring:
  - technical_score, communication_score
  - problem_solving_score, body_language_score
  - final_score
- Feedback:
  - final_feedback, body_language_feedback
- completed_at
```

#### **4. HumanBooking Model**
```python
- id (Primary Key)
- user_id (Foreign Key → User)
- domain, experience_level
- preferred_date, preferred_time, duration
- notes
- status (Pending/Approved/Completed)
- created_at
```

### **API Endpoints**

#### **Authentication Routes** (`/auth`)
```
POST   /auth/register          # Create new account
POST   /auth/login             # User login (returns JWT)
POST   /auth/refresh           # Refresh access token
GET    /auth/me                # Get current user profile (Protected)
PUT    /auth/update-profile    # Update user details (Protected)
POST   /auth/change-password   # Change password (Protected)
POST   /auth/request-password-reset # Send reset email
POST   /auth/reset-password    # Reset password with token
```

#### **Resume Routes** (`/resume`)
```
POST   /resume/upload          # Upload & parse resume (Protected)
GET    /resume/list            # Get all user resumes (Protected)
GET    /resume/:id             # Get single resume (Protected)
DELETE /resume/:id             # Delete resume (Protected)
```

#### **Interview Routes** (`/interview`)
```
POST   /interview/start        # Initialize interview (Protected)
POST   /interview/get-question # Generate next question (Protected)
POST   /interview/submit-answer # Submit answer & get feedback (Protected)
POST   /interview/body-language # Analyze video frame (Protected)
POST   /interview/complete     # Finish interview & generate summary (Protected)
GET    /interview/history      # Get interview history (Protected)
GET    /interview/:id          # Get specific interview (Protected)

POST   /human-booking/create   # Book expert interview (Protected)
GET    /human-booking/list     # Get user bookings (Protected)
```

---

## 🔄 **Core Workflows**

### **1. User Registration & Authentication**

```
User → Frontend /register page
  ↓
User enters: name, email, password, confirm password
  ↓
Frontend validates & calls POST /auth/register
  ↓
Backend:
  - Validates input (Pydantic schemas)
  - Hashes password with bcrypt
  - Creates user in SQLite
  - Returns success message
  ↓
User redirected to Login page
  ↓
User enters email & password
  ↓
Frontend calls POST /auth/login
  ↓
Backend:
  - Finds user by email
  - Compares password with hash
  - Generates JWT token (1 week expiry)
  - Returns token
  ↓
Frontend stores token in localStorage
  ↓
User authenticated ✓
```

### **2. Resume Upload & Parsing**

```
User uploads resume (PDF)
  ↓
Frontend FormData to POST /resume/upload
  ↓
Backend:
  - Receives file with FastAPI MultipartFile
  - Extracts text using PyMuPDF (fitz)
  - Creates prompt with extracted text
  ↓
AI Service (Gemini):
  - Analyzes unstructured text
  - Extracts: Name, Email, Skills, Experience, Education
  - Returns structured JSON
  - Retry logic with exponential backoff (max 3 attempts, 8s timeout per attempt)
  ↓
Backend:
  - Cleans JSON response (removes markdown wrappers)
  - Stores in Resume table:
    - Raw extracted_text
    - Parsed fields (name, email, skills)
    - Full parsed_data JSON
  ↓
Frontend displays parsed resume
  ↓
User confirms resume ✓
```

### **3. Live Interview Flow**

```
User selects mode (Technical/Behavioral/Coding) & resume
  ↓
Frontend calls POST /interview/start
  ↓
Backend:
  - Creates InterviewHistory record
  - Returns interview_id
  ↓
Frontend shows instructions modal
  ↓
User clicks "Start Interview"
  ↓
Frontend requests initial question: POST /interview/get-question
  ↓
Backend (interview_engine.py):
  - Generates system prompt with user's resume skills
  - Calls Gemini: _generate_content_with_retry()
  - Returns structured JSON: { question, concept_tested }
  ↓
Frontend:
  - Displays question
  - Activates microphone (navigator.mediaDevices.getUserMedia)
  - Starts Web Speech Recognition (SpeechRecognition API)
  - User speaks answer (continuous dictation)
  - Transcript accumulates in 3-layer system:
    * dictationBaseRef: Previous transcripts
    * dictationCommittedRef: Finalized chunks
    * interim: Current speech data
  ↓
User clicks "Submit Answer"
  ↓
Frontend calls POST /interview/submit-answer with:
  - interview_id
  - question_index
  - user_answer (merged transcript)
  - candidate mode
  ↓
Backend (interview_engine.py):
  - Calls evaluate_and_generate_followup()
  - Analyzes answer quality (Content, Clarity, Relevance)
  - Generates feedback
  - Returns next question OR completion signal
  ↓
LOOP: If more questions:
  - Frontend displays feedback
  - Shows next question
  - User answers again
  ↓
Parallel: Body Language Analysis
  - Frontend captures video frames (canvas)
  - Every 30s (throttled), sends frame to POST /interview/body-language
  - Backend analyzes with Gemini Vision:
    * Eye contact
    * Posture
    * Confidence level
    * Suggests improvements
  ↓
Interview Complete
  - Frontend calls POST /interview/complete
  ↓
Backend (interview_engine.py):
  - Aggregates all Q&A
  - Calls generate_interview_summary()
  - Computes final scores:
    * Technical Score (content accuracy)
    * Communication Score (clarity, confidence)
    * Problem Solving Score (approach, logic)
    * Body Language Score (posture, eye contact)
    * Final Score (weighted average)
  - Generates strengths & improvement areas
  - Stores in InterviewHistory
  ↓
Frontend redirects to /feedback/:id
  ↓
User views comprehensive report:
  - Scores (Recharts visualization)
  - Strengths & Areas to Improve
  - Per-question feedback
  - Body language notes
```

### **4. AI Question Generation Flow**

```
Backend interview_engine.py:

generate_initial_questions(resume_data, mode):
  - Analyzes resume skills
  - Creates tailored prompt
  - Gemini generates Q1
  - Returns: { question, concept_tested }

evaluate_and_generate_followup(question, history, answer, difficulty):
  - Evaluates user's answer:
    * Content accuracy
    * Clarity & communication
    * Completeness
  - Dynamically adjusts difficulty:
    * Strong answer → Harder question
    * Weak answer → Easier question
  - Returns: { feedback, next_question, followup_prompt }

generate_interview_summary(all_qa_pairs):
  - Processes entire interview
  - Generates comprehensive feedback
  - Calculates all scores
  - Returns: { final_score, strengths, improvements, detailed_feedback }

_generate_content_with_retry(prompt, max_attempts=3, timeout=8):
  - Thread pool executor wraps Gemini call
  - Handles transient errors (503, 429, timeout)
  - Exponential backoff: 1s, 2s, 4s
  - Cleans JSON response (removes markdown)
```

### **5. Body Language Analysis**

```
During interview:
  ↓
Every 30 seconds (throttled):
  ↓
Frontend:
  - Captures frame from video element
  - Downscales to 640px (optimization)
  - Converts to JPEG (quality: 0.6)
  - Encodes to base64
  ↓
Calls POST /interview/body-language with frame
  ↓
Backend:
  - Receives base64 image
  - Sends to Gemini Vision API
  - Analyzes:
    * Eye contact quality
    * Posture alignment
    * Facial expressions
    * Confidence indicators
  ↓
Returns feedback:
  - Current score (0-100)
  - Specific observations
  - Real-time suggestions
  ↓
Frontend displays subtle feedback
  ↓
Accumulates for final body_language_score in summary
```

---

## 🔐 **Authentication & Security**

### **JWT Token Flow**

```
1. User registers → bcrypt hash password → Store in DB
2. User logs in → Compare plaintext with hash
3. On match → Generate JWT token:
   - Payload: user_id, email, exp (7 days)
   - Secret: JWTSECRET from .env
   - Return to frontend
4. Frontend stores token in localStorage
5. All protected routes send Authorization header:
   - Header: "Authorization: Bearer <token>"
6. Backend verifies token:
   - Decode JWT
   - Check expiry
   - Extract user_id
   - Proceed if valid, 401 if invalid
7. Frontend detects 401 → Clear token → Redirect to login
```

### **Password Security**

- Hashed with bcrypt (salt rounds: 10)
- Previous password tracking (for security audit)
- Password recovery tokens with expiry
- Email verification for new accounts
- 2FA support (stored but not fully implemented)

---

## 📊 **Interview Scoring System**

### **Score Components** (out of 100 each)

1. **Technical Score (25%)** - Content Accuracy & Depth
   - Correct concepts & accurate answers
   - Depth of knowledge shown
   - Technical vocabulary usage

2. **Communication Score (25%)** - Clarity & Articulation
   - Clear explanation
   - Logical flow of thought
   - Pronunciation & pace

3. **Problem Solving Score (25%)** - Approach & Logic
   - Problem decomposition
   - Solution efficiency
   - Edge case handling

4. **Body Language Score (25%)** - Non-verbal Communication
   - Eye contact
   - Posture alignment
   - Confidence level
   - Gestures appropriateness

### **Final Score Calculation**

```
Final Score = (Technical × 0.25) + (Communication × 0.25) + 
              (Problem Solving × 0.25) + (Body Language × 0.25)
```

---

## 🚀 **How to Run**

### **Prerequisites**
- Node.js 18+ with npm
- Python 3.10+
- Google Gemini API Key
- .env files configured

### **Backend Setup**

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (example below)
# GEMINI_API_KEY=your_api_key_here
# CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
# JWTSECRET=your_jwt_secret_key

# Run backend
uvicorn main:app --reload
# Backend runs on http://localhost:8000
```

### **Frontend Setup**

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
# Frontend runs on http://localhost:5173

# Build for production
npm run build
# Output in frontend/dist/
```

### **Access Application**

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs (Swagger UI)
- **API Schema:** http://localhost:8000/openapi.json

---

## 📁 **Key File Purposes**

### **Frontend Key Files**

| File | Purpose |
|------|---------|
| `App.jsx` | Main router, layout, protected routes |
| `pages/Interview.jsx` | Live interview with speech recognition, retry logic, polling |
| `pages/Dashboard.jsx` | User dashboard with charts & stats |
| `utils/api.js` | Axios instance with JWT intercept |
| `context/AuthContext.jsx` | Global auth state |
| `context/ThemeContext.jsx` | Dark/Light mode state |

### **Backend Key Files**

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app setup, CORS, routes |
| `models.py` | SQLAlchemy database models |
| `interview_engine.py` | AI question generation & scoring logic |
| `ai_service.py` | Gemini API wrapper with retries |
| `auth.py` | JWT & bcrypt utilities |
| `routes/interview_routes.py` | Interview endpoints |

---

## 🔧 **Configuration Files**

### **.env Example**
```
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
JWTSECRET=your_super_secret_jwt_key_change_this
DATABASE_URL=sqlite:///./sql_app.db
```

### **vite.config.js**
- Uses Vite React plugin for JSX transformation
- Port: 5173 (can be configured)
- Optimizations for development

### **tailwind.config.js**
- Custom color scheme (slate/dark theme)
- Dark mode support
- Animation extensions

### **vscode/settings.json** (if present)
- Prettier formatting
- ESLint integration
- Language extensions

---

## 📈 **Performance Optimizations Implemented**

1. **Interview Page**
   - Loop-based retry logic (prevents recursive deadlock)
   - 3-layer text accumulation for dictation (prevents transcript loss)
   - 35-second frontend timeout (allows slow AI)
   - Frame downscaling (640px max, JPEG 0.6 quality)
   - Polling throttled to 30-second intervals

2. **AI Service**
   - Thread pool executor with timeout
   - Exponential backoff for retries
   - Transient error detection
   - Per-request 8-second timeout

3. **Frontend**
   - Vite for fast builds
   - Code splitting via React Router
   - Lazy loading of components
   - Canvas optimization for particles

4. **Database**
   - SQLAlchemy connection pooling
   - Indexed user_id & resume_id foreign keys

---

## 🎓 **Interview Modes**

### **1. Technical Interview**
- Deep technical questions from user's skills
- Focus on: concepts, algorithms, best practices
- Suitable for: SDE positions

### **2. Behavioral Interview**
- HR-style questions
- Focus on: teamwork, conflict resolution, achievements
- Suitable for: All roles

### **3. Coding Interview**
- Live coding problems
- Monaco Editor integration
- Real-time code execution feedback

### **4. Expert Booking**
- Schedule 1-on-1 with real experts
- Domain & experience selection
- Admin approval workflow

---

## 📝 **Development Workflow**

1. **Local Development:**
   - Backend: `uvicorn main:app --reload` (auto-refresh)
   - Frontend: `npm run dev` (hot reload)
   - Both watch for file changes

2. **Build & Test:**
   - Frontend: `npm run build` → outputs to `dist/`
   - Backend: No build needed (pure Python)

3. **Deployment:**
   - Frontend: Deploy `dist/` to static hosting (Vercel, Netlify, etc.)
   - Backend: Deploy FastAPI to platform (Azure, AWS, Render, etc.)
   - Database: Migrate to production DB (PostgreSQL recommended)

---

## 🔗 **Dependencies Summary**

### **Critical Dependencies**
- `google-genai`: AI question & feedback generation
- `sqlalchemy`: Database ORM
- `fastapi`: Backend framework
- `react` + `react-router-dom`: Frontend framework & routing
- `axios`: HTTP client
- `tailwindcss`: Styling

### **Optional but Implemented**
- `pymupdf`: PDF parsing
- `bcrypt`: Password security
- `pyjwt`: Token authentication
- `framer-motion`: UI animations
- `monaco-editor`: Code editing
- `recharts`: Data visualization
- `three.js`: 3D graphics

---

## 🎯 **Future Enhancement Ideas**

1. **Gamification**
   - Badges for achievements
   - Leaderboards
   - Streak tracking

2. **Analytics**
   - Detailed performance tracking
   - Comparative analysis
   - Progress graphs

3. **Content Expansion**
   - More interview domains
   - Industry-specific questions
   - Custom question creation

4. **Multiplayer Features**
   - Peer mock interviews
   - Group practice sessions
   - Interview exchange

5. **Mobile App**
   - React Native version
   - Offline interview practice

6. **Advanced AI**
   - Fine-tuned models for specific roles
   - Real-time speech-to-text (instead of Web Speech API)
   - More sophisticated body language analysis

---

## 📞 **Support & Troubleshooting**

### **Common Issues**

| Issue | Solution |
|-------|----------|
| `CORS error on frontend` | Check `CORS_ORIGINS` in `.env` matches frontend URL |
| `Gemini API error 401` | Verify `GEMINI_API_KEY` is valid & has quota |
| `Database lock error` | Remove old `*.db` files, restart backend |
| `Microphone not working` | Check browser permissions, use HTTPS in production |
| `Video frame analysis fails` | Ensure good lighting, check backend logs |

---

**Generated: April 21, 2026**
**Project: AI Interview Coach**
