# backend/app/routes/users.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from ..emails import send_email
from .. import schemas
from ..database import get_db
from ..models import User as UserModel, Role as RoleModel
from ..services.otp_service import create_otp, verify_otp
from ..schemas import SendOTPRequest, ResetPasswordRequest , VerifyLoginOTP
from ..auth import (
    get_password_hash,
    verify_password,
    MAX_BCRYPT_PASSWORD_BYTES,
    create_access_token,
)
from ..dependencies import get_current_user, admin_required , get_current_user_optional
from ..config import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/users", tags=["Users"])


# =========================
# REQUEST MODEL
# =========================
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role_name: Optional[str] = None
    role_id: Optional[int] = None

@router.post("/register", response_model=schemas.User)
async def register_user(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_current_user_optional),
):
    # =========================
    # CHECK IF USERS EXIST
    # =========================
    result = await db.execute(select(UserModel))
    existing_user = result.scalars().first()

    # =========================
    # AUTH CHECK (ONLY AFTER FIRST USER)
    # =========================
    if existing_user:
        if not current_user or not current_user.role or current_user.role.name != "admin":
            raise HTTPException(
                status_code=403,
                detail="Only admin can create users",
            )

    # =========================
    # PASSWORD VALIDATION
    # =========================
    if len(payload.password.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Password too long",
        )

    # =========================
    # DEFAULT ROLE = USER (if nothing given)
    # =========================
    resolved_role_id = None

    if payload.role_id:
        role = await db.get(RoleModel, payload.role_id)
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role_id")
        resolved_role_id = role.id

    elif payload.role_name:
        result = await db.execute(
            select(RoleModel).where(RoleModel.name == payload.role_name.lower())
        )
        role = result.scalar_one_or_none()

        if not role:
            role = RoleModel(name=payload.role_name.lower())
            db.add(role)
            await db.commit()
            await db.refresh(role)

        resolved_role_id = role.id

    # =========================
    # FIRST USER → ADMIN
    # =========================
    if not existing_user:
        result = await db.execute(
            select(RoleModel).where(RoleModel.name == "admin")
        )
        admin_role = result.scalar_one_or_none()

        if not admin_role:
            admin_role = RoleModel(name="admin")
            db.add(admin_role)
            await db.commit()
            await db.refresh(admin_role)

        resolved_role_id = admin_role.id

    # =========================
    # IF STILL NO ROLE → DEFAULT "user"
    # =========================
    if not resolved_role_id:
        result = await db.execute(
            select(RoleModel).where(RoleModel.name == "user")
        )
        user_role = result.scalar_one_or_none()

        if not user_role:
            user_role = RoleModel(name="user")
            db.add(user_role)
            await db.commit()
            await db.refresh(user_role)

        resolved_role_id = user_role.id

    # =========================
    # CREATE USER
    # =========================
    new_user = UserModel(
        username=payload.username,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role_id=resolved_role_id,
    )

    db.add(new_user)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="User already exists")

    # =========================
    # RETURN USER WITH ROLE
    # =========================
    result = await db.execute(
        select(UserModel)
        .options(selectinload(UserModel.role))
        .where(UserModel.id == new_user.id)
    )

    return result.scalar_one()
from datetime import datetime

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserModel).where(UserModel.username == form_data.username)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not getattr(user, "is_active", True):
        raise HTTPException(status_code=400, detail="User account is deactivated")

    # ✅ Generate OTP
    otp = await create_otp(db, user.email)

    # ✅ Send OTP email
    await send_email(
        to_email=user.email,
        subject="Login Verification Code",
        body=f"""
Your login verification code is: {otp}

This code will expire in 5 minutes.

If this wasn't you, please reset your password immediately.
"""
    )

    return {
        "message": "OTP sent",
        "email": user.email
    }
@router.post("/verify-login-otp")
async def verify_login_otp(
    payload: VerifyLoginOTP,
    db: AsyncSession = Depends(get_db),
):
    # ✅ Verify OTP
    valid = await verify_otp(db, payload.email, payload.otp)

    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # ✅ Get user
    result = await db.execute(
        select(UserModel).where(UserModel.email == payload.email)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ Generate token ONLY NOW
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
@router.post("/send-otp")
async def send_otp(
    payload: SendOTPRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserModel).where(UserModel.email == payload.email)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # create OTP
    otp = await create_otp(db, payload.email)

    # send email
    await send_email(
        to_email=payload.email,
        subject="Password Reset OTP",
        body=f"Your OTP is: {otp}\nExpires in 5 minutes."
    )

    return {"message": "OTP sent successfully"}
# =========================
# RESET PASSWORD (OTP)
# =========================
@router.post("/reset-password-otp")
async def reset_password_otp(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    # verify OTP
    valid = await verify_otp(db, payload.email, payload.otp)

    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    result = await db.execute(
        select(UserModel).where(UserModel.email == payload.email)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # password length check (same as register)
    if len(payload.new_password.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
        raise HTTPException(status_code=400, detail="Password too long")

    # update password
    user.hashed_password = get_password_hash(payload.new_password)

    await db.commit()

    return {"message": "Password updated successfully"}
# =========================
# CURRENT USER
# =========================
@router.get("/me", response_model=schemas.User)
async def read_current_user(
    current_user: UserModel = Depends(get_current_user),
):
    """
    Returns authenticated user WITH role.
    """
    return current_user