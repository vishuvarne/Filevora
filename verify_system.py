import requests
import time
import sys

def check_service(name, url):
    print(f"Checking {name} at {url}...")
    try:
        response = requests.get(url, timeout=5)
        print(f"✅ {name} is UP (Status: {response.status_code})")
        return True
    except requests.exceptions.ConnectionError:
        print(f"❌ {name} is DOWN (Connection Refused)")
        return False
    except Exception as e:
        print(f"❌ {name} Error: {e}")
        return False

def test_api():
    print("\nTesting Backend API (PDF Text Extraction Mock)...")
    # Using chat-pdf-init which essentially extracts text, as a smoke test
    # We need a dummy PDF file.
    
    dummy_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello FileVora!) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000157 00000 n\n0000000302 00000 n\n0000000389 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n483\n%%EOF"
    
    files = {'file': ('test.pdf', dummy_pdf_content, 'application/pdf')}
    
    try:
        response = requests.post("http://localhost:8000/process/chat-pdf-init", files=files, timeout=10)
        if response.status_code == 200:
            print("✅ API Test (PDF Init) PASSED")
            print("Response:", response.json())
            return True
        else:
            print(f"❌ API Test FAILED (Status: {response.status_code})")
            print("Response:", response.text)
            return False
    except Exception as e:
        print(f"❌ API Test Error: {e}")
        return False

def main():
    print("--- FileVora System Verification ---\n")
    
    # Allow some time for servers to start if just launched
    time.sleep(2)
    
    # Check Frontend
    fe_status = check_service("Frontend (Next.js)", "http://localhost:3000")
    
    # Check Backend
    be_status = check_service("Backend (FastAPI)", "http://localhost:8000/docs")
    
    if be_status:
        test_api()
        
    if fe_status and be_status:
        print("\n✅ SYSTEM GREEN: Both services are running.")
        sys.exit(0)
    else:
        print("\n❌ SYSTEM RED: One or more services failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
