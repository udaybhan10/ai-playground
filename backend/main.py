from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, vision, tts, stt, translate, rag, voice_chat
from database import engine, Base
import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Playground API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(vision.router, prefix="/api", tags=["vision"])
app.include_router(tts.router, prefix="/api", tags=["tts"])
app.include_router(stt.router, prefix="/api", tags=["stt"])
app.include_router(translate.router, prefix="/api", tags=["translate"])
app.include_router(rag.router, prefix="/api", tags=["rag"])
app.include_router(voice_chat.router, prefix="/api", tags=["voice"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Playground API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
