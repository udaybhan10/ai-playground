from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import VoiceSession, VoiceMessage
import ollama
import shutil
import os
import uuid
import soundfile as sf
import io

# Import existing utilities
try:
    from faster_whisper import WhisperModel
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

try:
    from kokoro_onnx import Kokoro
    KOKORO_AVAILABLE = True
except ImportError:
    KOKORO_AVAILABLE = False

router = APIRouter()

# Lazy load models
_whisper_model = None
_kokoro_instance = None

WHISPER_MODEL_SIZE = "tiny"
WHISPER_DEVICE = "cpu"
WHISPER_COMPUTE_TYPE = "int8"

KOKORO_MODEL_PATH = "models/kokoro-v0_19.onnx"
KOKORO_VOICES_BIN = "models/voices.bin"


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        if not WHISPER_AVAILABLE:
            raise RuntimeError("faster-whisper not installed")
        print(f"Loading Whisper model: {WHISPER_MODEL_SIZE}")
        _whisper_model = WhisperModel(WHISPER_MODEL_SIZE, device=WHISPER_DEVICE, compute_type=WHISPER_COMPUTE_TYPE)
    return _whisper_model


def get_kokoro():
    global _kokoro_instance
    if _kokoro_instance is None:
        if not KOKORO_AVAILABLE:
            raise RuntimeError("Kokoro not installed")
        if not os.path.exists(KOKORO_MODEL_PATH):
            raise RuntimeError("Kokoro model files not found")
        print("Loading Kokoro TTS model")
        _kokoro_instance = Kokoro(KOKORO_MODEL_PATH, KOKORO_VOICES_BIN)
    return _kokoro_instance


@router.post("/voice/chat")
async def voice_chat(
    audio_file: UploadFile = File(...),
    session_id: int = Form(None),
    voice: str = Form("af_sarah"),
    model: str = Form("llama3.2-vision:latest"),
    speed: float = Form(1.0),
    db: Session = Depends(get_db)
):
    """
    Voice chat endpoint: Audio in -> Audio out.
    1. Transcribe audio (STT)
    2. Get LLM response
    3. Synthesize speech (TTS)
    4. Save to session
    Returns JSON with text and audio URL.
    """
    if not WHISPER_AVAILABLE:
        raise HTTPException(status_code=500, detail="STT not available (faster-whisper not installed)")
    
    if not KOKORO_AVAILABLE:
        raise HTTPException(status_code=500, detail="TTS not available (Kokoro not installed)")
    
    saved_audio_path = ""
    output_audio_path = ""
    
    try:
        # Step 1: Get or create session
        if session_id:
            session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
        else:
            # Create new session
            session = VoiceSession(title="Voice Conversation")
            db.add(session)
            db.commit()
            db.refresh(session)
        
        # Step 2: Save uploaded audio
        file_ext = os.path.splitext(audio_file.filename)[1] or ".wav"
        audio_filename = f"{uuid.uuid4()}{file_ext}"
        saved_audio_path = os.path.join("static", audio_filename)
        
        with open(saved_audio_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
        
        # Step 3: Transcribe (STT)
        whisper = get_whisper_model()
        segments, info = whisper.transcribe(saved_audio_path, beam_size=5)
        user_text = "".join([segment.text for segment in segments]).strip()
        
        if not user_text:
            raise HTTPException(status_code=400, detail="Could not transcribe audio. Please speak clearly.")
        
        # Step 4: Get LLM response
        response = ollama.chat(
            model=model,
            messages=[{
                "role": "user",
                "content": user_text
            }],
            stream=False
        )
        
        ai_text = response["message"]["content"]
        
        # Step 5: Synthesize speech (TTS)
        kokoro = get_kokoro()
        samples, sample_rate = kokoro.create(
            ai_text,
            voice=voice,
            speed=speed,
            lang="en-us"
        )
        
        # Save output audio
        output_filename = f"{uuid.uuid4()}.wav"
        output_audio_path = os.path.join("static", output_filename)
        sf.write(output_audio_path, samples, sample_rate, format='WAV')
        
        # Step 6: Save message to session
        message = VoiceMessage(
            session_id=session.id,
            user_audio_path=f"/static/{audio_filename}",
            user_text=user_text,
            ai_text=ai_text,
            ai_audio_path=f"/static/{output_filename}",
            language=info.language,
            language_probability=info.language_probability
        )
        db.add(message)
        
        # Update session title with first user message
        if len(session.messages) == 0:
            session.title = user_text[:50] if len(user_text) > 50 else user_text
        
        db.commit()
        db.refresh(message)
        
        # Return response
        return {
            "session_id": session.id,
            "message_id": message.id,
            "user_text": user_text,
            "ai_text": ai_text,
            "audio_url": f"/static/{output_filename}",
            "language": info.language,
            "language_probability": info.language_probability
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Voice chat failed: {str(e)}")


@router.get("/voice/sessions")
async def get_voice_sessions(db: Session = Depends(get_db)):
    """Get all voice sessions"""
    sessions = db.query(VoiceSession).order_by(VoiceSession.created_at.desc()).all()
    return sessions


@router.get("/voice/sessions/{session_id}")
async def get_voice_session(session_id: int, db: Session = Depends(get_db)):
    """Get specific voice session with all messages"""
    session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Manually construct response with messages
    return {
        "id": session.id,
        "title": session.title,
        "created_at": session.created_at,
        "messages": [
            {
                "id": msg.id,
                "user_audio_path": msg.user_audio_path,
                "user_text": msg.user_text,
                "ai_text": msg.ai_text,
                "ai_audio_path": msg.ai_audio_path,
                "language": msg.language,
                "language_probability": msg.language_probability,
                "created_at": msg.created_at
            }
            for msg in session.messages
        ]
    }


@router.delete("/voice/sessions/{session_id}")
async def delete_voice_session(session_id: int, db: Session = Depends(get_db)):
    """Delete a voice session and all its messages"""
    session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Clean up audio files
    for message in session.messages:
        try:
            if message.user_audio_path and os.path.exists(message.user_audio_path.lstrip("/")):
                os.remove(message.user_audio_path.lstrip("/"))
            if message.ai_audio_path and os.path.exists(message.ai_audio_path.lstrip("/")):
                os.remove(message.ai_audio_path.lstrip("/"))
        except Exception as e:
            print(f"Warning: Could not delete audio files: {e}")
    
    db.delete(session)
    db.commit()
    return {"status": "success"}
