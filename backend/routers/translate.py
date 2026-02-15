from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import ollama
from sqlalchemy.orm import Session
from database import get_db
from models import TranslateHistory

router = APIRouter()

class TranslateRequest(BaseModel):
    text: str
    target_lang: str
    model: str = "llama3.2-vision:latest" # Default model

@router.post("/translate")
async def translate_text(request: TranslateRequest, db: Session = Depends(get_db)):
    try:
        # Construct a prompt for translation
        # Llama 3 models are good at following instructions
        prompt = f"Translate the following text to {request.target_lang}. Only provide the translated text, no explanations or introductory phrases.\n\nText: {request.text}"
        
        response = ollama.chat(
            model=request.model,
            messages=[{
                'role': 'user',
                'content': prompt
            }],
            stream=False
        )
        
        response_text = response['message']['content']

        # Save to DB
        history_item = TranslateHistory(
            source_text=request.text,
            target_language=request.target_lang,
            translated_text=response_text
        )
        db.add(history_item)
        db.commit()
        
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/translate/history")
async def list_translate_history(db: Session = Depends(get_db)):
    history = db.query(TranslateHistory).order_by(TranslateHistory.created_at.desc()).all()
    return history

@router.get("/translate/history/{history_id}")
async def get_translate_history_item(history_id: int, db: Session = Depends(get_db)):
    item = db.query(TranslateHistory).filter(TranslateHistory.id == history_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    return item

@router.delete("/translate/history/{history_id}")
async def delete_translate_history(history_id: int, db: Session = Depends(get_db)):
    item = db.query(TranslateHistory).filter(TranslateHistory.id == history_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    db.delete(item)
    db.commit()
    return {"status": "success"}

