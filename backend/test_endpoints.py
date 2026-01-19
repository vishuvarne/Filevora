
import requests
import os
import shutil
import subprocess
from pathlib import Path
import time
from services.media_service import MediaService

BASE_URL = "http://localhost:8000"
TEST_DIR = Path("test_assets")
OUTPUT_DIR = Path("test_outputs")

def setup():
    if TEST_DIR.exists(): shutil.rmtree(TEST_DIR)
    if OUTPUT_DIR.exists(): shutil.rmtree(OUTPUT_DIR)
    TEST_DIR.mkdir()
    OUTPUT_DIR.mkdir()

    print(" Creating dummy files...", flush=True)

    # 1. Create Dummy Text File
    (TEST_DIR / "doc.txt").write_text("This is a test document.")

    # 2. Create Dummy Zip
    shutil.make_archive(str(TEST_DIR / "archive"), 'zip', TEST_DIR, "doc.txt")

    # 3. Create Dummy Image (Red Square)
    from PIL import Image
    img = Image.new('RGB', (100, 100), color = 'red')
    img.save(TEST_DIR / "image.jpg")
    img.save(TEST_DIR / "image.png")

    # 4. Generate Dummy Video (using ffmpeg if avail)
    try:
        ffmpeg = MediaService.get_ffmpeg_path()
        video_path = str(TEST_DIR / "video.mp4")
        audio_path = str(TEST_DIR / "audio.mp3")
        
        # Use subprocess for safety
        # Generate video with audio (sine wave)
        subprocess.run([
            ffmpeg, "-y",
            "-f", "lavfi", "-i", "testsrc=duration=1:size=128x128:rate=30",
            "-f", "lavfi", "-i", "sine=f=440:d=1",
            "-map", "0:v", "-map", "1:a",
            "-c:v", "libx264", "-c:a", "aac", 
            video_path
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Audio file
        subprocess.run([ffmpeg, "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", "1", "-y", audio_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        if Path(video_path).exists():
            print("  Video created.", flush=True)
        else:
            print("  Video creation failed (no file).", flush=True)

    except Exception as e:
        print(f"Warning: Could not create media files: {e}", flush=True)

def test_endpoint(name, endpoint, file_path, data=None):
    print(f"Testing {name} ({endpoint})...", end=" ", flush=True)
    if not file_path.exists():
        print(f"SKIPPED (File not found: {file_path})", flush=True)
        return

    try:
        with open(file_path, "rb") as f:
            files = {"file": (file_path.name, f, "application/octet-stream")}
            # Special handling for image-to-pdf list input
            if endpoint == "/process/image-to-pdf" or endpoint == "/process/merge-pdf":
                 # Requests files list of tuples
                 response = requests.post(
                    f"{BASE_URL}{endpoint}", 
                    files=[("files", (file_path.name, open(file_path, "rb"), "image/jpeg"))], 
                    data=data,
                    timeout=10
                )
            else:
                 response = requests.post(f"{BASE_URL}{endpoint}", files=files, data=data, timeout=10)
        
        if response.status_code == 200:
            print("OK", flush=True)
        else:
            print(f"FAILED ({response.status_code}): {response.text[:100]}...", flush=True)
    except Exception as e:
        print(f"ERROR: {e}", flush=True)

def main():
    print("--- Starting Integration Tests ---", flush=True)
    try:
        requests.get(f"{BASE_URL}/docs", timeout=2)
        print("Server is UP.", flush=True)
    except:
        print("Server seems DOWN. Is uvicorn running?", flush=True)
        return

    setup()

    # Archives
    test_endpoint("Archive (Zip -> 7z)", "/process/archive-convert", TEST_DIR / "archive.zip", {"target_format": "7z"})
    test_endpoint("Archive (Zip -> Tar.gz)", "/process/archive-convert", TEST_DIR / "archive.zip", {"target_format": "tar.gz"})

    # Documents
    # We skip actual docx creation as we don't have python-docx, but we can try an empty file named .docx
    # and see if it fails gracefully or process. Backend checks extension.
    # (TEST_DIR / "fake.docx").write_text("fake")
    # test_endpoint("Docx to PDF (Fake)", "/process/docx-to-pdf", TEST_DIR / "fake.docx") # Likely 500 or 400 from docx2pdf

    # Images
    test_endpoint("Image to PDF", "/process/image-to-pdf", TEST_DIR / "image.jpg")
    test_endpoint("Convert Image (JPG -> PNG)", "/process/convert-image", TEST_DIR / "image.jpg", {"target_format": "png"})
    
    # Media
    test_endpoint("Convert Video (MP4 -> MKV)", "/process/convert-video", TEST_DIR / "video.mp4", {"target_format": "mkv"})
    test_endpoint("Compress Video", "/process/compress-video", TEST_DIR / "video.mp4", {"level": "basic"})
    test_endpoint("Extract Audio", "/process/extract-audio", TEST_DIR / "video.mp4", {"target_format": "mp3"})
    test_endpoint("Convert Audio", "/process/convert-audio", TEST_DIR / "audio.mp3", {"target_format": "wav"})
    
    # Cleanup
    # shutil.rmtree(TEST_DIR)

if __name__ == "__main__":
    main()
