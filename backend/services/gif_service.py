import subprocess
import logging
from pathlib import Path

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
