from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import shutil
import os
import tempfile
from typing import Optional

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
    file: UploadFile = File(...)
):
    if not WHISPER_AVAILABLE:
        raise HTTPException(status_code=500, detail="faster-whisper library not installed.")

    temp_file_path = ""
    try:
        # Save uploaded file to temp
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1] or ".wav") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name
        
        model = get_model()
        
        # Transcribe
        segments, info = model.transcribe(temp_file_path, beam_size=5)
        
        # Collect text from segments
        full_text = "".join([segment.text for segment in segments])
        
        return {
            "text": full_text.strip(),
            "language": info.language,
            "language_probability": info.language_probability
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp file
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
