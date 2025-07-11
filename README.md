# Markdown MCP Server with Advanced Search & Dashboard

고품질 한국어 임베딩을 통한 의미론적 검색이 가능한 Markdown MCP 서버와 현대적인 웹 대시보드입니다.

## 주요 기능

### 🔍 검색 및 분석
- **고품질 한국어 임베딩**: Python sentence-transformers 기반 한국어 최적화 모델 사용
- **의미론적 검색**: 텍스트 의미를 이해하는 지능형 검색
- **하이브리드 검색**: 키워드 + 의미론적 검색 조합
- **자동 요약**: AI 기반 노트 요약 생성
- **지식 그래프**: 노트 간 관계 시각화
- **스마트 태깅**: 자동 태그 생성 및 분류

### 🖥️ 웹 대시보드
- **현대적인 UI**: ShadCN UI + Tailwind CSS
- **다크모드 지원**: 라이트/다크/시스템 모드
- **실시간 검색**: 즉시 결과 표시
- **파일 관리**: 업로드, 정리, 관리
- **분석 대시보드**: 통계 및 활동 추적
- **설정 관리**: 사용자 설정 저장

### 🔧 기술 스택
- **백엔드**: Node.js + Express
- **프론트엔드**: React + TypeScript + Vite
- **UI**: ShadCN UI + Tailwind CSS
- **임베딩**: Python + sentence-transformers
- **테스트**: Vitest + React Testing Library

## 아키텍처

```
┌─────────────────┐    HTTP    ┌──────────────────┐
│   React App     │ ────────── │   Node.js MCP    │
│   (Frontend)    │            │     Server       │
│                 │            │                  │
│ - Dashboard     │            │ - Search API     │
│ - Search UI     │            │ - Vault Mgmt     │
│ - Settings      │            │ - Vector DB      │
└─────────────────┘            └──────────────────┘
                                        │
                                        │ HTTP
                                        ▼
                               ┌──────────────────┐
                               │ Python Embedding │
                               │     Server       │
                               │                  │
                               │ - KoSimCSE       │
                               │ - 768D Vectors   │
                               │ - FastAPI        │
                               └──────────────────┘
```

## 설치 및 실행

### 1. 환경 설정

```bash
# 저장소 클론
git clone <repository-url>
cd mcp_js

# 환경 변수 설정
cp env.example .env
# .env 파일에서 OBSIDIAN_VAULT_PATH 설정
```

### 2. Python 임베딩 서버 설정

```bash
# Python 3.9+ 설치 필요
cd embedding-server

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python embedding_server.py
# 또는
python start_server.py
```

### 3. 백엔드 서버 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 프로덕션 모드 실행
npm start
```

### 4. 프론트엔드 대시보드 실행

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

### 5. Docker로 실행 (권장)

```bash
# 전체 시스템 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

## 웹 대시보드 사용법

### 🏠 메인 화면
- **Search**: 의미론적 검색 및 결과 표시
- **Files**: 문서 관리 및 업로드
- **Analytics**: 통계 및 활동 분석
- **Settings**: 시스템 설정 관리

### 🔍 검색 기능
1. Search 탭에서 검색어 입력
2. 실시간으로 관련 문서 표시
3. 각 문서의 관련도 점수 확인
4. 문서 클릭하여 상세 내용 보기

### ⚙️ 설정 관리
1. Settings 탭에서 설정 변경
2. API 서버 URL, 임베딩 서비스 선택
3. 자동 인덱싱, 다크모드 설정
4. "Save Settings" 버튼으로 저장

### 🌙 다크모드
- 우측 상단 테마 토글 버튼 클릭
- Light/Dark/System 모드 선택
- 설정이 자동으로 저장됨

## API 사용법

### 검색 API

```bash
# 의미론적 검색
curl -X POST http://localhost:8080/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "마음근력", "topK": 10, "threshold": 0.7}'

# 키워드 검색
curl -X POST http://localhost:8080/api/search/keyword \
  -H "Content-Type: application/json" \
  -d '{"query": "명상", "topK": 10}'

# 하이브리드 검색
curl -X POST http://localhost:8080/api/search/hybrid \
  -H "Content-Type: application/json" \
  -d '{"query": "자기조절력", "topK": 10, "semanticWeight": 0.7}'
```

### 인덱싱 API

```bash
# Vault 인덱싱
curl -X POST http://localhost:8080/api/index

# 특정 폴더 인덱싱
curl -X POST http://localhost:8080/api/index/folder \
  -H "Content-Type: application/json" \
  -d '{"folderPath": "Life_Philosophy"}'
```

## 개발

### 프론트엔드 개발

```bash
cd frontend

# 개발 서버 실행
npm run dev

# 린트 검사
npm run lint

# 테스트 실행
npm test

# 빌드
npm run build
```

### 백엔드 개발

```bash
# 개발 모드 실행
npm run dev

# 테스트 실행
npm test

# 로그 레벨 설정
LOG_LEVEL=debug npm run dev
```

### 테스트

```bash
# 프론트엔드 테스트
cd frontend && npm test

# 백엔드 테스트
npm test

# 특정 테스트
npm test -- --testPathPattern="search.test.js"
```

## 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `PYTHON_EMBEDDING_URL` | Python 임베딩 서버 URL | `http://localhost:8000` |
| `EMBEDDING_MODE` | 임베딩 모드 (python/local) | `local` |
| `OBSIDIAN_VAULT_PATH` | Obsidian Vault 경로 | - |
| `VECTOR_DB_MODE` | 벡터 DB 모드 (local/pinecone) | `local` |
| `PORT` | 백엔드 서버 포트 | `8080` |

## 임베딩 모델 정보

- **모델**: `jhgan/ko-sroberta-multitask`
- **차원**: 768차원
- **언어**: 한국어 최적화
- **성능**: 의미론적 이해도 90%+

## 라이선스

MIT License

## 기여

Pull Request 및 Issue 환영합니다! 