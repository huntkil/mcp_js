import fs from 'fs/promises';
import path from 'path';
import noteIndexingService from '../services/noteIndexingService.js';
import logger from '../utils/logger.js';

/**
 * 2주차 노트 인덱싱 시스템 테스트
 */
async function testIndexingSystem() {
  logger.info('🚀 2주차 노트 인덱싱 시스템 테스트 시작');
  
  try {
    // 테스트용 임시 Vault 생성
    const testVaultPath = path.join(process.cwd(), 'test-vault');
    await createTestVault(testVaultPath);
    
    // 1. 인덱싱 서비스 초기화 테스트
    logger.info('📝 인덱싱 서비스 초기화 테스트');
    await noteIndexingService.initialize(testVaultPath);
    logger.info('✅ 인덱싱 서비스 초기화 성공');
    
    // 2. 단일 노트 인덱싱 테스트
    logger.info('📄 단일 노트 인덱싱 테스트');
    const testNotePath = path.join(testVaultPath, 'test-note.md');
    const singleResult = await noteIndexingService.indexNote(testNotePath);
    logger.info(`✅ 단일 노트 인덱싱 결과: ${JSON.stringify(singleResult)}`);
    
    // 3. 전체 Vault 인덱싱 테스트
    logger.info('📚 전체 Vault 인덱싱 테스트');
    const vaultResult = await noteIndexingService.indexVault(testVaultPath, {
      forceReindex: false,
      batchSize: 10
    });
    logger.info(`✅ Vault 인덱싱 결과: ${JSON.stringify(vaultResult)}`);
    
    // 4. 인덱스 통계 조회 테스트
    logger.info('📊 인덱스 통계 조회 테스트');
    const stats = noteIndexingService.getIndexStats();
    logger.info('📊 인덱스 통계:');
    logger.info(`   - 총 노트 수: ${stats.totalNotes}`);
    logger.info(`   - 총 청크 수: ${stats.totalChunks}`);
    logger.info(`   - 총 크기: ${stats.totalSize} bytes`);
    logger.info(`   - 마지막 업데이트: ${stats.lastUpdated}`);
    logger.info(`   - 태그: ${stats.tags.join(', ')}`);
    logger.info(`   - 파일 타입: ${JSON.stringify(stats.fileTypes)}`);
    
    // 5. 노트 삭제 테스트
    logger.info('🗑️ 노트 삭제 테스트');
    await noteIndexingService.deleteNote(testNotePath);
    logger.info('✅ 노트 삭제 성공');
    
    // 6. 정리
    logger.info('🧹 테스트 정리');
    await cleanupTestVault(testVaultPath);
    
    logger.info('🎉 2주차 노트 인덱싱 시스템 테스트 완료!');
    
  } catch (error) {
    logger.error(`❌ 인덱싱 테스트 실패: ${error.message}`);
    throw error;
  }
}

/**
 * 테스트용 Vault 생성
 * @param {string} vaultPath - Vault 경로
 */
async function createTestVault(vaultPath) {
  try {
    await fs.mkdir(vaultPath, { recursive: true });
    
    // 테스트 노트들 생성
    const testNotes = [
      {
        name: 'test-note.md',
        content: `---
title: 테스트 노트
tags: [test, demo, markdown]
created: 2024-07-10
---

# 테스트 노트

이것은 테스트용 노트입니다. 의미론적 검색을 위한 샘플 텍스트를 포함합니다.

## 주요 내용

- **마크다운** 문법 테스트
- 태그와 메타데이터 테스트
- 긴 텍스트 청킹 테스트

### 코드 예시

\`\`\`javascript
function testFunction() {
  console.log('Hello, World!');
}
\`\`\`

### 목록 테스트

1. 첫 번째 항목
2. 두 번째 항목
3. 세 번째 항목

- 체크리스트 항목 1
- 체크리스트 항목 2
- 체크리스트 항목 3

## 결론

이 노트는 인덱싱 시스템의 다양한 기능을 테스트하기 위해 작성되었습니다.
`
      },
      {
        name: 'project-notes.md',
        content: `---
title: 프로젝트 노트
tags: [project, development, planning]
created: 2024-07-10
---

# 프로젝트 계획

## 목표

의미론적 검색 시스템을 구축하여 Obsidian 노트의 검색 효율성을 향상시킵니다.

## 기술 스택

- **백엔드**: Node.js, Express
- **AI/ML**: OpenAI API, Pinecone
- **데이터베이스**: 벡터 데이터베이스
- **프론트엔드**: React (예정)

## 개발 단계

### 1단계: 기본 인프라
- 임베딩 서비스 구축
- 벡터 데이터베이스 연동

### 2단계: 노트 인덱싱
- 자동 인덱싱 시스템
- 배치 처리 최적화

### 3단계: 검색 API
- 의미론적 검색 구현
- 하이브리드 검색 지원

### 4단계: 성능 최적화
- 캐싱 시스템
- 검색 속도 개선

## 예상 결과

- 노트 검색 정확도 80% 이상 향상
- 검색 속도 10배 이상 개선
- 사용자 경험 대폭 향상
`
      },
      {
        name: 'daily-notes/2024-07-10.md',
        content: `---
title: 2024-07-10 일일 노트
tags: [daily, 2024-07-10]
created: 2024-07-10
---

# 2024년 7월 10일

## 오늘의 목표

- [ ] 의미론적 검색 시스템 설계
- [ ] OpenAI API 연동 테스트
- [ ] 벡터 데이터베이스 설정

## 진행 상황

### 오전
- 프로젝트 초기 설정 완료
- 기본 인프라 구축 시작

### 오후
- 임베딩 서비스 구현
- 벡터 데이터베이스 연동

## 배운 점

1. **OpenAI API**: text-embedding-3-small 모델의 성능이 우수함
2. **Pinecone**: 서버리스 인덱스의 편의성
3. **벡터 검색**: 코사인 유사도의 효과

## 내일 계획

- 노트 인덱싱 시스템 구현
- 배치 처리 최적화
- 성능 테스트 진행

## 메모

> 의미론적 검색은 단순 키워드 매칭을 넘어서는 강력한 도구입니다.
> 특히 대량의 문서를 다룰 때 그 진가를 발휘합니다.
`
      },
      {
        name: 'research/ai-search.md',
        content: `---
title: AI 검색 기술 연구
tags: [research, ai, search, vector]
created: 2024-07-10
---

# AI 기반 검색 기술 연구

## 개요

최근 AI 기술의 발전으로 의미론적 검색이 주목받고 있습니다. 이 문서는 관련 기술들을 정리합니다.

## 핵심 기술

### 1. 임베딩 (Embedding)

텍스트를 고차원 벡터로 변환하는 기술입니다.

**장점:**
- 의미적 유사성 포착
- 다국어 지원
- 확장성

**단점:**
- 계산 비용
- API 의존성

### 2. 벡터 데이터베이스

고차원 벡터를 효율적으로 저장하고 검색하는 데이터베이스입니다.

**주요 제품:**
- Pinecone
- Weaviate
- Qdrant
- ChromaDB

### 3. 유사도 계산

**코사인 유사도:**
\`\`\`python
similarity = dot(A, B) / (norm(A) * norm(B))
\`\`\`

**유클리드 거리:**
\`\`\`python
distance = sqrt(sum((A - B)^2))
\`\`\`

## 구현 방법

### 1. 텍스트 전처리
- 토큰화
- 정규화
- 불용어 제거

### 2. 임베딩 생성
- OpenAI API 사용
- 배치 처리
- 캐싱

### 3. 벡터 저장
- 인덱싱
- 메타데이터 저장
- 업데이트 관리

### 4. 검색 구현
- 쿼리 임베딩
- 유사도 계산
- 결과 랭킹

## 성능 최적화

### 1. 청킹 전략
- 적절한 청크 크기
- 오버랩 설정
- 메타데이터 보존

### 2. 배치 처리
- 병렬 처리
- 메모리 관리
- 에러 핸들링

### 3. 캐싱
- 임베딩 캐시
- 검색 결과 캐시
- 메타데이터 캐시

## 결론

AI 기반 검색은 기존 키워드 검색의 한계를 극복할 수 있는 강력한 도구입니다.
적절한 구현과 최적화를 통해 사용자 경험을 크게 향상시킬 수 있습니다.
`
      }
    ];
    
    for (const note of testNotes) {
      const notePath = path.join(vaultPath, note.name);
      await fs.mkdir(path.dirname(notePath), { recursive: true });
      await fs.writeFile(notePath, note.content, 'utf-8');
    }
    
    logger.info(`✅ 테스트 Vault 생성 완료: ${vaultPath}`);
  } catch (error) {
    logger.error(`❌ 테스트 Vault 생성 실패: ${error.message}`);
    throw error;
  }
}

/**
 * 테스트 Vault 정리
 * @param {string} vaultPath - Vault 경로
 */
async function cleanupTestVault(vaultPath) {
  try {
    await fs.rm(vaultPath, { recursive: true, force: true });
    logger.info(`✅ 테스트 Vault 정리 완료: ${vaultPath}`);
  } catch (error) {
    logger.warn(`⚠️ 테스트 Vault 정리 실패: ${error.message}`);
  }
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  testIndexingSystem()
    .then(() => {
      logger.info('✅ 모든 인덱싱 테스트 통과');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`❌ 인덱싱 테스트 실패: ${error.message}`);
      process.exit(1);
    });
}

export default testIndexingSystem; 