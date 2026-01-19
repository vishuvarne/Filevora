
import subprocess
import os
import imageio_ffmpeg
from pathlib import Path
from typing import Union, IO

class MediaService:
    @staticmethod
    def get_ffmpeg_path():
        return imageio_ffmpeg.get_ffmpeg_exe()

    @staticmethod
    def _run_ffmpeg(cmd_args):
        try:
            ffmpeg_exe = MediaService.get_ffmpeg_path()
            full_cmd = [ffmpeg_exe, "-y"] + cmd_args # -y to overwrite
            
            # Hide output on windows/linux to avoid console spam, or capture it
            completed = subprocess.run(
                full_cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                check=True
            )
            return completed
        except subprocess.CalledProcessError as e:
            # Capture stderr for debugging
            error_msg = e.stderr.decode('utf-8', errors='ignore') if e.stderr else str(e)
            raise ValueError(f"FFmpeg failed: {error_msg}")

    @staticmethod
    def convert_video(job_input: Union[Path, IO[bytes]], output_path: Path, target_format: str = "mp4", preset: str = "medium"):
        """
        Convert video to target format.
        """
        # Save input to temp file if stream (omitted for brevity, assuming Path used by processor)
        if not isinstance(job_input, Path):
             raise ValueError("Input must be a file path")

        # Basic conversion
        args = ["-i", str(job_input)]
        
        if target_format == "gif":
            # Better GIF generation
            # 1. Generate palette
            # 2. Use palette
            # Simple approach first:
            args.extend(["-vf", "fps=10,scale=320:-1:flags=lanczos", "-c:v", "gif"])
        elif target_format == "mp4":
            args.extend(["-c:v", "libx264", "-c:a", "aac", "-preset", preset])
        else:
            # Let ffmpeg decide based on extension or use safe defaults
             pass

        args.append(str(output_path))
        MediaService._run_ffmpeg(args)
        return output_path

    @staticmethod
    def compress_video(job_input: Path, output_path: Path, level: str = "basic"):
        """
        Compress video using CRF.
        """
        crf = "28" # Basic
        if level == "strong": crf = "35"
        elif level == "extreme": crf = "45"
        
        args = ["-i", str(job_input), "-vcodec", "libx264", "-crf", crf, str(output_path)]
        MediaService._run_ffmpeg(args)
        return output_path

    @staticmethod
    def extract_audio(job_input: Path, output_path: Path, format: str = "mp3"):
        """
        Extract audio from video.
        """
        args = ["-i", str(job_input), "-vn"] # -vn disable video
        if format == "mp3":
            args.extend(["-ab", "192k"])
        
        args.append(str(output_path))
        MediaService._run_ffmpeg(args)
        return output_path

    @staticmethod
    def convert_audio(job_input: Path, output_path: Path, format: str = "mp3"):
        """
        Convert audio format.
        """
        args = ["-i", str(job_input)]
        if format == "mp3":
            args.extend(["-ab", "192k"])
            
        args.append(str(output_path))
        MediaService._run_ffmpeg(args)
        return output_path
