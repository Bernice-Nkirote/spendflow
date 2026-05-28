import smtplib
from datetime import datetime, timezone
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
        html_body: str | None = None,
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

        if html_body:
            message.add_alternative(html_body, subtype="html")

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
        html_body: str | None = None,
        attachment_bytes: bytes | None = None,
        attachment_filename: str | None = None,
    ) -> None:
        message = self._build_message(
            to_email=to_email,
            subject=subject,
            body=body,
            html_body=html_body,
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
    
    def _format_expiry_datetime(self, expires_at: datetime) -> str:
        expiry_utc = expires_at.astimezone(timezone.utc)
        return expiry_utc.strftime("%A, %B %d, %Y at %I:%M %p UTC")

    def send_user_onboarding_email(
        self,
        to_email: str,
        user_name: str,
        setup_link: str,
        setup_link_expires_at: datetime,
    ) -> None:
        greeting_name = user_name.strip() if user_name and user_name.strip() else "User"
        expiry_text = self._format_expiry_datetime(setup_link_expires_at)

        subject = "Your Tendaflow account has been created"

        body = (
            f"Dear {greeting_name},\n\n"
            "Your Tendaflow user profile has been created.\n\n"
            "Please use the link below to set your password and activate your account:\n\n"
            f"{setup_link}\n\n"
            f"This link will expire on {expiry_text}.\n"
            "The link is valid for 24 hours from the time this email was sent.\n\n"
            "For security, if the link expires, please contact your administrator to request a new one.\n\n"
            "Best regards,\n"
            "Tendaflow Team"
        )

        html_body = f"""
        <html>
          <body style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, sans-serif; color:#141414;">
            <div style="max-width:640px; margin:32px auto; background:#ffffff; border:1px solid #dbe3ee; border-radius:14px; overflow:hidden;">
              <div style="background:#274C77; padding:24px 28px;">
                <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700;">Tendaflow</h1>
              </div>

              <div style="padding:28px;">
                <p style="font-size:16px; margin:0 0 18px;">Dear {greeting_name},</p>

                <p style="font-size:16px; line-height:1.6; margin:0 0 18px;">
                  Your Tendaflow user profile has been created.
                </p>

                <p style="font-size:16px; line-height:1.6; margin:0 0 24px;">
                  Please use the button below to set your password and activate your account:
                </p>

                <div style="text-align:center; margin:30px 0;">
                  <a href="{setup_link}"
                     style="display:inline-block; background:#274C77; color:#ffffff; text-decoration:none; padding:14px 30px; border-radius:8px; font-size:16px; font-weight:700;">
                    Set your password
                  </a>
                </div>

                <div style="border:1px solid #bfd7f5; background:#f1f7ff; border-radius:12px; padding:18px 20px; margin:28px 0;">
                  <p style="margin:0 0 8px; font-size:15px; font-weight:700; color:#274C77;">
                    This link will expire on:
                  </p>
                  <p style="margin:0 0 8px; font-size:16px; font-weight:700; color:#141414;">
                    {expiry_text}
                  </p>
                  <p style="margin:0; font-size:14px; color:#4b5563;">
                    The link is valid for 24 hours from the time this email was sent.
                  </p>
                </div>

                <p style="font-size:16px; line-height:1.6; margin:0 0 24px;">
                  For security, if the link expires, please contact your administrator to request a new one.
                </p>

                <p style="font-size:16px; line-height:1.6; margin:0;">
                  Best regards,<br />
                  <strong>Tendaflow Team</strong>
                </p>

                <hr style="border:none; border-top:1px solid #e5e7eb; margin:28px 0 18px;" />

                <p style="font-size:12px; color:#6b7280; text-align:center; margin:0;">
                  This is an automated email. Please do not reply to this message.
                </p>
              </div>
            </div>
          </body>
        </html>
        """

        self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
            html_body=html_body,
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

        subject = "Your Tendaflow supplier portal account has been created"
        body = (
            f"Dear {greeting_name},\n\n"
            "A supplier portal account has been created for you on Tendaflow.\n\n"
            "Please use the link below to set your password and activate your supplier portal access:\n\n"
            f"{setup_link}\n\n"
            "For security, this link will expire in 24 hours. If the link expires, please contact the procurement team.\n\n"
            "Best regards,\n"
            "Tendaflow Team"
        )

        self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
        )

        # PASSWORD RESET INTERNAL USER
    def send_password_reset_email(
        self,
        to_email: str,
        user_name: str,
        reset_link: str,
    ) -> None:
        greeting_name = user_name.strip() if user_name and user_name.strip() else "User"

        subject = "Reset your Tendaflow password"
        body = (
            f"Dear {greeting_name},\n\n"
            "We received a request to reset your Tendaflow password.\n\n"
            "Please use the link below to create a new password:\n\n"
            f"{reset_link}\n\n"
            "For security, this link will expire in 60 minutes. "
            "If you did not request this reset, you can safely ignore this email.\n\n"
            "Best regards,\n"
            "Tendaflow Team"
        )

        self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
        )

        # PASSWORD RESET SUPPLIER USER 
    def send_supplier_password_reset_email(
        self,
        to_email: str,
        supplier_name: str,
        reset_link: str,
    ) -> None:
        greeting_name = (
            supplier_name.strip()
            if supplier_name and supplier_name.strip()
            else "Supplier"
        )

        subject = "Reset your Tendaflow supplier portal password"
        body = (
            f"Dear {greeting_name},\n\n"
            "We received a request to reset your Tendaflow supplier portal password.\n\n"
            "Please use the link below to create a new password:\n\n"
            f"{reset_link}\n\n"
            "For security, this link will expire in 10 minutes. "
            "If you did not request this reset, you can safely ignore this email.\n\n"
            "Best regards,\n"
            "Tendaflow Team"
        )

        self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
        )