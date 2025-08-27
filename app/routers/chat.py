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
        print(f"🔍 Chat search query: '{query}' for user {user_id}")
        
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
        
        print(f"📊 Found {len(chunks)} chunks for user {user_id}")
        
        # Cosine similarity hesapla
        results = []
        for chunk in chunks:
            try:
                chunk_embedding = json.loads(chunk.embeddings)
                similarity = np.dot(query_embedding, chunk_embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(chunk_embedding)
                )
                
                # Debug: Tüm chunk'ları logla
                if "sürdürülebilirlik" in chunk.chunk_text.lower() or "endeks" in chunk.chunk_text.lower():
                    print(f"🎯 Found relevant chunk: {chunk.chunk_text[:100]}... (similarity: {similarity:.3f})")
                
                if similarity > 0.15:  # Çok düşük threshold - tüm chunk'ları bul
                    results.append({
                        'document_id': chunk.document_id,
                        'chunk_text': chunk.chunk_text,
                        'chunk_index': chunk.chunk_index,
                        'score': float(similarity)
                    })
            except Exception as e:
                print(f"❌ Error processing chunk: {e}")
                continue
        
        print(f"✅ Found {len(results)} chunks above threshold 0.15")
        
        # Eğer embedding ile yeterli sonuç bulunamadıysa, keyword search yap
        if len(results) < 5:
            print("🔍 Embedding results insufficient, trying keyword search...")
            keyword_results = self._keyword_search_in_chunks(query, chunks)
            results.extend(keyword_results)
            print(f"🔍 Keyword search added {len(keyword_results)} results")
        
        # En iyi chunk'ları döndür ve komşu chunk'ları ekle
        results.sort(key=lambda x: x['score'], reverse=True)
        top_results = results[:50]  # Top 50 sonucu al
        
        # Komşu chunk'ları bul ve ekle
        enhanced_results = []
        for result in top_results[:12]:  # En iyi 12 chunk'ı işle
            enhanced_results.append(result)
            
            # Komşu chunk'ları bul (chunk_index ±1)
            document_id = result['document_id']
            chunk_index = result['chunk_index']
            
            neighbor_chunks = db.query(DocumentChunk).filter(
                DocumentChunk.document_id == document_id,
                DocumentChunk.chunk_index.in_([chunk_index - 1, chunk_index + 1])
            ).all()
            
            for neighbor in neighbor_chunks:
                if neighbor.embeddings:
                    try:
                        neighbor_embedding = json.loads(neighbor.embeddings)
                        neighbor_similarity = np.dot(query_embedding, neighbor_embedding) / (
                            np.linalg.norm(query_embedding) * np.linalg.norm(neighbor_embedding)
                        )
                        
                        enhanced_results.append({
                            'document_id': neighbor.document_id,
                            'chunk_text': neighbor.chunk_text,
                            'chunk_index': neighbor.chunk_index,
                            'score': float(neighbor_similarity)
                        })
                    except:
                        continue
        
        # Duplicate'leri kaldır ve en iyi 12'yi döndür
        seen = set()
        final_results = []
        for result in enhanced_results:
            key = (result['document_id'], result['chunk_index'])
            if key not in seen:
                seen.add(key)
                final_results.append(result)
                if len(final_results) >= 12:
                    break
        
        return final_results
        
    except Exception as e:
        print(f"Chat chunk search error: {e}")
        return []
    
    def _keyword_search_in_chunks(self, query: str, chunks: List[DocumentChunk]) -> List[dict]:
        """Keyword tabanlı chunk arama (fallback)"""
        try:
            query_lower = query.lower()
            keyword_results = []
            
            for chunk in chunks:
                chunk_text_lower = chunk.chunk_text.lower()
                
                # Query'deki kelimeleri chunk'ta ara
                query_words = query_lower.split()
                match_score = 0
                
                for word in query_words:
                    if word in chunk_text_lower:
                        match_score += 1
                
                # Eğer en az 2 kelime eşleşiyorsa ekle
                if match_score >= 2:
                    keyword_results.append({
                        'document_id': chunk.document_id,
                        'chunk_text': chunk.chunk_text,
                        'chunk_index': chunk.chunk_index,
                        'score': 0.5 + (match_score * 0.1)  # Keyword match score
                    })
            
            return keyword_results[:20]  # En fazla 20 keyword result
            
        except Exception as e:
            print(f"Keyword search error: {e}")
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

@router.post("/reprocess-documents", response_model=dict)
async def reprocess_all_documents(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Tüm dökümanları yeni chunk ayarlarıyla yeniden işle"""
    try:
        from app.services.document_processor import DocumentProcessor
        
        # Mevcut chunk'ları sil
        chunks_deleted = db.query(DocumentChunk).join(Document).filter(
            Document.user_id == current_user.id
        ).delete()
        
        # Dökümanları yeniden işle
        processor = DocumentProcessor()
        documents = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.processed == True
        ).all()
        
        reprocessed_count = 0
        for doc in documents:
            try:
                doc.processed = False
                await processor.process_document(doc, db)
                reprocessed_count += 1
            except Exception as e:
                print(f"Error reprocessing document {doc.id}: {e}")
        
        db.commit()
        
        return {
            "message": f"Successfully reprocessed {reprocessed_count} documents",
            "chunks_deleted": chunks_deleted,
            "documents_reprocessed": reprocessed_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

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
        
        print(f"🎯 Using top {len(relevant_chunks)} chunks for context")
        
        # En iyi 12 chunk'ı kullan (daha fazla context)
        for chunk_data in relevant_chunks[:12]:
            doc = db.query(Document).filter(Document.id == chunk_data['document_id']).first()
            if doc:
                context_docs.append({
                    'filename': doc.original_filename,
                    'content_text': chunk_data['chunk_text'],  # Chunk text kullan
                    'summary': doc.summary or '',
                    'chunk_score': chunk_data['score']
                })
                relevant_doc_ids.add(doc.id)
                
                # Debug: Hangi chunk'ların kullanıldığını logla
                if "sürdürülebilirlik" in chunk_data['chunk_text'].lower() or "endeks" in chunk_data['chunk_text'].lower():
                    print(f"📄 Using chunk with 'sürdürülebilirlik endeks': {chunk_data['chunk_text'][:100]}...")
        
        relevant_doc_ids = list(relevant_doc_ids)
        print(f"📚 Total context documents: {len(context_docs)}")
        print(f"📊 Context chunks total length: {sum(len(doc['content_text']) for doc in context_docs)} characters")
        
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
