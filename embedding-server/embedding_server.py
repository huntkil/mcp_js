from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
import logging
import time
from typing import List, Dict, Any
import os

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Korean Embedding Server", version="1.0.0")

# 모델 초기화
model = None
model_name = "jhgan/ko-sroberta-multitask"  # 한국어 최적화 모델

class EmbeddingRequest(BaseModel):
    texts: List[str]
    normalize: bool = True

class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    model_name: str
    dimension: int
    processing_time: float

class SimilarityRequest(BaseModel):
    text1: str
    text2: str

class SimilarityResponse(BaseModel):
    similarity: float
    processing_time: float

@app.on_event("startup")
async def startup_event():
    global model
    logger.info(f"Loading Korean embedding model: {model_name}")
    start_time = time.time()
    
    try:
        model = SentenceTransformer(model_name)
        load_time = time.time() - start_time
        logger.info(f"Model loaded successfully in {load_time:.2f} seconds")
        logger.info(f"Model dimension: {model.get_sentence_embedding_dimension()}")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise e

@app.get("/")
async def root():
    return {
        "message": "Korean Embedding Server",
        "model": model_name,
        "status": "ready" if model else "loading"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_name": model_name
    }

@app.post("/embed", response_model=EmbeddingResponse)
async def create_embeddings(request: EmbeddingRequest):
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = time.time()
    
    try:
        # 텍스트 전처리
        texts = [text.strip() for text in request.texts if text.strip()]
        if not texts:
            raise HTTPException(status_code=400, detail="No valid texts provided")
        
        # 임베딩 생성
        embeddings = model.encode(texts, normalize_embeddings=request.normalize)
        
        # numpy array를 list로 변환
        embeddings_list = embeddings.tolist()
        
        processing_time = time.time() - start_time
        
        logger.info(f"Generated embeddings for {len(texts)} texts in {processing_time:.3f}s")
        
        return EmbeddingResponse(
            embeddings=embeddings_list,
            model_name=model_name,
            dimension=model.get_sentence_embedding_dimension(),
            processing_time=processing_time
        )
    
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@app.post("/similarity", response_model=SimilarityResponse)
async def calculate_similarity(request: SimilarityRequest):
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = time.time()
    
    try:
        # 두 텍스트의 임베딩 생성
        embeddings = model.encode([request.text1, request.text2], normalize_embeddings=True)
        
        # 코사인 유사도 계산
        similarity = np.dot(embeddings[0], embeddings[1])
        
        processing_time = time.time() - start_time
        
        logger.info(f"Calculated similarity in {processing_time:.3f}s")
        
        return SimilarityResponse(
            similarity=float(similarity),
            processing_time=processing_time
        )
    
    except Exception as e:
        logger.error(f"Similarity calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Similarity calculation failed: {str(e)}")

@app.get("/model-info")
async def get_model_info():
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_name": model_name,
        "dimension": model.get_sentence_embedding_dimension(),
        "max_seq_length": model.max_seq_length
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000) 