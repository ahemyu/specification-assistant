"""Authentication service for password hashing and JWT token management."""

import logging
from datetime import UTC, datetime, timedelta

from backend.config import JWT_ACCESS_TOKEN_EXPIRE_MINUTES, JWT_ALGORITHM, JWT_SECRET_KEY
from backend.models.user import User
from backend.schemas.auth import TokenData
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash.

    Args:
        plain_password: The plain text password to verify.
        hashed_password: The hashed password to compare against.

    Returns:
        True if the password matches, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a plain password using bcrypt.

    Args:
        password: The plain text password to hash.

    Returns:
        The hashed password string.
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token.

    Args:
        data: The payload data to encode in the token.
        expires_delta: Optional custom expiration time.

    Returns:
        The encoded JWT token string.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> TokenData | None:
    """Decode and validate a JWT access token.

    Args:
        token: The JWT token string to decode.

    Returns:
        TokenData with user information if valid, None otherwise.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: int | None = payload.get("sub")
        email: str | None = payload.get("email")
        if user_id is None:
            return None
        return TokenData(user_id=int(user_id), email=email)
    except JWTError as e:
        logger.warning("JWT decode error: %s", str(e))
        return None


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Get a user by their email address.

    Args:
        db: The database session.
        email: The email address to search for.

    Returns:
        The User if found, None otherwise.
    """
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    """Get a user by their username.

    Args:
        db: The database session.
        username: The username to search for.

    Returns:
        The User if found, None otherwise.
    """
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """Get a user by their ID.

    Args:
        db: The database session.
        user_id: The user ID to search for.

    Returns:
        The User if found, None otherwise.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    """Authenticate a user by email and password.

    Args:
        db: The database session.
        email: The user's email address.
        password: The plain text password to verify.

    Returns:
        The User if authentication succeeds, None otherwise.
    """
    user = await get_user_by_email(db, email)
    if not user:
        logger.info("Authentication failed: user not found for email %s", email)
        return None
    if not verify_password(password, user.hashed_password):
        logger.info("Authentication failed: invalid password for email %s", email)
        return None
    return user


async def create_user(db: AsyncSession, email: str, username: str, password: str) -> User:
    """Create a new user in the database.

    Args:
        db: The database session.
        email: The user's email address.
        username: The user's username.
        password: The plain text password (will be hashed).

    Returns:
        The created User object.
    """
    hashed_password = get_password_hash(password)
    user = User(
        email=email,
        username=username,
        hashed_password=hashed_password,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info("Created new user: %s (email: %s)", username, email)
    return user
