from PIL import Image
from pathlib import Path
import logging
from typing import IO, Union, Tuple

from ..config import config

logger = logging.getLogger(__name__)

class ImageService:
    @staticmethod
    def _validate_image_size(img):
        """Validates image dimensions against config limits."""
        if img.width > config.MAX_IMAGE_DIMENSION or img.height > config.MAX_IMAGE_DIMENSION:
             raise ValueError(f"Image dimensions ({img.width}x{img.height}) exceed maximum allowed ({config.MAX_IMAGE_DIMENSION}x{config.MAX_IMAGE_DIMENSION})")

    @staticmethod
    def convert_image(job_input: Union[Path, IO[bytes]], output_path: Path, format: str, quality: int = 85):
        """
        Converts and compresses an image.
        Format should be 'JPEG', 'PNG', or 'WEBP'.
        Quality applies to JPEG and WEBP.
        """
        try:
            # Open the image from path or stream
            with Image.open(job_input) as img:
                ImageService._validate_image_size(img)
                # Convert to RGB if saving as JPEG (handling RGBA Pngs)
                if format.upper() == "JPEG" and img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                    
                img.save(output_path, format=format, quality=quality, optimize=True)
                return output_path
        except Exception as e:
            name = job_input.name if hasattr(job_input, 'name') else 'stream'
            logger.error(f"Error converting image {name}: {e}")
            raise ValueError(f"Failed to process image: {e}")

    @staticmethod
    def rotate_image(job_input: Union[Path, IO[bytes]], output_path: Path, angle: int):
        """
        Rotates an image by the specified angle.
        """
        try:
            with Image.open(job_input) as img:
                ImageService._validate_image_size(img)
                rotated_img = img.rotate(-angle, expand=True) # Negative to rotate clockwise intuitively
                rotated_img.save(output_path)
                return output_path
        except Exception as e:
            name = job_input.name if hasattr(job_input, 'name') else 'stream'
            logger.error(f"Error rotating image {name}: {e}")
            raise ValueError(f"Failed to rotate image: {e}")

    @staticmethod
    def resize_image(job_input: Union[Path, IO[bytes]], output_path: Path, width: int = None, height: int = None):
        """
        Resizes an image. at least one of width or height must be provided.
        """
        try:
            with Image.open(job_input) as img:
                ImageService._validate_image_size(img)
                if width and height:
                    new_size = (width, height)
                elif width:
                    ratio = width / img.width
                    new_size = (width, int(img.height * ratio))
                elif height:
                    ratio = height / img.height
                    new_size = (int(img.width * ratio), height)
                else:
                     raise ValueError("Width or Height must be provided")

                resized_img = img.resize(new_size, Image.Resampling.LANCZOS)
                resized_img.save(output_path)
                return output_path
        except Exception as e:
            name = job_input.name if hasattr(job_input, 'name') else 'stream'
            logger.error(f"Error resizing image {name}: {e}")
            raise ValueError(f"Failed to resize image: {e}")
