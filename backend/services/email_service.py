import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import config
import logging

class EmailService:
    @staticmethod
    def send_download_link(to_email: str, download_url: str, filename: str):
        if not config.SMTP_USERNAME or not config.SMTP_PASSWORD:
            print(f"MOck EMAIL to {to_email}: Download {filename} at {download_url}")
            return {"status": "mock_sent", "message": "Email configuration missing, logged to console"}

        try:
            msg = MIMEMultipart()
            msg['From'] = config.EMAIL_FROM
            msg['To'] = to_email
            msg['Subject'] = f"Your FileVora Download: {filename}"

            body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #2563eb;">FileVora</h2>
                        <p>Your file <strong>{filename}</strong> is ready!</p>
                        <p>Click the button below to download it. This link is valid for 1 hour.</p>
                        <br>
                        <a href="{download_url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Download File</a>
                        <br><br>
                        <p style="font-size: 12px; color: #666;">If the button doesn't work, verify this link:<br>{download_url}</p>
                    </div>
                </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))

            with smtplib.SMTP(config.SMTP_SERVER, config.SMTP_PORT) as server:
                server.starttls()
                server.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
                server.send_message(msg)
            
            return {"status": "sent"}
        except Exception as e:
            logging.error(f"Failed to send email: {str(e)}")
            raise e
