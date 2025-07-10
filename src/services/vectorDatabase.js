import { Pinecone } from '@pinecone-database/pinecone';
import logger from '../utils/logger.js';

class VectorDatabase {
  constructor() {
    this.apiKey = process.env.PINECONE_API_KEY;
    this.indexName = process.env.PINECONE_INDEX_NAME || 'markdown-notes';
    this.index = null;
    this.dimensions = 1536; // text-embedding-3-small 차원
    
    // API 키가 있으면 Pinecone 클라이언트 초기화
    if (this.apiKey) {
      this.pinecone = new Pinecone({
        apiKey: this.apiKey,
      });
      logger.info('Pinecone 벡터 데이터베이스 초기화 완료');
    } else {
      this.pinecone = null;
      logger.warn('Pinecone API 키가 없습니다. Mock 모드로 동작합니다.');
    }
  }

  /**
   * 인덱스 초기화
   */
  async initialize() {
    try {
      logger.info('벡터 데이터베이스 초기화 시작');
      
      // API 키가 없으면 Mock 모드로 초기화
      if (!this.pinecone) {
        logger.info('Mock 벡터 데이터베이스 초기화 완료');
        return true;
      }
      
      // 인덱스 존재 확인
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.some(index => index.name === this.indexName);
      
      if (!indexExists) {
        logger.info(`인덱스 생성: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: this.dimensions,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        
        // 인덱스 생성 후 준비될 때까지 대기
        await this.waitForIndexReady();
      }
      
      this.index = this.pinecone.index(this.indexName);
      logger.info('벡터 데이터베이스 초기화 완료');
      
      return true;
    } catch (error) {
      logger.error(`벡터 데이터베이스 초기화 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 인덱스 준비 상태 대기
   */
  async waitForIndexReady() {
    let attempts = 0;
    const maxAttempts = 30; // 최대 5분 대기
    
    while (attempts < maxAttempts) {
      try {
        const indexStats = await this.pinecone.describeIndex(this.indexName);
        if (indexStats.status?.ready) {
          logger.info('인덱스 준비 완료');
          return;
        }
        
        logger.info(`인덱스 준비 대기 중... (${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기
        attempts++;
      } catch (error) {
        logger.warn(`인덱스 상태 확인 실패: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      }
    }
    
    throw new Error('인덱스 준비 시간 초과');
  }

  /**
   * 벡터 업서트 (삽입 또는 업데이트)
   * @param {string} id - 벡터 ID
   * @param {number[]} vector - 벡터 데이터
   * @param {Object} metadata - 메타데이터
   */
  async upsert(id, vector, metadata = {}) {
    try {
      // API 키가 없으면 Mock 모드로 동작
      if (!this.pinecone) {
        logger.info(`Mock 벡터 업서트 완료: ${id}`);
        return;
      }

      if (!this.index) {
        throw new Error('인덱스가 초기화되지 않았습니다.');
      }

      await this.index.upsert([{
        id,
        values: vector,
        metadata
      }]);
      
      logger.info(`벡터 업서트 완료: ${id}`);
    } catch (error) {
      logger.error(`벡터 업서트 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 배치 벡터 업서트
   * @param {Array} vectors - 벡터 배열 [{id, values, metadata}]
   */
  async upsertBatch(vectors) {
    try {
      // API 키가 없으면 Mock 모드로 동작
      if (!this.pinecone) {
        logger.info(`Mock 배치 업서트 완료: ${vectors.length}개 벡터`);
        return;
      }

      if (!this.index) {
        throw new Error('인덱스가 초기화되지 않았습니다.');
      }

      if (!vectors || vectors.length === 0) {
        throw new Error('벡터 배열이 비어있습니다.');
      }

      // Pinecone은 한 번에 최대 100개 벡터 처리
      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < vectors.length; i += batchSize) {
        batches.push(vectors.slice(i, i + batchSize));
      }

      logger.info(`배치 업서트 시작: ${vectors.length}개 벡터, ${batches.length}개 배치`);
      
      for (let i = 0; i < batches.length; i++) {
        await this.index.upsert(batches[i]);
        logger.info(`배치 ${i + 1}/${batches.length} 완료`);
      }
      
      logger.info('배치 업서트 완료');
    } catch (error) {
      logger.error(`배치 업서트 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 벡터 검색
   * @param {number[]} queryVector - 검색 쿼리 벡터
   * @param {number} topK - 반환할 최대 결과 수
   * @param {Object} filter - 메타데이터 필터
   * @returns {Promise<Array>} 검색 결과
   */
  async query(queryVector, topK = 10, filter = {}) {
    try {
      // API 키가 없으면 Mock 모드로 동작
      if (!this.pinecone) {
        logger.info(`Mock 벡터 검색 완료: ${topK}개 결과`);
        return this.generateMockResults(topK, filter);
      }

      if (!this.index) {
        throw new Error('인덱스가 초기화되지 않았습니다.');
      }

      const queryResponse = await this.index.query({
        vector: queryVector,
        topK,
        includeMetadata: true,
        filter
      });

      logger.info(`벡터 검색 완료: ${queryResponse.matches.length}개 결과`);
      return queryResponse.matches;
    } catch (error) {
      logger.error(`벡터 검색 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 벡터 삭제
   * @param {string} id - 삭제할 벡터 ID
   */
  async delete(id) {
    try {
      if (!this.index) {
        throw new Error('인덱스가 초기화되지 않았습니다.');
      }

      await this.index.deleteOne(id);
      logger.info(`벡터 삭제 완료: ${id}`);
    } catch (error) {
      logger.error(`벡터 삭제 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 배치 벡터 삭제
   * @param {string[]} ids - 삭제할 벡터 ID 배열
   */
  async deleteBatch(ids) {
    try {
      if (!this.index) {
        throw new Error('인덱스가 초기화되지 않았습니다.');
      }

      if (!ids || ids.length === 0) {
        throw new Error('삭제할 ID 배열이 비어있습니다.');
      }

      await this.index.deleteMany(ids);
      logger.info(`배치 삭제 완료: ${ids.length}개 벡터`);
    } catch (error) {
      logger.error(`배치 삭제 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 인덱스 통계 조회
   * @returns {Promise<Object>} 인덱스 통계
   */
  async getStats() {
    try {
      // API 키가 없으면 Mock 모드로 동작
      if (!this.pinecone) {
        logger.info('Mock 인덱스 통계 조회 완료');
        return {
          totalVectorCount: 100,
          indexDimension: this.dimensions,
          indexMetric: 'cosine',
          namespaces: {
            '': {
              vectorCount: 100
            }
          }
        };
      }

      if (!this.index) {
        throw new Error('인덱스가 초기화되지 않았습니다.');
      }

      const stats = await this.index.describeIndexStats();
      logger.info('인덱스 통계 조회 완료');
      return stats;
    } catch (error) {
      logger.error(`인덱스 통계 조회 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 인덱스 초기화 (모든 벡터 삭제)
   */
  async clear() {
    try {
      if (!this.index) {
        throw new Error('인덱스가 초기화되지 않았습니다.');
      }

      await this.index.deleteAll();
      logger.info('인덱스 초기화 완료');
    } catch (error) {
      logger.error(`인덱스 초기화 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mock 검색 결과 생성 (실제 인덱스된 노트 기반)
   * @param {number} topK - 반환할 결과 수
   * @param {Object} filter - 필터
   * @returns {Array} Mock 검색 결과
   */
  generateMockResults(topK, filter) {
    const results = [];
    
    // 실제 인덱스된 노트에서 결과 생성
    const indexedNotes = this.getIndexedNotesForMock();
    
    if (indexedNotes.length === 0) {
      // 인덱스된 노트가 없으면 기본 Mock 결과 반환
      for (let i = 0; i < topK; i++) {
        results.push({
          id: `mock-vector-${i + 1}`,
          score: Math.random() * 0.5 + 0.5,
          metadata: {
            title: `Mock Note ${i + 1}`,
            tags: ['mock', 'test'],
            filePath: `/mock/note-${i + 1}.md`
          }
        });
      }
    } else {
      // 인덱스된 노트를 기반으로 결과 생성
      const shuffledNotes = [...indexedNotes].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < Math.min(topK, shuffledNotes.length); i++) {
        const note = shuffledNotes[i];
        results.push({
          id: `${note.filePath}-chunk-${i}`,
          score: Math.random() * 0.3 + 0.7, // 0.7-1.0 범위 (더 높은 점수)
          metadata: {
            title: note.metadata.title || path.basename(note.filePath, '.md'),
            tags: note.metadata.tags || [],
            filePath: note.filePath,
            chunkIndex: i,
            originalFilePath: note.filePath
          }
        });
      }
    }
    
    return results;
  }

  /**
   * Mock 모드에서 인덱스된 노트 정보 가져오기
   * @returns {Array} 인덱스된 노트 배열
   */
  getIndexedNotesForMock() {
    try {
      // 동적 import를 동기적으로 처리
      const fs = require('fs');
      const path = require('path');
      
      const indexPath = path.join(process.cwd(), 'data', 'note-index.json');
      if (fs.existsSync(indexPath)) {
        const data = fs.readFileSync(indexPath, 'utf-8');
        const index = JSON.parse(data);
        return Object.values(index.notes || {});
      }
      
      return [];
    } catch (error) {
      logger.warn('Mock 모드에서 인덱스된 노트 정보를 가져올 수 없습니다.');
      return [];
    }
  }

  /**
   * 서비스 상태 확인
   * @returns {Promise<boolean>} 서비스 상태
   */
  async healthCheck() {
    try {
      // API 키가 없으면 Mock 모드로 항상 true 반환
      if (!this.pinecone) {
        return true;
      }
      
      if (!this.index) {
        return false;
      }
      
      await this.getStats();
      return true;
    } catch (error) {
      logger.error(`벡터 데이터베이스 헬스체크 실패: ${error.message}`);
      return false;
    }
  }
}

export default new VectorDatabase(); 