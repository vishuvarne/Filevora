from fastapi.testclient import TestClient
import sys
import os
import io
from pathlib import Path

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.main import app

client = TestClient(app)

def test_chat_pdf_flow():
    print("Testing Chat PDF Flow...")
    
    # Create a dummy PDF
    import fitz
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "This is a secret document about Project Filevora.\nIt is designed to be the fastest file converter.")
    
    pdf_bytes = doc.tobytes()
    doc.close()
    
    # 1. Init Chat
    response = client.post(
        "/process/chat-pdf-init",
        files={"file": ("test.pdf", pdf_bytes, "application/pdf")}
    )
    
    if response.status_code != 200:
        print(f"Init Failed: {response.text}")
        assert False
        
    data = response.json()
    assert data["status"] == "success"
    assert "Filevora" in data["preview"]
    print("Init OK")
    
    # 2. Query Chat
    response = client.post(
        "/process/chat-pdf-query",
        files={"file": ("test.pdf", pdf_bytes, "application/pdf")},
        data={"query": "fastest"}
    )
    
    if response.status_code != 200:
        print(f"Query Failed: {response.text}")
        assert False
        
    data = response.json()
    assert "fastest" in data["answer"]
    print("Query OK")

if __name__ == "__main__":
    try:
        test_chat_pdf_flow()
        print("\nAll chat tests passed!")
    except Exception as e:
        print(f"Test Execution Failed: {e}")
