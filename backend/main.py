from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, vision, tts, stt, translate

app = FastAPI(title="AI Playground API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(vision.router, prefix="/api", tags=["vision"])
app.include_router(tts.router, prefix="/api", tags=["tts"])
app.include_router(stt.router, prefix="/api", tags=["stt"])
app.include_router(translate.router, prefix="/api", tags=["translate"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Playground API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
