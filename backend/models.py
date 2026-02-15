from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="New Chat")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String)  # "user" or "assistant"
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

class VisionHistory(Base):
    __tablename__ = "vision_history"

    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String)
    prompt = Column(Text)
    response = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class TTSHistory(Base):
    __tablename__ = "tts_history"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text)
    voice = Column(String)
    audio_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class STTHistory(Base):
    __tablename__ = "stt_history"

    id = Column(Integer, primary_key=True, index=True)
    audio_path = Column(String)
    transcript = Column(Text)
    language = Column(String)
    language_probability = Column(Float)  # Ensure Float is imported
    created_at = Column(DateTime, default=datetime.utcnow)

class TranslateHistory(Base):
    __tablename__ = "translate_history"
    id = Column(Integer, primary_key=True, index=True)
    source_text = Column(Text)
    target_language = Column(String)
    translated_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class VoiceSession(Base):
    __tablename__ = "voice_sessions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="Voice Conversation")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    messages = relationship("VoiceMessage", back_populates="session", cascade="all, delete-orphan")

class VoiceMessage(Base):
    __tablename__ = "voice_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("voice_sessions.id"))
    user_audio_path = Column(String)
    user_text = Column(Text)
    ai_text = Column(Text)
    ai_audio_path = Column(String)
    language = Column(String)
    language_probability = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("VoiceSession", back_populates="messages")
