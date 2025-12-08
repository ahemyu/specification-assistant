"""Authentication schemas for user registration and login."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Request model for user registration."""

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    """Request model for user login."""

    email: EmailStr
    password: str


class Token(BaseModel):
    """Response model for JWT token."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""

    user_id: int | None = None
    email: str | None = None


class UserResponse(BaseModel):
    """Response model for user data (excludes password)."""

    id: int
    email: str
    username: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserInDB(UserResponse):
    """User model as stored in database (includes hashed password)."""

    hashed_password: str


class LogoutResponse(BaseModel):
    """Response model for logout confirmation."""

    message: str
