from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..middleware.clerk_auth import get_current_user
from ..models.chat import Chat
from ..schemas.chat import ChatCreate, ChatDetail, ChatListItem

router = APIRouter(prefix="/chats", tags=["chats"])


@router.get("/", response_model=List[ChatListItem])
async def list_chats(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Return all chats for the authenticated user, newest first."""
    return (
        db.query(Chat)
        .filter(Chat.user_id == user_id)
        .order_by(Chat.updated_at.desc())
        .all()
    )


@router.post("/", response_model=ChatDetail, status_code=201)
async def create_chat(
    payload: ChatCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Create a new chat session."""
    chat = Chat(
        user_id=user_id,
        title=payload.title or "New Chat",
        model=payload.model or "llama3.2",
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


@router.get("/{chat_id}", response_model=ChatDetail)
async def get_chat(
    chat_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Fetch a single chat with all its messages."""
    chat = (
        db.query(Chat)
        .filter(Chat.id == chat_id, Chat.user_id == user_id)
        .first()
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.patch("/{chat_id}/title", response_model=ChatListItem)
async def update_title(
    chat_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Update the chat title."""
    chat = (
        db.query(Chat)
        .filter(Chat.id == chat_id, Chat.user_id == user_id)
        .first()
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if "title" in payload:
        chat.title = payload["title"]
        db.commit()
        db.refresh(chat)
    return chat


@router.delete("/{chat_id}", status_code=204)
async def delete_chat(
    chat_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Permanently delete a chat and all its messages."""
    chat = (
        db.query(Chat)
        .filter(Chat.id == chat_id, Chat.user_id == user_id)
        .first()
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    db.delete(chat)
    db.commit()
