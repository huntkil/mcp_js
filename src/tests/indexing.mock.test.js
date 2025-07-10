/* global describe, test, expect */
import logger from '../utils/logger.js';

/**
 * 2주차 노트 인덱싱 시스템 테스트 (모킹 버전)
 */

// 모킹 임베딩 서비스 생성
function createMockEmbeddingService() {
  return {
    async generateEmbedding(text) {
      // 모킹 임베딩 생성 (실제로는 OpenAI API 호출)
      logger.info(`모킹 임베딩 생성: ${text.substring(0, 50)}...`);
      
      // 간단한 해시 기반 임베딩 시뮬레이션
      const hash = text.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      // 1536차원 벡터 생성 (실제 OpenAI 임베딩과 동일한 크기)
      const embedding = new Array(1536).fill(0).map((_, i) => {
        return Math.sin(hash + i) * 0.1;
      });
      
      return {
        embedding,
        model: 'text-embedding-3-small',
        usage: {
          prompt_tokens: text.split(/\s+/).length,
          total_tokens: text.split(/\s+/).length
        }
      };
    },
    
    async generateBatchEmbeddings(texts) {
      logger.info(`모킹 배치 임베딩 생성: ${texts.length}개 텍스트`);
      
      const embeddings = [];
      for (const text of texts) {
        const result = await this.generateEmbedding(text);
        embeddings.push(result);
      }
      
      return embeddings;
    },
    
    getModelInfo() {
      return {
        model: 'text-embedding-3-small',
        dimensions: 1536,
        maxTokens: 8192
      };
    }
  };
}

// 모킹 벡터 데이터베이스 생성
function createMockVectorDatabase() {
  const vectors = new Map();
  const metadata = new Map();
  
  return {
    async upsert(vectorsData) {
      logger.info(`모킹 벡터 업서트: ${vectorsData.length}개 벡터`);
      
      for (const vectorData of vectorsData) {
        const { id, values, metadata: meta } = vectorData;
        vectors.set(id, values);
        metadata.set(id, meta);
      }
      
      return {
        upsertedCount: vectorsData.length,
        totalVectors: vectors.size
      };
    },
    
    async query(vector, topK = 10, filter = {}) {
      logger.info(`모킹 벡터 쿼리: topK=${topK}`);
      
      // 간단한 유사도 계산 (코사인 유사도 시뮬레이션)
      const results = [];
      
      for (const [id] of vectors) {
        const meta = metadata.get(id);
        
        // 필터 적용
        if (filter && Object.keys(filter).length > 0) {
          if (filter.tags && meta.tags) {
            const hasMatchingTag = filter.tags.some(tag => meta.tags.includes(tag));
            if (!hasMatchingTag) continue;
          }
          
          if (filter.filePath && meta.filePath) {
            if (!meta.filePath.includes(filter.filePath)) continue;
          }
        }
        
        // 간단한 유사도 계산
        const similarity = Math.random() * 0.5 + 0.5; // 0.5-1.0 범위
        
        results.push({
          id,
          score: similarity,
          metadata: meta
        });
      }
      
      // 유사도 순으로 정렬
      results.sort((a, b) => b.score - a.score);
      
      return results.slice(0, topK);
    },
    
    async delete(ids) {
      logger.info(`모킹 벡터 삭제: ${ids.length}개 ID`);
      
      let deletedCount = 0;
      for (const id of ids) {
        if (vectors.has(id)) {
          vectors.delete(id);
          metadata.delete(id);
          deletedCount++;
        }
      }
      
      return { deletedCount };
    },
    
    async getStats() {
      return {
        totalVectors: vectors.size,
        totalMetadata: metadata.size,
        indexSize: vectors.size * 1536 * 4, // 4 bytes per float32
        lastUpdated: new Date().toISOString()
      };
    },
    
    async clear() {
      vectors.clear();
      metadata.clear();
      logger.info('모킹 벡터 데이터베이스 초기화 완료');
    }
  };
}

// 모킹 노트 인덱싱 서비스 생성
function createMockNoteIndexingService() {
  const embeddingService = createMockEmbeddingService();
  const vectorDB = createMockVectorDatabase();
  const indexState = {
    isIndexing: false,
    lastIndexed: null,
    totalIndexed: 0,
    errors: []
  };
  
  return {
    async indexNotes(notes, options = {}) {
      const {
        batchSize = 10,
        chunkSize = 1000,
        overlap = 200
        // updateExisting = true // Unused variable removed
      } = options;
      
      logger.info(`모킹 노트 인덱싱 시작: ${notes.length}개 노트`);
      
      if (indexState.isIndexing) {
        throw new Error('이미 인덱싱이 진행 중입니다.');
      }
      
      indexState.isIndexing = true;
      indexState.errors = [];
      
      try {
        const chunks = [];
        let totalChunks = 0;
        
        // 1. 노트를 청크로 분할
        for (const note of notes) {
          const noteChunks = this.chunkContent(note.content, chunkSize, overlap);
          
          for (let i = 0; i < noteChunks.length; i++) {
            const chunk = noteChunks[i];
            chunks.push({
              id: `${note.id}_chunk_${i}`,
              content: chunk,
              metadata: {
                ...note.metadata,
                chunkIndex: i,
                totalChunks: noteChunks.length,
                chunkStart: i * (chunkSize - overlap),
                chunkEnd: Math.min((i + 1) * chunkSize, note.content.length)
              }
            });
          }
          
          totalChunks += noteChunks.length;
        }
        
        logger.info(`청크 생성 완료: ${totalChunks}개 청크`);
        
        // 2. 배치로 임베딩 생성
        const vectors = [];
        for (let i = 0; i < chunks.length; i += batchSize) {
          const batch = chunks.slice(i, i + batchSize);
          
          const batchTexts = batch.map(chunk => chunk.content);
          const embeddings = await embeddingService.generateBatchEmbeddings(batchTexts);
          
          for (let j = 0; j < batch.length; j++) {
            vectors.push({
              id: batch[j].id,
              values: embeddings[j].embedding,
              metadata: batch[j].metadata
            });
          }
          
          logger.info(`배치 처리 완료: ${i + batch.length}/${chunks.length}`);
        }
        
        // 3. 벡터 데이터베이스에 저장
        const result = await vectorDB.upsert(vectors);
        
        indexState.lastIndexed = new Date().toISOString();
        indexState.totalIndexed = notes.length;
        
        logger.info(`모킹 노트 인덱싱 완료: ${result.upsertedCount}개 벡터 저장`);
        
        return {
          success: true,
          indexedNotes: notes.length,
          totalChunks,
          totalVectors: result.upsertedCount,
          errors: indexState.errors
        };
        
      } catch (error) {
        indexState.errors.push(error.message);
        logger.error(`모킹 노트 인덱싱 실패: ${error.message}`);
        throw error;
      } finally {
        indexState.isIndexing = false;
      }
    },
    
    chunkContent(content, chunkSize, overlap) {
      const chunks = [];
      let start = 0;
      
      while (start < content.length) {
        const end = Math.min(start + chunkSize, content.length);
        const chunk = content.substring(start, end);
        
        if (chunk.trim().length > 0) {
          chunks.push(chunk);
        }
        
        start = end - overlap;
        if (start >= content.length) break;
      }
      
      return chunks;
    },
    
    async searchNotes(query, options = {}) {
      const { topK = 10, filter = {} } = options;
      
      logger.info(`모킹 노트 검색: "${query}"`);
      
      // 쿼리 임베딩 생성
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      // 벡터 데이터베이스에서 검색
      const results = await vectorDB.query(queryEmbedding.embedding, topK, filter);
      
      return {
        query,
        results,
        totalFound: results.length,
        searchType: 'semantic',
        metadata: {
          queryEmbedding: queryEmbedding.embedding.length,
          filter
        }
      };
    },
    
    async updateNote(noteId, content, metadata) {
      logger.info(`모킹 노트 업데이트: ${noteId}`);
      
      // 기존 벡터 삭제
      const stats = await vectorDB.getStats();
      const existingIds = Array.from({ length: stats.totalVectors }, (_, i) => `${noteId}_chunk_${i}`);
      await vectorDB.delete(existingIds);
      
      // 새로 인덱싱
      const chunks = this.chunkContent(content, 1000, 200);
      const vectors = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await embeddingService.generateEmbedding(chunk);
        
        vectors.push({
          id: `${noteId}_chunk_${i}`,
          values: embedding.embedding,
          metadata: {
            ...metadata,
            chunkIndex: i,
            totalChunks: chunks.length
          }
        });
      }
      
      await vectorDB.upsert(vectors);
      
      return {
        success: true,
        updatedChunks: chunks.length,
        totalVectors: vectors.length
      };
    },
    
    async deleteNote(noteId) {
      logger.info(`모킹 노트 삭제: ${noteId}`);
      
      const stats = await vectorDB.getStats();
      const ids = Array.from({ length: stats.totalVectors }, (_, i) => `${noteId}_chunk_${i}`);
      
      const result = await vectorDB.delete(ids);
      
      return {
        success: true,
        deletedVectors: result.deletedCount
      };
    },
    
    async getIndexStats() {
      const dbStats = await vectorDB.getStats();
      
      return {
        ...indexState,
        ...dbStats,
        isHealthy: indexState.errors.length === 0
      };
    },
    
    async clearIndex() {
      logger.info('모킹 인덱스 초기화');
      
      await vectorDB.clear();
      indexState.lastIndexed = null;
      indexState.totalIndexed = 0;
      indexState.errors = [];
      
      return { success: true };
    }
  };
}

describe('Note Indexing System Tests (Mock)', () => {
  const mockIndexingService = createMockNoteIndexingService();
  const mockEmbeddingService = createMockEmbeddingService();
  const mockVectorDB = createMockVectorDatabase();
  
  describe('Embedding Service', () => {
    test('should generate embeddings successfully', async () => {
      const text = 'AI technology and machine learning research';
      const result = await mockEmbeddingService.generateEmbedding(text);
      
      expect(result).toBeDefined();
      expect(result.embedding).toBeDefined();
      expect(Array.isArray(result.embedding)).toBe(true);
      expect(result.embedding.length).toBe(1536);
      expect(result.model).toBe('text-embedding-3-small');
      expect(result.usage).toBeDefined();
    });
    
    test('should generate batch embeddings', async () => {
      const texts = [
        'AI technology research',
        'Machine learning algorithms',
        'Deep learning models'
      ];
      
      const results = await mockEmbeddingService.generateBatchEmbeddings(texts);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(3);
      expect(results.every(result => result.embedding.length === 1536)).toBe(true);
    });
    
    test('should return model info', () => {
      const info = mockEmbeddingService.getModelInfo();
      
      expect(info).toBeDefined();
      expect(info.model).toBe('text-embedding-3-small');
      expect(info.dimensions).toBe(1536);
      expect(info.maxTokens).toBe(8192);
    });
  });
  
  describe('Vector Database', () => {
    test('should upsert vectors successfully', async () => {
      const vectors = [
        {
          id: 'test1',
          values: new Array(1536).fill(0.1),
          metadata: { title: 'Test 1', tags: ['test'] }
        },
        {
          id: 'test2',
          values: new Array(1536).fill(0.2),
          metadata: { title: 'Test 2', tags: ['test'] }
        }
      ];
      
      const result = await mockVectorDB.upsert(vectors);
      
      expect(result).toBeDefined();
      expect(result.upsertedCount).toBe(2);
      expect(result.totalVectors).toBe(2);
    });
    
    test('should query vectors successfully', async () => {
      // 먼저 벡터 추가
      const vectors = [
        {
          id: 'test1',
          values: new Array(1536).fill(0.1),
          metadata: { title: 'Test 1', tags: ['ai'] }
        }
      ];
      await mockVectorDB.upsert(vectors);
      
      // 쿼리 실행
      const queryVector = new Array(1536).fill(0.1);
      const results = await mockVectorDB.query(queryVector, 5);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('score');
      expect(results[0]).toHaveProperty('metadata');
    });
    
    test('should apply filters in query', async () => {
      const queryVector = new Array(1536).fill(0.1);
      const filter = { tags: ['ai'] };
      
      const results = await mockVectorDB.query(queryVector, 5, filter);
      
      expect(Array.isArray(results)).toBe(true);
    });
    
    test('should delete vectors successfully', async () => {
      const result = await mockVectorDB.delete(['test1', 'test2']);
      
      expect(result).toBeDefined();
      expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    });
    
    test('should return database stats', async () => {
      const stats = await mockVectorDB.getStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalVectors).toBeGreaterThanOrEqual(0);
      expect(stats.totalMetadata).toBeGreaterThanOrEqual(0);
      expect(stats.indexSize).toBeGreaterThanOrEqual(0);
      expect(stats.lastUpdated).toBeDefined();
    });
  });
  
  describe('Note Indexing Service', () => {
    const testNotes = [
      {
        id: 'note1',
        content: 'AI technology and machine learning research. This is a comprehensive study of artificial intelligence applications.',
        metadata: {
          title: 'AI Research',
          tags: ['ai', 'research', 'technology'],
          filePath: '/research/ai.md'
        }
      },
      {
        id: 'note2',
        content: 'Machine learning algorithms and deep learning models. Understanding neural networks and their applications.',
        metadata: {
          title: 'ML Algorithms',
          tags: ['ml', 'algorithms', 'deep-learning'],
          filePath: '/research/ml.md'
        }
      }
    ];
    
    test('should index notes successfully', async () => {
      const result = await mockIndexingService.indexNotes(testNotes, {
        batchSize: 5,
        chunkSize: 100,
        overlap: 20
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.indexedNotes).toBe(2);
      expect(result.totalChunks).toBeGreaterThan(0);
      expect(result.totalVectors).toBeGreaterThan(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });
    
    test('should chunk content correctly', () => {
      const content = 'This is a test content that should be chunked into smaller pieces for processing.';
      const chunks = mockIndexingService.chunkContent(content, 20, 5);
      
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every(chunk => chunk.length <= 20)).toBe(true);
    });
    
    test('should search notes successfully', async () => {
      // 먼저 인덱싱
      await mockIndexingService.indexNotes(testNotes);
      
      // 검색 실행
      const result = await mockIndexingService.searchNotes('AI technology', {
        topK: 5
      });
      
      expect(result).toBeDefined();
      expect(result.query).toBe('AI technology');
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
      expect(result.searchType).toBe('semantic');
    });
    
    test('should update note successfully', async () => {
      const updatedContent = 'Updated AI technology research with new findings.';
      const updatedMetadata = {
        title: 'Updated AI Research',
        tags: ['ai', 'research', 'updated'],
        filePath: '/research/ai.md'
      };
      
      const result = await mockIndexingService.updateNote('note1', updatedContent, updatedMetadata);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.updatedChunks).toBeGreaterThan(0);
      expect(result.totalVectors).toBeGreaterThan(0);
    });
    
    test('should delete note successfully', async () => {
      const result = await mockIndexingService.deleteNote('note1');
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.deletedVectors).toBeGreaterThanOrEqual(0);
    });
    
    test('should get index statistics', async () => {
      const stats = await mockIndexingService.getIndexStats();
      
      expect(stats).toBeDefined();
      expect(stats.isIndexing).toBe(false);
      expect(stats.totalVectors).toBeGreaterThanOrEqual(0);
      expect(stats.isHealthy).toBeDefined();
    });
    
    test('should clear index successfully', async () => {
      const result = await mockIndexingService.clearIndex();
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
    
    test('should prevent concurrent indexing', async () => {
      // 첫 번째 인덱싱 시작
      const firstIndexing = mockIndexingService.indexNotes(testNotes);
      
      // 두 번째 인덱싱 시도 (동시 실행 방지)
      await expect(
        mockIndexingService.indexNotes(testNotes)
      ).rejects.toThrow('이미 인덱싱이 진행 중입니다.');
      
      // 첫 번째 인덱싱 완료 대기
      await firstIndexing;
    });
  });
  
  describe('Integration Tests', () => {
    test('should handle complete indexing workflow', async () => {
      const notes = [
        {
          id: 'workflow1',
          content: 'Complete workflow test for indexing system.',
          metadata: {
            title: 'Workflow Test',
            tags: ['test', 'workflow'],
            filePath: '/test/workflow.md'
          }
        }
      ];
      
      // 1. 인덱싱
      const indexResult = await mockIndexingService.indexNotes(notes);
      expect(indexResult.success).toBe(true);
      
      // 2. 검색
      const searchResult = await mockIndexingService.searchNotes('workflow');
      expect(searchResult.results.length).toBeGreaterThan(0);
      
      // 3. 업데이트
      const updateResult = await mockIndexingService.updateNote(
        'workflow1',
        'Updated workflow content.',
        { title: 'Updated Workflow Test', tags: ['test', 'updated'] }
      );
      expect(updateResult.success).toBe(true);
      
      // 4. 통계 확인
      const stats = await mockIndexingService.getIndexStats();
      expect(stats.totalVectors).toBeGreaterThan(0);
      
      // 5. 삭제
      const deleteResult = await mockIndexingService.deleteNote('workflow1');
      expect(deleteResult.success).toBe(true);
    });
  });
}); 