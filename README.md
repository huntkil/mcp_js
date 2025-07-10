# Markdown MCP Server

Obsidian Vault와 Markdown 파일을 관리하는 Model Context Protocol (MCP) 서버입니다. HTTP API를 통해 모든 Obsidian/Markdown 기능에 접근할 수 있습니다.

## 🚀 주요 기능

### 📊 Obsidian Vault 관리
- **Vault 통계 생성**: 전체 노트 수, 크기, 단어 수, 링크 수 등
- **노트 목록 조회**: 카테고리별, 최근 수정/생성 순 정렬
- **링크 추출**: 내부 링크, 외부 링크, 임베드, 태그 추출
- **백링크 찾기**: 특정 노트를 참조하는 다른 노트들
- **태그 관리**: 모든 태그 목록, 태그별 노트 검색

### 📝 데일리 노트 & 템플릿
- **데일리 노트 생성**: 날짜별 자동 노트 생성
- **템플릿 관리**: 생성, 조회, 목록, 삭제
- **데일리 노트 목록**: 기간별 데일리 노트 조회

### 🔍 고급 검색
- **Frontmatter 기반 검색**: 메타데이터 필드로 노트 검색
- **내용 검색**: 텍스트, 키워드, 정규식 검색
- **파일명 패턴 검색**: 와일드카드, 정규식 지원

### 📋 TODO 관리
- **TODO 추출**: 모든 노트에서 TODO 작업 추출
- **TODO 추가**: 특정 노트에 TODO 작업 추가
- **TODO 검색**: 상태별, 우선순위별 검색

### 📁 파일 관리
- **파일 목록**: 디렉토리별, 재귀적 검색
- **파일 통계**: 크기, 단어 수, 링크 수 등
- **첨부파일 관리**: 이미지, PDF 등 첨부파일 목록

## 🛠️ 기술 스택

- **Node.js**: 서버 런타임
- **Express.js**: HTTP 서버 프레임워크
- **ObsidianManager**: Obsidian Vault 관리 클래스
- **MarkdownManager**: Markdown 파일 관리 클래스
- **gray-matter**: Frontmatter 파싱
- **glob**: 파일 패턴 매칭

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 서버 실행
```bash
npm start
```

서버가 `http://localhost:8080`에서 실행됩니다.

## 🌐 API 엔드포인트

### 기본 정보
- `GET /` - 서버 상태 확인
- `GET /tools` - 사용 가능한 툴 목록

### Obsidian 툴
- `POST /tools/obsidian/getAllTags` - 모든 태그 목록
- `POST /tools/obsidian/generateVaultStats` - Vault 통계
- `POST /tools/obsidian/getRecentlyModifiedNotes` - 최근 수정된 노트
- `POST /tools/obsidian/getRecentlyCreatedNotes` - 최근 생성된 노트
- `POST /tools/obsidian/extractTodos` - TODO 작업 추출
- `POST /tools/obsidian/extractLinks` - 노트에서 링크 추출
- `POST /tools/obsidian/createDailyNote` - 데일리 노트 생성

### Markdown 툴
- `POST /tools/markdown/listFiles` - 파일 목록 조회
- `POST /tools/markdown/searchContent` - 내용 검색
- `POST /tools/markdown/manageFrontmatter` - Frontmatter 관리

## 📖 사용 예제

### 1. 서버 상태 확인
```bash
curl http://localhost:8080
```

### 2. Vault 통계 가져오기
```bash
curl -X POST http://localhost:8080/tools/obsidian/generateVaultStats \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. 최근 수정된 노트 목록
```bash
curl -X POST http://localhost:8080/tools/obsidian/getRecentlyModifiedNotes \
  -H "Content-Type: application/json" \
  -d '{"days": 7, "limit": 10}'
```

### 4. 특정 카테고리의 파일 목록
```bash
curl -X POST http://localhost:8080/tools/markdown/listFiles \
  -H "Content-Type: application/json" \
  -d '{"directory": "Health", "recursive": true}'
```

### 5. 내용 검색
```bash
curl -X POST http://localhost:8080/tools/markdown/searchContent \
  -H "Content-Type: application/json" \
  -d '{"query": "마라톤", "caseSensitive": false}'
```

### 6. TODO 작업 추출
```bash
curl -X POST http://localhost:8080/tools/obsidian/extractTodos \
  -H "Content-Type: application/json" \
  -d '{"status": "pending"}'
```

## 🔧 설정

### 환경 변수
- `BASE_PATH`: Obsidian Vault 경로 (기본값: `/Users/gukho/Library/Mobile Documents/iCloud~md~obsidian/Documents/My Card`)
- `PORT`: 서버 포트 (기본값: 8080)

### 예시
```bash
export BASE_PATH="/path/to/your/obsidian/vault"
export PORT=3000
npm start
```

## 📊 현재 Vault 통계

- **총 노트 수**: 332개
- **총 크기**: 1.5MB
- **총 단어 수**: 172,203개
- **총 링크 수**: 1,958개
- **총 태그 수**: 1,006개

### 주요 카테고리
- **Health (건강)**: 30개 노트
- **9. Diary (일기)**: 60개 노트
- **Projects**: 16개 노트
- **3. Study/Data Science**: 25개 노트

## 🏗️ 프로젝트 구조

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

## 🧪 테스트

```bash
npm test
```

## 📝 개발 히스토리

### v1.0.0 (2025-07-09)
- ✅ MCP SDK 기반 서버 구현
- ✅ HTTP 기반 서버로 전환 (Express.js)
- ✅ 모든 Obsidian/Markdown 기능 API 노출
- ✅ 실시간 Vault 통계 및 노트 관리
- ✅ TODO 관리, 데일리 노트, 템플릿 기능
- ✅ 고급 검색 및 Frontmatter 관리

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 🔗 관련 링크

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Obsidian](https://obsidian.md/)
- [Express.js](https://expressjs.com/) 