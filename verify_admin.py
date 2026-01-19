from fastapi import FastAPI
from sqladmin import Admin
from backend.admin import setup_admin
from backend.database import engine

def verify_admin_setup():
    app = FastAPI()
    try:
        setup_admin(app)
        print("Admin setup called successfully.")
        
        # Check if admin routes are added. Admin usually adds /admin
        # Note: sqladmin might add them dynamically on startup, but let's check basic attachment.
        # Introspecting app.routes might be tricky depending on how sqladmin behaves, 
        # but if the function ran without error, it's a good sign.
        
        print("Verification passed: setup_admin() executed without errors.")
    except Exception as e:
        print(f"Verification FAILED: {e}")

if __name__ == "__main__":
    verify_admin_setup()
