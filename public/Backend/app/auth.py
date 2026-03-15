from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt

from .config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
MAX_BCRYPT_PASSWORD_BYTES = 72

def _truncate_to_bcrypt_bytes(password: str) -> bytes:
    """
    Return the UTF-8 encoding of password truncated to MAX_BCRYPT_PASSWORD_BYTES bytes.
    We return bytes and pass bytes into passlib to guarantee bcrypt never sees >72 bytes.
    """
    b = password.encode("utf-8")
    if len(b) <= MAX_BCRYPT_PASSWORD_BYTES:
        return b
    return b[:MAX_BCRYPT_PASSWORD_BYTES]

def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt