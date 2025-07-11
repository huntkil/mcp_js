# Markdown MCP Dashboard

현대적인 웹 대시보드로 Markdown 문서를 관리하고 검색할 수 있는 React 애플리케이션입니다.

## 🚀 주요 기능

- **🔍 실시간 검색**: 의미론적 검색 및 키워드 검색
- **📁 파일 관리**: 문서 업로드, 정리, 관리
- **📊 분석 대시보드**: 통계 및 활동 추적
- **⚙️ 설정 관리**: 사용자 설정 저장
- **🌙 다크모드**: 라이트/다크/시스템 모드 지원
- **📱 반응형 디자인**: 모바일 및 데스크톱 최적화

## 🛠️ 기술 스택

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Library**: ShadCN UI
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Testing**: Vitest + React Testing Library
- **Icons**: Lucide React

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 3. 빌드

```bash
npm run build
```

### 4. 린트 검사

```bash
npm run lint
```

### 5. 테스트 실행

```bash
npm test
```

## 🏗️ 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── ui/             # ShadCN UI 컴포넌트
│   ├── ThemeToggle.tsx # 다크모드 토글
│   └── ThemeProvider.tsx # 테마 프로바이더
├── hooks/              # 커스텀 훅
│   └── use-toast.ts    # 토스트 알림 훅
├── lib/                # 유틸리티
│   ├── utils.ts        # 공통 유틸리티
│   └── theme.ts        # 테마 관리
├── App.tsx             # 메인 앱 컴포넌트
├── main.tsx            # 앱 진입점
└── index.css           # 글로벌 스타일
```

## 🎨 UI 컴포넌트

### ShadCN UI 컴포넌트
- Button, Card, Input, Label
- Tabs, Badge, Separator, Progress
- DropdownMenu, Toast

### 커스텀 컴포넌트
- **ThemeToggle**: 다크모드 토글 버튼
- **ThemeProvider**: 전역 테마 관리

## 🌙 다크모드

### 기능
- 라이트/다크/시스템 모드 지원
- 로컬 스토리지에 설정 저장
- 시스템 설정 자동 감지

### 사용법
1. 우측 상단 테마 토글 버튼 클릭
2. 원하는 모드 선택:
   - ☀️ **Light**: 밝은 테마
   - 🌙 **Dark**: 어두운 테마
   - 🖥️ **System**: 시스템 설정 따라감

## ⚙️ 설정 관리

### 저장되는 설정
- API 서버 URL
- 임베딩 서비스 선택
- 자동 인덱싱 설정
- 다크모드 설정

### 설정 저장
1. Settings 탭에서 설정 변경
2. "Save Settings" 버튼 클릭
3. 로컬 스토리지에 자동 저장
4. 토스트 알림으로 결과 확인

## 🧪 테스트

### 테스트 실행
```bash
# 전체 테스트
npm test

# 감시 모드
npm test -- --watch

# 커버리지 포함
npm test -- --coverage
```

### 테스트 구조
- **Vitest**: 테스트 러너
- **React Testing Library**: 컴포넌트 테스트
- **jsdom**: DOM 환경 시뮬레이션

## 🔧 개발 가이드

### 새 컴포넌트 추가
1. `src/components/` 디렉토리에 생성
2. TypeScript 타입 정의
3. 필요한 경우 테스트 파일 추가

### ShadCN UI 컴포넌트 추가
```bash
npx shadcn@latest add [component-name]
```

### 스타일 가이드
- Tailwind CSS 클래스 사용
- ShadCN UI 디자인 시스템 준수
- 반응형 디자인 고려

## 📱 반응형 디자인

### 브레이크포인트
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### 주요 반응형 요소
- 네비게이션 탭
- 카드 그리드
- 검색 인터페이스
- 설정 패널

## 🚀 배포

### 빌드
```bash
npm run build
```

### 정적 파일 서빙
빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 환경 변수
- `VITE_API_URL`: 백엔드 API URL (선택사항)

## 🤝 기여

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## �� 라이선스

MIT License
