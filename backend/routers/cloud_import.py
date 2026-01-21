from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional

from services.cloud_service import cloud_service

router = APIRouter(prefix="/api/cloud", tags=["cloud"])

class ImportRequest(BaseModel):
    provider: str
    file_url: str
    filename: str
    access_token: Optional[str] = None
    file_id: Optional[str] = None  # Specific to Google Drive

@router.post("/import")
async def import_cloud_file(request: ImportRequest):
    """
    Import a file from a cloud provider (Google Drive, Dropbox, OneDrive).
    The file is downloaded to the server and a job ID is returned.
    """
    if request.provider not in ['google', 'dropbox', 'onedrive']:
        raise HTTPException(status_code=400, detail="Invalid provider")
    
    # For Google Drive using API, we might construct the URL differently
    url = request.file_url
    if request.provider == 'google' and request.file_id:
        url = f"https://www.googleapis.com/drive/v3/files/{request.file_id}?alt=media"
    
    if not url:
        raise HTTPException(status_code=400, detail="File URL or ID required")
        
    result = await cloud_service.import_from_url(
        file_url=url, 
        filename=request.filename, 
        provider=request.provider,
        access_token=request.access_token
    )
    
    return result
