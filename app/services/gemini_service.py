import google.generativeai as genai
import os
import json
import numpy as np
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        # embedding-001 is accessed directly via genai.embed_content
    
    async def generate_summary(self, text: str) -> str:
        """Metinden özet çıkar"""
        try:
            prompt = f"""
            Aşağıdaki metni Türkçe olarak özetle. Özet kısa, net ve önemli noktaları içermeli:
            
            {text[:4000]}  # İlk 4000 karakteri al
            """
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Summary generation error: {e}")
            return "Özet oluşturulamadı."
    
    async def extract_keywords(self, text: str) -> List[str]:
        """Metinden anahtar kelimeler çıkar"""
        try:
            prompt = f"""
            Aşağıdaki metinden en önemli anahtar kelimeleri çıkar. 
            Maksimum 10 anahtar kelime döndür, virgülle ayırarak:
            
            {text[:3000]}
            """
            
            response = self.model.generate_content(prompt)
            keywords_text = response.text.strip()
            keywords = [kw.strip() for kw in keywords_text.split(',')]
            return keywords[:10]  # Maksimum 10 anahtar kelime
        except Exception as e:
            print(f"Keywords extraction error: {e}")
            return []
    
    async def generate_embeddings(self, text: str) -> List[float]:
        """Metin için embedding vektörü oluştur"""
        try:
            # Metni parçalara böl (embedding modeli için)
            chunks = self._split_text(text, max_length=1000)
            embeddings = []
            
            for chunk in chunks:
                response = genai.embed_content(
                    model="models/embedding-001",
                    content=chunk,
                    task_type="retrieval_document"
                )
                embeddings.append(response['embedding'])
            
            # Ortalama embedding al
            if embeddings:
                avg_embedding = np.mean(embeddings, axis=0)
                return avg_embedding.tolist()
            return []
        except Exception as e:
            print(f"Embeddings generation error: {e}")
            return []
    
    async def extract_text_from_image(self, image_path: str) -> str:
        """Resimden metin çıkar (OCR) - Gemini Vision API kullanarak"""
        try:
            import base64
            
            # Resmi base64'e çevir
            with open(image_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Gemini Vision modeli kullan
            vision_model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            prompt = """
            Bu resimdeki tüm metni çıkar. Lütfen:
            1. Tüm yazıları, sayıları ve sembolleri dahil et
            2. Metni orijinal sırayla ve düzende ver
            3. Tabloları, listeleri ve yapılandırılmış verileri koru
            4. Sadece metni ver, ek yorum yapma
            5. Türkçe karakterleri doğru şekilde kullan
            """
            
            # Resim ve prompt'u birleştir
            response = vision_model.generate_content([
                prompt,
                {
                    "mime_type": "image/jpeg" if image_path.lower().endswith('.jpg') else "image/png",
                    "data": image_data
                }
            ])
            
            extracted_text = response.text.strip()
            print(f"✅ Gemini OCR başarılı: {len(extracted_text)} karakter çıkarıldı")
            return extracted_text
            
        except Exception as e:
            print(f"❌ Gemini OCR hatası: {e}")
            # Fallback olarak Tesseract kullan
            try:
                import pytesseract
                from PIL import Image
                
                print("🔄 Tesseract fallback kullanılıyor...")
                image = Image.open(image_path)
                text = pytesseract.image_to_string(image, lang='tur+eng')
                print(f"✅ Tesseract fallback başarılı: {len(text)} karakter çıkarıldı")
                return text
                
            except Exception as fallback_error:
                print(f"❌ Tesseract fallback da başarısız: {fallback_error}")
                return f"Resimden metin çıkarılamadı. Hata: {str(e)}"
    
    async def chat_with_context(self, question: str, context_documents: List[Dict]) -> str:
        """Döküman bağlamında soru cevapla - Optimize edilmiş prompt"""
        try:
            if not context_documents:
                return "Henüz sisteme döküman yüklenmemiş. Lütfen önce döküman yükleyerek sistemi eğitin."
            
            # En alakalı chunk'ları al
            relevant_chunks = []
            for doc in context_documents[:12]:  # En fazla 12 döküman kullan
                relevant_chunks.append({
                    'filename': doc.get('filename', 'Bilinmeyen'),
                    'content': doc.get('content_text', '')[:2000],  # Daha uzun içerik
                    'summary': doc.get('summary', '')
                })
            
            # Bağlam oluştur
            context = ""
            for i, chunk in enumerate(relevant_chunks, 1):
                context += f"\n[KAYNAK {i}: {chunk['filename']}]\n"
                if chunk['summary']:
                    context += f"Özet: {chunk['summary']}\n"
                context += f"İçerik: {chunk['content']}\n"
            
            prompt = f"""Sen uzman bir döküman analisti ve yardımcı asistansın. Görevin kullanıcının sorularını yalnızca verilen kaynaklardan yanıtlamaktır.

KAYNAK DÖKÜMANLAR:
{context}

KULLANICI SORUSU: {question}

YÖNERGELER:
1. Yalnızca verilen kaynaklardan alıntı yaparak cevap ver
2. Hangi kaynaktan alıntı yaptığını belirt (örn: "Kaynak 1'e göre...")
3. Eğer cevap kaynaklarda yoksa açıkça belirt
4. Kısa, net ve Türkçe yanıt ver
5. Spekülasyon yapma, sadece kaynaklardaki bilgileri kullan

CEVAP:"""
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Chat error: {e}")
            return "Üzgünüm, şu anda sorunuzu yanıtlayamıyorum."
    
    async def search_similar_documents(self, query: str, document_embeddings: List[Dict]) -> List[Dict]:
        """Query'e benzer dökümanları bul"""
        try:
            # Query embedding'i oluştur
            query_response = genai.embed_content(
                model="models/embedding-001",
                content=query,
                task_type="retrieval_query"
            )
            query_embedding = np.array(query_response['embedding'])
            
            # Benzerlik skorları hesapla
            similarities = []
            for doc in document_embeddings:
                if doc.get('embeddings'):
                    doc_embedding = np.array(json.loads(doc['embeddings']))
                    similarity = np.dot(query_embedding, doc_embedding) / (
                        np.linalg.norm(query_embedding) * np.linalg.norm(doc_embedding)
                    )
                    similarities.append((doc, similarity))
            
            # Skor'a göre sırala
            similarities.sort(key=lambda x: x[1], reverse=True)
            
            # En benzer 5 dökümanı döndür
            return [doc for doc, score in similarities[:5] if score > 0.3]
        except Exception as e:
            print(f"Search error: {e}")
            return document_embeddings[:5]  # Fallback
    
    def _split_text(self, text: str, max_length: int = 1000) -> List[str]:
        """Metni parçalara böl"""
        chunks = []
        words = text.split()
        current_chunk = []
        current_length = 0
        
        for word in words:
            if current_length + len(word) + 1 <= max_length:
                current_chunk.append(word)
                current_length += len(word) + 1
            else:
                if current_chunk:
                    chunks.append(' '.join(current_chunk))
                current_chunk = [word]
                current_length = len(word)
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
