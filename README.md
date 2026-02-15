# 🎮 AI Playground

A comprehensive local AI playground featuring multiple AI capabilities including Chat, Vision Analysis, Text-to-Speech, Speech-to-Text, Translation, and Voice Chat - all running locally with a beautiful modern UI.

![AI Playground](https://img.shields.io/badge/AI-Playground-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Python](https://img.shields.io/badge/Python-3.10+-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 💬 Chat
- Interactive chat with local LLMs via Ollama
- Session management with history
- Markdown support for rich text formatting
- Real-time streaming responses

### 👁️ Vision
- Image analysis using local vision models
- Upload and analyze images
- Detailed visual descriptions
- Object detection and scene understanding

### 🔊 Text-to-Speech (TTS)
- High-quality speech synthesis using Kokoro
- Multiple voice options (alloy, echo, fable, onyx, nova, shimmer)
- Adjustable speech speed
- Audio playback and download

### 🎤 Speech-to-Text (STT)
- Accurate transcription using Faster-Whisper
- Automatic language detection
- Support for 99+ languages
- Audio file upload support

### 🌍 Translation
- Multilingual translation
- Support for 50+ languages
- Fast local processing
- Translation history tracking

### 🎙️ Voice Chat
- Real-time voice conversations with AI
- Continuous dialogue support
- Session-based conversation history
- Voice activity detection
- Multi-turn conversations with context

## 🏗️ Architecture

```
ai-playground/
├── backend/              # FastAPI backend
│   ├── routers/         # API endpoints
│   │   ├── chat.py      # Chat API
│   │   ├── vision.py    # Vision API
│   │   ├── tts.py       # Text-to-Speech API
│   │   ├── stt.py       # Speech-to-Text API
│   │   ├── translate.py # Translation API
│   │   └── voice_chat.py # Voice Chat API
│   ├── models.py        # Database models
│   ├── database.py      # Database configuration
│   └── main.py          # FastAPI app entry point
│
└── frontend/            # Next.js frontend
    ├── app/             # Next.js app directory
    │   ├── chat/        # Chat page
    │   ├── vision/      # Vision page
    │   ├── tts/         # TTS page
    │   ├── stt/         # STT page
    │   ├── translate/   # Translation page
    │   └── voice/       # Voice Chat page
    ├── components/      # React components
    │   ├── ui/          # UI components (Sidebar, etc.)
    │   └── VoiceModeOverlay.tsx # Voice chat overlay
    └── public/          # Static assets
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.10 or higher) - [Download](https://www.python.org/)
- **Ollama** (for Chat/Vision models) - [Install](https://ollama.com/)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-playground.git
cd ai-playground
```

### 2. Backend Setup (FastAPI)

#### Install Python Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Install Ollama Models

Required models for full functionality:

```bash
# For Chat functionality (primary LLM)
ollama pull deepseek-r1

# For Vision functionality (image analysis)
ollama pull llama3.2-vision

# For embeddings (RAG and semantic search)
ollama pull nomic-embed-text

# Alternative chat model (optional)
ollama pull granite3.2
```

Verify installation:
```bash
ollama list
```


#### Start Backend Server

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at:
- API: [http://localhost:8000](http://localhost:8000)
- Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup (Next.js)

Open a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 🗄️ Database

The application uses SQLite for data persistence:
- Database file: `backend/sql_app.db`
- Automatically created on first run
- Stores chat history, voice sessions, and all interaction history

## 🎨 UI Features

- **Modern Dark Theme** - Sleek dark interface with glassmorphism effects
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Smooth Animations** - Framer Motion for fluid transitions
- **Real-time Updates** - Live updates for chat and voice interactions
- **Session Management** - Organized history sidebar for all modules
- **Keyboard Shortcuts** - Quick access to features

## 📦 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **Pydantic** - Data validation
- **Faster-Whisper** - Speech recognition
- **Sentence Transformers** - Text embeddings
- **PyDub** - Audio processing

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **React Markdown** - Markdown rendering

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory (optional):

```env
# OpenAI API (if using cloud models)
OPENAI_API_KEY=your_api_key_here

# Database
DATABASE_URL=sqlite:///./sql_app.db

# Server
PORT=8000
```

### Ollama Configuration

Ensure Ollama is running:
```bash
ollama serve
```

List available models:
```bash
ollama list
```

## 📱 Usage Guide

### Chat Module
1. Navigate to `/chat`
2. Start a new conversation or select from history
3. Type your message and press Enter
4. AI responds with streaming output

### Vision Module
1. Navigate to `/vision`
2. Upload an image
3. Enter your question or prompt
4. Get detailed image analysis

### Voice Chat Module
1. Navigate to `/voice`
2. Click "Start New Voice Chat"
3. Grant microphone permissions
4. Speak naturally - AI responds with voice
5. Conversation continues until you close

### TTS Module
1. Navigate to `/tts`
2. Enter text to convert
3. Select voice and speed
4. Generate and play audio

### STT Module
1. Navigate to `/stt`
2. Upload audio file
3. Get transcription with language detection

### Translation Module
1. Navigate to `/translate`  
2. Enter text
3. Select target language
4. Get instant translation

## 🐛 Troubleshooting

### Backend Issues

**Issue:** `ModuleNotFoundError`
```bash
# Activate virtual environment first
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**Issue:** `Port already in use`
```bash
# Use different port
uvicorn main:app --reload --port 8001
```

**Issue:** Ollama connection error
```bash
# Ensure Ollama is running
ollama serve
# Try pulling models again
ollama pull llama3.2
```

### Frontend Issues

**Issue:** `Module not found`
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue:** Port 3000 in use
```bash
# Use different port
npm run dev -- -p 3001
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.com/) - Local LLM runtime
- [Faster-Whisper](https://github.com/SYSTRAN/faster-whisper) - Speech recognition
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python framework
- [Next.js](https://nextjs.org/) - React framework

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation above

---

**Built with ❤️ using FastAPI and Next.js**
