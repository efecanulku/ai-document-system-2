import os
import json
import io
from typing import Optional
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from docx import Document as DocxDocument
import openpyxl
from sqlalchemy.orm import Session

from app.models.document import Document, DocumentChunk
from app.services.gemini_service import GeminiService

class DocumentProcessor:
    def __init__(self):
        self.gemini_service = GeminiService()
        # Tesseract path'ini ayarla (Windows için)
        tesseract_cmd = os.getenv("TESSERACT_CMD", "tesseract")
        if os.name == 'nt' and tesseract_cmd == "tesseract":
            # Windows için varsayılan path
            possible_paths = [
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
            ]
            for path in possible_paths:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    break
    
    async def process_document(self, document: Document, db: Session) -> bool:
        """Dökümanı işle ve AI analizi yap"""
        try:
            # İçeriği çıkar
            content_text = await self.extract_text_content(document.file_path, document.file_type)
            
            if not content_text:
                print(f"No content extracted from {document.filename}")
                return False
            
            # AI analizi yap
            summary = await self.gemini_service.generate_summary(content_text)
            keywords = await self.gemini_service.extract_keywords(content_text)
            embeddings = await self.gemini_service.generate_embeddings(content_text)
            
            # Veritabanını güncelle - Tüm içerik kaydet
            document.content_text = content_text  # Tüm içerik, truncate yok
            document.summary = summary
            document.keywords = json.dumps(keywords, ensure_ascii=False)
            document.embeddings = json.dumps(embeddings)
            document.processed = True
            
            # Dökümanı parçalara böl ve kaydet
            await self.create_document_chunks(document, content_text, db)
            
            db.commit()
            return True
            
        except Exception as e:
            print(f"Document processing error for {document.filename}: {e}")
            db.rollback()
            return False
    
    async def extract_text_content(self, file_path: str, file_type: str) -> Optional[str]:
        """Dosyadan metin içeriği çıkar"""
        try:
            if file_type.lower() == "pdf":
                return await self._extract_pdf_text(file_path)
            elif file_type.lower() in ["docx", "doc"]:
                return await self._extract_docx_text(file_path)
            elif file_type.lower() in ["xlsx", "xls"]:
                return await self._extract_excel_text(file_path)
            elif file_type.lower() in ["jpg", "jpeg", "png", "gif", "bmp", "tiff"]:
                return await self._extract_image_text(file_path)
            elif file_type.lower() == "txt":
                return await self._extract_txt_text(file_path)
            else:
                return None
        except Exception as e:
            print(f"Text extraction error: {e}")
            return None
    
    async def _extract_pdf_text(self, file_path: str) -> str:
        """PDF'den metin çıkar - PyMuPDF ile optimize edilmiş"""
        text = ""
        try:
            pdf_document = fitz.open(file_path)
            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num]
                page_text = page.get_text()
                if page_text.strip():
                    text += page_text + "\n"
                else:
                    # Eğer metin yoksa OCR dene
                    pix = page.get_pixmap()
                    img_data = pix.tobytes("png")
                    try:
                        ocr_text = pytesseract.image_to_string(Image.open(io.BytesIO(img_data)), lang='tur+eng')
                        text += ocr_text + "\n"
                    except:
                        pass
            pdf_document.close()
        except Exception as e:
            print(f"PDF extraction error: {e}")
        return text.strip()
    
    async def _extract_docx_text(self, file_path: str) -> str:
        """DOCX dosyasından metin çıkar"""
        doc = DocxDocument(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    
    async def _extract_excel_text(self, file_path: str) -> str:
        """Excel dosyasından metin çıkar"""
        workbook = openpyxl.load_workbook(file_path, data_only=True)
        text = ""
        
        for sheet_name in workbook.sheetnames:
            sheet = workbook[sheet_name]
            text += f"\n--- {sheet_name} ---\n"
            
            for row in sheet.iter_rows(values_only=True):
                row_text = " | ".join([str(cell) if cell is not None else "" for cell in row])
                if row_text.strip():
                    text += row_text + "\n"
        
        return text.strip()
    
    async def _extract_image_text(self, file_path: str) -> str:
        """Resimden OCR ile metin çıkar"""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image, lang='tur+eng')
            return text.strip()
        except Exception as e:
            print(f"OCR error: {e}")
            return ""
    
    async def _extract_txt_text(self, file_path: str) -> str:
        """TXT dosyasından metin çıkar"""
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    
    async def create_document_chunks(self, document: Document, content_text: str, db: Session):
        """Dökümanı parçalara böl ve kaydet - Optimize edilmiş"""
        chunks = self._split_text_into_chunks(content_text, chunk_size=1200, overlap=250)
        
        # Batch processing için chunks'ları grupla
        batch_size = 5
        for i in range(0, len(chunks), batch_size):
            batch_chunks = chunks[i:i+batch_size]
            
            for j, chunk_text in enumerate(batch_chunks):
                chunk_index = i + j
                
                # Her parça için embedding oluştur
                chunk_embeddings = await self.gemini_service.generate_embeddings(chunk_text)
                
                chunk = DocumentChunk(
                    document_id=document.id,
                    chunk_text=chunk_text,
                    chunk_index=chunk_index,
                    embeddings=json.dumps(chunk_embeddings)
                )
                db.add(chunk)
            
            # Batch'i commit et
            db.commit()
    
    def _split_text_into_chunks(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> list:
        """Metni overlapping parçalara böl"""
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Kelime ortasında kesmemek için
            if end < len(text) and not text[end].isspace():
                last_space = chunk.rfind(' ')
                if last_space > 0:
                    chunk = chunk[:last_space]
                    end = start + last_space
            
            chunks.append(chunk.strip())
            start = end - overlap
            
            if start >= len(text):
                break
        
        return [chunk for chunk in chunks if chunk.strip()]
