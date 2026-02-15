from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import ollama
import base64
from typing import List, Optional

router = APIRouter()

@router.post("/vision")
async def analyze_image(
    file: UploadFile = File(...),
    prompt: str = Form("Describe this image"),
    model: str = Form("llama3.2-vision")
):
    try:
        # Read image content
        contents = await file.read()
        
        # Call Ollama with the image
        response = ollama.chat(
            model=model,
            messages=[{
                'role': 'user',
                'content': prompt,
                'images': [contents]
            }]
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vision/models")
async def list_vision_models():
    # In a real scenario, we might want to filter for models that support vision
    # For now, we'll just return all models or a hardcoded list of known vision models
    # if we want to be specific.
    try:
        models = ollama.list()
        # Simple heuristic: prioritize known vision models if present, otherwise return all
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
