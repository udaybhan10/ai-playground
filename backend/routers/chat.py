from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import ollama
from typing import List, Dict

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: List[Message]

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = ollama.chat(model=request.model, messages=[msg.dict() for msg in request.messages], stream=False)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def list_models():
    try:
        models = ollama.list()
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
