from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import engine
from routes import auth_routes, resume_routes, interview_routes

# ✅ Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Interview Coach API")

# ✅ CORS FIX (IMPORTANT)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # 👈 yahi main fix hai
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Routers with prefix (clean structure)
app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(resume_routes.router, prefix="/resume", tags=["Resume"])
app.include_router(interview_routes.router, prefix="/interview", tags=["Interview"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Interview Coach Backend 🚀"}