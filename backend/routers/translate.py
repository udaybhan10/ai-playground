from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import ollama

router = APIRouter()

class TranslateRequest(BaseModel):
    text: str
    target_lang: str
    model: str = "llama3.2-vision:latest" # Default model

@router.post("/translate")
async def translate_text(request: TranslateRequest):
    try:
        # Construct a prompt for translation
        # Llama 3 models are good at following instructions
        prompt = f"Translate the following text to {request.target_lang}. Only provide the translated text, no explanations or introductory phrases.\n\nText: {request.text}"
        
        response = ollama.chat(
            model=request.model,
            messages=[{
                'role': 'user',
                'content': prompt
            }],
            stream=False
        )
        
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
