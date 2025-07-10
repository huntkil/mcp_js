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
    // 간단한 코사인 유사도 기반 검색
    function cosine(a, b) {
      let dot = 0, normA = 0, normB = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    const results = [];
    for (const v of this.vectors.values()) {
      if (filter && filter.filePath && v.metadata.filePath && !v.metadata.filePath.includes(filter.filePath)) continue;
      if (filter && filter.tags && v.metadata.tags) {
        const hasTag = filter.tags.some(tag => v.metadata.tags.includes(tag));
        if (!hasTag) continue;
      }
      // values 필드를 사용 (vector 대신)
      const vector = v.values || v.vector;
      if (!vector) {
        logger.warn(`벡터 데이터 없음: ${v.id}`);
        continue;
      }
      const score = cosine(queryVector, vector);
      results.push({ id: v.id, score, metadata: v.metadata });
    }
    results.sort((a, b) => b.score - a.score);
    logger.info(`로컬 벡터 검색 완료: ${results.length}개 결과`);
    return results.slice(0, topK);
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