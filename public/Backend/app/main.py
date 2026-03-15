from fastapi import FastAPI
from .database import engine, Base
from .routes import admin, users  # Import both routers
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="Advanced Admin Panel")
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # add other dev origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # or ["*"] for quick local testing (not recommended for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -------------------------------
# Create tables on startup
# -------------------------------
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# -------------------------------
# Include routers
# -------------------------------
app.include_router(admin.router)  # Admin routes
app.include_router(users.router)  # User routes