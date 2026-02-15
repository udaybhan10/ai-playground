"""
RAG Utilities for Document Processing and Vector Storage
Uses ChromaDB for vector storage and Ollama for embeddings
"""
import os
import shutil
import uuid
from typing import List
from fastapi import UploadFile
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
import chromadb
from chromadb.config import Settings

# Initialize ChromaDB client
CHROMA_DB_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
os.makedirs(CHROMA_DB_PATH, exist_ok=True)

chroma_client = chromadb.PersistentClient(
    path=CHROMA_DB_PATH,
    settings=Settings(anonymized_telemetry=False)
)

# Initialize embeddings with Ollama
# Make sure you have pulled an embedding model: ollama pull nomic-embed-text
embeddings = OllamaEmbeddings(model="nomic-embed-text", base_url="http://localhost:11434")

# Initialize or get collection
collection = chroma_client.get_or_create_collection(
    name="documents",
    metadata={"hnsw:space": "cosine"}
)


async def process_document(file: UploadFile) -> tuple[str, List[str]]:
    """
    Process uploaded document: save to disk, load, and split into chunks.
    Returns (document_id, list of text chunks)
    """
    # Save file temporarily
    doc_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1].lower()
    temp_path = os.path.join("static", f"doc_{doc_id}{file_ext}")
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Load document based on type
    if file_ext == ".pdf":
        loader = PyPDFLoader(temp_path)
    elif file_ext in [".txt", ".md"]:
        loader = TextLoader(temp_path)
    else:
        raise ValueError(f"Unsupported file type: {file_ext}")
    
    documents = loader.load()
    
    # Split into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_documents(documents)
    
    # Extract text from chunks
    texts = [doc.page_content for doc in chunks]
    
    return doc_id, texts


def add_to_vectorstore(doc_id: str, texts: List[str], metadata: dict = None):
    """
    Embed text chunks and add to ChromaDB.
    """
    if not texts:
        return
    
    # Generate embeddings
    embedded_texts = embeddings.embed_documents(texts)
    
    # Prepare metadata
    metadatas = [{"doc_id": doc_id, **(metadata or {})} for _ in texts]
    ids = [f"{doc_id}_{i}" for i in range(len(texts))]
    
    # Add to collection
    collection.add(
        embeddings=embedded_texts,
        documents=texts,
        metadatas=metadatas,
        ids=ids
    )


def query_vectorstore(query: str, n_results: int = 3, doc_id: str = None) -> List[str]:
    """
    Query the vectorstore and return relevant context chunks.
    If doc_id is provided, filter results to that document only.
    """
    # Embed query
    query_embedding = embeddings.embed_query(query)
    
    # Query parameters
    query_params = {
        "query_embeddings": [query_embedding],
        "n_results": n_results
    }
    
    # Add filter if doc_id specified
    if doc_id:
        query_params["where"] = {"doc_id": doc_id}
    
    results = collection.query(**query_params)
    
    # Extract documents
    if results and results["documents"]:
        return results["documents"][0]  # Returns list of relevant texts
    return []


def delete_document(doc_id: str):
    """
    Delete all chunks associated with a document from the vectorstore.
    """
    collection.delete(where={"doc_id": doc_id})
