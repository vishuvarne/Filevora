"""Authentication routes for user registration and login."""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional

from ..database import get_db_session
from ..models.database import User, Session as DBSession
from ..utils.auth import auth_utils

router = APIRouter(prefix="/api/auth", tags=["authentication"])
security = HTTPBearer()

# Pydantic models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db_session)):
    """Register a new user with email and password."""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = auth_utils.hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name,
        oauth_provider="email",
        is_verified=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token = auth_utils.create_access_token(
        data={"sub": new_user.id, "email": new_user.email}
    )
    
    # Create session
    session = DBSession(
        user_id=new_user.id,
        token=auth_utils.generate_session_token(),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(session)
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db_session)):
    """Login with email and password."""
    
    # Find user
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not auth_utils.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = auth_utils.create_access_token(
        data={"sub": user.id, "email": user.email}
    )
    
    # Create session
    session = DBSession(
        user_id=user.id,
        token=auth_utils.generate_session_token(),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(session)
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db_session)
):
    """Get current authenticated user."""
    
    # Decode token
    payload = auth_utils.decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db_session)
):
    """Logout and invalidate session."""
    
    # Decode token to get user
    payload = auth_utils.decode_access_token(credentials.credentials)
    if payload:
        user_id = payload.get("sub")
        # Delete all sessions for user (logout from all devices)
        db.query(DBSession).filter(DBSession.user_id == user_id).delete()
        db.commit()
    
    return {"message": "Successfully logged out"}
