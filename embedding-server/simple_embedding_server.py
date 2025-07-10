#!/usr/bin/env python3
"""
Simple Korean Embedding Server for Testing
Uses basic HTTP server and simple TF-IDF based embeddings
"""

import json
import math
import re
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleEmbeddingModel:
    """간단한 TF-IDF 기반 임베딩 모델"""
    
    def __init__(self):
        self.vocab = {}
        self.idf = {}
        self.dimension = 768  # 실제 모델과 동일한 차원
        
    def preprocess_text(self, text):
        """텍스트 전처리"""
        # 한국어 특화 전처리
        text = text.lower()
        # 한글, 영문, 숫자만 유지
        text = re.sub(r'[^가-힣a-zA-Z0-9\s]', ' ', text)
        # 연속된 공백 제거
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def tokenize(self, text):
        """간단한 토큰화 (한국어 단어 단위)"""
        text = self.preprocess_text(text)
        # 한국어는 띄어쓰기로 단어 분리
        words = text.split()
        # 2글자 이상 단어만 유지
        return [word for word in words if len(word) >= 2]
    
    def create_embedding(self, text):
        """텍스트를 임베딩 벡터로 변환"""
        tokens = self.tokenize(text)
        
        # 간단한 TF-IDF 기반 임베딩 생성
        # 실제로는 더 정교한 알고리즘 사용
        embedding = []
        
        for i in range(self.dimension):
            # 각 차원을 토큰들의 해시 기반으로 생성
            value = 0.0
            for j, token in enumerate(tokens):
                # 토큰의 해시값을 사용해서 차원별 가중치 생성
                hash_val = hash(token + str(i)) % 1000
                value += (hash_val / 1000.0) * (1.0 / (j + 1))
            
            # 정규화
            embedding.append(value / max(len(tokens), 1))
        
        # 벡터 정규화
        norm = math.sqrt(sum(x*x for x in embedding))
        if norm > 0:
            embedding = [x/norm for x in embedding]
        
        return embedding
    
    def calculate_similarity(self, text1, text2):
        """두 텍스트 간의 코사인 유사도 계산"""
        emb1 = self.create_embedding(text1)
        emb2 = self.create_embedding(text2)
        
        dot_product = sum(a * b for a, b in zip(emb1, emb2))
        return max(0.0, min(1.0, dot_product))  # 0-1 범위로 제한

class EmbeddingRequestHandler(BaseHTTPRequestHandler):
    """HTTP 요청 핸들러"""
    
    def __init__(self, *args, **kwargs):
        self.model = SimpleEmbeddingModel()
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """GET 요청 처리"""
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        if path == '/health':
            self.send_health_response()
        elif path == '/model-info':
            self.send_model_info()
        elif path == '/':
            self.send_root_response()
        else:
            self.send_error(404, "Not Found")
    
    def do_POST(self):
        """POST 요청 처리"""
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        if path == '/embed':
            self.handle_embed_request()
        elif path == '/similarity':
            self.handle_similarity_request()
        else:
            self.send_error(404, "Not Found")
    
    def send_response_json(self, data, status_code=200):
        """JSON 응답 전송"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response = json.dumps(data, ensure_ascii=False)
        self.wfile.write(response.encode('utf-8'))
    
    def send_health_response(self):
        """헬스체크 응답"""
        data = {
            "status": "healthy",
            "model_loaded": True,
            "model_name": "simple-korean-embedding"
        }
        self.send_response_json(data)
    
    def send_model_info(self):
        """모델 정보 응답"""
        data = {
            "model_name": "simple-korean-embedding",
            "dimension": self.model.dimension,
            "max_seq_length": 512
        }
        self.send_response_json(data)
    
    def send_root_response(self):
        """루트 경로 응답"""
        data = {
            "message": "Simple Korean Embedding Server",
            "model": "simple-korean-embedding",
            "status": "ready"
        }
        self.send_response_json(data)
    
    def handle_embed_request(self):
        """임베딩 요청 처리"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            texts = request_data.get('texts', [])
            normalize = request_data.get('normalize', True)
            
            if not texts:
                self.send_response_json({"error": "No texts provided"}, 400)
                return
            
            start_time = time.time()
            
            embeddings = []
            for text in texts:
                embedding = self.model.create_embedding(text)
                embeddings.append(embedding)
            
            processing_time = time.time() - start_time
            
            response_data = {
                "embeddings": embeddings,
                "model_name": "simple-korean-embedding",
                "dimension": self.model.dimension,
                "processing_time": processing_time
            }
            
            logger.info(f"Generated {len(embeddings)} embeddings in {processing_time:.3f}s")
            self.send_response_json(response_data)
            
        except Exception as e:
            logger.error(f"Embedding request failed: {e}")
            self.send_response_json({"error": str(e)}, 500)
    
    def handle_similarity_request(self):
        """유사도 계산 요청 처리"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            text1 = request_data.get('text1', '')
            text2 = request_data.get('text2', '')
            
            if not text1 or not text2:
                self.send_response_json({"error": "Both text1 and text2 are required"}, 400)
                return
            
            start_time = time.time()
            
            similarity = self.model.calculate_similarity(text1, text2)
            
            processing_time = time.time() - start_time
            
            response_data = {
                "similarity": similarity,
                "processing_time": processing_time
            }
            
            logger.info(f"Calculated similarity: {similarity:.4f} in {processing_time:.3f}s")
            self.send_response_json(response_data)
            
        except Exception as e:
            logger.error(f"Similarity calculation failed: {e}")
            self.send_response_json({"error": str(e)}, 500)
    
    def log_message(self, format, *args):
        """로그 메시지 커스터마이징"""
        logger.info(f"{self.address_string()} - {format % args}")

def main():
    """메인 함수"""
    port = 8000
    server_address = ('', port)
    
    logger.info(f"Starting Simple Korean Embedding Server on port {port}")
    logger.info("Model: simple-korean-embedding (768D)")
    logger.info("=" * 50)
    
    httpd = HTTPServer(server_address, EmbeddingRequestHandler)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    finally:
        httpd.server_close()

if __name__ == "__main__":
    main() 