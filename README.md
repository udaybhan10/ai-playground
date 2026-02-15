# AI Playground

A local AI playground inspired by Sarvam AI, featuring Vision, TTS, STT, Translate, and Chat capabilities.

## Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- [Ollama](https://ollama.com/) (for Chat/Vision models)
- [Kokoro](https://github.com/hexgrad/kokoro) (will be set up for TTS)
- [Faster-Whisper](https://github.com/SYSTRAN/faster-whisper) (will be set up for STT)

## Getting Started

### 1. Backend (FastAPI)

Navigate to the `backend` directory and activate the virtual environment:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt # (If you haven't installed dependencies yet)
```

Start the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```
The API will be available at [http://localhost:8000](http://localhost:8000).
Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend (Next.js)

Navigate to the `frontend` directory:

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Modules

- **Chat**: Interact with local LLMs via Ollama.
- **Vision**: Analyze images using local vision models.
- **TTS**: Text-to-Speech using Kokoro.
- **STT**: Speech-to-Text using Faster-Whisper.
- **Translate**: Local translation models.
