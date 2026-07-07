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

    def _render_brand_email(
        self,
        *,
        eyebrow: str,
        title: str,
        greeting_name: str,
        message_html: str,
        action_url: str | None = None,
        action_label: str | None = None,
        info_title: str | None = None,
        info_html: str | None = None,
        closing_html: str | None = None,
        footer_note: str = "This is an automated email. Please do not reply to this message.",
    ) -> str:
        action_html = ""
        if action_url and action_label:
            action_html = f'''
                <div style="text-align:center; margin:30px 0;">
                  <a href="{action_url}"
                     style="display:inline-block; background:#26658C; color:#ffffff; text-decoration:none; padding:14px 30px; border-radius:14px; font-size:16px; font-weight:700; box-shadow:0 12px 26px rgba(38,101,140,0.22);">
                    {action_label}
                  </a>
                </div>
            '''

        info_box_html = ""
        if info_title and info_html:
            info_box_html = f'''
                <div style="border:1px solid rgba(167,199,231,0.72); background:linear-gradient(145deg, rgba(255,255,255,0.86), rgba(167,199,231,0.24)); border-radius:18px; padding:18px 20px; margin:28px 0; box-shadow:inset 0 1px 0 rgba(255,255,255,0.9);">
                  <p style="margin:0 0 8px; font-size:14px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#2A7387;">
                    {info_title}
                  </p>
                  <div style="font-size:14px; line-height:1.7; color:#40566b;">
                    {info_html}
                  </div>
                </div>
            '''

        closing = closing_html or "Best regards,<br /><strong>Tendaflow Team</strong>"

        return f'''
        <html>
          <body style="margin:0; padding:0; background:#f8fcfd; font-family:Arial, sans-serif; color:#011C40;">
            <div style="padding:32px 14px; background:linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(244,251,254,0.92) 46%, rgba(234,247,252,0.94) 100%);">
              <div style="max-width:660px; margin:0 auto; border:1px solid rgba(167,199,231,0.68); border-radius:24px; overflow:hidden; background:rgba(255,255,255,0.82); box-shadow:0 24px 70px rgba(1,28,64,0.12);">
                <div style="padding:28px 30px; background:linear-gradient(135deg, #011C40 0%, #26658C 58%, #54ACBF 100%);">
                  <p style="margin:0 0 8px; color:#A7EBF2; font-size:12px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase;">
                    {eyebrow}
                  </p>
                  <h1 style="margin:0; color:#ffffff; font-size:30px; line-height:1.2; font-weight:800;">
                    {title}
                  </h1>
                  <p style="margin:10px 0 0; color:rgba(255,255,255,0.78); font-size:14px; line-height:1.6;">
                    Take Action. Make Smarter Procurement Decisions.
                  </p>
                </div>

                <div style="padding:30px;">
                  <p style="font-size:16px; margin:0 0 18px; color:#011C40;">Dear {greeting_name},</p>

                  <div style="font-size:16px; line-height:1.7; color:#40566b;">
                    {message_html}
                  </div>

                  {action_html}
                  {info_box_html}

                  <p style="font-size:16px; line-height:1.7; margin:0 0 24px; color:#40566b;">
                    {closing}
                  </p>

                  <div style="border-top:1px solid rgba(167,199,231,0.5); padding-top:18px; margin-top:28px;">
                    <p style="font-size:12px; color:#66788a; text-align:center; margin:0; line-height:1.6;">
                      {footer_note}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
        '''

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

        html_body = self._render_brand_email(
            eyebrow="Purchase order",
            title=f"Purchase Order {po_number}",
            greeting_name=greeting_name,
            message_html=f"""
                <p style="margin:0 0 18px;">Please find attached Purchase Order <strong style="color:#011C40;">{po_number}</strong>.</p>
                <p style="margin:0;">Kindly review it and proceed accordingly.</p>
            """,
            info_title="Attachment included",
            info_html=f"""
                <p style="margin:0;"><strong style="color:#011C40;">File:</strong> {attachment_filename}</p>
            """,
            closing_html="Best regards,<br /><strong>Procurement Team</strong>",
        )

        self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
            html_body=html_body,
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

        html_body = self._render_brand_email(
            eyebrow="Account setup",
            title="Your Tendaflow account is ready",
            greeting_name=greeting_name,
            message_html="""
                <p style="margin:0 0 18px;">Your Tendaflow user profile has been created.</p>
                <p style="margin:0;">Use the button below to set your password and activate your account.</p>
            """,
            action_url=setup_link,
            action_label="Set your password",
            info_title="Link expiry",
            info_html=f"""
                <p style="margin:0 0 8px; font-weight:700; color:#011C40;">{expiry_text}</p>
                <p style="margin:0;">The link is valid for 24 hours from the time this email was sent.</p>
            """,
            closing_html="For security, if the link expires, please contact your administrator to request a new one.<br /><br />Best regards,<br /><strong>Tendaflow Team</strong>",
        )

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
            "For security, this link will expire in 24 hours.\n"
            "If the link expires, please contact the procurement team to request a new one.\n\n"
            "Best regards,\n"
            "Tendaflow Team"
        )

        html_body = self._render_brand_email(
            eyebrow="Supplier portal",
            title="Your supplier portal is ready",
            greeting_name=greeting_name,
            message_html="""
                <p style="margin:0 0 18px;">A supplier portal account has been created for you on Tendaflow.</p>
                <p style="margin:0;">Use the button below to set your password and activate your supplier portal access.</p>
            """,
            action_url=setup_link,
            action_label="Set your password",
            info_title="Link expiry",
            info_html="""
                <p style="margin:0;">This link is valid for 24 hours from the time this email was sent.</p>
            """,
            closing_html="If the link expires, please contact the procurement team to request a new one.<br /><br />Best regards,<br /><strong>Tendaflow Team</strong>",
        )

        self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
            html_body=html_body,
        )

    def send_company_signup_confirmation_email(
        self,
        to_email: str,
        admin_name: str,
        company_name: str,
        business_type: str,
        login_link: str,
    ) -> None:
        greeting_name = admin_name.strip() if admin_name and admin_name.strip() else "there"
        company_display_name = (
            company_name.strip() if company_name and company_name.strip() else "your company"
        )
        readable_business_type = business_type.replace("_", " ").title()

        subject = "Welcome to Tendaflow"

        body = (
            f"Dear {greeting_name},\n\n"
            f"Your Tendaflow workspace for {company_display_name} has been created successfully.\n\n"
            f"Business type: {readable_business_type}\n"
            f"Admin email: {to_email}\n\n"
            "You can now sign in and continue setup by reviewing departments, users, roles, permissions, approval workflows, suppliers, and exchange rates.\n\n"
            f"Sign in here: {login_link}\n\n"
            "Best regards,\n"
            "Tendaflow Team"
        )

        html_body = self._render_brand_email(
            eyebrow="Workspace created",
            title="Welcome to Tendaflow",
            greeting_name=greeting_name,
            message_html=f"""
                <p style="margin:0 0 18px;">Your Tendaflow workspace for <strong style="color:#011C40;">{company_display_name}</strong> has been created successfully.</p>
                <p style="margin:0;">You can now sign in and continue setup by reviewing departments, users, roles, permissions, approval workflows, suppliers, and exchange rates.</p>
            """,
            action_url=login_link,
            action_label="Sign in to Tendaflow",
            info_title="Workspace details",
            info_html=f"""
                <p style="margin:0 0 6px;"><strong style="color:#011C40;">Business type:</strong> {readable_business_type}</p>
                <p style="margin:0;"><strong style="color:#011C40;">Admin email:</strong> {to_email}</p>
            """,
            footer_note="This is an automated email confirming the email address used during signup.",
        )

        self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
            html_body=html_body,
        )

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
            "For security, this link will expire in 10 minutes.\n"
            "If you did not request this reset, you can safely ignore this email.\n\n"
            "Best regards,\n"
            "Tendaflow Team"
        )

        html_body = self._render_brand_email(
            eyebrow="Password reset",
            title="Reset your Tendaflow password",
            greeting_name=greeting_name,
            message_html="""
                <p style="margin:0 0 18px;">We received a request to reset your Tendaflow password.</p>
                <p style="margin:0;">Use the button below to create a new password.</p>
            """,
            action_url=reset_link,
            action_label="Reset password",
            info_title="Link expiry",
            info_html="""
                <p style="margin:0;">This link is valid for 10 minutes from the time this email was sent.</p>
            """,
            closing_html="If you did not request this reset, you can safely ignore this email.<br /><br />Best regards,<br /><strong>Tendaflow Team</strong>",
        )

        self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
            html_body=html_body,
        )

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
            "For security, this link will expire in 10 minutes.\n"
            "If you did not request this reset, you can safely ignore this email.\n\n"
            "Best regards,\n"
            "Tendaflow Team"
        )

        html_body = self._render_brand_email(
            eyebrow="Supplier password reset",
            title="Reset your supplier portal password",
            greeting_name=greeting_name,
            message_html="""
                <p style="margin:0 0 18px;">We received a request to reset your Tendaflow supplier portal password.</p>
                <p style="margin:0;">Use the button below to create a new password.</p>
            """,
            action_url=reset_link,
            action_label="Reset password",
            info_title="Link expiry",
            info_html="""
                <p style="margin:0;">This link is valid for 10 minutes from the time this email was sent.</p>
            """,
            closing_html="If you did not request this reset, you can safely ignore this email.<br /><br />Best regards,<br /><strong>Tendaflow Team</strong>",
        )

        self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
            html_body=html_body,
        )
