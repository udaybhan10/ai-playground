from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
import ollama
import base64
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
from models import VisionHistory
import os
import shutil
import uuid

router = APIRouter()

@router.post("/vision")
async def analyze_image(
    file: UploadFile = File(...),
    prompt: str = Form("Describe this image"),
    model: str = Form("llama3.2-vision"),
    db: Session = Depends(get_db)
):
    try:
        # Save image to static folder
        file_ext = os.path.splitext(file.filename)[1] or ".jpg"
        filename = f"{uuid.uuid4()}{file_ext}"
        filepath = os.path.join("static", filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Re-read file for Ollama (since we consumed the stream, or just read from disk)
        with open(filepath, "rb") as f:
            image_content = f.read()

        # Call Ollama with the image
        response = ollama.chat(
            model=model,
            messages=[{
                'role': 'user',
                'content': prompt,
                'images': [image_content]
            }]
        )
        
        response_text = response['message']['content']

        # Save to DB
        history_item = VisionHistory(
            image_path=f"/static/{filename}",
            prompt=prompt,
            response=response_text
        )
        db.add(history_item)
        db.commit()
        db.refresh(history_item)
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vision/history")
async def list_vision_history(db: Session = Depends(get_db)):
    history = db.query(VisionHistory).order_by(VisionHistory.created_at.desc()).all()
    return history

@router.get("/vision/history/{history_id}")
async def get_vision_history_item(history_id: int, db: Session = Depends(get_db)):
    item = db.query(VisionHistory).filter(VisionHistory.id == history_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    return item

@router.delete("/vision/history/{history_id}")
async def delete_vision_history(history_id: int, db: Session = Depends(get_db)):
    item = db.query(VisionHistory).filter(VisionHistory.id == history_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    
    # Optional: Delete file from disk
    # if item.image_path:
    #     file_path = item.image_path.lstrip('/')
    #     if os.path.exists(file_path):
    #         os.remove(file_path)

    db.delete(item)
    db.commit()
    return {"status": "success"}

@router.get("/vision/models")
async def list_vision_models():
    # In a real scenario, we might want to filter for models that support vision
    # For now, we'll just return all models or a hardcoded list of known vision models
    # if we want to be specific.
    try:
        models = ollama.list()
        # Simple heuristic: prioritize known vision models if present, otherwise return all
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
