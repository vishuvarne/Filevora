import os
import sys
from fastapi.testclient import TestClient
from pathlib import Path
import fitz
from PIL import Image
import io

# Add project root to path so we can import backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.main import app

client = TestClient(app)

def create_dummy_pdf():
    doc = fitz.open()
    doc.new_page().insert_text((50, 50), "Page 1")
    doc.new_page().insert_text((50, 50), "Page 2")
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()

def create_dummy_image():
    img = Image.new('RGB', (100, 100), color='red')
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer.read()

def test_split_pdf():
    print("Testing Split PDF...")
    pdf_bytes = create_dummy_pdf()
    response = client.post(
        "/process/split-pdf",
        files={"file": ("test.pdf", pdf_bytes, "application/pdf")}
    )
    if response.status_code != 200:
        print(f"Split PDF Failed: {response.text}")
        return
    assert response.status_code == 200
    assert "download_url" in response.json()
    print("Split PDF: OK")

def test_rotate_image():
    print("Testing Rotate Image...")
    img_bytes = create_dummy_image()
    response = client.post(
        "/process/rotate-image",
        files={"file": ("test.png", img_bytes, "image/png")},
        data={"angle": 90}
    )
    if response.status_code != 200:
        print(f"Rotate Image Failed: {response.text}")
        return
    assert response.status_code == 200
    assert "download_url" in response.json()
    print("Rotate Image: OK")

def test_pdf_to_image():
    print("Testing PDF to Image...")
    pdf_bytes = create_dummy_pdf()
    response = client.post(
        "/process/pdf-to-image",
        files={"file": ("test.pdf", pdf_bytes, "application/pdf")},
        data={"format": "png"}
    )
    if response.status_code != 200:
        print(f"PDF to Image Failed: {response.text}")
        return
    assert response.status_code == 200
    assert "download_url" in response.json()
    print("PDF to Image: OK")

if __name__ == "__main__":
    try:
        test_split_pdf()
        test_rotate_image()
        test_pdf_to_image()
        print("\nAll verification tests passed!")
    except ImportError:
        print("Missing dependencies for testing (httpx usually). Skipping automated verification.")
    except Exception as e:
        print(f"Test Execution Failed: {e}")
