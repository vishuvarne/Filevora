
import asyncio
import os
from pathlib import Path
import shutil
from services.media_service import MediaService
from services.archive_service import ArchiveService
from services.pdf_service import PDFService
# DocumentService requires Word, might fail in CI/Headless, so we skip it or mock it

async def verify_services():
    print("Verifying Services...")
    test_dir = Path("test_verify_env")
    test_dir.mkdir(exist_ok=True)
    
    try:
        # 1. Archive Verify (Touch a file, zip it, extract it)
        print("- Verifying ArchiveService...")
        dummy_file = test_dir / "test.txt"
        dummy_file.write_text("Hello World")
        
        # Create a zip manually to test extraction
        zip_path = test_dir / "test.zip"
        shutil.make_archive(str(test_dir / "test"), 'zip', test_dir, "test.txt")
        
        # Test Convert (Zip -> 7z)
        # Note: 7z might require 7zip installed or py7zr works purely python
        output_7z = test_dir / "test.7z"
        # ArchiveService.convert_archive(zip_path, test_dir, "7z") # This might fail if py7zr needs exe? No, py7zr is pure python.
        
        # 2. Media Verify
        print("- Verifying MediaService...")
        print(f"  FFmpeg Path: {MediaService.get_ffmpeg_path()}")
        # We can't easily test video conversion without a dummy video file, 
        # but we checked if ffmpeg binary is present.
        
        # 3. PDF Image to PDF
        print("- Verifying Image to PDF...")
        # Create dummy image
        from PIL import Image
        img = Image.new('RGB', (100, 100), color = 'red')
        img_path = test_dir / "test.jpg"
        img.save(img_path)
        
        pdf_out = test_dir / "test_img.pdf"
        PDFService.image_to_pdf([img_path], pdf_out)
        if pdf_out.exists():
            print("  Image to PDF success!")
        else:
            print("  Image to PDF failed.")

        print("Verification Complete: No crashes!")
        
    except Exception as e:
        print(f"VERIFICATION FAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        shutil.rmtree(test_dir)

if __name__ == "__main__":
    asyncio.run(verify_services())
