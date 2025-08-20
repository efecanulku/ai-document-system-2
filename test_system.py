#!/usr/bin/env python3
"""
AI Döküman Yönetim Sistemi Test Script
Bu script sistem gereksinimlerini kontrol eder ve temel testleri çalıştırır.
"""

import sys
import os
import importlib
from pathlib import Path

def check_python_version():
    """Python versiyonunu kontrol et"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python 3.8+ gerekli. Mevcut versiyon: {version.major}.{version.minor}")
        return False
    print(f"✅ Python versiyonu: {version.major}.{version.minor}.{version.micro}")
    return True

def check_dependencies():
    """Gerekli paketleri kontrol et"""
    required_packages = [
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'python-jose',
        'passlib',
        'python-dotenv',
        'google.generativeai',
        'pytesseract',
        'PIL',
        'PyPDF2',
        'docx',
        'openpyxl',
        'requests',
        'aiofiles'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            importlib.import_module(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} bulunamadı")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\nEksik paketler: {', '.join(missing_packages)}")
        print("Yüklemek için: pip install -r requirements.txt")
        return False
    
    return True

def check_environment():
    """Ortam değişkenlerini kontrol et"""
    env_file = Path('.env')
    if not env_file.exists():
        print("❌ .env dosyası bulunamadı")
        print("Lütfen .env.example dosyasını .env olarak kopyalayın ve düzenleyin")
        return False
    
    print("✅ .env dosyası mevcut")
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    required_vars = ['SECRET_KEY', 'GEMINI_API_KEY']
    missing_vars = []
    
    for var in required_vars:
        value = os.getenv(var)
        if not value or value == f'your-{var.lower().replace("_", "-")}-here':
            missing_vars.append(var)
            print(f"❌ {var} ayarlanmamış")
        else:
            print(f"✅ {var} ayarlanmış")
    
    if missing_vars:
        print("\nEksik ortam değişkenleri:")
        print("- SECRET_KEY: Güvenli bir secret key oluşturun")
        print("- GEMINI_API_KEY: Google Gemini API anahtarınızı girin")
        return False
    
    return True

def check_directories():
    """Gerekli dizinleri kontrol et"""
    required_dirs = ['uploads', 'static', 'templates', 'app']
    
    for dir_name in required_dirs:
        dir_path = Path(dir_name)
        if not dir_path.exists():
            print(f"❌ {dir_name} dizini bulunamadı")
            return False
        print(f"✅ {dir_name} dizini mevcut")
    
    return True

def test_database():
    """Veritabanı bağlantısını test et"""
    try:
        from app.database.database import engine, Base
        from app.models import user, document, chat
        
        # Test database connection
        with engine.connect() as conn:
            print("✅ Veritabanı bağlantısı başarılı")
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("✅ Veritabanı tabloları oluşturuldu")
        
        return True
    except Exception as e:
        print(f"❌ Veritabanı hatası: {e}")
        return False

def test_api_import():
    """API import'larını test et"""
    try:
        from app.main import app
        print("✅ FastAPI uygulaması import edildi")
        
        from app.routers import auth, documents, chat, search
        print("✅ Router'lar import edildi")
        
        from app.services import GeminiService, DocumentProcessor
        print("✅ AI servisleri import edildi")
        
        return True
    except Exception as e:
        print(f"❌ Import hatası: {e}")
        return False

def test_gemini_api():
    """Gemini API bağlantısını test et"""
    try:
        import google.generativeai as genai
        import os
        
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key or api_key == 'your-gemini-api-key-here':
            print("❌ Gemini API anahtarı ayarlanmamış")
            return False
        
        genai.configure(api_key=api_key)
        
        # Test basic functionality
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content("Test mesajı")
        
        if response.text:
            print("✅ Gemini API bağlantısı başarılı")
            return True
        else:
            print("❌ Gemini API'den yanıt alınamadı")
            return False
            
    except Exception as e:
        print(f"❌ Gemini API hatası: {e}")
        return False

def run_tests():
    """Tüm testleri çalıştır"""
    print("🚀 AI Döküman Yönetim Sistemi Test Başlatılıyor...\n")
    
    tests = [
        ("Python Versiyonu", check_python_version),
        ("Bağımlılıklar", check_dependencies),
        ("Ortam Değişkenleri", check_environment),
        ("Dizin Yapısı", check_directories),
        ("Veritabanı", test_database),
        ("API Import", test_api_import),
        ("Gemini API", test_gemini_api),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n📋 {test_name} Kontrolü:")
        print("-" * 40)
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} testi sırasında hata: {e}")
            results.append((test_name, False))
    
    # Sonuçları özetle
    print("\n" + "="*50)
    print("📊 TEST SONUÇLARI")
    print("="*50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ BAŞARILI" if result else "❌ BAŞARISIZ"
        print(f"{test_name:20} : {status}")
    
    print(f"\nToplam: {passed}/{total} test başarılı")
    
    if passed == total:
        print("\n🎉 Tüm testler başarılı! Sistem hazır.")
        print("\nSistemi başlatmak için:")
        print("uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return True
    else:
        print(f"\n⚠️  {total - passed} test başarısız. Sorunları çözün ve tekrar deneyin.")
        return False

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
