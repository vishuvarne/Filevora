import os
from pathlib import Path

class Config:
    BASE_DIR = Path(__file__).resolve().parent    # Storage
    STORAGE_PATH = Path("storage")
    JOBS_PATH = STORAGE_PATH / "jobs"
    
    # File Upload Limits
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB per file
    MAX_FILES_PER_REQUEST = 10
    MAX_PDF_PAGES = 500
    MAX_IMAGE_DIMENSION = 10000  # 10000x10000 pixels max
    
    # Allowed Formats
    ALLOWED_IMAGE_FORMATS = {'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff'}
    MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.jpg', '.png'}
    FILE_RETENTION_SECONDS = 3600 # 1 Hour
    
    # Rate Limiting (requests per hour)
    RATE_LIMIT_ANONYMOUS = 100
    RATE_LIMIT_AUTHENTICATED = 1000
    
    FILE_RETENTION_TIME = 3600  # 1 hour
    ALLOWED_ORIGINS = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://filevora.web.app",
        "https://filevora.firebaseapp.com",
        "https://filevora.com"
    ]

    # Email Settings
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@filevora.com")

    @staticmethod
    def setup_storage():
        Config.STORAGE_PATH.mkdir(parents=True, exist_ok=True)
        Config.JOBS_PATH.mkdir(parents=True, exist_ok=True)

    # Alias for compatibility
    STORAGE_DIR = JOBS_PATH

config = Config()
