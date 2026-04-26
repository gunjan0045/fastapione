from pathlib import Path
from env_utils import load_env_file

# Load backend/.env reliably regardless of the working directory used to start uvicorn.
load_env_file(Path(__file__).resolve().parent / ".env", override=True)

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import engine
from routes import auth_routes, resume_routes, interview_routes

# Create tables
models.Base.metadata.create_all(bind=engine)


def ensure_interview_history_schema():
    with engine.begin() as connection:
        columns = connection.exec_driver_sql("PRAGMA table_info(interview_history)").fetchall()
        column_names = {column[1] for column in columns}
        if "problem_solving_score" not in column_names:
            connection.exec_driver_sql(
                "ALTER TABLE interview_history ADD COLUMN problem_solving_score INTEGER DEFAULT 0"
            )


ensure_interview_history_schema()


def ensure_user_settings_schema():
    with engine.begin() as connection:
        columns = connection.exec_driver_sql("PRAGMA table_info(users)").fetchall()
        column_names = {column[1] for column in columns}

        schema_updates = {
            "email_notifications": "ALTER TABLE users ADD COLUMN email_notifications BOOLEAN DEFAULT 1",
            "newsletter_enabled": "ALTER TABLE users ADD COLUMN newsletter_enabled BOOLEAN DEFAULT 0",
            "profile_public": "ALTER TABLE users ADD COLUMN profile_public BOOLEAN DEFAULT 1",
            "two_factor_enabled": "ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0",
            "dark_mode_preference": "ALTER TABLE users ADD COLUMN dark_mode_preference BOOLEAN DEFAULT 1",
            "data_export_enabled": "ALTER TABLE users ADD COLUMN data_export_enabled BOOLEAN DEFAULT 1",
            "language": "ALTER TABLE users ADD COLUMN language VARCHAR DEFAULT 'English'",
            "region": "ALTER TABLE users ADD COLUMN region VARCHAR DEFAULT 'India'",
            "email_verified": "ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0",
            "email_verification_code": "ALTER TABLE users ADD COLUMN email_verification_code VARCHAR",
            "email_verification_expires_at": "ALTER TABLE users ADD COLUMN email_verification_expires_at DATETIME",
            "password_last_changed_at": "ALTER TABLE users ADD COLUMN password_last_changed_at DATETIME",
            "previous_hashed_password": "ALTER TABLE users ADD COLUMN previous_hashed_password VARCHAR",
            "password_recovery_token": "ALTER TABLE users ADD COLUMN password_recovery_token VARCHAR",
            "password_recovery_expires_at": "ALTER TABLE users ADD COLUMN password_recovery_expires_at DATETIME",
            "phone": "ALTER TABLE users ADD COLUMN phone VARCHAR",
            "address": "ALTER TABLE users ADD COLUMN address TEXT",
            "city": "ALTER TABLE users ADD COLUMN city VARCHAR",
            "state": "ALTER TABLE users ADD COLUMN state VARCHAR",
            "country": "ALTER TABLE users ADD COLUMN country VARCHAR",
            "postal_code": "ALTER TABLE users ADD COLUMN postal_code VARCHAR",
            "date_of_birth": "ALTER TABLE users ADD COLUMN date_of_birth VARCHAR",
            "government_id_type": "ALTER TABLE users ADD COLUMN government_id_type VARCHAR",
            "government_id_number": "ALTER TABLE users ADD COLUMN government_id_number VARCHAR",
            "college_name": "ALTER TABLE users ADD COLUMN college_name VARCHAR",
            "school_name": "ALTER TABLE users ADD COLUMN school_name VARCHAR",
            "highest_qualification": "ALTER TABLE users ADD COLUMN highest_qualification VARCHAR",
            "profession": "ALTER TABLE users ADD COLUMN profession VARCHAR",
            "linkedin_url": "ALTER TABLE users ADD COLUMN linkedin_url VARCHAR",
            "github_url": "ALTER TABLE users ADD COLUMN github_url VARCHAR",
            "portfolio_url": "ALTER TABLE users ADD COLUMN portfolio_url VARCHAR",
            "bio": "ALTER TABLE users ADD COLUMN bio TEXT",
        }

        for column_name, statement in schema_updates.items():
            if column_name not in column_names:
                connection.exec_driver_sql(statement)


ensure_user_settings_schema()

app = FastAPI(title="AI Interview Coach API")

allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
)
origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers with prefix (clean structure)
app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(resume_routes.router, prefix="/resume", tags=["Resume"])
app.include_router(interview_routes.router, prefix="/interview", tags=["Interview"])

@app.get("/")
def read_root():
    return {
        "message": "AI Interview Coach API is running",
        "status": "ok",
        "environment": os.getenv("APP_ENV", "development"),
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}