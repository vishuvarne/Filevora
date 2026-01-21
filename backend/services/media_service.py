
import subprocess
import os
import imageio_ffmpeg
from pathlib import Path
from typing import Union, IO, List

class MediaService:
    @staticmethod
    def get_ffmpeg_path():
        return imageio_ffmpeg.get_ffmpeg_exe()

    @staticmethod
    def _run_ffmpeg(cmd_args):
        try:
            ffmpeg_exe = MediaService.get_ffmpeg_path()
            full_cmd = [ffmpeg_exe, "-y", "-threads", "0"] + cmd_args # -y to overwrite, -threads 0 for multithreading
            
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
            args.extend(["-c:v", "libx264", "-c:a", "aac", "-preset", "fast"])
        else:
            # Let ffmpeg decide based on extension or use safe defaults
             pass

        args.append(str(output_path))
        MediaService._run_ffmpeg(args)
        return output_path

    @staticmethod
    def compress_video(job_input: Path, output_path: Path, quality: str = "medium"):
        """
        Compress video using CRF (Constant Rate Factor).
        
        Args:
            quality: "low" (smallest), "medium" (balanced), "high" (best quality)
        """
        # CRF values: lower = better quality, higher = smaller file
        crf_map = {
            "low": "32",      # Aggressive compression
            "medium": "28",   # Balanced
            "high": "23"      # High quality
        }
        crf = crf_map.get(quality, "28")
        
        args = [
            "-i", str(job_input), 
            "-vcodec", "libx264", 
            "-crf", crf, 
            "-preset", "medium",
            "-c:a", "aac",
            "-b:a", "128k",
            str(output_path)
        ]
        MediaService._run_ffmpeg(args)
        return output_path

    @staticmethod
    def merge_videos(input_paths: List[Path], output_path: Path):
        """
        Merge multiple videos into one.
        Uses FFmpeg concat demuxer for same codec/format.
        """
        # Create concat file
        concat_file = output_path.parent / "concat_list.txt"
        with open(concat_file, "w") as f:
            for video_path in input_paths:
                f.write(f"file '{video_path.absolute()}'\n")
        
        try:
            args = [
                "-f", "concat",
                "-safe", "0",
                "-i", str(concat_file),
                "-c", "copy",
                str(output_path)
            ]
            MediaService._run_ffmpeg(args)
            return output_path
        finally:
            # Cleanup
            if concat_file.exists():
                concat_file.unlink()

    @staticmethod
    def trim_video(job_input: Path, output_path: Path, start_time: str, end_time: str):
        """
        Trim video from start_time to end_time.
        
        Args:
            start_time: Start time in format "HH:MM:SS" or seconds
            end_time: End time in format "HH:MM:SS" or seconds
        """
        args = [
            "-i", str(job_input),
            "-ss", start_time,
            "-to", end_time,
            "-c", "copy",  # Copy codec for fast processing
            str(output_path)
        ]
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
    def convert_audio(job_input: Path, output_path: Path, target_format: str = "mp3"):
        """
        Convert audio format.
        """
        args = ["-i", str(job_input)]
        if target_format == "mp3":
            args.extend(["-ab", "192k"])
        elif target_format == "wav":
            args.extend(["-c:a", "pcm_s16le"])
        elif target_format == "ogg":
            args.extend(["-c:a", "libvorbis"])
            
        args.append(str(output_path))
        MediaService._run_ffmpeg(args)
        return output_path

    @staticmethod
    def compress_audio(job_input: Path, output_path: Path, bitrate: str = "128k"):
        """
        Compress audio by reducing bitrate.
        
        Args:
            bitrate: Target bitrate (e.g., "64k", "128k", "192k")
        """
        args = [
            "-i", str(job_input),
            "-b:a", bitrate,
            str(output_path)
        ]
        MediaService._run_ffmpeg(args)
        return output_path

    @staticmethod
    def boost_volume(job_input: Path, output_path: Path, factor: float = 1.5):
        """
        Boost audio volume.
        
        Args:
            factor: Volume multiplier (e.g., 1.5 = 150%, 2.0 = 200%)
        """
        # Convert factor to dB
        # dB = 20 * log10(factor)
        import math
        db = 20 * math.log10(factor)
        
        args = [
            "-i", str(job_input),
            "-filter:a", f"volume={db}dB",
            str(output_path)
        ]
        MediaService._run_ffmpeg(args)
        return output_path
