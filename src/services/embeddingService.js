import logger from '../utils/logger.js';
import localEmbeddingService from './localEmbeddingService.js';
import pythonEmbeddingService from './pythonEmbeddingService.js';

class EmbeddingService {
  constructor() {
    this.model = 'local-embedding-v1';
    this.dimensions = 1536;
    this.localService = localEmbeddingService;
    this.pythonService = pythonEmbeddingService;
    this.usePythonService = false;
    
    // Python 서비스 사용 가능 여부 확인
    this.checkPythonService();
  }

  /**
   * Python 임베딩 서비스 사용 가능 여부 확인
   */
  async checkPythonService() {
    try {
      await this.pythonService.checkHealth();
      this.usePythonService = this.pythonService.isAvailable;
      
      if (this.usePythonService) {
        const modelInfo = this.pythonService.modelInfo;
        this.model = modelInfo?.model_name || 'python-embedding';
        this.dimensions = modelInfo?.dimension || 768;
        logger.info(`Python 임베딩 서비스 활성화: ${this.model} (${this.dimensions}D)`);
      } else {
        logger.info('Python 임베딩 서비스 사용 불가, 로컬 임베딩 서비스 사용');
      }
    } catch (error) {
      logger.warn(`Python 임베딩 서비스 확인 실패: ${error.message}`);
      this.usePythonService = false;
    }
  }

  /**
   * 텍스트를 벡터로 변환 (Python 서비스 우선, 로컬 서비스 폴백)
   * @param {string} text - 임베딩할 텍스트
   * @returns {Promise<number[]>} 임베딩 벡터
   */
  async embedText(text) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('텍스트가 비어있습니다.');
      }

      // Python 서비스 사용 가능하면 Python 서비스 사용
      if (this.usePythonService) {
        logger.info(`Python 텍스트 임베딩 시작: ${text.substring(0, 50)}...`);
        
        const result = await this.pythonService.createEmbeddings(text);
        const embedding = result.embeddings[0]; // 단일 텍스트이므로 첫 번째 결과
        
        logger.info(`Python 임베딩 완료: ${embedding.length}차원 벡터 생성 (${result.processingTime.toFixed(3)}s)`);
        
        return embedding;
      } else {
        // Python 서비스 사용 불가시 로컬 서비스 사용
        logger.info(`로컬 텍스트 임베딩 시작: ${text.substring(0, 50)}...`);
        
        const embedding = await this.localService.embedText(text);
        
        logger.info(`로컬 임베딩 완료: ${embedding.length}차원 벡터 생성`);
        
        return embedding;
      }
    } catch (error) {
      logger.error(`임베딩 실패: ${error.message}`);
      
      // Python 서비스 실패시 로컬 서비스로 폴백
      if (this.usePythonService) {
        logger.info('Python 서비스 실패, 로컬 서비스로 폴백');
        this.usePythonService = false;
        return await this.localService.embedText(text);
      }
      
      throw error;
    }
  }

  /**
   * 여러 텍스트를 배치로 임베딩 (Python 서비스 우선, 로컬 서비스 폴백)
   * @param {string[]} texts - 임베딩할 텍스트 배열
   * @returns {Promise<number[][]>} 임베딩 벡터 배열
   */
  async embedBatch(texts) {
    try {
      if (!texts || texts.length === 0) {
        throw new Error('텍스트 배열이 비어있습니다.');
      }

      // Python 서비스 사용 가능하면 Python 서비스 사용
      if (this.usePythonService) {
        logger.info(`Python 배치 임베딩 시작: ${texts.length}개 텍스트`);
        
        const result = await this.pythonService.createBatchEmbeddings(texts);
        
        logger.info(`Python 배치 임베딩 완료: ${result.embeddings.length}개 벡터 생성`);
        
        return result.embeddings;
      } else {
        // Python 서비스 사용 불가시 로컬 서비스 사용
        logger.info(`로컬 배치 임베딩 시작: ${texts.length}개 텍스트`);
        
        const embeddings = await this.localService.embedBatch(texts);

        logger.info(`로컬 배치 임베딩 완료: ${embeddings.length}개 벡터 생성`);
        
        return embeddings;
      }
    } catch (error) {
      logger.error(`배치 임베딩 실패: ${error.message}`);
      
      // Python 서비스 실패시 로컬 서비스로 폴백
      if (this.usePythonService) {
        logger.info('Python 서비스 실패, 로컬 서비스로 폴백');
        this.usePythonService = false;
        return await this.localService.embedBatch(texts);
      }
      
      throw error;
    }
  }

  /**
   * 두 텍스트 간의 유사도 계산 (Python 서비스 우선)
   * @param {string} text1 - 첫 번째 텍스트
   * @param {string} text2 - 두 번째 텍스트
   * @returns {Promise<number>} 유사도 점수 (0-1)
   */
  async calculateTextSimilarity(text1, text2) {
    try {
      if (this.usePythonService) {
        logger.info('Python 유사도 계산 시작');
        
        const result = await this.pythonService.calculateSimilarity(text1, text2);
        
        logger.info(`Python 유사도 계산 완료: ${result.similarity.toFixed(4)} (${result.processingTime.toFixed(3)}s)`);
        
        return result.similarity;
      } else {
        // 로컬 서비스로 폴백: 각각 임베딩 후 코사인 유사도 계산
        logger.info('로컬 유사도 계산 시작');
        
        const [embedding1, embedding2] = await Promise.all([
          this.embedText(text1),
          this.embedText(text2)
        ]);
        
        const similarity = this.calculateCosineSimilarity(embedding1, embedding2);
        
        logger.info(`로컬 유사도 계산 완료: ${similarity.toFixed(4)}`);
        
        return similarity;
      }
    } catch (error) {
      logger.error(`유사도 계산 실패: ${error.message}`);
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
   * 텍스트 전처리 개선 (한국어 특화)
   */
  preprocessText(text) {
    if (!text || typeof text !== 'string') return '';
    
    // 기본 정규화
    let processed = text.trim();
    
    // 한국어 특화 전처리
    // 1. 연속된 공백 제거
    processed = processed.replace(/\s+/g, ' ');
    
    // 2. 특수문자 처리 (한글, 영문, 숫자, 기본 문장부호만 유지)
    processed = processed.replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ.,!?;:()[\]{}"'`~@#$%^&*+=|\\/<>]/g, ' ');
    
    // 3. 연속된 특수문자 제거
    processed = processed.replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]+/g, ' ');
    
    // 4. 앞뒤 공백 제거
    processed = processed.trim();
    
    return processed;
  }

  /**
   * 개선된 텍스트 청킹 (슬라이딩 윈도우 적용)
   */
  createChunks(text, maxChunkSize = 1000, overlapSize = 200) {
    if (!text || text.length <= maxChunkSize) {
      return [text];
    }

    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + maxChunkSize;
      
      // 문장 단위로 자르기 시도
      if (end < text.length) {
        const nextPeriod = text.indexOf('.', end - 100);
        const nextNewline = text.indexOf('\n', end - 100);
        
        if (nextPeriod > end - 100 && nextPeriod < end + 100) {
          end = nextPeriod + 1;
        } else if (nextNewline > end - 100 && nextNewline < end + 100) {
          end = nextNewline + 1;
        }
      }
      
      const chunk = text.substring(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      
      // 슬라이딩 윈도우 (중첩)
      start = end - overlapSize;
      if (start >= text.length) break;
    }
    
    return chunks;
  }

  /**
   * 메타데이터 가중치 적용 임베딩
   */
  async createWeightedEmbedding(text, metadata = {}) {
    const baseEmbedding = await this.createEmbedding(text);
    
    // 메타데이터 가중치 적용
    const weights = {
      title: 1.5,
      tags: 1.3,
      fileName: 1.2,
      content: 1.0
    };
    
    // 제목이나 태그가 있으면 가중치 적용
    if (metadata.title && text.toLowerCase().includes(metadata.title.toLowerCase())) {
      return baseEmbedding.map(val => val * weights.title);
    }
    
    if (metadata.tags && metadata.tags.length > 0) {
      const tagMatch = metadata.tags.some(tag => 
        text.toLowerCase().includes(tag.toLowerCase())
      );
      if (tagMatch) {
        return baseEmbedding.map(val => val * weights.tags);
      }
    }
    
    return baseEmbedding;
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
      logger.error(`임베딩 서비스 헬스체크 실패: ${error.message}`);
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
      type: this.usePythonService ? 'python' : 'local',
      pythonServiceAvailable: this.usePythonService,
      pythonServiceStatus: this.pythonService.getStatus()
    };
  }
}

export default new EmbeddingService(); 