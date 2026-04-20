from app.core.config import settings
from app.services.notifications.email_service import EmailService

# ✅ create instance FIRST
email_service = EmailService(
    smtp_host=settings.SMTP_HOST,
    smtp_port=settings.SMTP_PORT,
    smtp_username=settings.SMTP_USERNAME,
    smtp_password=settings.SMTP_PASSWORD,
    from_email=settings.FROM_EMAIL,
    use_tls=settings.SMTP_USE_TLS,
)

# ✅ then call it
email_service.send_email(
    to_email="bernicemwirigi@gmail.com",
    subject="SMTP Test - SpendFlow",
    body="Hello,\n\nThis is a test email.\n\nIf you received this, it works.",
)

print("Email sent successfully")