"""Unit tests for authentication functionality."""

import pytest
from backend.schemas.auth import Token, TokenData, UserCreate, UserLogin
from backend.services.auth import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)


@pytest.mark.unit
class TestPasswordHashing:
    """Tests for password hashing and verification."""

    def test_password_hash_creates_different_hash(self):
        """Password hash should not equal plain password."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        assert hashed != password
        assert len(hashed) > 0

    def test_verify_password_correct(self):
        """Correct password should verify successfully."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Incorrect password should fail verification."""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)
        assert verify_password(wrong_password, hashed) is False

    def test_same_password_generates_different_hashes(self):
        """Same password should generate different hashes (salt)."""
        password = "testpassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        # Hashes should be different due to salt
        assert hash1 != hash2
        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


@pytest.mark.unit
class TestJWTTokens:
    """Tests for JWT token creation and decoding."""

    def test_create_access_token(self):
        """Access token should be created successfully."""
        data = {"sub": "123", "email": "test@example.com"}
        token = create_access_token(data)
        assert token is not None
        assert len(token) > 0
        assert isinstance(token, str)

    def test_decode_access_token_valid(self):
        """Valid token should decode successfully."""
        user_id = 123
        email = "test@example.com"
        data = {"sub": str(user_id), "email": email}
        token = create_access_token(data)

        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded.user_id == user_id
        assert decoded.email == email

    def test_decode_access_token_invalid(self):
        """Invalid token should return None."""
        invalid_token = "invalid.token.here"
        decoded = decode_access_token(invalid_token)
        assert decoded is None

    def test_decode_access_token_missing_sub(self):
        """Token without 'sub' field should return None."""
        data = {"email": "test@example.com"}  # No 'sub' field
        token = create_access_token(data)
        decoded = decode_access_token(token)
        assert decoded is None


@pytest.mark.unit
class TestAuthSchemas:
    """Tests for Pydantic auth schemas."""

    def test_user_create_valid(self):
        """UserCreate should accept valid data."""
        user = UserCreate(
            email="test@example.com",
            username="testuser",
            password="password123",
        )
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.password == "password123"

    def test_user_create_invalid_email(self):
        """UserCreate should reject invalid email."""
        with pytest.raises(ValueError):
            UserCreate(
                email="invalid-email",
                username="testuser",
                password="password123",
            )

    def test_user_create_short_username(self):
        """UserCreate should reject short username."""
        with pytest.raises(ValueError):
            UserCreate(
                email="test@example.com",
                username="ab",  # Too short (min 3)
                password="password123",
            )

    def test_user_create_short_password(self):
        """UserCreate should reject short password."""
        with pytest.raises(ValueError):
            UserCreate(
                email="test@example.com",
                username="testuser",
                password="short",  # Too short (min 8)
            )

    def test_user_login_valid(self):
        """UserLogin should accept valid data."""
        login = UserLogin(
            email="test@example.com",
            password="password123",
        )
        assert login.email == "test@example.com"
        assert login.password == "password123"

    def test_token_schema(self):
        """Token schema should work correctly."""
        token = Token(access_token="abc123")
        assert token.access_token == "abc123"
        assert token.token_type == "bearer"

    def test_token_data_schema(self):
        """TokenData schema should work correctly."""
        token_data = TokenData(user_id=1, email="test@example.com")
        assert token_data.user_id == 1
        assert token_data.email == "test@example.com"

    def test_token_data_optional_fields(self):
        """TokenData should allow None values."""
        token_data = TokenData()
        assert token_data.user_id is None
        assert token_data.email is None
