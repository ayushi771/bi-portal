from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm
from app import schemas , models , auth
from ..database import get_db
from ..models import User as UserModel, Role as RoleModel
from ..schemas import UserCreate, User as UserSchema
from ..auth import get_password_hash, verify_password, create_access_token
from ..dependencies import get_current_user
from ..config import ACCESS_TOKEN_EXPIRE_MINUTES
router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register", response_model=schemas.User)
async def register_user(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):

    hashed_password = get_password_hash(user.password)

    new_user = UserModel(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role_id=user.role_id
    )

    db.add(new_user)
    await db.commit()

    # reload user WITH role
    result = await db.execute(
        select(UserModel)
        .options(selectinload(UserModel.role))
        .where(UserModel.username == user.username)
    )

    created_user = result.scalar_one()

    return created_user

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(
        select(UserModel).where(UserModel.username == form_data.username)
    )

    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me")
async def read_current_user(current_user: UserModel = Depends(get_current_user)):
    return current_user