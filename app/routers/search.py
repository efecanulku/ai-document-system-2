from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import json

from app.database.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.models.schemas import SearchRequest, SearchResult, Document as DocumentSchema
from app.utils.auth import get_current_active_user
from app.services.gemini_service import GeminiService

router = APIRouter()
gemini_service = GeminiService()

async def search_in_chunks(query: str, user_id: int, db: Session):
    """Chunk'larda embedding tabanlı arama yap"""
    try:
        # Query embedding'i oluştur
        import google.generativeai as genai
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
        ).limit(200).all()  # En fazla 200 chunk kontrol et
        
        # Cosine similarity hesapla
        import numpy as np
        results = []
        
        for chunk in chunks:
            try:
                chunk_embedding = json.loads(chunk.embeddings)
                
                # Cosine similarity
                similarity = np.dot(query_embedding, chunk_embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(chunk_embedding)
                )
                
                if similarity > 0.3:  # Threshold
                    results.append({
                        'document_id': chunk.document_id,
                        'chunk_text': chunk.chunk_text,
                        'score': float(similarity)
                    })
            except:
                continue
        
        # En iyi 40 chunk'ı döndür
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:40]
        
    except Exception as e:
        print(f"Chunk search error: {e}")
        return []

@router.post("/", response_model=SearchResult)
async def search_documents(
    search_request: SearchRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Akıllı döküman arama"""
    try:
        # Temel sorgu
        query = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.processed == True
        )
        
        # Dosya tipi filtresi
        if search_request.document_types:
            query = query.filter(Document.file_type.in_(search_request.document_types))
        
        all_documents = query.all()
        
        if not all_documents:
            return SearchResult(documents=[], total_results=0)
        
        # Chunk bazlı arama - çok daha performanslı
        relevant_chunks = await search_in_chunks(search_request.query, current_user.id, db)
        
        # Chunk'lardan dökümanları topla
        document_scores = {}
        for chunk_data in relevant_chunks:
            doc_id = chunk_data['document_id']
            score = chunk_data['score']
            
            if doc_id in document_scores:
                document_scores[doc_id] = max(document_scores[doc_id], score)
            else:
                document_scores[doc_id] = score
        
        # En iyi skorlu dökümanları al
        sorted_doc_ids = sorted(document_scores.keys(), 
                              key=lambda x: document_scores[x], reverse=True)
        
        final_docs = []
        for doc_id in sorted_doc_ids[:search_request.limit]:
            doc = next((d for d in all_documents if d.id == doc_id), None)
            if doc:
                final_docs.append(doc)
        
        # Limit uygula
        limited_docs = final_docs[:search_request.limit]
        
        return SearchResult(
            documents=limited_docs,
            total_results=len(final_docs)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

@router.get("/suggestions")
async def get_search_suggestions(
    query: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Arama önerileri getir"""
    try:
        if len(query) < 2:
            return {"suggestions": []}
        
        # Kullanıcının dökümanlarından anahtar kelimeler topla
        documents = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.processed == True
        ).all()
        
        suggestions = set()
        query_lower = query.lower()
        
        for doc in documents:
            # Dosya adından öneriler
            if query_lower in doc.original_filename.lower():
                suggestions.add(doc.original_filename)
            
            # Anahtar kelimelerden öneriler
            if doc.keywords:
                try:
                    keywords = json.loads(doc.keywords)
                    for keyword in keywords:
                        if query_lower in keyword.lower():
                            suggestions.add(keyword)
                except:
                    pass
        
        # En fazla 10 öneri
        return {"suggestions": list(suggestions)[:10]}
        
    except Exception as e:
        return {"suggestions": []}

@router.get("/filters")
async def get_search_filters(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Arama filtreleri getir"""
    try:
        # Kullanıcının dökümanlarındaki dosya tiplerini al
        file_types = db.query(Document.file_type).filter(
            Document.user_id == current_user.id
        ).distinct().all()
        
        available_types = [ft[0] for ft in file_types if ft[0]]
        
        return {
            "file_types": available_types,
            "sort_options": [
                {"value": "upload_date", "label": "Yükleme Tarihi"},
                {"value": "filename", "label": "Dosya Adı"},
                {"value": "file_size", "label": "Dosya Boyutu"}
            ]
        }
        
    except Exception as e:
        return {"file_types": [], "sort_options": []}

@router.get("/stats")
async def get_search_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Arama istatistikleri"""
    try:
        print(f"🔍 Stats API called for user: {current_user.id} ({current_user.email})")
        
        # Debug: Check all documents in database
        all_docs = db.query(Document).all()
        print(f"📊 Total documents in database: {len(all_docs)}")
        for doc in all_docs:
            print(f"  - Doc {doc.id}: User {doc.user_id}, {doc.original_filename}, Processed: {doc.processed}")
        
        # Get user's documents
        total_docs = db.query(Document).filter(
            Document.user_id == current_user.id
        ).count()
        print(f"👤 Documents for user {current_user.id}: {total_docs}")
        
        processed_docs = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.processed == True
        ).count()
        print(f"✅ Processed documents for user {current_user.id}: {processed_docs}")
        
        # Dosya tiplerine göre dağılım
        type_distribution = {}
        file_types = db.query(
            Document.file_type,
            func.count(Document.id).label('count')
        ).filter(
            Document.user_id == current_user.id
        ).group_by(Document.file_type).all()
        
        for file_type, count in file_types:
            type_distribution[file_type] = count
        
        result = {
            "total_documents": total_docs,
            "processed_documents": processed_docs,
            "processing_rate": round((processed_docs / total_docs * 100) if total_docs > 0 else 0, 1),
            "file_type_distribution": type_distribution
        }
        
        print(f"📈 Stats result: {result}")
        return result
        
    except Exception as e:
        print(f"❌ Stats API error: {e}")
        return {
            "total_documents": 0,
            "processed_documents": 0,
            "processing_rate": 0,
            "file_type_distribution": {}
        }
