from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from fastapi.responses import FileResponse, StreamingResponse
import os
import soundfile as sf
import io
import numpy as np
from sqlalchemy.orm import Session
from database import get_db
from models import TTSHistory
import uuid
import shutil

# Try importing Kokoro, but handle potential missing dependencies or model files
try:
    from kokoro_onnx import Kokoro
    KOKORO_AVAILABLE = True
except ImportError:
    KOKORO_AVAILABLE = False
    print("Kokoro-onnx not installed.")

router = APIRouter()

# Path to models
MODEL_PATH = "models/kokoro-v0_19.onnx"
VOICES_BIN_PATH = "models/voices.bin"
VOICES_JSON_PATH = "models/voices.json"

_kokoro_instance = None

def get_kokoro():
    global _kokoro_instance
    if _kokoro_instance is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(VOICES_BIN_PATH):
            raise RuntimeError("Kokoro model files not found in models/")
        _kokoro_instance = Kokoro(MODEL_PATH, VOICES_BIN_PATH)
    return _kokoro_instance

class TTSRequest(BaseModel):
    text: str
    voice: str = "af_sarah" # Default voice
    speed: float = 1.0

@router.post("/tts")
async def generate_speech(request: TTSRequest, db: Session = Depends(get_db)):
    if not KOKORO_AVAILABLE:
         raise HTTPException(status_code=500, detail="Kokoro-onnx library not installed.")
    
    try:
        kokoro = get_kokoro()
        
        # Generate audio
        samples, sample_rate = kokoro.create(
            request.text, 
            voice=request.voice, 
            speed=request.speed, 
            lang="en-us"
        )
        
        # Save to file
        filename = f"{uuid.uuid4()}.wav"
        filepath = os.path.join("static", filename)
        sf.write(filepath, samples, sample_rate, format='WAV')

        # Save to DB
        history_item = TTSHistory(
            text=request.text,
            voice=request.voice,
            audio_path=f"/static/{filename}"
        )
        db.add(history_item)
        db.commit()
        
        # Return streaming response (reading from file or memory)
        # We can enable the user to play it immediately
        buffer = io.BytesIO()
        sf.write(buffer, samples, sample_rate, format='WAV')
        buffer.seek(0)
        
        return StreamingResponse(buffer, media_type="audio/wav")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tts/history")
async def list_tts_history(db: Session = Depends(get_db)):
    history = db.query(TTSHistory).order_by(TTSHistory.created_at.desc()).all()
    return history

@router.get("/tts/history/{history_id}")
async def get_tts_history_item(history_id: int, db: Session = Depends(get_db)):
    item = db.query(TTSHistory).filter(TTSHistory.id == history_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    return item

@router.delete("/tts/history/{history_id}")
async def delete_tts_history(history_id: int, db: Session = Depends(get_db)):
    item = db.query(TTSHistory).filter(TTSHistory.id == history_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    db.delete(item)
    db.commit()
    return {"status": "success"}

@router.get("/tts/voices")
async def list_voices():
    if not KOKORO_AVAILABLE:
        return {"voices": []}
    try:
        # voices.json is loaded by Kokoro. We can inspect it or just return hardcoded list of known voices if API doesn't expose them
        # kokoro-onnx doesn't plainly expose `get_voices` in inspection, but we can read the json file directly.
        import json
        if os.path.exists(VOICES_JSON_PATH):
            with open(VOICES_JSON_PATH, 'r') as f:
                voices_data = json.load(f)
            return {"voices": list(voices_data.keys())}
        return {"voices": ["af_sarah", "af_bella", "af_nicole", "af_sky", "am_adam", "am_michael"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
