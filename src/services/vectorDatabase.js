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
        
        // NaN이나 Infinity 값 체크
        for (let i = 0; i < a.length; i++) {
          if (isNaN(a[i]) || !isFinite(a[i]) || isNaN(b[i]) || !isFinite(b[i])) {
            return 0;
          }
        }
        
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
          dot += a[i] * b[i];
          normA += a[i] * a[i];
          normB += b[i] * b[i];
        }
        
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        if (denominator === 0 || isNaN(denominator) || !isFinite(denominator)) {
          return 0;
        }
        
        const result = dot / denominator;
        return isNaN(result) || !isFinite(result) ? 0 : Math.max(0, Math.min(1, result));
      }
      
      const results = [];
      let processedCount = 0;
      let filteredCount = 0;
      let nanCount = 0;
      const topScores = [];
      
      for (const v of this.vectors.values()) {
        try {
          // 필터 적용
          if (filter && filter.filePath && v.metadata && v.metadata.filePath && !v.metadata.filePath.includes(filter.filePath)) {
            filteredCount++;
            continue;
          }
          if (filter && filter.tags && v.metadata && v.metadata.tags) {
            const hasTag = filter.tags.some(tag => v.metadata.tags.includes(tag));
            if (!hasTag) {
              filteredCount++;
              continue;
            }
          }
          
          // 벡터 데이터 추출
          const vector = v.values || v.vector;
          if (!vector || !Array.isArray(vector)) {
            logger.warn(`벡터 데이터 없음 또는 잘못된 형태: ${v.id}`);
            continue;
          }
          
          const score = cosine(queryVector, vector);
          if (isNaN(score)) {
            nanCount++;
            logger.warn(`유사도 점수가 NaN: ${v.id}`);
            continue;
          }
          
          // 상위 점수 추적
          if (topScores.length < 10) {
            topScores.push({ id: v.id, score });
            topScores.sort((a, b) => b.score - a.score);
          } else if (score > topScores[9].score) {
            topScores[9] = { id: v.id, score };
            topScores.sort((a, b) => b.score - a.score);
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
      
      // 디버깅 로그
      logger.info(`[VECTOR][DEBUG] 검색 통계: 처리 ${processedCount}개, 필터링 ${filteredCount}개, NaN ${nanCount}개`);
      logger.info(`[VECTOR][DEBUG] results 배열 크기: ${results.length}`);
      if (topScores.length > 0) {
        logger.info(`[VECTOR][DEBUG] 상위 점수: ${topScores.slice(0, 5).map(s => `${s.id}: ${s.score.toFixed(4)}`).join(', ')}`);
      }
      
      // 점수순 정렬
      results.sort((a, b) => b.score - a.score);
      
      const topResults = results.slice(0, topK);
      logger.info(`[VECTOR][DEBUG] topResults 크기: ${topResults.length}, topK: ${topK}`);
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

  /**
   * 벡터 수 조회
   */
  getVectorCount() {
    return this.vectors.size;
  }

  /**
   * 모든 벡터 조회
   */
  getAllVectors() {
    return Array.from(this.vectors.values());
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