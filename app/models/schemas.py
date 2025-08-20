from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from fastapi import UploadFile

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    company_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Document schemas
class DocumentBase(BaseModel):
    filename: str
    file_type: str

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    original_filename: str
    file_path: str
    file_size: int
    content_text: Optional[str] = None
    summary: Optional[str] = None
    keywords: Optional[str] = None
    processed: bool
    upload_date: datetime
    user_id: int
    
    class Config:
        from_attributes = True

class DocumentUpload(BaseModel):
    file: UploadFile

# Chat schemas
class ChatSessionBase(BaseModel):
    session_name: str

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSession(ChatSessionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool
    
    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    content: str

class ChatMessageCreate(ChatMessageBase):
    session_id: int

class ChatMessage(ChatMessageBase):
    id: int
    session_id: int
    message_type: str
    context_documents: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    session_id: int
    context_documents: List[int] = []

# Search schemas
class SearchRequest(BaseModel):
    query: str
    document_types: Optional[List[str]] = None
    limit: Optional[int] = 10

class SearchResult(BaseModel):
    documents: List[Document]
    total_results: int
