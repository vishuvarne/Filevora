import subprocess
import logging
from pathlib import Path
from typing import List
from PIL import Image

logger = logging.getLogger("filevora")

class GIFService:
    @staticmethod
    def video_to_gif(job_input: Path, output_path: Path, fps: int = 15, scale: int = 480):
        """
        Convert video to GIF using FFmpeg.
        
        Args:
            job_input: Input video file path
            output_path: Output GIF file path
            fps: Frames per second for the GIF (default: 15)
            scale: Width in pixels, height auto-calculated (default: 480)
        """
        try:
            # FFmpeg command for high-quality GIF
            # Using palette generation for better colors
            palette_path = job_input.parent / f"{job_input.stem}_palette.png"
            
            # Step 1: Generate color palette
            palette_cmd = [
                "ffmpeg",
                "-i", str(job_input),
                "-vf", f"fps={fps},scale={scale}:-1:flags=lanczos,palettegen",
                "-threads", "0",
                "-y",
                str(palette_path)
            ]
            
            logger.info(f"Generating palette: {' '.join(palette_cmd)}")
            subprocess.run(palette_cmd, check=True, capture_output=True)
            
            # Step 2: Create GIF using the palette
            gif_cmd = [
                "ffmpeg",
                "-i", str(job_input),
                "-i", str(palette_path),
                "-filter_complex", f"fps={fps},scale={scale}:-1:flags=lanczos[x];[x][1:v]paletteuse",
                "-threads", "0",
                "-y",
                str(output_path)
            ]
            
            logger.info(f"Creating GIF: {' '.join(gif_cmd)}")
            result = subprocess.run(gif_cmd, check=True, capture_output=True, text=True)
            logger.info(result.stdout)
            
            # Cleanup palette
            if palette_path.exists():
                palette_path.unlink()
            
            return output_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg failed: {e.stderr}")
            raise ValueError(f"Failed to convert video to GIF: {e.stderr}")
        except Exception as e:
            logger.error(f"GIF conversion error: {str(e)}")
            raise ValueError(f"Failed to convert video to GIF: {str(e)}")

    @staticmethod
    def gif_to_mp4(job_input: Path, output_path: Path):
        """Convert GIF to MP4 video."""
        try:
            cmd = [
                "ffmpeg",
                "-i", str(job_input),
                "-movflags", "faststart",
                "-pix_fmt", "yuv420p",
                "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
                "-y",
                str(output_path)
            ]
            
            logger.info(f"Converting GIF to MP4: {' '.join(cmd)}")
            subprocess.run(cmd, check=True, capture_output=True)
            return output_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg failed: {e.stderr}")
            raise ValueError(f"Failed to convert GIF to MP4: {e.stderr}")

    @staticmethod
    def images_to_gif(image_paths: List[Path], output_path: Path, duration: int = 500):
        """
        Create animated GIF from multiple images.
        
        Args:
            image_paths: List of image file paths
            output_path: Output GIF path
            duration: Duration per frame in milliseconds (default: 500ms)
        """
        try:
            if not image_paths:
                raise ValueError("No images provided")
                
            images = []
            for img_path in image_paths:
                img = Image.open(img_path)
                # Convert to RGB if needed (for transparency handling)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                images.append(img)
            
            # Save as GIF
            images[0].save(
                output_path,
                save_all=True,
                append_images=images[1:],
                duration=duration,
                loop=0,
                optimize=True
            )
            
            logger.info(f"Created GIF from {len(images)} images")
            return output_path
            
        except Exception as e:
            logger.error(f"Failed to create GIF from images: {str(e)}")
            raise ValueError(f"Failed to create GIF from images: {str(e)}")
