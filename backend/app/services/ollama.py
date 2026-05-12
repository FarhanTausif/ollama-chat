import json
from typing import AsyncGenerator

import httpx

from ..config import settings

_TIMEOUT = httpx.Timeout(connect=5.0, read=120.0, write=10.0, pool=10.0)


async def list_models() -> list[str]:
    """Return model names available in the local Ollama instance."""
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        try:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            resp.raise_for_status()
            data = resp.json()
            return [m["name"] for m in data.get("models", [])]
        except Exception:
            return []


async def stream_chat(
    model: str,
    messages: list[dict],
) -> AsyncGenerator[str, None]:
    """
    Stream token chunks from Ollama's /api/chat endpoint.
    Each yielded value is a raw text fragment.
    """
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
    }
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        async with client.stream(
            "POST",
            f"{settings.OLLAMA_BASE_URL}/api/chat",
            json=payload,
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    chunk = data.get("message", {}).get("content", "")
                    if chunk:
                        yield chunk
                    if data.get("done"):
                        break
                except json.JSONDecodeError:
                    continue
