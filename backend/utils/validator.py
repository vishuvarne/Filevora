"""File validation and size checking utilities."""
import magic
from pathlib import Path
from typing import Optional, Tuple
from ..config import config

class FileValidator:
    """Validates uploaded files for security and size constraints."""
    
    @staticmethod
    def check_file_size(file_path: Path) -> Tuple[bool, Optional[str]]:
        """Check if file size is within limits."""
        file_size = file_path.stat().st_size
        
        if file_size > config.MAX_FILE_SIZE:
            size_mb = file_size / (1024 * 1024)
            limit_mb = config.MAX_FILE_SIZE / (1024 * 1024)
            return False, f"File size ({size_mb:.2f}MB) exceeds maximum allowed size ({limit_mb}MB)"
        
        return True, None
    
    @staticmethod
    def validate_mime_type(file_path: Path, expected_types: set) -> Tuple[bool, Optional[str]]:
        """Validate file MIME type using magic bytes."""
        try:
            mime = magic.Magic(mime=True)
            file_mime = mime.from_file(str(file_path))
            
            if file_mime not in expected_types:
                return False, f"Invalid file type. Expected: {', '.join(expected_types)}, got: {file_mime}"
            
            return True, None
        except Exception as e:
            return False, f"Could not validate file type: {str(e)}"
    
    @staticmethod
    def validate_image(file_path: Path) -> Tuple[bool, Optional[str]]:
        """Validate image file."""
        from PIL import Image
        
        # Check file size
        valid, error = FileValidator.check_file_size(file_path)
        if not valid:
            return False, error
        
        # Check if it's actually an image
        try:
            with Image.open(file_path) as img:
                # Check dimensions
                width, height = img.size
                if width > config.MAX_IMAGE_DIMENSION or height > config.MAX_IMAGE_DIMENSION:
                    return False, f"Image dimensions ({width}x{height}) exceed maximum allowed ({config.MAX_IMAGE_DIMENSION}x{config.MAX_IMAGE_DIMENSION})"
                
                # Verify format
                if img.format.lower() not in config.ALLOWED_IMAGE_FORMATS:
                    return False, f"Image format '{img.format}' not allowed"
                
            return True, None
        except Exception as e:
            return False, f"Invalid image file: {str(e)}"
    
    @staticmethod
    def validate_pdf(file_path: Path) -> Tuple[bool, Optional[str]]:
        """Validate PDF file."""
        import fitz  # PyMuPDF
        
        # Check file size
        valid, error = FileValidator.check_file_size(file_path)
        if not valid:
            return False, error
        
        # Validate MIME type
        valid, error = FileValidator.validate_mime_type(file_path, config.ALLOWED_PDF_MIME)
        if not valid:
            return False, error
        
        # Check page count
        try:
            doc = fitz.open(file_path)
            page_count = len(doc)
            doc.close()
            
            if page_count > config.MAX_PDF_PAGES:
                return False, f"PDF has {page_count} pages, maximum allowed is {config.MAX_PDF_PAGES}"
            
            return True, None
        except Exception as e:
            return False, f"Invalid PDF file: {str(e)}"

validator = FileValidator()
