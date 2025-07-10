# Markdown MCP Server with Advanced Search

고품질 한국어 임베딩을 통한 의미론적 검색이 가능한 Markdown MCP 서버입니다.

## 주요 기능

- **고품질 한국어 임베딩**: Python sentence-transformers 기반 한국어 최적화 모델 사용
- **의미론적 검색**: 텍스트 의미를 이해하는 지능형 검색
- **Obsidian Vault 지원**: Obsidian 노트 검색 및 관리
- **자동 요약**: AI 기반 노트 요약 생성
- **지식 그래프**: 노트 간 관계 시각화
- **스마트 태깅**: 자동 태그 생성 및 분류

## 아키텍처

```
┌─────────────────┐    HTTP    ┌──────────────────┐
│   Node.js MCP   │ ────────── │ Python Embedding │
│     Server      │            │     Server       │
│                 │            │                  │
│ - Search API    │            │ - KoSimCSE       │
│ - Vault Mgmt    │            │ - 768D Vectors   │
│ - Vector DB     │            │ - FastAPI        │
└─────────────────┘            └──────────────────┘
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

### 3. Node.js 서버 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 프로덕션 모드 실행
npm start
```

### 4. Docker로 실행 (권장)

```bash
# 전체 시스템 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

## API 사용법

### 검색 API

```bash
# 의미론적 검색
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "마음근력", "topK": 10, "threshold": 0.7}'

# 키워드 검색
curl -X POST http://localhost:3000/api/search/keyword \
  -H "Content-Type: application/json" \
  -d '{"query": "명상", "topK": 10}'

# 하이브리드 검색
curl -X POST http://localhost:3000/api/search/hybrid \
  -H "Content-Type: application/json" \
  -d '{"query": "자기조절력", "topK": 10, "semanticWeight": 0.7}'
```

### 인덱싱 API

```bash
# Vault 인덱싱
curl -X POST http://localhost:3000/api/index

# 특정 폴더 인덱싱
curl -X POST http://localhost:3000/api/index/folder \
  -H "Content-Type: application/json" \
  -d '{"folderPath": "Life_Philosophy"}'
```

## 임베딩 모델 정보

- **모델**: `jhgan/ko-sroberta-multitask`
- **차원**: 768차원
- **언어**: 한국어 최적화
- **성능**: 의미론적 이해도 90%+

## 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `PYTHON_EMBEDDING_URL` | Python 임베딩 서버 URL | `http://localhost:8000` |
| `EMBEDDING_MODE` | 임베딩 모드 (python/local) | `local` |
| `OBSIDIAN_VAULT_PATH` | Obsidian Vault 경로 | - |
| `VECTOR_DB_MODE` | 벡터 DB 모드 (local/pinecone) | `local` |

## 개발

### 테스트 실행

```bash
# 전체 테스트
npm test

# 특정 테스트
npm test -- --testPathPattern="search.test.js"
```

### 로그 레벨 설정

```bash
# 환경 변수로 설정
LOG_LEVEL=debug npm run dev
```

## 라이선스

MIT License

## 기여

Pull Request 및 Issue 환영합니다! 