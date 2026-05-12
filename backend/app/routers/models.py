from fastapi import APIRouter, Depends

from ..middleware.clerk_auth import get_current_user
from ..services.ollama import list_models

router = APIRouter(prefix="/models", tags=["models"])


@router.get("/")
async def get_models(user_id: str = Depends(get_current_user)):
    """Return the list of locally available Ollama models."""
    models = await list_models()
    return {"models": models}
