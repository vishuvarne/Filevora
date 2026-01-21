from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.concurrency import run_in_threadpool
from typing import List, Optional
import shutil
import os
from pathlib import Path
from pydantic import BaseModel, EmailStr

from utils.file_ops import file_ops
from utils.error_handler import handle_processing_errors, FileProcessingError
from services.email_service import EmailService
from services.pdf_service import PDFService
from services.image_service import ImageService
from services.archive_service import ArchiveService
from services.media_service import MediaService
from services.document_service import DocumentService
from services.gif_service import GIFService
from config import config

router = APIRouter()

class EmailRequest(BaseModel):
    email: EmailStr
    download_url: str
    filename: str

@router.post("/email-link")
@handle_processing_errors
async def email_download_link(request: EmailRequest):
    # Validate that the download URL belongs to our domain (security)
    result = EmailService.send_download_link(request.email, request.download_url, request.filename)
    return result

# --- Helper for standard response ---
def create_job_response(job_dir: Path, output_filename: str):
    remote_key = f"{job_dir.name}/{output_filename}"
    output_path = job_dir / "outputs" / output_filename
    
    # Check if we should upload to S3 or just return local
    download_url = file_ops.upload_to_storage(output_path, remote_key)
    
    return {
        "job_id": job_dir.name,
        "filename": output_filename,
        "download_url": download_url
    }

async def process_file_generic(file: UploadFile, expected_mime: str, service_func, output_ext: str = None, *args, **kwargs):
    """Generic file processing helper"""
    # Validation
    if not file_ops.validate_magic_bytes(file.file, expected_mime):
        raise FileProcessingError(f"Invalid file type. Expected {expected_mime}", status_code=400)

    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    
    try:
        # Save input
        input_path = await file_ops.save_upload(file, job_dir)
        
        # Determine output filename
        if output_ext:
            output_filename = f"{Path(file.filename).stem}{output_ext}"
        else:
            output_filename = f"processed_{file.filename}" 

        output_path = output_dir / output_filename

        # Execute Service
        await run_in_threadpool(service_func, input_path, output_path, *args, **kwargs)

        # Upload & Return
        return create_job_response(job_dir, output_filename)
        
    except Exception as e:
        # Cleanup on failure?
        # file_ops.cleanup_job(job_dir) 
        raise e 

# --- Routes ---

@router.post("/process/merge-pdf")
@handle_processing_errors
async def merge_pdf(files: List[UploadFile] = File(...)):
    if not files:
        raise FileProcessingError("No files uploaded", status_code=400)

    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    inputs = []

    try:
        for file in files:
            if not file_ops.validate_magic_bytes(file.file, "application/pdf"):
                 raise FileProcessingError(f"Invalid PDF file: {file.filename}", status_code=400)
            inputs.append(file.file)

        output_filename = "merged.pdf"
        output_path = output_dir / output_filename
        
        await run_in_threadpool(PDFService.merge_pdfs, inputs, output_path)

        return create_job_response(job_dir, output_filename)
        
    except Exception:
        raise

@router.post("/process/split-pdf")
@handle_processing_errors
async def split_pdf(file: UploadFile = File(...)):
    if not file_ops.validate_magic_bytes(file.file, "application/pdf"):
        raise FileProcessingError("Invalid PDF file", status_code=400)

    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    
    await run_in_threadpool(PDFService.split_pdf, file.file, output_dir)
    
    zip_path = job_dir / f"{Path(file.filename).stem}_split.zip"
    await run_in_threadpool(file_ops.create_zip, output_dir, zip_path)
    
    remote_key = f"{job_dir.name}/{zip_path.name}"
    download_url = file_ops.upload_to_storage(zip_path, remote_key)
    
    return {
        "job_id": job_dir.name,
        "filename": zip_path.name,
        "download_url": download_url
    }

@router.post("/process/compress-pdf")
@handle_processing_errors
async def compress_pdf(
    file: UploadFile = File(...), 
    level: str = Form(None), 
    quality: int = Form(None), 
    dpi: int = Form(None)
):
    if not file_ops.validate_magic_bytes(file.file, "application/pdf"):
        raise FileProcessingError("Invalid PDF file", status_code=400)
    
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    
    input_path = await file_ops.save_upload(file, job_dir)
    original_size = input_path.stat().st_size
        
    output_filename = f"{Path(file.filename).stem}_compressed.pdf"
    output_path = output_dir / output_filename
    
    if quality is not None:
        if not (1 <= quality <= 100):
             raise FileProcessingError("Quality must be between 1 and 100", status_code=400)
        await run_in_threadpool(
            PDFService.compress_pdf_manual, 
            input_path, output_path, quality, dpi or 150
        )
    else:
        await run_in_threadpool(PDFService.compress_pdf, input_path, output_path, level or "basic")
    
    compressed_size = output_path.stat().st_size
    reduction_percent = round((1 - compressed_size / original_size) * 100, 1) if original_size > 0 else 0
    
    res = create_job_response(job_dir, output_filename)
    res.update({
        "original_size": original_size,
        "compressed_size": compressed_size,
        "reduction_percent": reduction_percent
    })
    return res

@router.post("/process/pdf-to-word")
@handle_processing_errors
async def pdf_to_word(file: UploadFile = File(...)):
    if not file_ops.validate_magic_bytes(file.file, "application/pdf"):
        raise FileProcessingError("Invalid PDF file", status_code=400)
        
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    
    output_filename = f"{Path(file.filename).stem}.docx"
    output_path = output_dir / output_filename
    
    await run_in_threadpool(PDFService.pdf_to_word, file.file, output_path)
    return create_job_response(job_dir, output_filename)

@router.post("/process/pdf-to-image")
@handle_processing_errors
@router.post("/process/pdf-to-image")
@handle_processing_errors
async def pdf_to_image(files: List[UploadFile] = File(...), format: str = Form("png")):
    if not files:
        raise FileProcessingError("No files uploaded", status_code=400)
    
    if format.lower() not in ["png", "jpeg", "jpg", "webp"]:
        raise FileProcessingError("Unsupported image format", status_code=400)

    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    output_dir.mkdir(exist_ok=True) # Ensure outputs dir exists
    
    # Check if batch (more than 1 or requested as batch flow)
    is_batch = len(files) > 1

    processed_dirs = []

    for file in files:
        if not file_ops.validate_magic_bytes(file.file, "application/pdf"):
             # In batch, maybe generic error or skip? Using strict error for now.
            raise FileProcessingError("Invalid PDF file", status_code=400)
    
        # Create subfolder for each PDF if batch, or just root if single (actually always best to use subfolder or naming convention to avoid conflicts)
        # However, to keep backward compatibility with "page_X.png", if single file we want images in root of output? 
        # No, existing code: `output_dir / f"page_{i+1}.{format}"`.
        # If we handle multiple files, we'll get naming collisions "page_1.png".
        # So we MUST Use subfolders or prefix.

        if is_batch:
            file_stem = Path(file.filename).stem
            dest_dir = output_dir / file_stem
            dest_dir.mkdir(exist_ok=True)
        else:
            dest_dir = output_dir

        await run_in_threadpool(PDFService.pdf_to_image, file.file, dest_dir, format)
        processed_dirs.append(dest_dir)

    # Creating Zip
    # If single file, zip name is {filename}_images.zip
    # If multiple, zip name is converted_images_{job_id}.zip
    
    if is_batch:
        zip_filename = f"converted_images_{job_dir.name}.zip"
    else:
        # Backward compatibility for single file name
        zip_filename = f"{Path(files[0].filename).stem}_images.zip"

    zip_path = job_dir / zip_filename
    await run_in_threadpool(file_ops.create_zip, output_dir, zip_path)
    
    remote_key = f"{job_dir.name}/{zip_path.name}"
    download_url = file_ops.upload_to_storage(zip_path, remote_key)
    
    return {
        "job_id": job_dir.name,
        "filename": zip_path.name,
        "download_url": download_url
    }

@router.post("/process/image-to-pdf")
@handle_processing_errors
async def image_to_pdf(files: List[UploadFile] = File(...)):
    if not files:
        raise FileProcessingError("No files uploaded", status_code=400)

    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    
    saved_paths = []
    for file in files:
        # Basic mime check
        if not file_ops.validate_magic_bytes(file.file, "image/"):
             raise FileProcessingError(f"Invalid image file: {file.filename}", status_code=400)
        file_path = await file_ops.save_upload(file, job_dir)
        saved_paths.append(file_path)
        
    output_filename = "converted_images.pdf"
    output_path = output_dir / output_filename
    
    await run_in_threadpool(PDFService.image_to_pdf, saved_paths, output_path)
    return create_job_response(job_dir, output_filename)

@router.post("/process/convert-image")
@handle_processing_errors
async def convert_image(
    files: List[UploadFile] = File(...), 
    target_format: str = Form(...), 
    quality: int = Form(85)
):
    if not files: raise FileProcessingError("No files uploaded", status_code=400)

    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    output_dir.mkdir(exist_ok=True)
    
    processed_files = []
    
    for file in files:
        if not file_ops.validate_magic_bytes(file.file, "image/"):
             raise FileProcessingError(f"Invalid image file: {file.filename}", status_code=400)

        output_filename = f"{Path(file.filename).stem}.{target_format.lower()}"
        output_path = output_dir / output_filename
        
        await run_in_threadpool(
            ImageService.convert_image,
            file.file, 
            output_path, 
            format=target_format, 
            quality=quality
        )
        processed_files.append(output_filename)

    if len(processed_files) > 1:
        zip_filename = f"converted_images_{job_dir.name}.zip"
        zip_path = job_dir / zip_filename
        await run_in_threadpool(file_ops.create_zip, output_dir, zip_path)
        
        remote_key = f"{job_dir.name}/{zip_filename}"
        download_url = file_ops.upload_to_storage(zip_path, remote_key)
        
        return {
            "job_id": job_dir.name,
            "filename": zip_filename,
            "download_url": download_url
        }
    elif len(processed_files) == 1:
         return create_job_response(job_dir, processed_files[0])
    
    raise FileProcessingError("No files processed", status_code=400)

@router.post("/process/rotate-image")
@handle_processing_errors
async def rotate_image(file: UploadFile = File(...), angle: int = Form(...)):
    if not file_ops.validate_magic_bytes(file.file, "image/"):
         raise FileProcessingError("Invalid image file", status_code=400)
    
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    output_filename = file.filename
    output_path = output_dir / output_filename
    
    await run_in_threadpool(ImageService.rotate_image, file.file, output_path, angle)
    return create_job_response(job_dir, output_filename)

@router.post("/process/chat-pdf-init")
@handle_processing_errors
async def chat_pdf_init(file: UploadFile = File(...)):
    if not file_ops.validate_magic_bytes(file.file, "application/pdf"):
        raise FileProcessingError("Invalid PDF file", status_code=400)
    
    text = await run_in_threadpool(PDFService.extract_text, file.file)
    return {"status": "success", "message": "PDF analyzed", "preview": text[:100]}

@router.post("/process/chat-pdf-query")
@handle_processing_errors
async def chat_pdf_query(file: UploadFile = File(...), query: str = Form(...)):
    text = await run_in_threadpool(PDFService.extract_text, file.file)
    lines = text.split('\n')
    relevant_lines = [line for line in lines if any(word.lower() in line.lower() for word in query.split())]
    
    if relevant_lines:
        answer = "Here is what I found:\n" + "\n".join(relevant_lines[:5])
    else:
        answer = "I couldn't find specific keywords from your query in the document, but I have read the file."
    return {"answer": answer}

@router.post("/process/docx-to-pdf")
@handle_processing_errors
async def docx_to_pdf(file: UploadFile = File(...)):
    # Extension check as magic bytes for docx is complex (zip)
    if not file.filename.lower().endswith((".docx", ".doc")):
         raise FileProcessingError("Invalid Word file (must be .docx or .doc)", status_code=400)
         
    return await process_file_generic(file, "application/zip", DocumentService.docx_to_pdf, ".pdf") 
    # Note: docx magic type is roughly application/zip or specific openxml. 
    # For now relying on internal save_upload and service exception.

@router.post("/process/archive-convert")
@handle_processing_errors
async def archive_convert(file: UploadFile = File(...), target_format: str = Form("zip")):
    return await process_file_generic(
        file, 
        "application/", # Loose check for archives
        ArchiveService.convert_archive, 
        f".{target_format}",
        target_format=target_format 
        # Note: ArchiveService.convert_archive signature needs check: input, output_dir, format
    )

@router.post("/process/video-to-gif")
@handle_processing_errors
async def video_to_gif(file: UploadFile = File(...), fps: int = Form(15), scale: int = Form(480)):
    # We will use the generic pattern but GIF service needs specific params
    if not file_ops.validate_magic_bytes(file.file, "video/"):
        raise FileProcessingError("Invalid video file", status_code=400)

    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    input_path = await file_ops.save_upload(file, job_dir)
    
    output_filename = f"{Path(file.filename).stem}.gif"
    output_path = output_dir / output_filename
    
    await run_in_threadpool(GIFService.video_to_gif, input_path, output_path, fps, scale)
    
    # Clean up input file or schedule job cleanup (User requested robustness: schedule cleanup)
    # BackgroundTaskManager is ideal but here we just return URL.
    # The file_ops.cleanup_old_jobs runs periodically?
    
    return create_job_response(job_dir, output_filename)

@router.post("/process/convert-video")
@handle_processing_errors
async def convert_video(file: UploadFile = File(...), target_format: str = Form("mp4")):
     # Loose check
    return await process_file_generic(
        file, 
        "video/", 
        MediaService.convert_video, 
        f".{target_format}", 
        target_format
    )

@router.post("/process/extract-audio")
@handle_processing_errors
async def extract_audio(file: UploadFile = File(...), target_format: str = Form("mp3")):
    return await process_file_generic(
        file, "video/", MediaService.extract_audio, f".{target_format}", target_format
    )

# --- Phase 1: Additional GIF Tools ---

@router.post("/process/webm-to-gif")
@router.post("/process/mov-to-gif")
@router.post("/process/avi-to-gif")
@handle_processing_errors
async def other_video_formats_to_gif(file: UploadFile = File(...), fps: int = Form(15), scale: int = Form(480)):
    """Convert WEBM/MOV/AVI to GIF - reuses video_to_gif logic"""
    if not file_ops.validate_magic_bytes(file.file, "video/"):
        raise FileProcessingError("Invalid video file", status_code=400)

    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    input_path = await file_ops.save_upload(file, job_dir)
    
    output_filename = f"{Path(file.filename).stem}.gif"
    output_path = output_dir / output_filename
    
    await run_in_threadpool(GIFService.video_to_gif, input_path, output_path, fps, scale)
    
    return create_job_response(job_dir, output_filename)

@router.post("/process/gif-to-mp4")
@handle_processing_errors
async def gif_to_mp4(file: UploadFile = File(...)):
    """Convert GIF to MP4 video"""
    # GIF magic bytes: 47 49 46 38 (GIF8)
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    input_path = await file_ops.save_upload(file, job_dir)
    
    output_filename = f"{Path(file.filename).stem}.mp4"
    output_path = output_dir / output_filename
    
    await run_in_threadpool(GIFService.gif_to_mp4, input_path, output_path)
    
    return create_job_response(job_dir, output_filename)

@router.post("/process/images-to-gif")
@handle_processing_errors
async def images_to_gif(files: List[UploadFile] = File(...), duration: int = Form(500)):
    """Create animated GIF from multiple images"""
    if not files:
        raise FileProcessingError("No files uploaded", status_code=400)

    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    
    saved_paths = []
    for file in files:
        if not file_ops.validate_magic_bytes(file.file, "image/"):
             raise FileProcessingError(f"Invalid image file: {file.filename}", status_code=400)
        file_path = await file_ops.save_upload(file, job_dir)
        saved_paths.append(file_path)
    
    output_filename = "animated.gif"
    output_path = output_dir / output_filename
    
    await run_in_threadpool(GIFService.images_to_gif, saved_paths, output_path, duration)
    
    return create_job_response(job_dir, output_filename)

# --- Phase 1: Additional Video Tools ---

@router.post("/process/compress-video")
@handle_processing_errors
async def compress_video_endpoint(file: UploadFile = File(...), quality: str = Form("medium")):
    """Compress video with quality presets"""
    return await process_file_generic(
        file, "video/", MediaService.compress_video, ".mp4", quality
    )

@router.post("/process/merge-videos")
@handle_processing_errors
async def merge_videos(files: List[UploadFile] = File(...)):
    """Merge multiple videos into one"""
    if not files or len(files) < 2:
        raise FileProcessingError("At least 2 videos required", status_code=400)

    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    
    saved_paths = []
    for file in files:
        if not file_ops.validate_magic_bytes(file.file, "video/"):
             raise FileProcessingError(f"Invalid video file: {file.filename}", status_code=400)
        file_path = await file_ops.save_upload(file, job_dir)
        saved_paths.append(file_path)
    
    output_filename = "merged_video.mp4"
    output_path = output_dir / output_filename
    
    await run_in_threadpool(MediaService.merge_videos, saved_paths, output_path)
    
    return create_job_response(job_dir, output_filename)

@router.post("/process/trim-video")
@handle_processing_errors
async def trim_video(
    file: UploadFile = File(...), 
    start_time: str = Form(...), 
    end_time: str = Form(...)
):
    """Trim video from start to end time"""
    if not file_ops.validate_magic_bytes(file.file, "video/"):
        raise FileProcessingError("Invalid video file", status_code=400)

    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    input_path = await file_ops.save_upload(file, job_dir)
    
    output_filename = f"{Path(file.filename).stem}_trimmed.mp4"
    output_path = output_dir / output_filename
    
    await run_in_threadpool(MediaService.trim_video, input_path, output_path, start_time, end_time)
    
    return create_job_response(job_dir, output_filename)

# --- Phase 1: Additional Audio Tools ---

@router.post("/process/convert-audio")
@handle_processing_errors
async def convert_audio_endpoint(file: UploadFile = File(...), target_format: str = Form("mp3")):
    """Convert audio between formats"""
    return await process_file_generic(
        file, "audio/", MediaService.convert_audio, f".{target_format}", target_format
    )

@router.post("/process/compress-audio")
@handle_processing_errors
async def compress_audio_endpoint(file: UploadFile = File(...), bitrate: str = Form("128k")):
    """Compress audio by reducing bitrate"""
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    input_path = await file_ops.save_upload(file, job_dir)
    
    output_filename = f"{Path(file.filename).stem}_compressed.mp3"
    output_path = output_dir / output_filename
    
    await run_in_threadpool(MediaService.compress_audio, input_path, output_path, bitrate)
    
    return create_job_response(job_dir, output_filename)

# --- Phase 2: PDF/Document Tools ---

@router.post("/process/pdf-to-epub")
@handle_processing_errors
async def pdf_to_epub(file: UploadFile = File(...)):
    """Convert PDF to EPUB e-book format"""
    return await process_file_generic(
        file, "application/pdf", PDFService.pdf_to_epub, ".epub"
    )

@router.post("/process/epub-to-pdf")
@handle_processing_errors
async def epub_to_pdf(file: UploadFile = File(...)):
    """Convert EPUB to PDF document"""
    return await process_file_generic(
        file, "application/epub+zip", PDFService.epub_to_pdf, ".pdf"
    )

@router.post("/process/volume-booster")
@handle_processing_errors
async def volume_booster(file: UploadFile = File(...), factor: float = Form(1.5)):
    """Boost audio volume by factor"""
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    input_path = await file_ops.save_upload(file, job_dir)
    
    output_filename = f"{Path(file.filename).stem}_boosted.mp3"
    output_path = output_dir / output_filename
    
    await run_in_threadpool(MediaService.boost_volume, input_path, output_path, factor)
    
    return create_job_response(job_dir, output_filename)

@router.get("/download/{job_id}/{filename}")
async def download_file(job_id: str, filename: str):
    job_path = config.STORAGE_DIR / job_id
    file_path = job_path / "outputs" / filename
    
    if not file_path.exists():
        file_path = job_path / filename # root for zips
        
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found or expired")
    
    return FileResponse(path=file_path, filename=filename)

