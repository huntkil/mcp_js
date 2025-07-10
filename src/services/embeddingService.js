import logger from '../utils/logger.js';
import localEmbeddingService from './localEmbeddingService.js';

class EmbeddingService {
  constructor() {
    this.model = 'local-embedding-v1';
    this.dimensions = 1536;
    this.localService = localEmbeddingService;
  }

  /**
   * 텍스트를 벡터로 변환 (로컬 임베딩 사용)
   * @param {string} text - 임베딩할 텍스트
   * @returns {Promise<number[]>} 임베딩 벡터
   */
  async embedText(text) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('텍스트가 비어있습니다.');
      }

      logger.info(`로컬 텍스트 임베딩 시작: ${text.substring(0, 50)}...`);
      
      // 로컬 임베딩 서비스 사용
      const embedding = await this.localService.embedText(text);
      
      logger.info(`로컬 임베딩 완료: ${embedding.length}차원 벡터 생성`);
      
      return embedding;
    } catch (error) {
      logger.error(`로컬 임베딩 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 여러 텍스트를 배치로 임베딩 (로컬 임베딩 사용)
   * @param {string[]} texts - 임베딩할 텍스트 배열
   * @returns {Promise<number[][]>} 임베딩 벡터 배열
   */
  async embedBatch(texts) {
    try {
      if (!texts || texts.length === 0) {
        throw new Error('텍스트 배열이 비어있습니다.');
      }

      logger.info(`로컬 배치 임베딩 시작: ${texts.length}개 텍스트`);
      
      // 로컬 임베딩 서비스 사용
      const embeddings = await this.localService.embedBatch(texts);

      logger.info(`로컬 배치 임베딩 완료: ${embeddings.length}개 벡터 생성`);
      
      return embeddings;
    } catch (error) {
      logger.error(`로컬 배치 임베딩 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 두 벡터 간의 코사인 유사도 계산
   * @param {number[]} vectorA - 첫 번째 벡터
   * @param {number[]} vectorB - 두 번째 벡터
   * @returns {number} 코사인 유사도 (0-1)
   */
  calculateCosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('벡터 차원이 일치하지 않습니다.');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * 텍스트 청킹 (긴 텍스트를 작은 조각으로 분할)
   * @param {string} text - 분할할 텍스트
   * @param {number} maxChunkSize - 최대 청크 크기 (토큰 수)
   * @param {number} overlap - 청크 간 겹치는 부분 (토큰 수)
   * @returns {string[]} 텍스트 청크 배열
   */
  chunkText(text, maxChunkSize = 1000, overlap = 200) {
    const words = text.split(/\s+/);
    const chunks = [];
    
    for (let i = 0; i < words.length; i += maxChunkSize - overlap) {
      const chunk = words.slice(i, i + maxChunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk);
      }
    }
    
    return chunks;
  }

  /**
   * 서비스 상태 확인
   * @returns {Promise<boolean>} 서비스 상태
   */
  async healthCheck() {
    try {
      const testEmbedding = await this.embedText('test');
      return testEmbedding.length === this.dimensions;
    } catch (error) {
      logger.error(`로컬 임베딩 서비스 헬스체크 실패: ${error.message}`);
      return false;
    }
  }

  /**
   * 모델 정보 반환
   * @returns {Object} 모델 정보
   */
  getModelInfo() {
    return {
      model: this.model,
      dimensions: this.dimensions,
      type: 'local'
    };
  }
}

export default new EmbeddingService(); 