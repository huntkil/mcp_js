import logger from '../utils/logger.js';

class PythonEmbeddingService {
  constructor() {
    this.baseUrl = process.env.PYTHON_EMBEDDING_URL || 'http://localhost:5001';
    this.isAvailable = false;
    this.modelInfo = null;
    this.checkHealth();
  }

  /**
   * Python 임베딩 서버 상태 확인
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (response.ok) {
        const health = await response.json();
        this.isAvailable = health.model_loaded;
        logger.info(`Python embedding server is ${this.isAvailable ? 'ready' : 'loading'}`);
        
        if (this.isAvailable && !this.modelInfo) {
          await this.getModelInfo();
        }
      } else {
        this.isAvailable = false;
        logger.warn('Python embedding server is not available');
      }
    } catch (error) {
      this.isAvailable = false;
      logger.warn(`Python embedding server health check failed: ${error.message}`);
    }
  }

  /**
   * 모델 정보 가져오기
   */
  async getModelInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/model-info`);
      if (response.ok) {
        this.modelInfo = await response.json();
        logger.info(`Python embedding model: ${this.modelInfo.model_name} (${this.modelInfo.dimension}D)`);
      }
    } catch (error) {
      logger.error(`Failed to get model info: ${error.message}`);
    }
  }

  /**
   * 텍스트 임베딩 생성
   * @param {string|Array<string>} texts - 임베딩할 텍스트
   * @param {Object} options - 옵션
   */
  async createEmbeddings(texts, options = {}) {
    if (!this.isAvailable) {
      throw new Error('Python embedding server is not available');
    }

    const { normalize = true } = options;
    
    // 단일 텍스트를 배열로 변환
    const textArray = Array.isArray(texts) ? texts : [texts];
    
    try {
      const response = await fetch(`${this.baseUrl}/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: textArray,
          normalize
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Embedding request failed: ${error}`);
      }

      const result = await response.json();
      
      logger.info(`Generated ${result.embeddings.length} embeddings in ${result.processing_time.toFixed(3)}s`);
      
      return {
        embeddings: result.embeddings,
        dimension: result.dimension,
        modelName: result.model_name,
        processingTime: result.processing_time
      };
    } catch (error) {
      logger.error(`Python embedding generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 두 텍스트 간의 유사도 계산
   * @param {string} text1 - 첫 번째 텍스트
   * @param {string} text2 - 두 번째 텍스트
   */
  async calculateSimilarity(text1, text2) {
    if (!this.isAvailable) {
      throw new Error('Python embedding server is not available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/similarity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text1,
          text2
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Similarity calculation failed: ${error}`);
      }

      const result = await response.json();
      
      logger.info(`Calculated similarity: ${result.similarity.toFixed(4)} in ${result.processing_time.toFixed(3)}s`);
      
      return {
        similarity: result.similarity,
        processingTime: result.processing_time
      };
    } catch (error) {
      logger.error(`Python similarity calculation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 배치 임베딩 생성 (성능 최적화)
   * @param {Array<string>} texts - 텍스트 배열
   * @param {Object} options - 옵션
   */
  async createBatchEmbeddings(texts, options = {}) {
    const { batchSize = 32 } = options;
    const results = [];
    
    // 배치 단위로 처리
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResult = await this.createEmbeddings(batch, options);
      results.push(...batchResult.embeddings);
    }
    
    return {
      embeddings: results,
      dimension: this.modelInfo?.dimension || 768,
      modelName: this.modelInfo?.model_name || 'unknown',
      totalTexts: texts.length
    };
  }

  /**
   * 서비스 상태 확인
   */
  getStatus() {
    return {
      available: this.isAvailable,
      baseUrl: this.baseUrl,
      modelInfo: this.modelInfo
    };
  }
}

// 싱글톤 인스턴스 생성
const pythonEmbeddingService = new PythonEmbeddingService();

export default pythonEmbeddingService; 