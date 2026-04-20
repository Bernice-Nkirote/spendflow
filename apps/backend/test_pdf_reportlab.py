from app.core.config import settings
from app.services.notifications.email_service import EmailService


email_service = EmailService(
    smtp_host=settings.SMTP_HOST,
    smtp_port=settings.SMTP_PORT,
    smtp_username=settings.SMTP_USERNAME,
    smtp_password=settings.SMTP_PASSWORD,
    from_email=settings.FROM_EMAIL,
    use_tls=settings.SMTP_USE_TLS,
)

email_service.send_email(
    to_email="your_personal_email@gmail.com",
    subject="Test Email",
    body="If you see this, email is working.",
)

print("Test email sent successfully")