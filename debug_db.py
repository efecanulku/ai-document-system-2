#!/usr/bin/env python3
"""Debug database contents"""

from app.database.database import SessionLocal
from app.models.document import Document
from app.models.user import User

def debug_database():
    db = SessionLocal()
    try:
        # Check users
        users = db.query(User).all()
        print(f"Users: {len(users)}")
        for user in users:
            print(f"User ID: {user.id}, Email: {user.email}")
        
        # Check documents
        docs = db.query(Document).all()
        print(f"\nTotal Documents: {len(docs)}")
        for doc in docs:
            print(f"Doc ID: {doc.id}, User ID: {doc.user_id}, Filename: {doc.original_filename}, Processed: {doc.processed}")
        
        # Check specific user documents
        if users:
            user_id = users[0].id
            user_docs = db.query(Document).filter(Document.user_id == user_id).all()
            print(f"\nDocuments for User {user_id}: {len(user_docs)}")
            for doc in user_docs:
                print(f"  - {doc.original_filename} (Processed: {doc.processed})")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_database()
