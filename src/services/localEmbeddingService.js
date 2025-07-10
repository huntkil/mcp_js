import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * 로컬 임베딩 서비스
 * OpenAI API 없이 로컬에서 임베딩을 생성하는 서비스
 */
class LocalEmbeddingService {
  constructor() {
    this.dimensions = 1536;
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'his', 'hers', 'ours', 'theirs',
      'who', 'what', 'where', 'when', 'why', 'how', 'which', 'whose', 'whom',
      'if', 'then', 'else', 'when', 'while', 'until', 'unless', 'although', 'though', 'because', 'since',
      'as', 'so', 'than', 'like', 'such', 'just', 'only', 'even', 'also', 'too', 'very', 'much', 'more', 'most',
      'some', 'any', 'no', 'all', 'both', 'each', 'every', 'either', 'neither', 'few', 'many', 'several',
      'here', 'there', 'where', 'now', 'then', 'ago', 'before', 'after', 'during', 'since', 'until',
      'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'above', 'below', 'between', 'among',
      'first', 'second', 'third', 'last', 'next', 'previous', 'current', 'final',
      'good', 'bad', 'big', 'small', 'large', 'little', 'high', 'low', 'long', 'short', 'wide', 'narrow',
      'new', 'old', 'young', 'fresh', 'clean', 'dirty', 'hot', 'cold', 'warm', 'cool',
      '가', '이', '그', '저', '우리', '너희', '그들', '저들', '이것', '그것', '저것', '무엇', '어떤', '어느',
      '있다', '없다', '하다', '되다', '있다가', '없다가', '하다가', '되다가',
      '그리고', '또는', '하지만', '그러나', '그런데', '그래서', '따라서', '그러므로',
      '이상', '이하', '이상', '이하', '이상', '이하', '이상', '이하'
    ]);
  }

  /**
   * 텍스트를 벡터로 변환 (로컬 임베딩)
   * @param {string} text - 임베딩할 텍스트
   * @returns {Promise<number[]>} 임베딩 벡터
   */
  async embedText(text) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('텍스트가 비어있습니다.');
      }

      logger.info(`로컬 텍스트 임베딩 시작: ${text.substring(0, 100)}...`);
      
      // 텍스트 전처리
      const processedText = this.preprocessText(text);
      
      // 해시 기반 임베딩 생성
      const hashEmbedding = this.generateHashBasedEmbedding(processedText);
      
      // 단어 빈도 기반 임베딩 생성
      const frequencyEmbedding = this.generateFrequencyBasedEmbedding(processedText);
      
      // 두 임베딩을 결합
      const combinedEmbedding = this.combineEmbeddings(hashEmbedding, frequencyEmbedding);
      
      logger.info(`로컬 임베딩 완료: ${combinedEmbedding.length}차원 벡터 생성`);
      
      return combinedEmbedding;
    } catch (error) {
      logger.error(`로컬 임베딩 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 여러 텍스트를 배치로 임베딩
   * @param {string[]} texts - 임베딩할 텍스트 배열
   * @returns {Promise<number[][]>} 임베딩 벡터 배열
   */
  async embedBatch(texts) {
    try {
      if (!texts || texts.length === 0) {
        throw new Error('텍스트 배열이 비어있습니다.');
      }

      logger.info(`로컬 배치 임베딩 시작: ${texts.length}개 텍스트`);
      
      const embeddings = [];
      for (const text of texts) {
        const embedding = await this.embedText(text);
        embeddings.push(embedding);
      }
      
      logger.info(`로컬 배치 임베딩 완료: ${embeddings.length}개 벡터 생성`);
      
      return embeddings;
    } catch (error) {
      logger.error(`로컬 배치 임베딩 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 텍스트 전처리
   * @param {string} text - 원본 텍스트
   * @returns {string} 전처리된 텍스트
   */
  preprocessText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ') // 특수문자 제거 (한글 포함)
      .replace(/\s+/g, ' ') // 연속 공백을 단일 공백으로
      .trim();
  }

  /**
   * 해시 기반 임베딩 생성
   * @param {string} text - 전처리된 텍스트
   * @returns {number[]} 해시 기반 임베딩
   */
  generateHashBasedEmbedding(text) {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    const hashNumber = parseInt(hash.substring(0, 8), 16);
    
    const embedding = new Array(this.dimensions).fill(0).map((_, i) => {
      return Math.sin(hashNumber + i * 0.1) * 0.1;
    });
    
    return embedding;
  }

  /**
   * 단어 빈도 기반 임베딩 생성
   * @param {string} text - 전처리된 텍스트
   * @returns {number[]} 빈도 기반 임베딩
   */
  generateFrequencyBasedEmbedding(text) {
    const words = text.split(/\s+/).filter(word => 
      word.length > 1 && !this.stopWords.has(word)
    );
    
    // 단어 빈도 계산
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // 빈도 기반 벡터 생성
    const embedding = new Array(this.dimensions).fill(0);
    const wordEntries = Object.entries(wordFreq);
    
    wordEntries.forEach(([word, freq], index) => {
      const positions = this.getWordPositions(word, this.dimensions);
      positions.forEach(pos => {
        embedding[pos] += freq * 0.01;
      });
    });
    
    // 정규화
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      return embedding.map(val => val / norm);
    }
    
    return embedding;
  }

  /**
   * 단어의 벡터 위치 계산
   * @param {string} word - 단어
   * @param {number} dimensions - 벡터 차원
   * @returns {number[]} 위치 배열
   */
  getWordPositions(word, dimensions) {
    const hash = crypto.createHash('md5').update(word).digest('hex');
    const hashNumber = parseInt(hash.substring(0, 8), 16);
    
    const positions = [];
    for (let i = 0; i < 5; i++) { // 각 단어당 5개 위치 사용
      const pos = (hashNumber + i * 1000) % dimensions;
      positions.push(pos);
    }
    
    return positions;
  }

  /**
   * 두 임베딩을 결합
   * @param {number[]} hashEmbedding - 해시 기반 임베딩
   * @param {number[]} frequencyEmbedding - 빈도 기반 임베딩
   * @returns {number[]} 결합된 임베딩
   */
  combineEmbeddings(hashEmbedding, frequencyEmbedding) {
    const combined = new Array(this.dimensions).fill(0);
    
    for (let i = 0; i < this.dimensions; i++) {
      combined[i] = hashEmbedding[i] * 0.3 + frequencyEmbedding[i] * 0.7;
    }
    
    return combined;
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
   * 텍스트 청킹
   * @param {string} text - 분할할 텍스트
   * @param {number} maxChunkSize - 최대 청크 크기 (단어 수)
   * @param {number} overlap - 청크 간 겹치는 부분 (단어 수)
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
   * 서비스 정보 반환
   * @returns {Object} 서비스 정보
   */
  getModelInfo() {
    return {
      model: 'local-hash-embedding',
      dimensions: this.dimensions,
      maxTokens: 8192,
      type: 'local'
    };
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
}

export default new LocalEmbeddingService(); 