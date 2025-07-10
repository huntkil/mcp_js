import dotenv from 'dotenv';
import embeddingService from '../services/embeddingService.js';
import vectorDatabase from '../services/vectorDatabase.js';
import logger from '../utils/logger.js';

// 환경 변수 로드
dotenv.config();

/**
 * 1주차 인프라 테스트
 */
async function testInfrastructure() {
  logger.info('🚀 1주차 인프라 테스트 시작');
  
  try {
    // 1. 임베딩 서비스 테스트
    logger.info('📝 임베딩 서비스 테스트 시작');
    
    const testText = '이것은 테스트 텍스트입니다. 의미론적 검색을 위한 임베딩을 생성합니다.';
    const embedding = await embeddingService.embedText(testText);
    
    logger.info(`✅ 임베딩 생성 성공: ${embedding.length}차원 벡터`);
    logger.info(`📊 임베딩 샘플: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    
    // 배치 임베딩 테스트
    const testTexts = [
      '첫 번째 테스트 텍스트입니다.',
      '두 번째 테스트 텍스트입니다.',
      '세 번째 테스트 텍스트입니다.'
    ];
    
    const batchEmbeddings = await embeddingService.embedBatch(testTexts);
    logger.info(`✅ 배치 임베딩 성공: ${batchEmbeddings.length}개 벡터`);
    
    // 코사인 유사도 테스트
    const similarity = embeddingService.calculateCosineSimilarity(
      batchEmbeddings[0], 
      batchEmbeddings[1]
    );
    logger.info(`📊 코사인 유사도: ${similarity.toFixed(4)}`);
    
    // 텍스트 청킹 테스트
    const longText = '이것은 매우 긴 텍스트입니다. '.repeat(100);
    const chunks = embeddingService.chunkText(longText, 50, 10);
    logger.info(`✅ 텍스트 청킹 성공: ${chunks.length}개 청크`);
    
    // 2. 벡터 데이터베이스 테스트
    logger.info('🗄️ 벡터 데이터베이스 테스트 시작');
    
    // 데이터베이스 초기화
    await vectorDatabase.initialize();
    logger.info('✅ 벡터 데이터베이스 초기화 성공');
    
    // 단일 벡터 업서트 테스트
    const testId = 'test-vector-1';
    const testMetadata = {
      filePath: '/test/note.md',
      title: '테스트 노트',
      tags: ['test', 'demo'],
      createdAt: new Date().toISOString()
    };
    
    await vectorDatabase.upsert(testId, embedding, testMetadata);
    logger.info('✅ 단일 벡터 업서트 성공');
    
    // 벡터 검색 테스트
    const searchResults = await vectorDatabase.query(embedding, 5);
    logger.info(`✅ 벡터 검색 성공: ${searchResults.length}개 결과`);
    
    if (searchResults.length > 0) {
      const topResult = searchResults[0];
      logger.info(`🏆 최고 유사도: ${topResult.score.toFixed(4)}`);
      logger.info(`📄 메타데이터: ${JSON.stringify(topResult.metadata)}`);
    }
    
    // 배치 업서트 테스트
    const batchVectors = batchEmbeddings.map((vector, index) => ({
      id: `batch-test-${index + 1}`,
      values: vector,
      metadata: {
        filePath: `/test/batch-${index + 1}.md`,
        title: `배치 테스트 ${index + 1}`,
        tags: ['batch', 'test'],
        createdAt: new Date().toISOString()
      }
    }));
    
    await vectorDatabase.upsertBatch(batchVectors);
    logger.info('✅ 배치 벡터 업서트 성공');
    
    // 인덱스 통계 조회
    const stats = await vectorDatabase.getStats();
    logger.info('📊 인덱스 통계:');
    logger.info(`   - 총 벡터 수: ${stats.totalVectorCount || 'N/A'}`);
    logger.info(`   - 차원: ${stats.dimension || 'N/A'}`);
    
    // 3. 통합 테스트
    logger.info('🔗 통합 테스트 시작');
    
    // 새로운 쿼리로 검색
    const queryText = '테스트와 관련된 내용을 찾아보겠습니다.';
    const queryEmbedding = await embeddingService.embedText(queryText);
    const queryResults = await vectorDatabase.query(queryEmbedding, 3);
    
    logger.info(`🔍 쿼리 검색 결과: ${queryResults.length}개`);
    queryResults.forEach((result, index) => {
      logger.info(`   ${index + 1}. 유사도: ${result.score.toFixed(4)}, ID: ${result.id}`);
    });
    
    // 4. 정리
    logger.info('🧹 테스트 데이터 정리');
    
    // 테스트 벡터들 삭제
    const testIds = [testId, ...batchVectors.map(v => v.id)];
    await vectorDatabase.deleteBatch(testIds);
    logger.info('✅ 테스트 데이터 정리 완료');
    
    logger.info('🎉 1주차 인프라 테스트 완료!');
    
  } catch (error) {
    logger.error(`❌ 인프라 테스트 실패: ${error.message}`);
    throw error;
  }
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  testInfrastructure()
    .then(() => {
      logger.info('✅ 모든 테스트 통과');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`❌ 테스트 실패: ${error.message}`);
      process.exit(1);
    });
}

export default testInfrastructure; 