import os
from pathlib import Path
from celery_app import celery_app
from services.pdf_service import PDFService
from services.image_service import ImageService
from services.media_service import MediaService
from services.document_service import DocumentService
from services.gif_service import GIFService
from services.archive_service import ArchiveService
from utils.file_ops import file_ops
from config import config
import logging

logger = logging.getLogger(__name__)

# Helper to reconstruct generic response
def create_job_response(job_id: str, output_filename: str, output_path: Path):
    remote_key = f"{job_id}/{output_filename}"
    
    # Check if we should upload to S3 or just return local
    # In async worker, this upload happens in background
    download_url = file_ops.upload_to_storage(output_path, remote_key)
    
    file_stat = output_path.stat()
    
    return {
        "job_id": job_id,
        "filename": output_filename,
        "download_url": download_url,
        "size": file_stat.st_size
    }

@celery_app.task(bind=True)
def task_merge_pdf(self, job_id: str, input_files: list[str]):
    try:
        job_dir = config.JOBS_PATH / job_id
        output_dir = job_dir / "outputs"
        output_filename = "merged.pdf"
        output_path = output_dir / output_filename
        
        # Convert strings back to Paths
        input_paths = [Path(p) for p in input_files]
        
        # Verify inputs exist (shared storage assumption)
        for p in input_paths:
            if not p.exists():
                raise FileNotFoundError(f"Input file not found: {p}")

        PDFService.merge_pdfs(input_paths, output_path)
        
        return create_job_response(job_id, output_filename, output_path)
    except Exception as e:
        logger.error(f"Task failed: {e}")
        raise e

@celery_app.task(bind=True)
def task_compress_pdf(self, job_id: str, input_file: str, level: str = "basic", quality: int = None, dpi: int = 150):
    try:
        job_dir = config.JOBS_PATH / job_id
        output_dir = job_dir / "outputs"
        input_path = Path(input_file)
        
        output_filename = f"{input_path.stem}_compressed.pdf"
        output_path = output_dir / output_filename
        
        original_size = input_path.stat().st_size

        if quality is not None:
             PDFService.compress_pdf_manual(input_path, output_path, quality, dpi)
        else:
             PDFService.compress_pdf(input_path, output_path, level)
             
        res = create_job_response(job_id, output_filename, output_path)
        
        # Add compression stats
        compressed_size = output_path.stat().st_size
        reduction_percent = round((1 - compressed_size / original_size) * 100, 1) if original_size > 0 else 0
        
        res.update({
            "original_size": original_size,
            "compressed_size": compressed_size,
            "reduction_percent": reduction_percent
        })
        return res
        
    except Exception as e:
        logger.error(f"Task failed: {e}")
        raise e

@celery_app.task(bind=True)
def task_convert_image(self, job_id: str, input_files: list[str], target_format: str, quality: int = 85):
    try:
        job_dir = config.JOBS_PATH / job_id
        output_dir = job_dir / "outputs"
        output_dir.mkdir(exist_ok=True, parents=True) # Ensure for worker
        
        processed_files = []
        input_paths = [Path(p) for p in input_files]
        
        for input_path in input_paths:
            output_filename = f"{input_path.stem}.{target_format.lower()}"
            output_path = output_dir / output_filename
            
            ImageService.convert_image(input_path, output_path, format=target_format, quality=quality)
            processed_files.append(output_filename)

        # Zip if multiple
        if len(processed_files) > 1:
            zip_filename = f"converted_images_{job_id}.zip"
            zip_path = job_dir / zip_filename
            file_ops.create_zip(output_dir, zip_path)
            
            return create_job_response(job_id, zip_filename, zip_path)
        elif len(processed_files) == 1:
             return create_job_response(job_id, processed_files[0], output_dir / processed_files[0])
             
    except Exception as e:
        logger.error(f"Task failed: {e}")
        raise e

@celery_app.task(bind=True)
def task_rotate_image(self, job_id: str, input_file: str, angle: int):
    try:
        job_dir = config.JOBS_PATH / job_id
        output_dir = job_dir / "outputs"
        input_path = Path(input_file)
        output_filename = input_path.name
        output_path = output_dir / output_filename
        
        ImageService.rotate_image(input_path, output_path, angle)
        return create_job_response(job_id, output_filename, output_path)
    except Exception as e:
        raise e

@celery_app.task(bind=True)
def task_pdf_to_image(self, job_id: str, input_files: list[str], format: str = "png"):
    try:
        job_dir = config.JOBS_PATH / job_id
        output_dir = job_dir / "outputs"
        output_dir.mkdir(exist_ok=True, parents=True)
        
        input_paths = [Path(p) for p in input_files]
        is_batch = len(input_paths) > 1
        
        for input_path in input_paths:
            if is_batch:
                file_stem = input_path.stem
                dest_dir = output_dir / file_stem
                dest_dir.mkdir(exist_ok=True)
            else:
                dest_dir = output_dir
                
            PDFService.pdf_to_image(input_path, dest_dir, format)

        if is_batch:
            zip_filename = f"converted_images_{job_id}.zip"
        else:
            zip_filename = f"{input_paths[0].stem}_images.zip"
            
        zip_path = job_dir / zip_filename
        file_ops.create_zip(output_dir, zip_path)
        
        return create_job_response(job_id, zip_filename, zip_path)
    except Exception as e:
        raise e

@celery_app.task(bind=True)
def task_image_to_pdf(self, job_id: str, input_files: list[str]):
    try:
        job_dir = config.JOBS_PATH / job_id
        output_dir = job_dir / "outputs"
        output_filename = "converted_images.pdf"
        output_path = output_dir / output_filename
        
        input_paths = [Path(p) for p in input_files]
        PDFService.image_to_pdf(input_paths, output_path)
        
        return create_job_response(job_id, output_filename, output_path)
    except Exception as e:
        raise e

# --- Generic Media Tasks ---
@celery_app.task(bind=True)
def task_convert_media(self, job_id: str, input_file: str, target_ext: str, format_name: str, service_module: str = "MediaService", method: str = "convert_video"):
    """Generic wrapper for simple media conversions"""
    try:
        job_dir = config.JOBS_PATH / job_id
        output_dir = job_dir / "outputs"
        input_path = Path(input_file)
        
        output_filename = f"{input_path.stem}{target_ext}"
        output_path = output_dir / output_filename
        
        # Dispatch dynamically or statically? Statically is safer.
        if method == "convert_video":
             MediaService.convert_video(input_path, output_path, format_name)
        elif method == "extract_audio":
             MediaService.extract_audio(input_path, output_path, format_name)
        elif method == "convert_audio":
             MediaService.convert_audio(input_path, output_path, format_name)
             
        return create_job_response(job_id, output_filename, output_path)
    except Exception as e:
        raise e

@celery_app.task(bind=True)
def task_video_to_gif(self, job_id: str, input_file: str, fps: int = 15, scale: int = 480):
    try:
        job_dir = config.JOBS_PATH / job_id
        output_dir = job_dir / "outputs"
        input_path = Path(input_file)
        output_filename = f"{input_path.stem}.gif"
        output_path = output_dir / output_filename
        
        GIFService.video_to_gif(input_path, output_path, fps, scale)
        return create_job_response(job_id, output_filename, output_path)
    except Exception as e:
        raise e
