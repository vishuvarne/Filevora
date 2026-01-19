
import requests
import os
import shutil
from pathlib import Path
import time
from reportlab.pdfgen import canvas

BASE_URL = "http://localhost:8000"
TEST_DIR = Path("pdf_test_assets")
OUTPUT_DIR = Path("pdf_test_outputs")

def create_dummy_pdf(filename, content="Dummy PDF"):
    c = canvas.Canvas(str(TEST_DIR / filename))
    c.drawString(100, 750, content)
    c.save()

def setup():
    if TEST_DIR.exists(): shutil.rmtree(TEST_DIR)
    if OUTPUT_DIR.exists(): shutil.rmtree(OUTPUT_DIR)
    TEST_DIR.mkdir()
    OUTPUT_DIR.mkdir()

    print(" Creating dummy PDFs...", flush=True)
    create_dummy_pdf("test1.pdf", "Page 1 Content")
    create_dummy_pdf("test2.pdf", "Page 2 Content")
    create_dummy_pdf("test3.pdf", "Page 3 Content")

def test_endpoint(name, endpoint, files_dict, data=None):
    print(f"Testing {name} ({endpoint})...", end=" ", flush=True)
    
    try:
        # files_dict is list of (key, (filename, open_file, mime))
        # We need to open files here
        opened_files = []
        files_payload = []
        
        for key, path in files_dict:
            f = open(path, "rb")
            opened_files.append(f)
            files_payload.append((key, (path.name, f, "application/pdf")))
            
        response = requests.post(f"{BASE_URL}{endpoint}", files=files_payload, data=data, timeout=30)
        
        # Close files
        for f in opened_files:
            f.close()

        if response.status_code == 200:
            print("OK", flush=True)
            # Try to save content if it returns a file (check headers or assumption)
            # But the endpoint returns JSON with download URL usually.
            # print(response.json()) 
        else:
            print(f"FAILED ({response.status_code}): {response.text[:200]}...", flush=True)
            
    except Exception as e:
        print(f"ERROR: {e}", flush=True)

def main():
    print("--- Starting PDF Deep Tests ---", flush=True)
    try:
        requests.get(f"{BASE_URL}/docs", timeout=2)
        print("Server is UP.", flush=True)
    except:
        print("Server seems DOWN. Is uvicorn running?", flush=True)
        return

    setup()

    # 1. Merge PDF
    # The endpoint /process/merge-pdf expects 'files' as a list of UploadFile
    # In requests, we send multiple parts with name 'files' (or whatever fastapi expects)
    # Looking at processor.py: async def merge_pdf(files: List[UploadFile] = File(...)):
    # So the key must be "files".
    
    test_endpoint(
        "Merge PDF", 
        "/process/merge-pdf", 
        [("files", TEST_DIR / "test1.pdf"), ("files", TEST_DIR / "test2.pdf")]
    )

    # 2. Split PDF
    # /process/split-pdf expects 'file'
    test_endpoint(
        "Split PDF", 
        "/process/split-pdf", 
        [("file", TEST_DIR / "test1.pdf")]
    )

    # 3. Compress PDF
    test_endpoint(
        "Compress PDF", 
        "/process/compress-pdf", 
        [("file", TEST_DIR / "test1.pdf")],
        data={"level": "basic"}
    )
    
    # 4. PDF to Word
    test_endpoint(
        "PDF to Word", 
        "/process/pdf-to-word", 
        [("file", TEST_DIR / "test1.pdf")]
    )
    
    # 5. PDF to Image
    test_endpoint(
        "PDF to Image", 
        "/process/pdf-to-image", 
        [("file", TEST_DIR / "test1.pdf")],
        data={"format": "png"}
    )

    # 6. Image to PDF
    # Create dummy image
    from PIL import Image
    img = Image.new('RGB', (100, 100), color = 'red')
    img.save(TEST_DIR / "test_img.jpg")
    
    test_endpoint(
        "Image to PDF", 
        "/process/image-to-pdf", 
        [("files", TEST_DIR / "test_img.jpg")]
    )

if __name__ == "__main__":
    main()
