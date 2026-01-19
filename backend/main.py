from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging
from collections import defaultdict
import time

from .config import config, Config
from .utils.file_ops import file_ops
from .routers import processor, auth
from .database import init_db
from .admin import setup_admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("filevora")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting FileVora Backend...")
    Config.setup_storage()
    init_db()  # Initialize database tables
    logger.info("Database initialized")
    
    # Background task for cleanup
    cleanup_task = asyncio.create_task(periodic_cleanup())
    
    yield
    
    # Shutdown
    cleanup_task.cancel()
    logger.info("Shutting down...")

async def periodic_cleanup():
    while True:
        try:
            logger.info("Running storage cleanup...")
            file_ops.cleanup_old_jobs()
            await asyncio.sleep(600)  # Check every 10 minutes
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Cleanup error: {e}")
            await asyncio.sleep(600)

app = FastAPI(lifespan=lifespan)
setup_admin(app)

# CORS - Restrict to known origins only
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS if len(config.ALLOWED_ORIGINS) > 0 else ["https://filevora.web.app", "https://filevora.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],  # Only allow needed methods
    allow_headers=["Content-Type", "Authorization"],  # Restrict headers
    max_age=3600,  # Cache preflight for 1 hour
)

# Trusted Host - Prevent host header attacks
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*.filevora.com", "*.filevora.web.app", "*.onrender.com", "localhost", "127.0.0.1"]
)

# Rate limiting storage
rate_limit_storage = defaultdict(list)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Simple rate limiting: 60 requests per minute per IP"""
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # Clean old requests (older than 1 minute)
    rate_limit_storage[client_ip] = [
        timestamp for timestamp in rate_limit_storage[client_ip]
        if current_time - timestamp < 60
    ]
    
    # Check rate limit
    if len(rate_limit_storage[client_ip]) >= 60:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please wait before trying again."},
            headers={"Retry-After": "60"}
        )
    
    # Add current request
    rate_limit_storage[client_ip].append(current_time)
    
    # Add security headers
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(),midi=(),sync-xhr=(),microphone=(),camera=(),magnetometer=(),gyroscope=(),fullscreen=(self),payment=()"
    
    return response

app.include_router(processor.router)
app.include_router(auth.router)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "FileVora API"}

from fastapi.responses import FileResponse
from fastapi import HTTPException

@app.get("/download/{job_id}/{filename}")
async def download_file(job_id: str, filename: str):
    file_path = Config.JOBS_PATH / job_id / "outputs" / filename
    if not file_path.exists():
        # Fallback to root job dir if not in outputs (support legacy/flat structure)
        file_path = Config.JOBS_PATH / job_id / filename
        
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(
        path=file_path, 
        filename=filename,
        media_type="application/octet-stream"
    )
