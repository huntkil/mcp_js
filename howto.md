# MCP JS 서버 사용 및 테스트 HOWTO

---

## 1. 환경 준비 및 설정

### 1.1. 의존성 설치
```sh
npm install
```

### 1.2. 환경 변수(.env) 설정
- `env.example` 파일을 복사해 `.env`로 만듭니다.
- API 키는 선택사항이며, 없어도 로컬 임베딩으로 동작합니다.

```sh
cp env.example .env
# .env 파일을 열어 원하는 설정을 입력
```

#### 주요 환경 변수 예시
```
# OpenAI API (선택사항)
OPENAI_API_KEY=sk-...

# Pinecone 벡터 DB (선택사항)
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=markdown-notes

# 임베딩 서비스 선택
USE_LOCAL_EMBEDDING=true  # 로컬 임베딩 사용
# USE_LOCAL_EMBEDDING=false  # OpenAI 또는 Mock 사용

# 서버 설정
PORT=8080
```

#### 임베딩 서비스 옵션
1. **로컬 임베딩** (`USE_LOCAL_EMBEDDING=true`): API 키 없이 로컬에서 임베딩 생성
2. **OpenAI 임베딩** (`USE_LOCAL_EMBEDDING=false` + API 키): 고품질 임베딩 (유료)
3. **Mock 임베딩** (기본값): API 키 없을 때 자동으로 Mock 모드 동작

---

## 2. 서버 실행
```sh
npm start
```
- 기본적으로 `localhost:3000`에서 서버가 실행됩니다.
- 포트는 `.env`의 `PORT`로 변경 가능

---

## 3. API 문서 및 테스트

### 3.1. Swagger (OpenAPI) 문서
- 브라우저에서 [http://localhost:3000/api-docs](http://localhost:3000/api-docs) 접속
- 모든 엔드포인트(Obsidian, Markdown, Search, Performance 등) 사용법, 파라미터, 예시 확인 및 직접 테스트 가능

### 3.2. 주요 API 엔드포인트 예시

#### 1) 노트 인덱싱
```sh
curl -X POST http://localhost:3000/api/index \
  -H "Content-Type: application/json" \
  -d '{"vaultPath": "/path/to/your/obsidian/vault"}'
```

#### 2) 의미론적(벡터) 검색
```sh
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "AI 기술", "topK": 5}'
```

#### 3) 키워드 검색
```sh
curl -X POST http://localhost:3000/api/search/keyword \
  -H "Content-Type: application/json" \
  -d '{"query": "프로젝트", "topK": 5}'
```

#### 4) 하이브리드 검색
```sh
curl -X POST http://localhost:3000/api/search/hybrid \
  -H "Content-Type: application/json" \
  -d '{"query": "AI 기술", "topK": 5}'
```

#### 5) 성능 최적화/모니터링
```sh
curl -X POST http://localhost:3000/api/performance/auto-optimize
curl -X POST http://localhost:3000/api/performance/monitoring/start
curl -X POST http://localhost:3000/api/performance/monitoring/stop
```

#### 6) 기타 기능
- 백링크, 스마트 태그, 지식 그래프, 통계 등 다양한 기능은 Swagger에서 상세 확인

---

## 4. 자동화 테스트 실행
```sh
npm test
```
- `src/tests/`의 모든 테스트가 실행됩니다.
- 실제 API 키가 없으면 mock(모킹)으로 동작하여 안전하게 테스트 가능

---

## 5. 실제 Obsidian Vault 연동 실험
- `vaultPath`에 실제 Obsidian 노트 디렉토리 경로를 지정해 인덱싱/검색/통계 등 실험 가능
- 예시:
```sh
curl -X POST http://localhost:3000/api/index \
  -H "Content-Type: application/json" \
  -d '{"vaultPath": "/Users/username/Obsidian/MyVault"}'
```

---

## 6. 문제 해결 및 FAQ

### Q. OpenAI/Pinecone 키가 없으면?
- **로컬 임베딩 모드**: `.env`에서 `USE_LOCAL_EMBEDDING=true`로 설정하면 API 키 없이도 로컬에서 임베딩 생성
- **Mock 모드**: 기본적으로 Mock으로 동작하여 테스트 가능
- **실제 검색 품질**: OpenAI API 키를 사용하면 가장 높은 품질, 로컬 임베딩은 중간 품질

### Q. API가 500 에러를 반환하면?
- 서버 로그(`npm start` 실행 터미널)에서 에러 메시지 확인
- .env 설정, vaultPath 경로, 파일 권한 등을 점검

### Q. Swagger에서 요청이 안 될 때?
- 서버가 정상 실행 중인지, 포트가 맞는지 확인
- CORS 문제는 발생하지 않음 (Express 기본 설정)

### Q. 테스트가 실패할 때?
- `src/tests/` 내 테스트 코드와 실제 서비스 코드가 동기화되어 있는지 확인
- 의존성(`npm install`) 및 환경 변수 재확인

---

## 7. 기타 참고
- 모든 API는 RESTful 구조로 설계되어 있어, 프론트엔드/외부 시스템 연동이 용이
- Swagger에서 요청/응답 예시, 파라미터 설명, 응답 구조를 쉽게 확인 가능
- 추가 기능/테스트/연동 문의는 README 또는 이 HOWTO에 자유롭게 추가

---

**문의/이슈는 GitHub PR/Issue로 남겨주세요!** 