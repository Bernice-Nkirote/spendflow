import smtplib
from email.message import EmailMessage

def send_email_with_attachment(to_email, subject, body, file_buffer, file_name):
    msg = EmailMessage()
    msg["Subject"] =subject
    msg["From"] = "bernicemwirigi@gmail.com"
    msg["To"] = to_email
    msg.set_content(body)

    msg.add_attachment(
        file_buffer.read(),
        main_type="application",
        subtype="pdf",
        filename=file_name
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login("your-email@gmail.com", "your-app-password")
        smtp.send_message(msg)