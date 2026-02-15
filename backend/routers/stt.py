from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
import shutil
import os
import tempfile
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models import STTHistory
import uuid

# Try importing faster_whisper
try:
    from faster_whisper import WhisperModel
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    print("faster-whisper not installed.")

router = APIRouter()

# Initialize model lazily to avoid startup delay or if not installed
_model_instance = None
MODEL_SIZE = "tiny" # or "base", "small", "medium", "large-v3" based on hardware
DEVICE = "cpu" # or "cuda"
COMPUTE_TYPE = "int8" # or "float16" for cuda

def get_model():
    global _model_instance
    if _model_instance is None:
        if not WHISPER_AVAILABLE:
             raise RuntimeError("faster-whisper library not installed.")
        print(f"Loading Faster-Whisper model: {MODEL_SIZE} on {DEVICE}...")
        _model_instance = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
        print("Faster-Whisper model loaded.")
    return _model_instance

@router.post("/stt")
async def transcribe_audio(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not WHISPER_AVAILABLE:
        raise HTTPException(status_code=500, detail="faster-whisper library not installed.")

    temp_file_path = ""
    saved_filepath = ""
    try:
        # Save uploaded file to static for history
        file_ext = os.path.splitext(file.filename)[1] or ".wav"
        filename = f"{uuid.uuid4()}{file_ext}"
        saved_filepath = os.path.join("static", filename)
        
        with open(saved_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Also need a temp path for whisper? actually we can just use the static path now!
        # But let's verify if whisper needs a closed file. It usually takes a path.
        
        model = get_model()
        
        # Transcribe
        segments, info = model.transcribe(saved_filepath, beam_size=5)
        
        # Collect text from segments
        full_text = "".join([segment.text for segment in segments])
        
        # Save to DB
        history_item = STTHistory(
            audio_path=f"/static/{filename}",
            transcript=full_text.strip(),
            language=info.language,
            language_probability=info.language_probability
        )
        db.add(history_item)
        db.commit()

        return {
            "text": full_text.strip(),
            "language": info.language,
            "language_probability": info.language_probability
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    # finally:
        # No need to cleanup temp file as we are saving it for history
        # pass

@router.get("/stt/history")
async def list_stt_history(db: Session = Depends(get_db)):
    history = db.query(STTHistory).order_by(STTHistory.created_at.desc()).all()
    return history

@router.get("/stt/history/{history_id}")
async def get_stt_history_item(history_id: int, db: Session = Depends(get_db)):
    item = db.query(STTHistory).filter(STTHistory.id == history_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    return item

@router.delete("/stt/history/{history_id}")
async def delete_stt_history(history_id: int, db: Session = Depends(get_db)):
    item = db.query(STTHistory).filter(STTHistory.id == history_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    db.delete(item)
    db.commit()
    return {"status": "success"}


