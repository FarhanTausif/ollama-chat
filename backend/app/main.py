from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import chats_router, messages_router, models_router

# Auto-create tables on startup (use Alembic for production migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ollama Chat API",
    version="1.0.0",
    description="LLM-powered chat API backed by a local Ollama instance.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(chats_router, prefix="/api")
app.include_router(messages_router, prefix="/api")
app.include_router(models_router, prefix="/api")


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
