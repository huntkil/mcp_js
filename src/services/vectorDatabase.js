import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

class VectorDatabase {
  constructor() {
    this.vectors = new Map();
    this.dimensions = 1536;
    this.dataPath = path.join(process.cwd(), 'data', 'vector-db.json');
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8'));
        for (const v of data) {
          this.vectors.set(v.id, v);
        }
        logger.info(`로컬 벡터DB 로드 완료: ${this.vectors.size}개 벡터`);
      }
    } catch (e) {
      logger.warn('로컬 벡터DB 로드 실패: ' + e.message);
    }
  }

  save() {
    try {
      fs.mkdirSync(path.dirname(this.dataPath), { recursive: true });
      fs.writeFileSync(this.dataPath, JSON.stringify(Array.from(this.vectors.values()), null, 2));
      logger.info('로컬 벡터DB 저장 완료');
    } catch (e) {
      logger.warn('로컬 벡터DB 저장 실패: ' + e.message);
    }
  }

  async initialize() {
    logger.info('로컬 벡터 데이터베이스 초기화 완료');
    return true;
  }

  async upsert(id, vector, metadata = {}) {
    this.vectors.set(id, { id, vector, metadata });
    this.save();
    logger.info(`로컬 벡터 업서트 완료: ${id}`);
  }

  async upsertBatch(vectors) {
    for (const v of vectors) {
      this.vectors.set(v.id, v);
    }
    this.save();
    logger.info(`로컬 배치 업서트 완료: ${vectors.length}개 벡터`);
  }

  async query(queryVector, topK = 10, filter = {}) {
    try {
      // 입력 검증
      if (!Array.isArray(queryVector)) {
        logger.error('쿼리 벡터가 배열이 아님');
        return [];
      }
      
      if (queryVector.length !== this.dimensions) {
        logger.warn(`쿼리 벡터 차원 불일치: ${queryVector.length} (예상: ${this.dimensions})`);
      }
      
      // 간단한 코사인 유사도 기반 검색
      function cosine(a, b) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
          return 0;
        }
        
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
          dot += a[i] * b[i];
          normA += a[i] * a[i];
          normB += b[i] * b[i];
        }
        
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dot / denominator;
      }
      
      const results = [];
      let processedCount = 0;
      
      for (const v of this.vectors.values()) {
        try {
          // 필터 적용
          if (filter && filter.filePath && v.metadata && v.metadata.filePath && !v.metadata.filePath.includes(filter.filePath)) {
            continue;
          }
          if (filter && filter.tags && v.metadata && v.metadata.tags) {
            const hasTag = filter.tags.some(tag => v.metadata.tags.includes(tag));
            if (!hasTag) continue;
          }
          
          // 벡터 데이터 추출
          const vector = v.values || v.vector;
          if (!vector || !Array.isArray(vector)) {
            logger.warn(`벡터 데이터 없음 또는 잘못된 형태: ${v.id}`);
            continue;
          }
          
          const score = cosine(queryVector, vector);
          if (isNaN(score)) {
            logger.warn(`유사도 점수가 NaN: ${v.id}`);
            continue;
          }
          
          results.push({ 
            id: v.id, 
            score, 
            metadata: v.metadata || {} 
          });
          
          processedCount++;
        } catch (error) {
          logger.error(`벡터 처리 중 오류 (${v.id}): ${error.message}`);
        }
      }
      
      // 점수순 정렬
      results.sort((a, b) => b.score - a.score);
      
      const topResults = results.slice(0, topK);
      logger.info(`로컬 벡터 검색 완료: ${topResults.length}개 결과 (처리: ${processedCount}개, 총 벡터: ${this.vectors.size}개)`);
      
      return topResults;
    } catch (error) {
      logger.error(`벡터 쿼리 중 오류: ${error.message}`);
      return [];
    }
  }

  async delete(id) {
    if (this.vectors.has(id)) {
      this.vectors.delete(id);
      this.save();
      logger.info(`로컬 벡터 삭제 완료: ${id}`);
    } else {
      logger.warn(`로컬 벡터 삭제 실패: 벡터 ID ${id}를 찾을 수 없습니다.`);
    }
  }

  async deleteBatch(ids) {
    let deletedCount = 0;
    for (const id of ids) {
      if (this.vectors.has(id)) {
        this.vectors.delete(id);
        deletedCount++;
      }
    }
    this.save();
    logger.info(`로컬 배치 삭제 완료: ${deletedCount}개 벡터`);
  }

  async getStats() {
    return {
      totalVectorCount: this.vectors.size,
      indexDimension: this.dimensions,
      indexMetric: 'cosine',
    };
  }

  async clear() {
    this.vectors.clear();
    this.save();
    logger.info('로컬 벡터DB 초기화 완료');
  }

  async healthCheck() {
    return true;
  }
}

export default new VectorDatabase(); 