import os
import uuid
from typing import List, Optional
from fastapi import UploadFile, HTTPException
import aiofiles
from pathlib import Path

ALLOWED_EXTENSIONS = {
    "pdf": ["application/pdf"],
    "docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    "doc": ["application/msword"],
    "xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    "xls": ["application/vnd.ms-excel"],
    "jpg": ["image/jpeg"],
    "jpeg": ["image/jpeg"],
    "png": ["image/png"],
    "gif": ["image/gif"],
    "bmp": ["image/bmp"],
    "tiff": ["image/tiff"],
    "txt": ["text/plain"]
}

UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def get_file_extension(filename: str) -> str:
    """Dosya uzantısını al"""
    return filename.split(".")[-1].lower()

def is_allowed_file(file_content: bytes, filename: str) -> bool:
    """Dosya tipinin izin verilen tiplerden olup olmadığını kontrol et"""
    file_ext = get_file_extension(filename)
    if file_ext not in ALLOWED_EXTENSIONS:
        return False
    
    # Basit dosya header kontrolü
    return _check_file_header(file_content, file_ext)

def _check_file_header(file_content: bytes, file_ext: str) -> bool:
    """Dosya header'ını kontrol ederek dosya tipini doğrula"""
    if len(file_content) < 10:
        return False
    
    # Basit magic number kontrolü
    header = file_content[:10]
    
    if file_ext == "pdf":
        return header.startswith(b'%PDF')
    elif file_ext in ["jpg", "jpeg"]:
        return header.startswith(b'\xff\xd8\xff')
    elif file_ext == "png":
        return header.startswith(b'\x89PNG')
    elif file_ext == "gif":
        return header.startswith(b'GIF8')
    elif file_ext in ["docx", "xlsx"]:
        return header.startswith(b'PK')  # ZIP file signature
    elif file_ext == "txt":
        # Text dosyalar için UTF-8 kontrolü
        try:
            file_content[:100].decode('utf-8')
            return True
        except UnicodeDecodeError:
            return False
    else:
        # Diğer format için genel kabul
        return True

def generate_unique_filename(original_filename: str) -> str:
    """Benzersiz dosya adı oluştur"""
    file_ext = get_file_extension(original_filename)
    unique_id = str(uuid.uuid4())
    return f"{unique_id}.{file_ext}"

async def save_upload_file(upload_file: UploadFile, user_id: int) -> tuple[str, str]:
    """Yüklenen dosyayı kaydet"""
    # Dosya boyutunu kontrol et
    contents = await upload_file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    # Dosya tipini kontrol et
    if not is_allowed_file(contents, upload_file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Kullanıcı klasörünü oluştur
    user_dir = Path(UPLOAD_DIR) / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    
    # Benzersiz dosya adı oluştur
    unique_filename = generate_unique_filename(upload_file.filename)
    file_path = user_dir / unique_filename
    
    # Dosyayı kaydet
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(contents)
    
    return str(file_path), unique_filename

def delete_file(file_path: str) -> bool:
    """Dosyayı sil"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False

def get_file_size(file_path: str) -> int:
    """Dosya boyutunu al"""
    try:
        return os.path.getsize(file_path)
    except Exception:
        return 0
