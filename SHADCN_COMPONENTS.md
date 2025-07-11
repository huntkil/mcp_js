# ShadCN UI Components

프로젝트에서 사용 중인 ShadCN UI 컴포넌트들과 설치 방법을 정리합니다.

## 📦 설치된 컴포넌트

### 기본 컴포넌트
- ✅ **Button** - 버튼 컴포넌트 (variant, size 지원)
- ✅ **Card** - 카드 컨테이너 (Header, Content, Title, Description)
- ✅ **Input** - 입력 필드
- ✅ **Label** - 라벨 컴포넌트
- ✅ **Tabs** - 탭 네비게이션 (List, Trigger, Content)
- ✅ **Badge** - 배지 컴포넌트
- ✅ **Separator** - 구분선
- ✅ **Progress** - 진행률 표시
- ✅ **DropdownMenu** - 드롭다운 메뉴
- ✅ **Toast** - 토스트 알림 (Toaster 포함)

### 설치 명령어
```bash
# 기본 컴포넌트들
npx shadcn@latest add button card input label tabs badge separator progress

# 드롭다운 메뉴
npx shadcn@latest add dropdown-menu

# 토스트 알림
npx shadcn@latest add toast
```

## 🎨 사용 예시

### Button
```tsx
import { Button } from '@/components/ui/button'

// 기본 버튼
<Button>Click me</Button>

// 변형 버튼
<Button variant="outline" size="sm">
  <Search className="h-4 w-4 mr-2" />
  Search
</Button>
```

### Card
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

### Tabs
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="search">Search</TabsTrigger>
    <TabsTrigger value="files">Files</TabsTrigger>
  </TabsList>
  <TabsContent value="search">
    Search content
  </TabsContent>
  <TabsContent value="files">
    Files content
  </TabsContent>
</Tabs>
```

### Toast
```tsx
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

function MyComponent() {
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully.",
    })
  }

  return (
    <div>
      <Button onClick={handleSave}>Save</Button>
      <Toaster />
    </div>
  )
}
```

### DropdownMenu
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuItem>Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## 🌙 다크모드 지원

모든 ShadCN 컴포넌트는 자동으로 다크모드를 지원합니다:

```css
/* 라이트 모드 */
.bg-background { background-color: hsl(0 0% 100%); }
.text-foreground { color: hsl(222.2 84% 4.9%); }

/* 다크 모드 */
.dark .bg-background { background-color: hsl(224 71.4% 4.1%); }
.dark .text-foreground { color: hsl(210 20% 98%); }
```

## 🔧 커스터마이징

### CSS 변수 재정의
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... */
}

.dark {
  --background: 224 71.4% 4.1%;
  --foreground: 210 20% 98%;
  --primary: 210 20% 98%;
  /* ... */
}
```

### 컴포넌트 변형 추가
```tsx
// button-variants.ts
import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

## 📱 반응형 디자인

ShadCN 컴포넌트는 Tailwind CSS의 반응형 클래스를 사용합니다:

```tsx
<Card className="w-full md:w-1/2 lg:w-1/3">
  <CardContent className="p-4 md:p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 반응형 그리드 */}
    </div>
  </CardContent>
</Card>
```

## 🧪 테스트

컴포넌트 테스트 예시:

```tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('renders button with correct text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
})
```

## 📚 추가 리소스

- [ShadCN UI 공식 문서](https://ui.shadcn.com/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Radix UI 프리미티브](https://www.radix-ui.com/primitives)
- [Class Variance Authority](https://cva.style/docs)

## 🔄 컴포넌트 업데이트

새로운 ShadCN 컴포넌트를 추가할 때:

1. 설치 명령어 실행
2. 컴포넌트 파일 확인 (`src/components/ui/`)
3. 필요한 경우 스타일 커스터마이징
4. 테스트 추가
5. 문서 업데이트