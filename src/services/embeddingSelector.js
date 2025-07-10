import logger from '../utils/logger.js';
import localEmbeddingService from './localEmbeddingService.js';

/**
 * 임베딩 서비스 선택기
 * 환경 변수에 따라 적절한 임베딩 서비스를 선택
 */
class EmbeddingSelector {
  constructor() {
    this.selectedService = this.selectService();
    logger.info(`임베딩 서비스 선택됨: ${this.selectedService.getModelInfo().model}`);
  }

  /**
   * 환경에 따른 임베딩 서비스 선택
   * @returns {Object} 선택된 임베딩 서비스
   */
  selectService() {
    // 무조건 로컬 임베딩 서비스만 사용
    return localEmbeddingService;
  }

  /**
   * 텍스트 임베딩
   * @param {string} text - 텍스트
   * @returns {Promise<number[]>} 임베딩 벡터
   */
  async embedText(text) {
    return this.selectedService.embedText(text);
  }

  /**
   * 배치 임베딩
   * @param {string[]} texts - 텍스트 배열
   * @returns {Promise<number[][]>} 임베딩 벡터 배열
   */
  async embedBatch(texts) {
    return this.selectedService.embedBatch(texts);
  }

  /**
   * 코사인 유사도 계산
   * @param {number[]} vectorA - 첫 번째 벡터
   * @param {number[]} vectorB - 두 번째 벡터
   * @returns {number} 코사인 유사도
   */
  calculateCosineSimilarity(vectorA, vectorB) {
    return this.selectedService.calculateCosineSimilarity(vectorA, vectorB);
  }

  /**
   * 텍스트 청킹
   * @param {string} text - 텍스트
   * @param {number} maxChunkSize - 최대 청크 크기
   * @param {number} overlap - 겹치는 부분
   * @returns {string[]} 청크 배열
   */
  chunkText(text, maxChunkSize = 1000, overlap = 200) {
    return this.selectedService.chunkText(text, maxChunkSize, overlap);
  }

  /**
   * 모델 정보 반환
   * @returns {Object} 모델 정보
   */
  getModelInfo() {
    return this.selectedService.getModelInfo();
  }

  /**
   * 서비스 상태 확인
   * @returns {Promise<boolean>} 서비스 상태
   */
  async healthCheck() {
    return this.selectedService.healthCheck();
  }

  /**
   * 현재 사용 중인 서비스 타입 반환
   * @returns {string} 서비스 타입
   */
  getServiceType() {
    const info = this.getModelInfo();
    return info.type || 'mock';
  }
}

export default new EmbeddingSelector(); 