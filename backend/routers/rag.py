from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
import ollama
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from rag_utils import process_document, add_to_vectorstore, query_vectorstore, delete_document

router = APIRouter()

# Store document metadata (in-memory for now, could be DB)
uploaded_documents = {}


class RAGChatRequest(BaseModel):
    message: str
    doc_id: Optional[str] = None
    model: str = "llama3.2-vision:latest"


@router.post("/rag/upload")
async def upload_document(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None)
):
    """
    Upload and process a document for RAG.
    Supported formats: PDF, TXT, MD
    """
    try:
        # Process document
        doc_id, texts = await process_document(file)
        
        # Add to vectorstore
        filename = name or file.filename
        add_to_vectorstore(doc_id, texts, metadata={"filename": filename})
        
        # Store metadata
        uploaded_documents[doc_id] = {
            "filename": filename,
            "chunks": len(texts)
        }
        
        return {
            "doc_id": doc_id,
            "filename": filename,
            "chunks_created": len(texts),
            "message": "Document uploaded and indexed successfully"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/rag/chat")
async def rag_chat(request: RAGChatRequest):
    """
    Chat with RAG context retrieval.
    If doc_id is provided, retrieves context from that specific document.
    Otherwise, retrieves from all documents.
    """
    try:
        # Retrieve relevant context
        context_chunks = query_vectorstore(
            request.message,
            n_results=3,
            doc_id=request.doc_id
        )
        
        # Build context string
        if context_chunks:
            context = "\n\n".join([f"Context {i+1}: {chunk}" for i, chunk in enumerate(context_chunks)])
            enhanced_prompt = f"""Based on the following context, answer the user's question. If the answer is not in context, say so.

Context:
{context}

User Question: {request.message}

Answer:"""
        else:
            enhanced_prompt = request.message
        
        # Query Ollama
        response = ollama.chat(
            model=request.model,
            messages=[{
                "role": "user",
                "content": enhanced_prompt
            }],
            stream=False
        )
        
        return {
            "message": response["message"]["content"],
            "context_used": len(context_chunks) > 0,
            "num_chunks": len(context_chunks)
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"RAG chat failed: {str(e)}")


@router.get("/rag/documents")
async def list_documents():
    """
    List all uploaded documents.
    """
    return {"documents": uploaded_documents}


@router.delete("/rag/documents/{doc_id}")
async def delete_doc(doc_id: str):
    """
    Delete a document and its embeddings.
    """
    if doc_id not in uploaded_documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        delete_document(doc_id)
        del uploaded_documents[doc_id]
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
