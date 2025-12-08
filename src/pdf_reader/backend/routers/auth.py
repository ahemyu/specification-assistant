"""Authentication router for user registration and login."""

import logging
from datetime import timedelta

from backend.config import JWT_ACCESS_TOKEN_EXPIRE_MINUTES
from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models.user import User
from backend.schemas.auth import LogoutResponse, Token, UserCreate, UserLogin, UserResponse
from backend.services.auth import (
    authenticate_user,
    create_access_token,
    create_user,
    get_user_by_email,
    get_user_by_username,
)
from backend.services.document import delete_documents_by_user
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Register a new user.

    Args:
        user_data: The user registration data.
        db: The database session.

    Returns:
        The created user information.

    Raises:
        HTTPException: If email or username already exists.
    """
    # Check if email already exists
    existing_email = await get_user_by_email(db, user_data.email)
    if existing_email:
        logger.warning("Registration failed: email already registered: %s", user_data.email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check if username already exists
    existing_username = await get_user_by_username(db, user_data.username)
    if existing_username:
        logger.warning("Registration failed: username already taken: %s", user_data.username)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Create new user
    user = await create_user(
        db=db,
        email=user_data.email,
        username=user_data.username,
        password=user_data.password,
    )

    return UserResponse.model_validate(user)


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> Token:
    """Authenticate user and return JWT token.

    Args:
        login_data: The user login credentials.
        db: The database session.

    Returns:
        JWT access token.

    Raises:
        HTTPException: If credentials are invalid.
    """
    user = await authenticate_user(db, login_data.email, login_data.password)
    if not user:
        logger.warning("Login failed for email: %s", login_data.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        logger.warning("Login failed: inactive user: %s", login_data.email)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Create access token
    access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires,
    )

    logger.info("User logged in successfully: %s", user.email)
    return Token(access_token=access_token, token_type="bearer")


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LogoutResponse:
    """Logout the current user and delete their uploaded documents.

    This endpoint validates the token, deletes all documents uploaded by the user,
    and confirms logout. The client should remove the token from storage.

    Args:
        current_user: The currently authenticated user.
        db: The database session.

    Returns:
        Logout confirmation message.
    """
    # Delete all documents uploaded by this user
    deleted_count = await delete_documents_by_user(db, current_user.id)
    logger.info("User logged out: %s (deleted %d documents)", current_user.email, deleted_count)
    return LogoutResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get the current authenticated user's information.

    Args:
        current_user: The currently authenticated user.

    Returns:
        The current user's information.
    """
    return UserResponse.model_validate(current_user)
