import logger from '../utils/logger.js';

/**
 * 1주차 인프라 모킹 테스트 (환경 변수 없이)
 */
async function testInfrastructureMock() {
  logger.info('🚀 1주차 인프라 모킹 테스트 시작');
  
  try {
    // 1. 임베딩 서비스 구조 테스트
    logger.info('📝 임베딩 서비스 구조 테스트');
    
    // 모킹 임베딩 벡터 생성 (1536차원)
    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random() - 0.5);
    logger.info(`✅ 모킹 임베딩 생성: ${mockEmbedding.length}차원 벡터`);
    logger.info(`📊 임베딩 샘플: [${mockEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    
    // 배치 임베딩 모킹
    const mockBatchEmbeddings = [
      Array.from({ length: 1536 }, () => Math.random() - 0.5),
      Array.from({ length: 1536 }, () => Math.random() - 0.5),
      Array.from({ length: 1536 }, () => Math.random() - 0.5)
    ];
    logger.info(`✅ 모킹 배치 임베딩: ${mockBatchEmbeddings.length}개 벡터`);
    
    // 코사인 유사도 계산 함수 테스트
    function calculateCosineSimilarity(vectorA, vectorB) {
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
    
    const similarity = calculateCosineSimilarity(
      mockBatchEmbeddings[0], 
      mockBatchEmbeddings[1]
    );
    logger.info(`📊 코사인 유사도: ${similarity.toFixed(4)}`);
    
    // 텍스트 청킹 함수 테스트
    function chunkText(text, maxChunkSize = 1000, overlap = 200) {
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
    
    const longText = '이것은 매우 긴 텍스트입니다. '.repeat(100);
    const chunks = chunkText(longText, 50, 10);
    logger.info(`✅ 텍스트 청킹: ${chunks.length}개 청크`);
    
    // 2. 벡터 데이터베이스 구조 테스트
    logger.info('🗄️ 벡터 데이터베이스 구조 테스트');
    
    // 모킹 벡터 데이터베이스 클래스
    class MockVectorDatabase {
      constructor() {
        this.vectors = new Map();
        this.dimensions = 1536;
      }
      
      async upsert(id, vector, metadata = {}) {
        this.vectors.set(id, { vector, metadata });
        logger.info(`✅ 모킹 벡터 업서트: ${id}`);
      }
      
      async query(queryVector, topK = 10, _filter = {}) {
        const results = [];
        
        for (const [id, data] of this.vectors.entries()) {
          const similarity = calculateCosineSimilarity(queryVector, data.vector);
          results.push({
            id,
            score: similarity,
            metadata: data.metadata
          });
        }
        
        // 유사도 순으로 정렬
        results.sort((a, b) => b.score - a.score);
        
        logger.info(`✅ 모킹 벡터 검색: ${results.length}개 결과`);
        return results.slice(0, topK);
      }
      
      async delete(id) {
        this.vectors.delete(id);
        logger.info(`✅ 모킹 벡터 삭제: ${id}`);
      }
      
      getStats() {
        return {
          totalVectorCount: this.vectors.size,
          dimension: this.dimensions
        };
      }
    }
    
    const mockDB = new MockVectorDatabase();
    
    // 단일 벡터 업서트 테스트
    const testId = 'test-vector-1';
    const testMetadata = {
      filePath: '/test/note.md',
      title: '테스트 노트',
      tags: ['test', 'demo'],
      createdAt: new Date().toISOString()
    };
    
    await mockDB.upsert(testId, mockEmbedding, testMetadata);
    
    // 배치 업서트 테스트
    const batchVectors = mockBatchEmbeddings.map((vector, index) => ({
      id: `batch-test-${index + 1}`,
      vector,
      metadata: {
        filePath: `/test/batch-${index + 1}.md`,
        title: `배치 테스트 ${index + 1}`,
        tags: ['batch', 'test'],
        createdAt: new Date().toISOString()
      }
    }));
    
    for (const item of batchVectors) {
      await mockDB.upsert(item.id, item.vector, item.metadata);
    }
    
    // 벡터 검색 테스트
    const searchResults = await mockDB.query(mockEmbedding, 5);
    logger.info(`🔍 검색 결과: ${searchResults.length}개`);
    
    if (searchResults.length > 0) {
      const topResult = searchResults[0];
      logger.info(`🏆 최고 유사도: ${topResult.score.toFixed(4)}`);
      logger.info(`📄 메타데이터: ${JSON.stringify(topResult.metadata)}`);
    }
    
    // 인덱스 통계 조회
    const stats = mockDB.getStats();
    logger.info('📊 모킹 인덱스 통계:');
    logger.info(`   - 총 벡터 수: ${stats.totalVectorCount}`);
    logger.info(`   - 차원: ${stats.dimension}`);
    
    // 3. 통합 테스트
    logger.info('🔗 통합 테스트 시작');
    
    // 새로운 쿼리로 검색
    const queryVector = Array.from({ length: 1536 }, () => Math.random() - 0.5);
    const queryResults = await mockDB.query(queryVector, 3);
    
    logger.info(`🔍 쿼리 검색 결과: ${queryResults.length}개`);
    queryResults.forEach((result, index) => {
      logger.info(`   ${index + 1}. 유사도: ${result.score.toFixed(4)}, ID: ${result.id}`);
    });
    
    // 4. 정리
    logger.info('🧹 테스트 데이터 정리');
    
    // 테스트 벡터들 삭제
    await mockDB.delete(testId);
    for (const item of batchVectors) {
      await mockDB.delete(item.id);
    }
    
    const finalStats = mockDB.getStats();
    logger.info(`✅ 정리 완료: 남은 벡터 ${finalStats.totalVectorCount}개`);
    
    logger.info('🎉 1주차 인프라 모킹 테스트 완료!');
    
    // 5. 성능 테스트
    logger.info('⚡ 성능 테스트 시작');
    
    const startTime = Date.now();
    
    // 대량의 벡터 생성 및 검색 테스트
    const largeBatch = Array.from({ length: 100 }, (_, i) => ({
      id: `perf-test-${i}`,
      vector: Array.from({ length: 1536 }, () => Math.random() - 0.5),
      metadata: { index: i, timestamp: Date.now() }
    }));
    
    for (const item of largeBatch) {
      await mockDB.upsert(item.id, item.vector, item.metadata);
    }
    
    const searchStartTime = Date.now();
    const perfResults = await mockDB.query(mockEmbedding, 10);
    const searchEndTime = Date.now();
    
    const totalTime = Date.now() - startTime;
    const searchTime = searchEndTime - searchStartTime;
    
    logger.info(`⚡ 성능 테스트 결과:`);
    logger.info(`   - 총 실행 시간: ${totalTime}ms`);
    logger.info(`   - 검색 시간: ${searchTime}ms`);
    logger.info(`   - 처리된 벡터: ${largeBatch.length}개`);
    logger.info(`   - 검색 결과: ${perfResults.length}개`);
    
    logger.info('🎉 모든 테스트 완료!');
    
  } catch (error) {
    logger.error(`❌ 모킹 테스트 실패: ${error.message}`);
    throw error;
  }
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  testInfrastructureMock()
    .then(() => {
      logger.info('✅ 모든 모킹 테스트 통과');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`❌ 모킹 테스트 실패: ${error.message}`);
      process.exit(1);
    });
}

export default testInfrastructureMock; 