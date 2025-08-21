from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from app.database.database import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.document import Document, DocumentChunk
from app.models.schemas import (
    ChatRequest, ChatResponse, ChatSession as ChatSessionSchema,
    ChatMessage as ChatMessageSchema
)
from app.utils.auth import get_current_active_user
from app.services.gemini_service import GeminiService

router = APIRouter()
gemini_service = GeminiService()

async def get_relevant_chunks_for_chat(query: str, user_id: int, db: Session):
    """Chat için en alakalı chunk'ları bul"""
    try:
        # Query embedding'i oluştur
        import google.generativeai as genai
        import numpy as np
        import json
        
        query_response = genai.embed_content(
            model="models/embedding-001",
            content=query,
            task_type="retrieval_query"
        )
        query_embedding = query_response['embedding']
        
        # Kullanıcının tüm chunk'larını al
        chunks = db.query(DocumentChunk).join(Document).filter(
            Document.user_id == user_id,
            DocumentChunk.embeddings.isnot(None)
        ).all()
        
        # Cosine similarity hesapla
        results = []
        for chunk in chunks:
            try:
                chunk_embedding = json.loads(chunk.embeddings)
                similarity = np.dot(query_embedding, chunk_embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(chunk_embedding)
                )
                
                if similarity > 0.4:  # Chat için daha yüksek threshold
                    results.append({
                        'document_id': chunk.document_id,
                        'chunk_text': chunk.chunk_text,
                        'score': float(similarity)
                    })
            except:
                continue
        
        # En iyi chunk'ları döndür
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:10]  # Chat için en iyi 10 chunk
        
    except Exception as e:
        print(f"Chat chunk search error: {e}")
        return []

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
        
        # Chunk bazlı context arama - çok daha etkili
        relevant_chunks = await get_relevant_chunks_for_chat(
            chat_request.message, current_user.id, db
        )
        
        # Context'i chunk'lardan oluştur
        context_docs = []
        relevant_doc_ids = set()
        
        for chunk_data in relevant_chunks[:5]:  # En iyi 5 chunk
            doc = db.query(Document).filter(Document.id == chunk_data['document_id']).first()
            if doc:
                context_docs.append({
                    'filename': doc.original_filename,
                    'content_text': chunk_data['chunk_text'],  # Chunk text kullan
                    'summary': doc.summary or '',
                    'chunk_score': chunk_data['score']
                })
                relevant_doc_ids.add(doc.id)
        
        relevant_doc_ids = list(relevant_doc_ids)
        
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
