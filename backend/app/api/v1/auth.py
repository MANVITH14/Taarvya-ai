"""Authentication endpoints."""
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.database import get_db
from app.core.auth import (
    hash_password, verify_password, needs_rehash,
    create_access_token, create_refresh_token, decode_token,
    get_current_user,
)
from app.models.user import User

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

REFRESH_COOKIE = "taarvya_refresh"


# ============================================================
# Schemas
# ============================================================
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    preferred_language: str = "en"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    password: str


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    preferred_language: Optional[str] = None


# ============================================================
# Helpers
# ============================================================
def _user_to_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "preferred_language": user.preferred_language,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat(),
    }


def _set_refresh_cookie(response: Response, token: str, days: int = 30):
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=days * 24 * 3600,
        path="/api/v1/auth",
    )


# ============================================================
# Routes
# ============================================================
@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    # Validate password strength
    if len(body.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    if not any(c.isupper() for c in body.password):
        raise HTTPException(status_code=422, detail="Password must contain at least one uppercase letter")
    if not any(c.isdigit() for c in body.password):
        raise HTTPException(status_code=422, detail="Password must contain at least one number")

    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        full_name=body.full_name.strip(),
        preferred_language=body.preferred_language if body.preferred_language in ("en", "kn") else "en",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    access = create_access_token(str(user.id), user.email)
    refresh = create_refresh_token(str(user.id))
    _set_refresh_cookie(response, refresh)

    return AuthResponse(access_token=access, user=_user_to_dict(user))


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == body.email.lower(), User.is_active == True))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Rehash if needed (algorithm update)
    if needs_rehash(user.hashed_password):
        user.hashed_password = hash_password(body.password)
        await db.flush()

    access = create_access_token(str(user.id), user.email)
    refresh = create_refresh_token(str(user.id))
    _set_refresh_cookie(response, refresh)

    return AuthResponse(access_token=access, user=_user_to_dict(user))


@router.post("/logout")
async def logout(response: Response):
    """Invalidate the refresh cookie."""
    response.delete_cookie(key=REFRESH_COOKIE, path="/api/v1/auth")
    return {"message": "Logged out"}


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using the HTTP-only refresh cookie."""
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    try:
        uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    except (ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Invalid user ID in refresh token")

    result = await db.execute(select(User).where(User.id == uid, User.is_active == True))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access = create_access_token(str(user.id), user.email)
    new_refresh = create_refresh_token(str(user.id))
    _set_refresh_cookie(response, new_refresh)

    return AuthResponse(access_token=access, user=_user_to_dict(user))


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return _user_to_dict(current_user)


@router.patch("/me")
async def update_me(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile."""
    if body.full_name is not None:
        current_user.full_name = body.full_name.strip()
    if body.preferred_language is not None and body.preferred_language in ("en", "kn"):
        current_user.preferred_language = body.preferred_language
    await db.flush()
    await db.refresh(current_user)
    return _user_to_dict(current_user)


@router.post("/password-reset/request")
@limiter.limit("3/minute")
async def request_password_reset(
    request: Request,
    body: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
):
    """Request a password reset email."""
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()

    # Always return success to prevent email enumeration
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.flush()
        # TODO: send email with reset link
        # For now: log it (in production, send via SMTP service)
        import logging
        logging.getLogger(__name__).info(f"Password reset token for {user.email}: {token}")

    return {"message": "If an account exists with that email, a reset link has been sent."}


@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete the current user's account and all data."""
    await db.delete(current_user)
    await db.flush()
    return {"message": "Account deleted successfully"}
