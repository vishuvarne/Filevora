import shutil
import uuid
import time
import os
import magic
from pathlib import Path
from typing import List, Union, IO
import logging
from config import config

logger = logging.getLogger(__name__)

class FileOps:
    @staticmethod
    def create_job_dir() -> Path:
        job_id = str(uuid.uuid4())
        job_dir = config.STORAGE_DIR / job_id
        (job_dir / "uploads").mkdir(parents=True, exist_ok=True)
        (job_dir / "outputs").mkdir(parents=True, exist_ok=True)
        return job_dir

    @staticmethod
    def cleanup_old_jobs():
        """Deletes job directories older than retention period."""
        current_time = time.time()
        if not config.STORAGE_DIR.exists():
            return
            
        for job_dir in config.STORAGE_DIR.iterdir():
            if job_dir.is_dir():
                try:
                    # Check directory modification time
                    stat = job_dir.stat()
                    if current_time - stat.st_mtime > config.FILE_RETENTION_SECONDS:
                        shutil.rmtree(job_dir)
                        logger.info(f"Deleted old job: {job_dir}")
                except Exception as e:
                    logger.error(f"Error deleting {job_dir}: {e}")

    @staticmethod
    def validate_magic_bytes(file_input: Union[Path, str, bytes, IO[bytes]], expected_mime_type: str) -> bool:
        """
        Validates file integrity using Magic Bytes.
        Returns True if the detected mime type matches expected (or is a valid subclass).
        Supports Path, bytes, or file-like objects.
        """
        try:
            # use magic to read the file header
            mime = magic.Magic(mime=True)
            
            if isinstance(file_input, (str, Path)):
                detected_mime = mime.from_file(str(file_input))
            elif isinstance(file_input, (bytes, bytearray)):
                detected_mime = mime.from_buffer(file_input)
            elif hasattr(file_input, "read"):
                # Read header
                if hasattr(file_input, "seek"):
                    file_input.seek(0)
                # Read 2KB which is enough for most magic numbers
                header = file_input.read(2048)
                detected_mime = mime.from_buffer(header)
                # Reset stream
                if hasattr(file_input, "seek"):
                    file_input.seek(0)
            else:
                return False
            
            # Simple check, can be expanded for specific subtypes
            # e.g. allowing 'application/pdf' for PDFs
            # or 'image/png', 'image/jpeg' for images
            
            if expected_mime_type == "application/pdf":
                return detected_mime == "application/pdf"
            
            if expected_mime_type.startswith("image/"):
                return detected_mime.startswith("image/")
                
            return False
        except Exception as e:
            logger.error(f"Magic bytes check failed: {e}")
            return False

    @staticmethod
    def create_zip(source_dir: Path, output_path: Path):
        """Creates a zip file from a directory."""
        shutil.make_archive(str(output_path.with_suffix('')), 'zip', source_dir)
        return output_path

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitize filename to prevent directory traversal and unsafe characters.
        Blocks executable extensions.
        """
        import re
        
        # Blocked extensions (abuse prevention)
        BLOCKED_EXTENSIONS = {
            '.exe', '.dll', '.so', '.rpm', '.deb', '.pl', '.sh', '.php', '.py', '.pyc', 
            '.rb', '.bat', '.cmd', '.vbs', '.js', '.jar', '.msi', '.bin', '.wsf', '.scf',
            '.com', '.gadget', '.inf', '.installer', '.jsx', '.reg', '.vb', '.vbe'
        }
        
        # Get the basename (files only, no paths)
        path = Path(filename)
        clean_name = path.name
        
        # Check against blocked extensions (case-insensitive)
        if path.suffix.lower() in BLOCKED_EXTENSIONS:
            # Option 1: Raise Error (Secure)
            raise ValueError(f"File type '{path.suffix}' is not allowed for security reasons.")
             # Option 2: Rename (User friendly? No, blocking is safer for these types)

        # Allow only alphanumeric, dashes, dots, underscores
        clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_name)
        
        # Ensure it's not empty and no dots at start
        clean_name = clean_name.lstrip('.')
        if not clean_name:
            clean_name = "unnamed_file"
            
        # Limit length
        if len(clean_name) > 255:
            stem = Path(clean_name).stem[:250]
            suffix = Path(clean_name).suffix
            clean_name = f"{stem}{suffix}"
            
        return clean_name

    @staticmethod
    async def save_upload(file, job_dir: Path) -> Path:
        """
        Securely saves an uploaded file to the job directory with a sanitized name.
        Returns the path to the saved file.
        """
        clean_filename = FileOps.sanitize_filename(file.filename)
        destination = job_dir / clean_filename
        
        # Avoid overwrites by appending counter
        counter = 1
        stem = destination.stem
        suffix = destination.suffix
        while destination.exists():
            destination = job_dir / f"{stem}_{counter}{suffix}"
            counter += 1
            
        # Save file
        # Using a loop for async support if needed, but shutil is sync
        # Since we are in run_in_threadpool context usually, sync is fine?
        # UploadFile.read is async, but file.file is SpooledTemporaryFile
        
        # Best practice for FastAPI UploadFile:
        # If we use `await file.read()`, it loads into memory.
        # `shutil.copyfileobj(file.file, f)` is efficient.
        
        with open(destination, "wb") as f:
            shutil.copyfileobj(file.file, f)
            
        return destination

    @staticmethod
    def schedule_cleanup(job_dir: Path):
        """Placeholder for any specific cleanup scheduling if needed"""
        pass

    @staticmethod
    def get_s3_client():
        try:
            import boto3
            from botocore.exceptions import NoCredentialsError
            
            # Check for AWS credentials in env
            if not os.getenv("AWS_ACCESS_KEY_ID") or not os.getenv("AWS_SECRET_ACCESS_KEY"):
                return None
                
            s3 = boto3.client(
                's3',
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                region_name=os.getenv("AWS_REGION", "us-east-1")
            )
            return s3
        except ImportError:
            logger.warning("boto3 not installed, S3 disabled")
            return None
        except Exception as e:
            logger.error(f"S3 Init Error: {e}")
            return None

    @staticmethod
    def upload_to_storage(local_path: Path, remote_key: str) -> str:
        """
        Uploads a file to S3/GCS if configured, otherwise returns local path.
        Returns the download URL.
        """
        bucket = os.getenv("AWS_BUCKET_NAME")
        s3 = FileOps.get_s3_client()
        
        if s3 and bucket:
            try:
                # Upload
                s3.upload_file(str(local_path), bucket, remote_key)
                
                # Generate Presigned URL (valid for 1 hour by default, matching retention)
                # Or if public:
                # url = f"https://{bucket}.s3.amazonaws.com/{remote_key}"
                
                url = s3.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': bucket, 'Key': remote_key},
                    ExpiresIn=config.FILE_RETENTION_SECONDS
                )
                logger.info(f"Uploaded {local_path} to S3: {remote_key}")
                return url
            except Exception as e:
                logger.error(f"S3 Upload Failed: {e}")
                # Fallback to local
                return f"/download/{remote_key}"
        else:
            # Local Storage
            # Remote key is usually "job_id/filename"
            return f"/download/{remote_key}"

file_ops = FileOps()
