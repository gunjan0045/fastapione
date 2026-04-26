import os
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple


def _env_bool(key: str, default: bool) -> bool:
    value = os.getenv(key)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def validate_smtp_config() -> Tuple[bool, str]:
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()

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

    return True, "SMTP configuration looks valid"


def send_email(subject: str, recipient_email: str, plain_text_body: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_sender = os.getenv("SMTP_SENDER", smtp_user or "no-reply@ai-interview-coach.local")
    smtp_use_tls = _env_bool("SMTP_USE_TLS", True)
    smtp_use_ssl = _env_bool("SMTP_USE_SSL", False)

    valid, reason = validate_smtp_config()
    if not valid:
        print(f"[Email] {reason}")
        return False

    message = MIMEMultipart()
    message["From"] = smtp_sender
    message["To"] = recipient_email
    message["Subject"] = subject
    message.attach(MIMEText(plain_text_body, "plain", "utf-8"))

    try:
        if smtp_use_ssl:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20) as smtp:
                smtp.login(smtp_user, smtp_password)
                smtp.sendmail(smtp_sender, recipient_email, message.as_string())
            return True

        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as smtp:
            if smtp_use_tls:
                smtp.starttls()
            smtp.login(smtp_user, smtp_password)
            smtp.sendmail(smtp_sender, recipient_email, message.as_string())
    except smtplib.SMTPAuthenticationError:
        print("[Email] SMTP authentication failed. Check SMTP_USER/SMTP_PASSWORD.")
        return False
    except (smtplib.SMTPException, OSError) as exc:
        print(f"[Email] SMTP send failed: {exc}")
        return False

    return True


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
