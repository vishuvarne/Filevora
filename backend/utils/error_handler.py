from fastapi import HTTPException, status
import logging
import traceback
from functools import wraps

logger = logging.getLogger(__name__)

class FileProcessingError(Exception):
    """Custom exception for file processing errors."""
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

def handle_processing_errors(func):
    """Decorator to handle exceptions in processing routes."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except ValueError as e:
            logger.warning(f"Validation Error in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except FileProcessingError as e:
            logger.error(f"Processing Error in {func.__name__}: {e.message}")
            raise HTTPException(status_code=e.status_code, detail=str(e.message))
        except Exception as e:
            logger.error(f"Unexpected Error in {func.__name__}: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during processing.")
    return wrapper
