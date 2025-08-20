from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.database.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.schemas import SearchRequest, SearchResult, Document as DocumentSchema
from app.utils.auth import get_current_active_user
from app.services.gemini_service import GeminiService

router = APIRouter()
gemini_service = GeminiService()

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
        
        # Basit metin araması
        text_filtered_docs = []
        search_terms = search_request.query.lower().split()
        
        for doc in all_documents:
            doc_text = ""
            if doc.content_text:
                doc_text += doc.content_text.lower()
            if doc.summary:
                doc_text += " " + doc.summary.lower()
            if doc.keywords:
                try:
                    keywords = json.loads(doc.keywords)
                    doc_text += " " + " ".join(keywords).lower()
                except:
                    pass
            
            # Temel skorlama
            score = 0
            for term in search_terms:
                if term in doc_text:
                    score += doc_text.count(term)
            
            if score > 0:
                text_filtered_docs.append((doc, score))
        
        # AI tabanlı benzerlik araması
        if text_filtered_docs:
            # Döküman listesini hazırla
            doc_list = []
            for doc, _ in text_filtered_docs:
                doc_dict = {
                    'id': doc.id,
                    'filename': doc.filename,
                    'content_text': doc.content_text or '',
                    'summary': doc.summary or '',
                    'embeddings': doc.embeddings
                }
                doc_list.append(doc_dict)
            
            # AI ile benzer dökümanları bul
            similar_docs = await gemini_service.search_similar_documents(
                search_request.query, doc_list
            )
            
            # Sonuçları birleştir
            ai_doc_ids = [doc['id'] for doc in similar_docs]
            final_docs = []
            
            # Önce AI sonuçları
            for doc_dict in similar_docs:
                doc = next((d for d, _ in text_filtered_docs if d.id == doc_dict['id']), None)
                if doc and doc not in final_docs:
                    final_docs.append(doc)
            
            # Sonra metin arama sonuçları
            text_filtered_docs.sort(key=lambda x: x[1], reverse=True)
            for doc, score in text_filtered_docs:
                if doc.id not in ai_doc_ids and doc not in final_docs:
                    final_docs.append(doc)
        else:
            # Sadece AI araması
            doc_list = []
            for doc in all_documents:
                doc_dict = {
                    'id': doc.id,
                    'filename': doc.filename,
                    'content_text': doc.content_text or '',
                    'summary': doc.summary or '',
                    'embeddings': doc.embeddings
                }
                doc_list.append(doc_dict)
            
            similar_docs = await gemini_service.search_similar_documents(
                search_request.query, doc_list
            )
            
            final_docs = []
            for doc_dict in similar_docs:
                doc = next((d for d in all_documents if d.id == doc_dict['id']), None)
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
        total_docs = db.query(Document).filter(
            Document.user_id == current_user.id
        ).count()
        
        processed_docs = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.processed == True
        ).count()
        
        # Dosya tiplerine göre dağılım
        type_distribution = {}
        file_types = db.query(
            Document.file_type,
            db.func.count(Document.id).label('count')
        ).filter(
            Document.user_id == current_user.id
        ).group_by(Document.file_type).all()
        
        for file_type, count in file_types:
            type_distribution[file_type] = count
        
        return {
            "total_documents": total_docs,
            "processed_documents": processed_docs,
            "processing_rate": round((processed_docs / total_docs * 100) if total_docs > 0 else 0, 1),
            "file_type_distribution": type_distribution
        }
        
    except Exception as e:
        return {
            "total_documents": 0,
            "processed_documents": 0,
            "processing_rate": 0,
            "file_type_distribution": {}
        }
