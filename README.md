# AI Döküman Yönetim Sistemi

Yapay zeka destekli akıllı döküman yönetim sistemi. Bu sistem şirketlerin belgelerini yüklemelerine, AI ile analiz etmelerine ve akıllı arama/chatbot özellikleri kullanmalarına olanak sağlar.

## Özellikler

### 🤖 Yapay Zeka Destekli
- **Google Gemini API** entegrasyonu
- Dökümanların otomatik analizi ve özetlenmesi
- Anahtar kelime çıkarma
- Vector embedding ile benzerlik araması

### 📄 Döküman Yönetimi
- **Çoklu format desteği**: PDF, Word, Excel, resimler, metin dosyaları
- **OCR teknolojisi**: Resim ve taranmış dökümanlardan metin çıkarma
- Otomatik dosya işleme ve indeksleme
- Güvenli dosya yükleme ve saklama

### 💬 AI Chatbot
- Dökümanlar hakkında doğal dil ile soru sorma
- Bağlamsal cevaplar ve kaynak referansları
- Çoklu sohbet oturumu yönetimi
- Gerçek zamanlı mesajlaşma

### 🔍 Akıllı Arama
- Anlamsal arama teknolojisi
- Dosya tipi filtreleme
- Otomatik öneri sistemi
- Hızlı ve doğru sonuçlar

### 🔐 Güvenlik
- JWT tabanlı kimlik doğrulama
- Kullanıcı bazlı veri izolasyonu
- Güvenli dosya erişimi
- Şifreleme ve hash'leme

## Kurulum

### Gereksinimler
- Python 3.8+
- Google Gemini API anahtarı
- Tesseract OCR (opsiyonel, resim işleme için)

### 1. Projeyi İndirin
```bash
git clone <repository-url>
cd DocumentManagementSystem2
```

### 2. Sanal Ortam Oluşturun
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# veya
venv\\Scripts\\activate  # Windows
```

### 3. Bağımlılıkları Yükleyin
```bash
pip install -r requirements.txt
```

### 4. Tesseract OCR Kurulumu (Opsiyonel)
**Windows:**
- [Tesseract-OCR](https://github.com/UB-Mannheim/tesseract/wiki) indirin ve kurun
- `.env` dosyasında `TESSERACT_CMD` yolunu güncelleyin

**Linux:**
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-tur
```

**Mac:**
```bash
brew install tesseract tesseract-lang
```

### 5. Ortam Değişkenlerini Ayarlayın
`.env` dosyasını düzenleyin:
```env
# Google Gemini API anahtarınızı buraya ekleyin
GEMINI_API_KEY=your-actual-gemini-api-key

# Güvenli bir secret key oluşturun
SECRET_KEY=your-super-secret-key-for-production

# Tesseract yolu (gerekirse)
TESSERACT_CMD=/usr/bin/tesseract  # Linux/Mac
# TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe  # Windows
```

### 6. Veritabanını Başlatın
```bash
python -c "from app.database.database import engine, Base; from app.models import user, document, chat; Base.metadata.create_all(bind=engine)"
```

### 7. Uygulamayı Başlatın
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Uygulama `http://localhost:8000` adresinde çalışacaktır.

## Kullanım

### 1. Hesap Oluşturma
- Ana sayfadan "Kayıt Ol" butonuna tıklayın
- Şirket bilgilerinizi ve kullanıcı hesabınızı oluşturun

### 2. Döküman Yükleme
- Dashboard'dan "Döküman Yükle" butonuna tıklayın
- Desteklenen formatlardan birini seçin (PDF, Word, Excel, resim)
- Dosya yüklendikten sonra AI otomatik olarak analiz edecektir

### 3. AI Chat Kullanımı
- "AI Chat" sekmesine gidin
- Dökümanlarınız hakkında sorular sorun
- AI size dökümanlarınızdaki bilgilere dayanarak cevap verecektir

### 4. Akıllı Arama
- "Arama" sekmesine gidin
- Aradığınız bilgiyi doğal dille yazın
- Sistem anlamsal arama ile en uygun dökümanları bulacaktır

## API Dökümantasyonu

Uygulama çalıştıktan sonra API dökümantasyonuna şu adreslerden erişebilirsiniz:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Teknoloji Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM ve veritabanı yönetimi
- **SQLite**: Hafif veritabanı çözümü
- **Google Gemini**: AI ve NLP işlemleri
- **JWT**: Kimlik doğrulama
- **Tesseract**: OCR teknolojisi

### Frontend
- **HTML5/CSS3**: Modern web standartları
- **Bootstrap 5**: Responsive UI framework
- **JavaScript (ES6+)**: İnteraktif özellikler
- **Axios**: HTTP istemcisi

### Dosya İşleme
- **PyPDF2**: PDF dosya işleme
- **python-docx**: Word dosya işleme
- **openpyxl**: Excel dosya işleme
- **Pillow**: Resim işleme
- **pytesseract**: OCR entegrasyonu

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Branch'i push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## Destek

Sorularınız için:
- GitHub Issues açabilirsiniz
- Dökümantasyonu kontrol edebilirsiniz
- API endpoint'leri için Swagger UI kullanabilirsiniz

## Sürüm Notları

### v1.0.0
- İlk sürüm
- Temel döküman yönetimi
- AI chatbot entegrasyonu
- Akıllı arama özelliği
- OCR desteği
- Kullanıcı kimlik doğrulama

---

**Not**: Bu sistem staj projesi olarak geliştirilmiştir ve production ortamında kullanmadan önce güvenlik ayarlarının gözden geçirilmesi önerilir.
