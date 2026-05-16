import smtplib
from email.message import EmailMessage

from fastapi import HTTPException, status


class EmailService:
    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        smtp_username: str,
        smtp_password: str,
        from_email: str,
        use_tls: bool = True,
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_username = smtp_username
        self.smtp_password = smtp_password
        self.from_email = from_email
        self.use_tls = use_tls

    def _build_message(
        self,
        to_email: str,
        subject: str,
        body: str,
        attachment_bytes: bytes | None = None,
        attachment_filename: str | None = None,
    ) -> EmailMessage:
        if not to_email or not to_email.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Recipient email is required",
            )

        if not subject or not subject.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email subject is required",
            )

        if not body or not body.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email body is required",
            )

        message = EmailMessage()
        message["From"] = self.from_email
        message["To"] = to_email.strip()
        message["Subject"] = subject.strip()
        message.set_content(body)

        if attachment_bytes is not None:
            if not attachment_filename or not attachment_filename.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Attachment filename is required",
                )

            message.add_attachment(
                attachment_bytes,
                maintype="application",
                subtype="pdf",
                filename=attachment_filename.strip(),
            )

        return message

    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        attachment_bytes: bytes | None = None,
        attachment_filename: str | None = None,
    ) -> None:
        message = self._build_message(
            to_email=to_email,
            subject=subject,
            body=body,
            attachment_bytes=attachment_bytes,
            attachment_filename=attachment_filename,
        )

        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()

                if self.smtp_username and self.smtp_password:
                    server.login(self.smtp_username, self.smtp_password)

                server.send_message(message)

        except smtplib.SMTPException as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send email: {str(exc)}",
            ) from exc

        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected email error: {str(exc)}",
            ) from exc

    def send_po_email(
        self,
        to_email: str,
        supplier_name: str,
        po_number: str,
        attachment_bytes: bytes,
        attachment_filename: str,
    ) -> None:
        greeting_name = supplier_name.strip() if supplier_name and supplier_name.strip() else "Supplier"

        subject = f"Purchase Order {po_number}"
        body = (
            f"Dear {greeting_name},\n\n"
            f"Please find attached Purchase Order {po_number}.\n\n"
            "Kindly review it and proceed accordingly.\n\n"
            "Best regards,\n"
            "Procurement Team"
        )

        self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
            attachment_bytes=attachment_bytes,
            attachment_filename=attachment_filename,
        )
    
    def send_user_onboarding_email(
        self,
        to_email: str,
        user_name: str,
        setup_link: str,
    ) -> None:
        greeting_name = user_name.strip() if user_name and user_name.strip() else "User"

        subject = "Your SpendFlow account has been created"
        body = (
            f"Dear {greeting_name},\n\n"
            "Your SpendFlow user profile has been created.\n\n"
            "Please use the link below to set your password and activate your account:\n\n"
            f"{setup_link}\n\n"
            "For security, this link will expire. If the link expires, please contact your administrator.\n\n"
            "Best regards,\n"
            "SpendFlow Team"
        )

        self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
        )

    
    def send_supplier_onboarding_email(
        self,
        to_email: str,
        supplier_name: str,
        setup_link: str,
    ) -> None:
        greeting_name = (
            supplier_name.strip()
            if supplier_name and supplier_name.strip()
            else "Supplier"
        )

        subject = "Your SpendFlow supplier portal account has been created"
        body = (
            f"Dear {greeting_name},\n\n"
            "A supplier portal account has been created for you on SpendFlow.\n\n"
            "Please use the link below to set your password and activate your supplier portal access:\n\n"
            f"{setup_link}\n\n"
            "For security, this link will expire in 24 hours. If the link expires, please contact the procurement team.\n\n"
            "Best regards,\n"
            "SpendFlow Team"
        )

        self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
        )