# app/services/otp_service.py

import random
from datetime import datetime, timedelta
from sqlalchemy import delete, select
from ..models import PasswordResetOTP


def generate_otp():
    return str(random.randint(100000, 999999))


async def create_otp(db, email: str):
    otp = generate_otp()

    # delete old OTPs
    await db.execute(
        delete(PasswordResetOTP).where(
            PasswordResetOTP.email == email
        )
    )

    record = PasswordResetOTP(
        email=email,
        otp=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=5)
    )

    db.add(record)
    await db.commit()

    return otp


async def verify_otp(db, email: str, otp: str):
    result = await db.execute(
        select(PasswordResetOTP).where(
            PasswordResetOTP.email == email,
            PasswordResetOTP.otp == otp
        )
    )

    record = result.scalar_one_or_none()

    if not record:
        return False

    if datetime.utcnow() > record.expires_at:
        await db.delete(record)
        await db.commit()
        return False

    await db.delete(record)
    await db.commit()
    return True