from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from app.database.database import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.document import Document
from app.models.schemas import (
    ChatRequest, ChatResponse, ChatSession as ChatSessionSchema,
    ChatMessage as ChatMessageSchema
)
from app.utils.auth import get_current_active_user
from app.services.gemini_service import GeminiService

router = APIRouter()
gemini_service = GeminiService()

@router.post("/sessions", response_model=ChatSessionSchema)
async def create_chat_session(
    session_name: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Yeni chat oturumu oluştur"""
    session = ChatSession(
        session_name=session_name,
        user_id=current_user.id
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session

@router.get("/sessions", response_model=List[ChatSessionSchema])
async def get_chat_sessions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Kullanıcının chat oturumlarını listele"""
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id,
        ChatSession.is_active == True
    ).order_by(ChatSession.updated_at.desc()).all()
    
    return sessions

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageSchema])
async def get_chat_messages(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Chat oturumundaki mesajları getir"""
    # Oturum kontrolü
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.timestamp.asc()).all()
    
    return messages

@router.post("/", response_model=ChatResponse)
async def chat_with_ai(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """AI ile sohbet et"""
    try:
        # Session kontrolü veya oluştur
        if chat_request.session_id:
            session = db.query(ChatSession).filter(
                ChatSession.id == chat_request.session_id,
                ChatSession.user_id == current_user.id
            ).first()
            if not session:
                raise HTTPException(status_code=404, detail="Chat session not found")
        else:
            # Yeni session oluştur
            session = ChatSession(
                session_name="Yeni Sohbet",
                user_id=current_user.id
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        
        # Kullanıcı mesajını kaydet
        user_message = ChatMessage(
            session_id=session.id,
            message_type="user",
            content=chat_request.message
        )
        db.add(user_message)
        
        # Kullanıcının dökümanlarından bağlamsal olanları bul
        user_documents = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.processed == True
        ).all()
        
        # AI ile sohbet et
        context_docs = []
        relevant_doc_ids = []
        
        if user_documents:
            # Relevance scoring için döküman listesi hazırla
            doc_list = []
            for doc in user_documents:
                doc_dict = {
                    'id': doc.id,
                    'filename': doc.filename,
                    'content_text': doc.content_text or '',
                    'summary': doc.summary or '',
                    'embeddings': doc.embeddings
                }
                doc_list.append(doc_dict)
            
            # Benzer dökümanları bul
            similar_docs = await gemini_service.search_similar_documents(
                chat_request.message, doc_list
            )
            
            context_docs = similar_docs[:3]  # En benzer 3 döküman
            relevant_doc_ids = [doc['id'] for doc in context_docs]
        
        # AI yanıtı al
        ai_response = await gemini_service.chat_with_context(
            chat_request.message, context_docs
        )
        
        # AI yanıtını kaydet
        ai_message = ChatMessage(
            session_id=session.id,
            message_type="assistant",
            content=ai_response,
            context_documents=json.dumps(relevant_doc_ids)
        )
        db.add(ai_message)
        
        # Session güncelleme zamanını güncelle
        from sqlalchemy import func
        session.updated_at = func.now()
        
        db.commit()
        
        return ChatResponse(
            response=ai_response,
            session_id=session.id,
            context_documents=relevant_doc_ids
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Chat oturumunu sil"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Soft delete
    session.is_active = False
    db.commit()
    
    return {"message": "Chat session deleted successfully"}

@router.put("/sessions/{session_id}/name")
async def update_session_name(
    session_id: int,
    session_name: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Chat oturumu adını güncelle"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    session.session_name = session_name
    db.commit()
    
    return {"message": "Session name updated successfully"}
