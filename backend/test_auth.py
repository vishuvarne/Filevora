from fastapi.testclient import TestClient
import sys
import os

# Add project root to path so we can import backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.main import app
from backend.models.database import Base
from backend.database import engine

client = TestClient(app)

def setup_module(module):
    # Create tables
    Base.metadata.create_all(bind=engine)

def teardown_module(module):
    # Drop tables (optional, or use a test db)
    # Base.metadata.drop_all(bind=engine)
    pass

def test_register_login():
    print("Testing Registration...")
    email = f"test_{os.urandom(4).hex()}@example.com"
    password = "password123"
    name = "Test User"
    
    # Register
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": name}
    )
    if response.status_code != 201:
        print(f"Registration Failed: {response.text}")
        assert False
    
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == email
    print("Registration OK")
    
    # Login
    print("Testing Login...")
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    if response.status_code != 200:
        print(f"Login Failed: {response.text}")
        assert False
        
    data = response.json()
    assert "access_token" in data
    token = data["access_token"]
    print("Login OK")
    
    # Get Me
    print("Testing Get Me...")
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code != 200:
        print(f"Get Me Failed: {response.text}")
        assert False
        
    data = response.json()
    assert data["email"] == email
    print("Get Me OK")

if __name__ == "__main__":
    try:
        setup_module(None)
        test_register_login()
        print("\nAll auth tests passed!")
    except Exception as e:
        print(f"Test Execution Failed: {e}")
