from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from fastapi.responses import FileResponse, StreamingResponse
import os
import soundfile as sf
import io
import numpy as np

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
async def generate_speech(request: TTSRequest):
    if not KOKORO_AVAILABLE:
         raise HTTPException(status_code=500, detail="Kokoro-onnx library not installed.")
    
    try:
        kokoro = get_kokoro()
        
        # Generate audio
        # samples, sample_rate = kokoro.create(request.text, voice=request.voice, speed=request.speed, lang="en-us")
        # create returns (samples, sample_rate)
        # Verify method signature from kokoro-onnx docs or usage
        
        samples, sample_rate = kokoro.create(
            request.text, 
            voice=request.voice, 
            speed=request.speed, 
            lang="en-us"
        )
        
        # Convert to BytesIO
        buffer = io.BytesIO()
        sf.write(buffer, samples, sample_rate, format='WAV')
        buffer.seek(0)
        
        return StreamingResponse(buffer, media_type="audio/wav")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

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
