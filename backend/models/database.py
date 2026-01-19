"""Database models for user authentication and conversion history."""
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)  # Nullable for OAuth users
    name = Column(String, nullable=False)
    oauth_provider = Column(String, nullable=True)  # 'google', 'github', 'email', etc.
    oauth_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    conversions = relationship("ConversionHistory", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email}>"

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    
    def __repr__(self):
        return f"<Session {self.id} for user {self.user_id}>"

class ConversionHistory(Base):
    __tablename__ = "conversion_history"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Nullable for anonymous users
    tool_used = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    file_count = Column(Integer, default=1)
    success = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="conversions")
    
    def __repr__(self):
        return f"<Conversion {self.tool_used} by user {self.user_id}>"
