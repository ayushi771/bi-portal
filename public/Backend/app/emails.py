import os
import aiosmtplib
from email.message import EmailMessage

async def send_email(to_email: str, subject: str, body: str):
    try:
        message = EmailMessage()
        message["From"] = os.getenv("GMAIL_FROM", "adminbiportal@gmail.com")
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(body)

        await aiosmtplib.send(
            message,
            hostname=os.getenv("GMAIL_SMTP_SERVER", "smtp.gmail.com"),
            port=int(os.getenv("GMAIL_SMTP_PORT", 587)),   # ✅ FIX
            username=os.getenv("GMAIL_SMTP_USERNAME", "adminbiportal@gmail.com"),
            password=os.getenv("GMAIL_SMTP_PASSWORD"),
            start_tls=True,
        )

        print(f"✅ Email sent to {to_email}")

    except Exception as e:
        print("❌ Email sending failed:", str(e))
        print("USER:", os.getenv("GMAIL_SMTP_USERNAME"))
        print("PASS:", os.getenv("GMAIL_SMTP_PASSWORD"))