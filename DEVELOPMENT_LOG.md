# 개발 로그 (Development Log)

## 프로젝트 개요
**Markdown MCP Server** - Obsidian Vault와 Markdown 파일을 관리하는 Model Context Protocol (MCP) 서버

## 개발 타임라인

### 2025-07-09: 초기 개발 및 완성

#### 1. MCP SDK 호환성 문제 해결
- **문제**: 최신 MCP SDK의 API 변경으로 인한 호환성 문제
- **해결책**: HTTP 기반 서버로 전환 (Express.js 사용)
- **결과**: 안정적인 서버 구현 완료

#### 2. 서버 아키텍처 결정
- **초기 계획**: MCP SDK 기반 stdio 서버
- **최종 구현**: Express.js HTTP 서버
- **이유**: SDK 호환성 문제와 더 나은 확장성

#### 3. 핵심 기능 구현
- ✅ **ObsidianManager**: Vault 통계, 노트 관리, 링크 추출
- ✅ **MarkdownManager**: 파일 관리, 검색, Frontmatter 처리
- ✅ **HTTP API**: 모든 기능을 REST API로 노출
- ✅ **테스트 스위트**: 69개 테스트로 품질 보장

#### 4. 주요 기술적 결정사항

##### 서버 구조
```javascript
// Express.js 기반 HTTP 서버
const app = express();
app.use(express.json());

// MCP 툴을 HTTP 엔드포인트로 노출
app.post('/tools/obsidian/:method', async (req, res) => {
  // ObsidianManager 메서드 호출
});

app.post('/tools/markdown/:method', async (req, res) => {
  // MarkdownManager 메서드 호출
});
```

##### 클래스 설계
```javascript
// ObsidianManager: Vault 전용 기능
class ObsidianManager {
  generateVaultStats()
  extractTodos()
  createDailyNote()
  // ...
}

// MarkdownManager: 일반 Markdown 기능
class MarkdownManager {
  listFiles()
  searchContent()
  manageFrontmatter()
  // ...
}
```

#### 5. 해결한 주요 문제들

##### 1. MCP SDK 버전 호환성
- **문제**: `@modelcontextprotocol/sdk` 최신 버전의 API 변경
- **해결**: HTTP 기반 서버로 전환하여 SDK 의존성 제거

##### 2. 파일 경로 처리
- **문제**: Obsidian Vault 경로의 안전한 처리
- **해결**: `path.resolve()` 및 경로 검증 로직 추가

##### 3. 비동기 처리
- **문제**: 파일 I/O 작업의 비동기 처리
- **해결**: Promise 기반 비동기 함수 구현

##### 4. 에러 핸들링
- **문제**: 파일 시스템 에러의 적절한 처리
- **해결**: try-catch 블록과 상세한 에러 메시지

#### 6. 테스트 전략
- **단위 테스트**: 각 클래스의 개별 메서드 테스트
- **통합 테스트**: HTTP API 엔드포인트 테스트
- **모의 데이터**: 실제 Vault 없이도 테스트 가능

#### 7. 성능 최적화
- **파일 캐싱**: 자주 사용되는 파일 정보 캐싱
- **배치 처리**: 대량 데이터 처리 시 효율성 고려
- **메모리 관리**: 대용량 파일 처리 시 메모리 사용량 제한

## 현재 상태

### ✅ 완료된 기능
1. **Obsidian Vault 관리**
   - Vault 통계 생성
   - 노트 목록 조회 (카테고리별, 최근 순)
   - 링크 추출 (내부, 외부, 임베드, 태그)
   - 백링크 찾기
   - 태그 관리

2. **Markdown 파일 관리**
   - 파일 목록 조회
   - 내용 검색 (키워드, 정규식)
   - Frontmatter 관리
   - 파일 통계

3. **고급 기능**
   - TODO 작업 추출 및 관리
   - 데일리 노트 생성
   - 템플릿 시스템
   - 첨부파일 관리

4. **HTTP API**
   - RESTful 엔드포인트
   - JSON 요청/응답
   - 에러 핸들링
   - CORS 지원

### 📊 현재 Vault 통계
- **총 노트 수**: 332개
- **총 크기**: 1.5MB
- **총 단어 수**: 172,203개
- **총 링크 수**: 1,958개
- **총 태그 수**: 1,006개

### 🧪 테스트 커버리지
- **총 테스트 수**: 69개
- **MarkdownManager**: 35개 테스트
- **ObsidianManager**: 34개 테스트
- **모든 테스트 통과**: ✅

## 기술 스택

### 백엔드
- **Node.js**: 서버 런타임
- **Express.js**: HTTP 서버 프레임워크
- **gray-matter**: Frontmatter 파싱
- **glob**: 파일 패턴 매칭

### 개발 도구
- **Jest**: 테스트 프레임워크
- **ESLint**: 코드 품질 관리
- **Docker**: 컨테이너화

### 프로젝트 구조
```
mcp_js/
├── src/
│   ├── index.js          # 서버 진입점
│   ├── server.js         # Express.js HTTP 서버
│   ├── ObsidianManager.js # Obsidian Vault 관리
│   └── MarkdownManager.js # Markdown 파일 관리
├── tests/                # 테스트 파일들
├── package.json
└── README.md
```

## 향후 개선 계획

### 단기 계획
1. **API 문서화**: Swagger/OpenAPI 스펙 추가
2. **로깅 시스템**: Winston 등 로깅 라이브러리 도입
3. **환경 설정**: dotenv를 통한 환경 변수 관리

### 중기 계획
1. **웹 UI**: 관리자 대시보드 구현
2. **실시간 업데이트**: WebSocket을 통한 실시간 통계
3. **백업 시스템**: 자동 백업 및 복원 기능

### 장기 계획
1. **플러그인 시스템**: 확장 가능한 플러그인 아키텍처
2. **클라우드 동기화**: 여러 Vault 간 동기화
3. **AI 통합**: 노트 유사성 분석 및 추천 시스템

## 학습한 교훈

### 1. API 설계
- **일관성**: 모든 엔드포인트에서 동일한 응답 형식 사용
- **에러 처리**: 명확한 에러 메시지와 HTTP 상태 코드
- **문서화**: API 사용법을 명확히 문서화

### 2. 테스트 전략
- **모의 데이터**: 실제 파일 시스템에 의존하지 않는 테스트
- **경계값 테스트**: 예외 상황에 대한 테스트 케이스
- **통합 테스트**: 전체 워크플로우 테스트

### 3. 코드 품질
- **모듈화**: 단일 책임 원칙을 따른 클래스 설계
- **에러 핸들링**: 적절한 예외 처리와 로깅
- **성능 고려**: 대용량 데이터 처리 시 메모리 사용량

## 결론

이 프로젝트는 MCP 서버의 개념을 HTTP API로 성공적으로 구현한 사례입니다. Obsidian Vault와의 완전한 통합을 통해 실제 사용 가능한 도구를 만들었으며, 포괄적인 테스트를 통해 안정성을 보장했습니다.

주요 성과:
- ✅ 안정적인 HTTP 기반 MCP 서버
- ✅ Obsidian Vault 완전 통합
- ✅ 포괄적인 기능 세트
- ✅ 높은 테스트 커버리지
- ✅ 완전한 문서화

이 프로젝트는 향후 MCP 서버 개발의 좋은 참고 사례가 될 것입니다. 