from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import secrets
import os
from urllib.parse import quote_plus
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import json
from typing import Optional
from pathlib import Path

import models, schemas, auth
from database import get_db
from env_utils import read_env_file
from notification_service import (
    send_email,
    validate_smtp_config,
    send_email_verification_code,
    send_password_changed_alert,
)

# ❗ PREFIX REMOVE kar diya
router = APIRouter(tags=["Authentication"])
OAUTH_STATE_CACHE = {}
OAUTH_STATE_TTL_SECONDS = 600
BACKEND_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"


def _read_env_value(key: str) -> str:
    # First try os.environ (loaded by dotenv in main.py)
    value = os.getenv(key)
    if value:
        return str(value).strip()
    
    # Fallback: read .env file directly
    try:
        dotenv_map = read_env_file(BACKEND_ENV_PATH)
        dotenv_value = dotenv_map.get(key)
        if dotenv_value:
            return str(dotenv_value).strip()
    except Exception as e:
        print(f"DEBUG: Error reading {key} from .env: {e}")
    
    return ""


def _cleanup_oauth_states():
    now = datetime.utcnow()
    expired = [key for key, value in OAUTH_STATE_CACHE.items() if value["expires_at"] < now]
    for key in expired:
        OAUTH_STATE_CACHE.pop(key, None)


def _frontend_auth_callback(error: Optional[str] = None, token: Optional[str] = None):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    params = {}
    if error:
        params["error"] = error
    if token:
        params["token"] = token
    query = urlencode(params)
    target = f"{frontend_url}/oauth/callback"
    if query:
        target = f"{target}?{query}"
    return RedirectResponse(url=target, status_code=status.HTTP_302_FOUND)


def _http_json_request(url: str, method: str = "GET", headers: dict | None = None, data: dict | None = None):
    payload = None
    request_headers = headers.copy() if headers else {}

    if data is not None:
        payload = urlencode(data).encode("utf-8")
        request_headers.setdefault("Content-Type", "application/x-www-form-urlencoded")

    request = Request(url, data=payload, headers=request_headers, method=method)
    try:
        with urlopen(request, timeout=20) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except HTTPError as exc:
        detail = exc.read().decode("utf-8") if hasattr(exc, "read") else str(exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"OAuth request failed: {detail}")


def _get_provider_config(provider: str):
    backend_url = (_read_env_value("BACKEND_URL") or "http://localhost:8000").rstrip("/")

    configs = {
        "google": {
            "client_id": _read_env_value("GOOGLE_CLIENT_ID"),
            "client_secret": _read_env_value("GOOGLE_CLIENT_SECRET"),
            "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "userinfo_url": "https://www.googleapis.com/oauth2/v3/userinfo",
            "scope": "openid email profile",
            "callback_url": f"{backend_url}/auth/oauth/google/callback",
        },
        "github": {
            "client_id": _read_env_value("GITHUB_CLIENT_ID"),
            "client_secret": _read_env_value("GITHUB_CLIENT_SECRET"),
            "authorize_url": "https://github.com/login/oauth/authorize",
            "token_url": "https://github.com/login/oauth/access_token",
            "userinfo_url": "https://api.github.com/user",
            "emails_url": "https://api.github.com/user/emails",
            "scope": "read:user user:email",
            "callback_url": f"{backend_url}/auth/oauth/github/callback",
        },
    }

    config = configs.get(provider)
    if not config:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported OAuth provider")
    
    # Debug logging
    client_id = config["client_id"]
    client_secret = config["client_secret"]
    print(f"DEBUG: {provider} - client_id len={len(client_id)}, client_secret len={len(client_secret)}")
    
    if not client_id or not client_secret:
        print(f"DEBUG: {provider} OAuth config missing - ID: '{client_id}', Secret: '{client_secret}'")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"{provider.title()} OAuth is not configured")
    
    return config


def _extract_oauth_identity(provider: str, access_token: str, config: dict):
    if provider == "google":
        profile = _http_json_request(
            config["userinfo_url"],
            headers={"Authorization": f"Bearer {access_token}"},
        )
        email = (profile.get("email") or "").strip().lower()
        name = (profile.get("name") or profile.get("given_name") or "").strip()
        return email, name

    profile = _http_json_request(
        config["userinfo_url"],
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json", "User-Agent": "AI-Interview-Coach"},
    )
    email = (profile.get("email") or "").strip().lower()
    name = (profile.get("name") or profile.get("login") or "").strip()

    if not email:
        emails = _http_json_request(
            config["emails_url"],
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json", "User-Agent": "AI-Interview-Coach"},
        )
        if isinstance(emails, list):
            primary = next((item for item in emails if item.get("primary") and item.get("verified")), None)
            fallback = next((item for item in emails if item.get("verified")), None)
            selected = primary or fallback
            if selected:
                email = (selected.get("email") or "").strip().lower()

    return email, name


def _redirect_password_change_result(status_value: str, message: str):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    encoded_message = quote_plus(message)
    target = f"{frontend_url}/security/password-change-result?status={status_value}&message={encoded_message}"
    return RedirectResponse(url=target, status_code=status.HTTP_302_FOUND)


@router.get("/oauth/{provider}/start")
def oauth_start(provider: str):
    provider = (provider or "").strip().lower()
    config = _get_provider_config(provider)

    _cleanup_oauth_states()
    state = secrets.token_urlsafe(24)
    OAUTH_STATE_CACHE[state] = {
        "provider": provider,
        "expires_at": datetime.utcnow() + timedelta(seconds=OAUTH_STATE_TTL_SECONDS),
    }

    if provider == "google":
        params = {
            "client_id": config["client_id"],
            "redirect_uri": config["callback_url"],
            "response_type": "code",
            "scope": config["scope"],
            "state": state,
            "access_type": "online",
            "prompt": "select_account",
        }
    else:
        params = {
            "client_id": config["client_id"],
            "redirect_uri": config["callback_url"],
            "scope": config["scope"],
            "state": state,
        }

    return RedirectResponse(url=f"{config['authorize_url']}?{urlencode(params)}", status_code=status.HTTP_302_FOUND)


@router.get("/oauth/{provider}/callback")
def oauth_callback(provider: str, code: str = Query(""), state: str = Query(""), db: Session = Depends(get_db)):
    provider = (provider or "").strip().lower()
    if not code or not state:
        return _frontend_auth_callback(error="Missing OAuth callback parameters")

    _cleanup_oauth_states()
    cached_state = OAUTH_STATE_CACHE.pop(state, None)
    if not cached_state or cached_state.get("provider") != provider:
        return _frontend_auth_callback(error="Invalid or expired OAuth state")

    try:
        config = _get_provider_config(provider)

        token_payload = {
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "code": code,
            "redirect_uri": config["callback_url"],
        }

        if provider == "google":
            token_payload["grant_type"] = "authorization_code"
            token_response = _http_json_request(config["token_url"], method="POST", data=token_payload)
        else:
            token_response = _http_json_request(
                config["token_url"],
                method="POST",
                headers={"Accept": "application/json", "User-Agent": "AI-Interview-Coach"},
                data=token_payload,
            )

        access_token = token_response.get("access_token")
        if not access_token:
            return _frontend_auth_callback(error="Failed to get access token from provider")

        email, name = _extract_oauth_identity(provider, access_token, config)
        if not email:
            return _frontend_auth_callback(error="Provider account has no verified email")

        user = auth.get_user(db, email=email)
        if not user:
            generated_name = name or email.split("@")[0]
            user = models.User(
                email=email,
                name=generated_name,
                hashed_password=auth.get_password_hash(secrets.token_urlsafe(32)),
                email_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        token = auth.create_access_token(
            data={"sub": user.email},
            expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        return _frontend_auth_callback(token=token)
    except HTTPException as exc:
        return _frontend_auth_callback(error=exc.detail)
    except Exception:
        return _frontend_auth_callback(error="OAuth login failed")


# ✅ REGISTER
@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = auth.get_user(db, email=user.email)

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth.get_password_hash(user.password)

    new_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ✅ LOGIN
@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    user = auth.get_user(db, email=form_data.username)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Wrong password")

    access_token = auth.create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ✅ GET CURRENT USER
@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@router.get("/settings", response_model=schemas.UserResponse)
def get_user_settings(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@router.put("/settings", response_model=schemas.UserResponse)
def update_user_settings(
    request: schemas.UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    updates = request.model_dump(exclude_unset=True)

    for key, value in updates.items():
        if isinstance(value, str):
            value = value.strip()
            if key in {"language", "region"}:
                value = value or ("English" if key == "language" else "India")
            elif key == "name":
                value = value or current_user.name
        setattr(current_user, key, value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    request: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if request.email.lower() != current_user.email.lower():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email does not match logged in user")

    if not current_user.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email is not verified. Verify email before changing password.")

    if not auth.verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    if len(request.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 6 characters")

    current_user.previous_hashed_password = current_user.hashed_password
    current_user.hashed_password = auth.get_password_hash(request.new_password)
    current_user.password_last_changed_at = datetime.utcnow()
    current_user.password_recovery_token = secrets.token_urlsafe(32)
    current_user.password_recovery_expires_at = datetime.utcnow() + timedelta(hours=24)
    db.add(current_user)
    db.commit()

    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
    reject_url = f"{backend_url}/auth/security/reject-password-change?token={current_user.password_recovery_token}"
    send_password_changed_alert(
        recipient_email=current_user.email,
        candidate_name=current_user.name,
        reject_url=reject_url,
        changed_at=current_user.password_last_changed_at,
    )

    return {"success": True, "message": "Password updated successfully"}


@router.post("/verify-email/send")
def send_verification_code(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    valid, reason = validate_smtp_config()
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)

    code = f"{secrets.randbelow(1_000_000):06d}"
    current_user.email_verification_code = code
    current_user.email_verification_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.add(current_user)
    db.commit()

    sent = send_email_verification_code(current_user.email, current_user.name, code)
    if not sent:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send verification email")

    return {"success": True, "message": "Verification code sent to your email"}


@router.post("/verify-email/confirm")
def confirm_verification_code(
    request: schemas.VerifyEmailCodeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    code = (request.code or "").strip()
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code is required")

    if not current_user.email_verification_code or not current_user.email_verification_expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active verification code found")

    if datetime.utcnow() > current_user.email_verification_expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code expired")

    if code != current_user.email_verification_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

    current_user.email_verified = True
    current_user.email_verification_code = None
    current_user.email_verification_expires_at = None
    db.add(current_user)
    db.commit()

    return {"success": True, "message": "Email verified successfully"}


@router.get("/security/reject-password-change")
def reject_password_change(
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.password_recovery_token == token).first()
    if not user:
        return _redirect_password_change_result("error", "Invalid security token")

    if not user.password_recovery_expires_at or datetime.utcnow() > user.password_recovery_expires_at:
        return _redirect_password_change_result("error", "Security token expired")

    if not user.previous_hashed_password:
        return _redirect_password_change_result("error", "No recoverable password found")

    user.hashed_password = user.previous_hashed_password
    user.previous_hashed_password = None
    user.password_recovery_token = None
    user.password_recovery_expires_at = None
    db.add(user)
    db.commit()

    return _redirect_password_change_result(
        "success",
        "Password change rejected. Your previous password has been restored. Please login and secure your account."
    )


@router.post("/test-email")
def send_test_email(
    request: schemas.TestEmailRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    valid, reason = validate_smtp_config()
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)

    recipient = request.recipient_email or current_user.email
    sent = send_email(
        subject="SMTP Test - AI Interview Coach",
        recipient_email=recipient,
        plain_text_body=(
            "Hello,\n\n"
            "This is a test email from AI Interview Coach.\n"
            "If you received this message, your SMTP configuration is working correctly.\n\n"
            "Regards,\n"
            "AI Interview Coach"
        ),
    )

    if not sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SMTP configured but email delivery failed. Check backend logs for auth/network details."
        )

    return {"success": True, "message": f"Test email sent to {recipient}"}