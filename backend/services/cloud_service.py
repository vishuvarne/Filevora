import httpx
import uuid
from pathlib import Path
from typing import Optional, Dict
import logging
from fastapi import HTTPException

from config import config
from utils.ssrf_guard import SSRFGuard
from utils.file_ops import file_ops

logger = logging.getLogger("filevora")

class CloudImportService:
    """
    Handles downloading files from cloud providers (Google Drive, Dropbox, OneDrive).
    """

    async def import_from_url(self, file_url: str, filename: str, provider: str, access_token: Optional[str] = None) -> Dict:
        """
        Generic handler to download a file from a URL.
        
        Args:
            file_url: The direct download URL (or API URL for Google Drive).
            filename: The name of the file to save.
            provider: 'google', 'dropbox', or 'onedrive'.
            access_token: Optional OAuth token (required for Google/OneDrive sometimes).
        
        Returns:
            Dict containing job_id, filepath, and stats.
        """
        
        # 1. SSRF Check
        try:
            SSRFGuard.validate_url(file_url)
        except ValueError as e:
            logger.warning(f"SSRF Blocked: {file_url} - {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid or unsafe file URL")

        # 2. Prepare headers
        headers = {}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        
        # Google Drive specific headers ? 
        if provider == 'google':
             # Usually for drive, we use the file_id and service, but if we have a download URL:
             pass

        # 3. Create Job ID & Path
        job_id = str(uuid.uuid4())
        job_dir = config.JOBS_PATH / job_id 
        job_dir.mkdir(parents=True, exist_ok=True)
        
        safe_filename = file_ops.sanitize_filename(filename)
        save_path = job_dir / safe_filename
        
        # 4. Stream Download
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                async with client.stream("GET", file_url, headers=headers) as response:
                    response.raise_for_status()
                    
                    # Size Check
                    content_length = response.headers.get("content-length")
                    if content_length and int(content_length) > config.MAX_UPLOAD_SIZE:
                         raise HTTPException(status_code=413, detail=f"File too large. Max {config.MAX_UPLOAD_SIZE/1024/1024}MB")

                    downloaded_size = 0
                    with open(save_path, "wb") as f:
                        async for chunk in response.aiter_bytes(chunk_size=8192):
                            downloaded_size += len(chunk)
                            if downloaded_size > config.MAX_UPLOAD_SIZE:
                                raise HTTPException(status_code=413, detail="File too large (streamed)")
                            f.write(chunk)
                            
            logger.info(f"Cloud import successful: {job_id}/{safe_filename} ({downloaded_size} bytes)")
            
            return {
                "job_id": job_id,
                "filename": safe_filename,
                "size": downloaded_size,
                "url": f"/download/{job_id}/{safe_filename}"  # Virtual download URL
            }
            
        except HTTPException:
            # Cleanup on specific errors
            if job_dir.exists():
                import shutil
                shutil.rmtree(job_dir)
            raise
        except Exception as e:
            logger.error(f"Cloud download failed: {e}")
            if job_dir.exists():
                import shutil
                shutil.rmtree(job_dir)
            raise HTTPException(status_code=502, detail="Failed to download file from cloud provider")

cloud_service = CloudImportService()
