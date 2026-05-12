from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


# ── Message schemas ──────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    id: UUID
    chat_id: UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Chat schemas ─────────────────────────────────────────────────────────────

class ChatCreate(BaseModel):
    title: Optional[str] = "New Chat"
    model: Optional[str] = "llama3.2"


class ChatListItem(BaseModel):
    id: UUID
    title: str
    model: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatDetail(ChatListItem):
    user_id: str
    messages: List[MessageResponse] = []


# ── Send message ─────────────────────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    content: str
    model: str = "llama3.2"
