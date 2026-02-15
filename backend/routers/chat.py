from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import ollama
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
from models import ChatSession, ChatMessage
import json
from fastapi.responses import StreamingResponse

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: List[Message]
    session_id: Optional[int] = None

@router.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        # 1. Handle Session
        if request.session_id:
            session = db.query(ChatSession).filter(ChatSession.id == request.session_id).first()
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
        else:
            # Create new session
            # Use first message as title (truncated)
            title = "New Chat"
            if request.messages:
                title = request.messages[0].content[:30] + "..." if len(request.messages[0].content) > 30 else request.messages[0].content
            
            session = ChatSession(title=title)
            db.add(session)
            db.commit()
            db.refresh(session)
        
        # 2. Save User Message
        user_msg_content = request.messages[-1].content
        user_message = ChatMessage(session_id=session.id, role="user", content=user_msg_content)
        db.add(user_message)
        db.commit()

        # 3. Stream Response & Save AI Message
        async def generate():
            full_response = ""
            
            # Send session_id first as a special event or metadata? 
            # Ideally clients should handle this, but for simplicity we'll just stream text 
            # and clients refresh the list. 
            # Actually, let's yield the session_id as the first chunk if it is a new session
            if not request.session_id:
                yield json.dumps({"session_id": session.id}) + "\n"

            stream = ollama.chat(
                model=request.model, 
                messages=[msg.dict() for msg in request.messages], 
                stream=True
            )
            
            for chunk in stream:
                if "message" in chunk and "content" in chunk["message"]:
                    content = chunk["message"]["content"]
                    full_response += content
                    yield content

            # Save Assistant Message after stream completes
            ai_message = ChatMessage(session_id=session.id, role="assistant", content=full_response)
            db.add(ai_message)
            db.commit()

        return StreamingResponse(generate(), media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/sessions")
async def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).order_by(ChatSession.created_at.desc()).all()
    return sessions

@router.get("/chat/sessions/{session_id}")
async def get_session_history(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    return {"session": session, "messages": messages}

@router.delete("/chat/sessions/{session_id}")
async def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    return {"status": "success"}

@router.get("/models")
async def list_models():
    try:
        models = ollama.list()
        # Filter out embedding-only models (they don't support chat)
        embedding_models = {'nomic-embed-text', 'all-minilm', 'mxbai-embed-large'}
        if models and 'models' in models:
            models['models'] = [
                m for m in models['models'] 
                if not any(embed_name in m.get('model', '').lower() for embed_name in embedding_models)
            ]
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
