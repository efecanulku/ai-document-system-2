from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import os

from app.database.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.schemas import Document as DocumentSchema
from app.utils.auth import get_current_active_user
from app.utils.file_utils import save_upload_file, delete_file, get_file_extension
from app.services.document_processor import DocumentProcessor

router = APIRouter()
document_processor = DocumentProcessor()

@router.post("/upload", response_model=DocumentSchema)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Döküman yükle"""
    try:
        # Dosyayı kaydet
        file_path, unique_filename = await save_upload_file(file, current_user.id)
        file_extension = get_file_extension(file.filename)
        
        # Veritabanına kaydet
        document = Document(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_type=file_extension,
            file_size=os.path.getsize(file_path),
            user_id=current_user.id
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Background task olarak AI işleme başlat
        background_tasks.add_task(process_document_background, document.id, db)
        
        return document
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

async def process_document_background(document_id: int, db: Session):
    """Arka planda döküman işleme"""
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            await document_processor.process_document(document, db)
    except Exception as e:
        print(f"Background processing error: {e}")

@router.get("/", response_model=List[DocumentSchema])
async def get_user_documents(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Kullanıcının dökümanlarını listele"""
    documents = db.query(Document).filter(
        Document.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return documents

@router.get("/{document_id}", response_model=DocumentSchema)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Belirli bir dökümanı getir"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Dökümanı sil"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Dosyayı diskten sil
    delete_file(document.file_path)
    
    # Veritabanından sil
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}

@router.get("/{document_id}/content")
async def get_document_content(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Döküman içeriğini getir"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "content_text": document.content_text,
        "summary": document.summary,
        "keywords": document.keywords,
        "processed": document.processed
    }

@router.post("/{document_id}/reprocess")
async def reprocess_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Dökümanı yeniden işle"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # İşleme durumunu sıfırla
    document.processed = False
    db.commit()
    
    # Yeniden işleme başlat
    background_tasks.add_task(process_document_background, document_id, db)
    
    return {"message": "Document reprocessing started"}
