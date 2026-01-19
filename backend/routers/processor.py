from services.email_service import EmailService
from pydantic import BaseModel, EmailStr

class EmailRequest(BaseModel):
    email: EmailStr
    download_url: str
    filename: str

@router.post("/email-link")
async def email_download_link(request: EmailRequest):
    try:
        # Validate that the download URL belongs to our domain (security)
        # For now, we trust the client but in prod, we should verify the token integrity
        result = EmailService.send_download_link(request.email, request.download_url, request.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import FileResponse, JSONResponse
from fastapi.concurrency import run_in_threadpool
from typing import List, Optional
import shutil
import os
from pathlib import Path

from ..utils.file_ops import file_ops
from ..services.pdf_service import PDFService
from ..services.image_service import ImageService
from ..services.archive_service import ArchiveService
from ..services.media_service import MediaService
from ..services.document_service import DocumentService
from ..services.gif_service import GIFService
from ..config import config

router = APIRouter()

@router.post("/process/merge-pdf")
async def merge_pdf(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # Create Job Environment
    job_dir = file_ops.create_job_dir()
    # upload_dir = job_dir / "uploads" # No longer needed
    output_dir = job_dir / "outputs"
    inputs = []

    try:
        # Validate and Collect Inputs
        for file in files:
            # Validate Magic Bytes (Peek at stream)
            if not file_ops.validate_magic_bytes(file.file, "application/pdf"):
                 raise HTTPException(status_code=400, detail=f"Invalid PDF file: {file.filename}")
            
            # Pass the spooled file directly
            inputs.append(file.file)

        # Process in threadpool to avoid blocking event loop
        output_filename = "merged.pdf"
        output_path = output_dir / output_filename
        
        await run_in_threadpool(PDFService.merge_pdfs, inputs, output_path)

        return {
            "job_id": job_dir.name,
            "filename": output_filename,
            "download_url": f"/download/{job_dir.name}/{output_filename}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/split-pdf")
async def split_pdf(file: UploadFile = File(...)):
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    
    try:
        if not file_ops.validate_magic_bytes(file.file, "application/pdf"):
            raise HTTPException(status_code=400, detail="Invalid PDF file")
            
        # Process (streaming)
        await run_in_threadpool(PDFService.split_pdf, file.file, output_dir)
        
        # Zip results
        zip_path = job_dir / f"{Path(file.filename).stem}_split.zip"
        await run_in_threadpool(file_ops.create_zip, output_dir, zip_path)
        
        return {
            "job_id": job_dir.name,
            "filename": zip_path.name,
            "download_url": f"/download/{job_dir.name}/{zip_path.name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/compress-pdf")
async def compress_pdf(
    file: UploadFile = File(...), 
    level: str = Form(None), 
    quality: int = Form(None), 
    dpi: int = Form(None)
):
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    
    try:
        if not file_ops.validate_magic_bytes(file.file, "application/pdf"):
            raise HTTPException(status_code=400, detail="Invalid PDF file")
        
        # Save input file to disk for size tracking
        # Save input file to disk securely
        input_path = await file_ops.save_upload(file, job_dir)
        
        original_size = input_path.stat().st_size
            
        output_filename = f"{Path(file.filename).stem}_compressed.pdf"
        output_path = output_dir / output_filename
        
        # Use manual settings if provided, otherwise use preset level
        if quality is not None and dpi is not None:
            await run_in_threadpool(
                PDFService.compress_pdf_manual, 
                input_path, 
                output_path, 
                quality, 
                dpi
            )
        else:
            compression_level = level or "basic"
            await run_in_threadpool(PDFService.compress_pdf, input_path, output_path, compression_level)
        
        compressed_size = output_path.stat().st_size
        reduction_percent = round((1 - compressed_size / original_size) * 100, 1) if original_size > 0 else 0
        
        return {
            "job_id": job_dir.name,
            "filename": output_filename,
            "download_url": f"/download/{job_dir.name}/{output_filename}",
            "original_size": original_size,
            "compressed_size": compressed_size,
            "reduction_percent": reduction_percent
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/pdf-to-word")
async def pdf_to_word(file: UploadFile = File(...)):
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    
    try:
        if not file_ops.validate_magic_bytes(file.file, "application/pdf"):
            raise HTTPException(status_code=400, detail="Invalid PDF file")
            
        output_filename = f"{Path(file.filename).stem}.docx"
        output_path = output_dir / output_filename
        
        await run_in_threadpool(PDFService.pdf_to_word, file.file, output_path)
        
        return {
            "job_id": job_dir.name,
            "filename": output_filename,
            "download_url": f"/download/{job_dir.name}/{output_filename}"
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/pdf-to-image")
async def pdf_to_image(file: UploadFile = File(...), format: str = Form("png")):
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    
    try:
        if not file_ops.validate_magic_bytes(file.file, "application/pdf"):
            raise HTTPException(status_code=400, detail="Invalid PDF file")
            
        await run_in_threadpool(PDFService.pdf_to_image, file.file, output_dir, format)
        
        # Zip results
        zip_path = job_dir / f"{Path(file.filename).stem}_images.zip"
        await run_in_threadpool(file_ops.create_zip, output_dir, zip_path)
        
        return {
            "job_id": job_dir.name,
            "filename": zip_path.name,
            "download_url": f"/download/{job_dir.name}/{zip_path.name}"
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/image-to-pdf")
async def image_to_pdf(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    inputs = []
    
    try:
        # Save input files to disk
        saved_paths = []
        for file in files:
            file_path = await file_ops.save_upload(file, job_dir)
            saved_paths.append(file_path)
            
        output_filename = "converted_images.pdf"
        output_path = output_dir / output_filename
        
        await run_in_threadpool(PDFService.image_to_pdf, saved_paths, output_path)
        
        return {
            "job_id": job_dir.name,
            "filename": output_filename,
            "download_url": f"/download/{job_dir.name}/{output_filename}"
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/convert-image")
async def convert_image(
    files: List[UploadFile] = File(...), 
    target_format: str = Form(...), # "png", "jpeg", "webp"
    quality: int = Form(85)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # Create Job Environment
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    output_dir.mkdir(exist_ok=True)

    try:
        processed_files = []
        
        # Validate and Process All Files
        for file in files:
            # Validate Magic Bytes (Allow any image)
            # Re-reading file stream for validation might be needed if not handled by save_upload
            # But save_upload reads chunks, so we should validate start
            # For simplicity in batch, we can trust the extension or Quick check
            # Best practice: Check bytes. 
            # Note: file_ops.save_upload saves the file. We can validate after saving or before.
            # file_ops.validate_magic_bytes consumes stream but seeks back 0.
            
            if not file_ops.validate_magic_bytes(file.file, "image/"):
                 # Skip or Error? For batch, maybe skip or error. Let's error for now.
                 raise HTTPException(status_code=400, detail=f"Invalid image file: {file.filename}")

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

        # Determine Response
        if len(processed_files) > 1:
            # Zip results
            zip_filename = f"converted_images_{job_dir.name}.zip"
            zip_path = job_dir / zip_filename
            await run_in_threadpool(file_ops.create_zip, output_dir, zip_path)
            
            return {
                "job_id": job_dir.name,
                "filename": zip_filename,
                "download_url": f"/download/{job_dir.name}/{zip_filename}"
            }
        elif len(processed_files) == 1:
             return {
                "job_id": job_dir.name,
                "filename": processed_files[0],
                "download_url": f"/download/{job_dir.name}/{processed_files[0]}"
            }
        else:
            raise HTTPException(status_code=400, detail="No files processed")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/rotate-image")
async def rotate_image(
    file: UploadFile = File(...), 
    angle: int = Form(...)
):
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    
    try:
        if not file_ops.validate_magic_bytes(file.file, "image/"):
             raise HTTPException(status_code=400, detail="Invalid image file")
            
        output_filename = file.filename
        output_path = output_dir / output_filename
        
        await run_in_threadpool(ImageService.rotate_image, file.file, output_path, angle)
        
        return {
            "job_id": job_dir.name,
            "filename": output_filename,
            "download_url": f"/download/{job_dir.name}/{output_filename}"
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/chat-pdf-init")
async def chat_pdf_init(file: UploadFile = File(...)):
    if not file_ops.validate_magic_bytes(file.file, "application/pdf"):
        raise HTTPException(status_code=400, detail="Invalid PDF file")
    
    try:
        # For this simple demo, we just verify text extraction works
        # In a real app, we would cache this text in Redis or a Vector DB
        text = await run_in_threadpool(PDFService.extract_text, file.file)
        return {"status": "success", "message": "PDF analyzed", "preview": text[:100]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/docx-to-pdf")
async def docx_to_pdf(file: UploadFile = File(...)):
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    output_dir.mkdir(exist_ok=True)
    
    try:
        # Validate magic bytes is hard for docx/zip, rely on extension or complex check
        # For now, trust extension or try-catch failure
        if not file.filename.lower().endswith((".docx", ".doc")):
             raise HTTPException(status_code=400, detail="Invalid Word file (must be .docx or .doc)")

        # Save input file first (docx2pdf needs file on disk)
        # Save input file securely
        input_path = await file_ops.save_upload(file, job_dir)
            
        output_filename = f"{Path(file.filename).stem}.pdf"
        output_path = output_dir / output_filename
        
        await run_in_threadpool(DocumentService.docx_to_pdf, input_path, output_path)
        
        return {
            "job_id": job_dir.name,
            "filename": output_filename,
            "download_url": f"/download/{job_dir.name}/{output_filename}"
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
         
@router.post("/process/chat-pdf-query")
async def chat_pdf_query(file: UploadFile = File(...), query: str = Form(...)):
    # Re-extract text (stateless demo)
    try:
        text = await run_in_threadpool(PDFService.extract_text, file.file)
        
        lines = text.split('\n')
        relevant_lines = [line for line in lines if any(word.lower() in line.lower() for word in query.split())]
        
        if relevant_lines:
            answer = "Here is what I found:\n" + "\n".join(relevant_lines[:5])
        else:
            answer = "I couldn't find specific keywords from your query in the document, but I have read the file."
            
        return {"answer": answer}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/archive-convert")
async def archive_convert(file: UploadFile = File(...), target_format: str = Form("zip")):
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    output_dir.mkdir(exist_ok=True)
    
    try:
        # Save input to disk
        # Save input to disk securely
        input_path = await file_ops.save_upload(file, job_dir)

        # Validate input (basic)
        output_path = await run_in_threadpool(
            ArchiveService.convert_archive, 
            input_path, 
            output_dir, 
            target_format
        )
        
        return {
            "job_id": job_dir.name,
            "filename": output_path.name,
            "download_url": f"/download/{job_dir.name}/{output_path.name}"
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/convert-video")
async def convert_video(file: UploadFile = File(...), target_format: str = Form("mp4")):
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    output_dir.mkdir(exist_ok=True)
    
    try:
        # Save input to disk for FFmpeg
        # Save input securely
        input_path = await file_ops.save_upload(file, job_dir)

        output_filename = f"{Path(file.filename).stem}.{target_format}"
        output_path = output_dir / output_filename
        
        await run_in_threadpool(MediaService.convert_video, input_path, output_path, target_format)
        
        return {
            "job_id": job_dir.name,
            "filename": output_filename,
            "download_url": f"/download/{job_dir.name}/{output_filename}"
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/compress-video")
async def compress_video(file: UploadFile = File(...), level: str = Form("basic")):
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    output_dir.mkdir(exist_ok=True)
    
    try:
        # Save input to disk
        # Save input securely
        input_path = await file_ops.save_upload(file, job_dir)

        output_filename = f"{Path(file.filename).stem}_compressed.mp4"
        output_path = output_dir / output_filename
        
        await run_in_threadpool(MediaService.compress_video, input_path, output_path, level)
        
        return {
            "job_id": job_dir.name,
            "filename": output_filename,
            "download_url": f"/download/{job_dir.name}/{output_filename}"
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/extract-audio")
async def extract_audio(file: UploadFile = File(...), target_format: str = Form("mp3")):
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    output_dir.mkdir(exist_ok=True)
    
    try:
        # Save input to disk
        # Save input securely
        input_path = await file_ops.save_upload(file, job_dir)

        output_filename = f"{Path(file.filename).stem}.{target_format}"
        output_path = output_dir / output_filename
        
        await run_in_threadpool(MediaService.extract_audio, input_path, output_path, target_format)
        
        return {
            "job_id": job_dir.name,
            "filename": output_filename,
            "download_url": f"/download/{job_dir.name}/{output_filename}"
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/convert-audio")
async def convert_audio(file: UploadFile = File(...), target_format: str = Form("mp3")):
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    output_dir.mkdir(exist_ok=True)
    
    try:
        # Save input to disk
        # Save input securely
        input_path = await file_ops.save_upload(file, job_dir)

        output_filename = f"{Path(file.filename).stem}.{target_format}"
        output_path = output_dir / output_filename
        
        await run_in_threadpool(MediaService.convert_audio, input_path, output_path, target_format)
        
        return {
            "job_id": job_dir.name,
            "filename": output_filename,
            "download_url": f"/download/{job_dir.name}/{output_filename}"
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{job_id}/{filename}")
async def download_file(job_id: str, filename: str):
    # Check both the job dir (for zip files) and outputs dir
    job_path = config.STORAGE_DIR / job_id
    file_path = job_path / "outputs" / filename
    
    # If not in outputs, check root of job dir (for zips I put there in previous steps? Wait i put zips in job_dir)
    if not file_path.exists():
        file_path = job_path / filename
        
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found or expired")
    
    return FileResponse(path=file_path, filename=filename)
@router.post("/pdf-to-epub")
async def pdf_to_epub(file: UploadFile = File(...)):
    """
    Convert PDF to EPUB.
    """
    return await process_file(file, DocumentService.pdf_to_epub, ".epub", "application/epub+zip")

@router.post("/video-to-gif")
async def video_to_gif(
    file: UploadFile = File(...),
    fps: int = Form(15),
    scale: int = Form(480)
):
    """
    Convert video to GIF.
    """
    job_dir = file_ops.create_job_dir()
    output_dir = job_dir / "outputs"
    
    try:
        # Save uploaded file
        input_path = await file_ops.save_upload(file, job_dir)
        
        # Generate output filename
        output_filename = f"{Path(file.filename).stem}.gif"
        output_path = output_dir / output_filename
        
        # Convert video to GIF
        result_path = await run_in_threadpool(
            GIFService.video_to_gif,
            input_path,
            output_path,
            fps,
            scale
        )
        
        # Get file size
        file_size = result_path.stat().st_size
        
        # Schedule cleanup
        file_ops.schedule_cleanup(job_dir)
        
        return {
            "job_id": job_dir.name,
            "filename": output_filename,
            "download_url": f"/download/{job_dir.name}/{output_filename}",
            "file_size": file_size
        }
        
    except Exception as e:
        file_ops.cleanup_job(job_dir)
        raise HTTPException(status_code=500, detail=str(e))
