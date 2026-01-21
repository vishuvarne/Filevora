from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging
from collections import defaultdict
import time
from dotenv import load_dotenv

load_dotenv()

from config import config, Config
from utils.file_ops import file_ops
from routers import processor, auth, cloud_import
from database import init_db
from admin import setup_admin

# ... (existing code)



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

# GZip Compression
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Trusted Host - Prevent host header attacks
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*.filevora.com", "*.filevora.web.app", "*.onrender.com", "localhost", "127.0.0.1"]
)

# Rate limiting storage
rate_limit_storage = defaultdict(list)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Rate Limiting
    client_ip = request.client.host if request.client else "unknown"
    
    # Check Authentication for Rate Limit
    is_authenticated = False
    auth_header = request.headers.get("Authorization")
    try:
        if auth_header and auth_header.startswith("Bearer "):
            from utils.auth import auth_utils
            token = auth_header.split(" ")[1]
            if auth_utils.decode_access_token(token):
                is_authenticated = True
    except Exception:
        pass # Fail closed to anonymous limits

    from middleware.rate_limiter import rate_limiter
    
    # Check limit (returns tuple: allowed, current, limit)
    allowed, current, limit = rate_limiter.is_allowed(request, is_authenticated)
    
    if not allowed:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Rate limit exceeded",
                "message": f"You have exceeded the {limit} requests/hour limit.",
                "retry_after": 3600
            },
            headers={"Retry-After": "3600"}
        )
    
    # Check max content size (500MB)
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 500 * 1024 * 1024:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=413,
            content={"detail": "File too large (Max 500MB)"},
        )
        
    # Process request
    response = await call_next(request)
    
    # Add Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(),midi=(),sync-xhr=(),microphone=(),camera=(),magnetometer=(),gyroscope=(),fullscreen=(self),payment=()"
    response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: https: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com; style-src 'self' 'unsafe-inline'; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' https://docs.google.com https://accounts.google.com;"
    
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Mask detailed internal errors in production.
    Logs the actual error but returns a generic message to the client.
    """
    logger.error(f"Global error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error. Please try again later."},
    )

app.include_router(processor.router)
app.include_router(auth.router)
app.include_router(cloud_import.router)

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
