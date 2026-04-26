import os
import smtplib
import ssl
from datetime import datetime
from email import encoders
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path

from dotenv import dotenv_values


BACKEND_ENV_PATH = Path(__file__).resolve().parent / ".env"


def _read_config_value(key: str, default: str = "") -> str:
    value = os.getenv(key)
    if value is not None and str(value).strip() != "":
        return str(value).strip()

    try:
        dotenv_map = dotenv_values(BACKEND_ENV_PATH)
        dotenv_value = dotenv_map.get(key)
        if dotenv_value is not None and str(dotenv_value).strip() != "":
            return str(dotenv_value).strip()
    except Exception as exc:
        print(f"[Email] Failed reading {key} from {BACKEND_ENV_PATH}: {exc}")

    return default


def _env_bool(key: str, default: bool) -> bool:
    value = _read_config_value(key)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _normalized_smtp_password() -> str:
    return (_read_config_value("SMTP_PASSWORD", "") or "").replace(" ", "").replace("-", "").strip()


def validate_smtp_config() -> Tuple[bool, str]:
    smtp_host = _read_config_value("SMTP_HOST", "").strip()
    smtp_user = _read_config_value("SMTP_USER", "").strip()
    smtp_password = _normalized_smtp_password()

    if not smtp_host or not smtp_user or not smtp_password:
        return False, "SMTP is not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in backend/.env"

    placeholder_markers = {
        "your-email@example.com",
        "your-app-password",
        "example.com",
    }

    lowered_user = smtp_user.lower()
    lowered_password = smtp_password.lower()
    if any(marker in lowered_user for marker in placeholder_markers) or any(marker in lowered_password for marker in placeholder_markers):
        return False, "SMTP is using placeholder values. Update SMTP_USER and SMTP_PASSWORD in backend/.env"

    if smtp_host == "smtp.gmail.com":
        normalized_password = smtp_password.replace(" ", "").replace("-", "")
        if len(normalized_password) < 16:
            return False, "Gmail SMTP requires a 16-character App Password. Set SMTP_PASSWORD to a real Google App Password, not your normal account password."

    return True, "SMTP configuration looks valid"


def send_email(
    subject: str,
    recipient_email: str,
    plain_text_body: str,
    attachments: Optional[List[Tuple[str, bytes, str]]] = None,
) -> bool:
    smtp_host = _read_config_value("SMTP_HOST", "")
    smtp_port = int(_read_config_value("SMTP_PORT", "587"))
    smtp_user = _read_config_value("SMTP_USER", "")
    smtp_password = _normalized_smtp_password()
    smtp_sender = _read_config_value("SMTP_SENDER", smtp_user or "no-reply@ai-interview-coach.local")
    smtp_use_tls = _env_bool("SMTP_USE_TLS", True)
    smtp_use_ssl = _env_bool("SMTP_USE_SSL", False)
    tls_context = ssl.create_default_context()

    if not recipient_email:
        return False

    valid, reason = validate_smtp_config()
    if not valid:
        print(f"[Email] {reason}")
        return False

    message = MIMEMultipart()
    message["From"] = smtp_sender
    message["To"] = recipient_email
    message["Subject"] = subject
    message.attach(MIMEText(plain_text_body, "plain", "utf-8"))

    for attachment in attachments or []:
        filename, payload, mime_type = attachment
        maintype, subtype = (mime_type.split("/", 1) if "/" in mime_type else ("application", "octet-stream"))
        part = MIMEBase(maintype, subtype)
        part.set_payload(payload)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
        message.attach(part)

    try:
        if smtp_use_ssl:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20, context=tls_context) as smtp:
                smtp.ehlo()
                smtp.login(smtp_user, smtp_password)
                smtp.sendmail(smtp_sender, recipient_email, message.as_string())
            return True

        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as smtp:
            smtp.ehlo()
            if smtp_use_tls:
                smtp.starttls(context=tls_context)
                smtp.ehlo()
            smtp.login(smtp_user, smtp_password)
            smtp.sendmail(smtp_sender, recipient_email, message.as_string())
    except smtplib.SMTPAuthenticationError:
        print("[Email] SMTP authentication failed. Use a valid Gmail App Password for SMTP_PASSWORD, not your normal account password.")
        return False
    except (smtplib.SMTPException, OSError) as exc:
        print(f"[Email] SMTP send failed: {exc}")
        return False

    return True


def send_interview_report_email(
    recipient_email: str,
    candidate_name: str,
    history: Dict[str, Any],
    pdf_bytes: bytes,
) -> bool:
    subject = "Your AI Interview Performance Report"
    final_score = int(history.get("final_score") or 0)
    technical_score = int(history.get("technical_score") or 0)
    communication_score = int(history.get("communication_score") or 0)
    problem_solving_score = int(history.get("problem_solving_score") or 0)
    body_language_score = int(history.get("body_language_score") or 0)

    body = (
        f"Hi {candidate_name},\n\n"
        "Your interview has been completed and the detailed performance report is attached to this email.\n\n"
        "Score Summary:\n"
        f"- Final Score: {final_score}%\n"
        f"- Technical: {technical_score}%\n"
        f"- Communication: {communication_score}%\n"
        f"- Problem Solving: {problem_solving_score}%\n"
        f"- Body Language: {body_language_score}%\n\n"
        "Open the attached PDF for the full analysis, question-by-question feedback, and improvement plan.\n\n"
        "Regards,\n"
        "AI Interview Coach"
    )

    attachments = [("interview-performance-report.pdf", pdf_bytes, "application/pdf")]
    return send_email(subject, recipient_email, body, attachments=attachments)


def send_interview_summary_email(
    recipient_email: str,
    candidate_name: str,
    final_score: int,
    technical_score: int,
    communication_score: int,
    problem_solving_score: int,
    body_language_score: int,
):
    subject = "Your AI Interview Report Is Ready"

    body = (
        f"Hi {candidate_name},\n\n"
        "Your recent AI interview session has been completed.\n\n"
        "Score Breakdown:\n"
        f"- Final Score: {final_score}%\n"
        f"- Technical: {technical_score}%\n"
        f"- Communication: {communication_score}%\n"
        f"- Problem Solving: {problem_solving_score}%\n"
        f"- Body Language: {body_language_score}%\n\n"
        "Open your dashboard to review detailed feedback and download the PDF report.\n\n"
        "Regards,\n"
        "AI Interview Coach"
    )
    return send_email(subject, recipient_email, body)


def send_email_verification_code(recipient_email: str, candidate_name: str, code: str) -> bool:
    subject = "Verify Your Email - AI Interview Coach"
    body = (
        f"Hi {candidate_name},\n\n"
        "Use this verification code to confirm your email in Settings:\n\n"
        f"Verification Code: {code}\n\n"
        "This code will expire in 10 minutes.\n\n"
        "Regards,\n"
        "AI Interview Coach"
    )
    return send_email(subject, recipient_email, body)


def send_password_changed_alert(
    recipient_email: str,
    candidate_name: str,
    reject_url: str,
    changed_at: datetime,
) -> bool:
    subject = "Security Alert: Your Password Was Changed"
    body = (
        f"Hi {candidate_name},\n\n"
        f"Your account password was changed at {changed_at.strftime('%Y-%m-%d %H:%M:%S UTC')}.\n\n"
        "If this was you, no action is needed.\n"
        "If this was NOT you, click the link below immediately to revert the password:\n\n"
        f"{reject_url}\n\n"
        "This security link expires in 24 hours.\n\n"
        "Regards,\n"
        "AI Interview Coach Security"
    )
    return send_email(subject, recipient_email, body)