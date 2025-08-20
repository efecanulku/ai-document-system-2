#!/usr/bin/env python3
"""
AI Döküman Yönetim Sistemi Server Başlatıcı
"""

import uvicorn
import os
from pathlib import Path

def check_setup():
    """Temel kurulum kontrolü"""
    if not Path('.env').exists():
        print("❌ .env dosyası bulunamadı!")
        print("Lütfen .env.example dosyasını .env olarak kopyalayın ve düzenleyin.")
        return False
    
    # Upload dizinini oluştur
    upload_dir = Path('uploads')
    upload_dir.mkdir(exist_ok=True)
    
    return True

def main():
    if not check_setup():
        return
    
    print("🚀 AI Döküman Yönetim Sistemi Başlatılıyor...")
    print("📍 Server: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("🛑 Durdurmak için: Ctrl+C")
    print("-" * 50)
    
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            reload_dirs=["app", "templates", "static"],
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server durduruldu.")
    except Exception as e:
        print(f"❌ Server başlatılırken hata: {e}")

if __name__ == "__main__":
    main()
