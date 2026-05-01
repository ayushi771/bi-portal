from sqlalchemy import Column, Integer, String, Boolean, ForeignKey , DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime , timedelta



class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    otp = Column(String)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

class User(Base):
    __tablename__ = "userss"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role_id = Column(Integer, ForeignKey("roles.id"))
    
    role = relationship("Role")


class FavoriteDashboard(Base):
    __tablename__ = "favorite_dashboards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("userss.id"), nullable=False)

    dashboard_id = Column(String, nullable=False)   # UUID from Superset
    dashboard_name = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("user_id", "dashboard_id", name="uq_user_dashboard"),
    )