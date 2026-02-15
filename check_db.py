from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import ChatSession, ChatMessage
from backend.database import SQLALCHEMY_DATABASE_URL

# Fix for relative import issue in script execution context if needed, 
# but here we import from backend modules assuming we run from root.
# Actually, running from root requires setting PYTHONPATH.

import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from backend.database import engine, SessionLocal
from backend.models import ChatSession

db = SessionLocal()
sessions = db.query(ChatSession).all()

print(f"Total sessions found: {len(sessions)}")
for session in sessions:
    print(f"ID: {session.id}, Title: {session.title}, Created: {session.created_at}")

db.close()
