# UI 디자인 시스템 가이드

## 🎯 개요
이 문서는 **ShadCN UI + Tailwind CSS + Lucide React** 기반의 모던한 디자인 시스템을 다른 프로젝트에 적용하기 위한 완전한 가이드입니다.

---

## 📦 필수 패키지 설치

### 1. ShadCN UI 초기화
```bash
npx shadcn@latest init
```

설정 옵션:
- Style: `new-york`
- Base color: `gray`
- CSS variables: `yes`
- React Server Components: `yes`
- TypeScript: `yes`
- Tailwind CSS: `yes`
- CSS import: `app/globals.css`
- Components path: `@/components`
- Utils path: `@/lib/utils`
- Include example components: `no`

### 2. 필수 의존성 설치
```bash
# Radix UI 컴포넌트들
npm install @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast

# 유틸리티 라이브러리
npm install class-variance-authority clsx tailwind-merge

# 아이콘
npm install lucide-react

# 테마 관리
npm install next-themes

# 애니메이션
npm install tailwindcss-animate
```

---

## 🎨 스타일 파일 설정

### 1. tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 2. app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 224 71.4% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 224 71.4% 4.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 224 71.4% 4.1%;
    --primary: 220.9 39.3% 11%;
    --primary-foreground: 210 20% 98%;
    --secondary: 220 14.3% 95.9%;
    --secondary-foreground: 220.9 39.3% 11%;
    --muted: 220 14.3% 95.9%;
    --muted-foreground: 220 8.9% 46.1%;
    --accent: 220 14.3% 95.9%;
    --accent-foreground: 220.9 39.3% 11%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 20% 98%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 224 71.4% 4.1%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    --background: 224 71.4% 4.1%;
    --foreground: 210 20% 98%;
    --card: 224 71.4% 4.1%;
    --card-foreground: 210 20% 98%;
    --popover: 224 71.4% 4.1%;
    --popover-foreground: 210 20% 98%;
    --primary: 210 20% 98%;
    --primary-foreground: 220.9 39.3% 11%;
    --secondary: 215 27.9% 16.9%;
    --secondary-foreground: 210 20% 98%;
    --muted: 215 27.9% 16.9%;
    --muted-foreground: 217.9 10.6% 64.9%;
    --accent: 215 27.9% 16.9%;
    --accent-foreground: 210 20% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 20% 98%;
    --border: 215 27.9% 16.9%;
    --input: 215 27.9% 16.9%;
    --ring: 216 12.2% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 🔧 유틸리티 파일 설정

### lib/utils.ts
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 🧩 ShadCN 컴포넌트 설치

### 기본 컴포넌트들
```bash
# 필수 컴포넌트
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add toast
npx shadcn@latest add progress
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add switch
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add textarea
npx shadcn@latest add scroll-area
npx shadcn@latest add collapsible
npx shadcn@latest add sheet
npx shadcn@latest add alert
```

---

## 🌙 테마 시스템 설정

### components/ThemeProvider.tsx
```typescript
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### components/ThemeToggle.tsx
```typescript
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### app/layout.tsx 설정
```typescript
import { ThemeProvider } from "@/components/ThemeProvider"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## 📁 디렉토리 구조

```
components/
├── ui/                    # ShadCN 컴포넌트들
│   ├── alert.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── checkbox.tsx
│   ├── collapsible.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── progress.tsx
│   ├── radio-group.tsx
│   ├── scroll-area.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── switch.tsx
│   ├── tabs.tsx
│   ├── textarea.tsx
│   ├── toast.tsx
│   └── toaster.tsx
├── ThemeProvider.tsx
└── ThemeToggle.tsx

lib/
└── utils.ts

app/
├── globals.css
└── layout.tsx

hooks/
└── use-toast.ts
```

---

## 🎨 컴포넌트 사용 예시

### 기본 카드 컴포넌트
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Plus } from "lucide-react"

export function SearchCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          검색
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">검색어</Label>
          <Input id="search" placeholder="검색어를 입력하세요" />
        </div>
        <Button className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          검색하기
        </Button>
      </CardContent>
    </Card>
  )
}
```

### 탭 컴포넌트
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TabExample() {
  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">계정</TabsTrigger>
        <TabsTrigger value="password">비밀번호</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>계정 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <p>계정 정보를 관리하세요.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>비밀번호 변경</CardTitle>
          </CardHeader>
          <CardContent>
            <p>비밀번호를 변경하세요.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
```

### 드롭다운 메뉴
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Settings, User, LogOut } from "lucide-react"

export function DropdownMenuExample() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>내 계정</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          프로필
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          설정
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## 🚀 빠른 시작 스크립트

### setup-design-system.sh
```bash
#!/bin/bash

echo "🎨 UI 디자인 시스템 설정을 시작합니다..."

# 1. ShadCN 초기화
echo "📦 ShadCN UI 초기화 중..."
npx shadcn@latest init --yes

# 2. 필수 패키지 설치
echo "📦 필수 패키지 설치 중..."
npm install @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast class-variance-authority clsx tailwind-merge lucide-react next-themes tailwindcss-animate

# 3. 기본 컴포넌트 설치
echo "🧩 기본 컴포넌트 설치 중..."
npx shadcn@latest add button card input label dialog dropdown-menu select tabs toast progress avatar badge separator switch checkbox radio-group textarea scroll-area collapsible sheet alert

echo "✅ UI 디자인 시스템 설정이 완료되었습니다!"
echo "📝 다음 단계:"
echo "1. app/globals.css 파일을 위의 내용으로 교체"
echo "2. tailwind.config.js 파일을 위의 내용으로 교체"
echo "3. lib/utils.ts 파일 생성"
echo "4. components/ThemeProvider.tsx 파일 생성"
echo "5. app/layout.tsx에 ThemeProvider 추가"
```

---

## 🎯 디자인 원칙

### 1. 색상 시스템
- **Primary**: 주요 액션과 브랜드 색상
- **Secondary**: 보조 액션과 배경
- **Muted**: 비활성화된 요소
- **Destructive**: 삭제, 취소 등 위험한 액션
- **Accent**: 강조 요소

### 2. 간격 시스템
- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

### 3. 타이포그래피
- **text-xs**: 0.75rem (12px)
- **text-sm**: 0.875rem (14px)
- **text-base**: 1rem (16px)
- **text-lg**: 1.125rem (18px)
- **text-xl**: 1.25rem (20px)
- **text-2xl**: 1.5rem (24px)

### 4. 반응형 디자인
- **sm**: 640px 이상
- **md**: 768px 이상
- **lg**: 1024px 이상
- **xl**: 1280px 이상
- **2xl**: 1536px 이상

---

## 🔧 커스터마이징

### 색상 테마 변경
`app/globals.css`의 CSS 변수를 수정하여 색상 테마를 변경할 수 있습니다:

```css
:root {
  --primary: 220.9 39.3% 11%; /* 기본 회색 */
  /* 파란색 테마로 변경하려면: */
  --primary: 221.2 83.2% 53.3%;
}
```

### 컴포넌트 스타일 오버라이드
```typescript
// 커스텀 버튼 스타일
<Button className="bg-blue-500 hover:bg-blue-600 text-white">
  커스텀 버튼
</Button>

// 커스텀 카드 스타일
<Card className="border-2 border-blue-200 shadow-lg">
  <CardContent>커스텀 카드</CardContent>
</Card>
```

---

## 📚 추가 리소스

- [ShadCN UI 공식 문서](https://ui.shadcn.com/)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/)
- [Lucide React 아이콘](https://lucide.dev/)
- [Radix UI 컴포넌트](https://www.radix-ui.com/)

---

## 🎉 완료!

이제 다른 프로젝트에서 이 디자인 시스템을 사용할 수 있습니다. 모든 컴포넌트는 TypeScript로 작성되어 타입 안전성을 보장하며, 다크모드와 라이트모드를 자동으로 지원합니다. 