import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  FileText, 
  Sparkles,
  Target,
  TrendingUp,
  Moon,
  Sun,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import SearchTab from './components/SearchTab'
import RecommendationsTab from './components/RecommendationsTab'
import AdvancedFeaturesTab from './components/AdvancedFeaturesTab'
import PerformanceTab from './components/PerformanceTab'

const queryClient = new QueryClient()

// 상태 컴포넌트
const StatusIndicator = ({ status, label, details }: { status: 'online' | 'offline' | 'warning'; label: string; details?: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'online':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20'
        }
      default:
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <div className="group relative">
      <Badge 
        variant="outline" 
        className={`${config.bgColor} ${config.color} ${config.borderColor} cursor-help`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
      {details && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {details}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  )
}

// 시스템 상태 컴포넌트
const SystemStatus = () => {
  const { data: stats } = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      try {
        const response = await fetch('http://localhost:8080/api/performance/stats')
        if (!response.ok) throw new Error('Server not responding')
        return response.json()
      } catch {
        return null
      }
    },
    refetchInterval: 10000, // 10초마다 갱신
  })

  const serverStatus = stats ? 'online' : 'offline'
  const aiStatus = stats?.vectorCount > 0 ? 'online' : 'warning'
  const dbStatus = stats?.status === 'healthy' ? 'online' : 'warning'

  return (
    <div className="flex items-center gap-2">
      <StatusIndicator 
        status={serverStatus}
        label="Server"
        details={serverStatus === 'online' ? '백엔드 서버 정상 동작' : '백엔드 서버 연결 실패'}
      />
      <StatusIndicator 
        status={aiStatus}
        label="AI"
        details={aiStatus === 'online' ? `${stats?.vectorCount || 0}개 벡터 로드됨` : 'AI 모델 로드 필요'}
      />
      <StatusIndicator 
        status={dbStatus}
        label="DB"
        details={dbStatus === 'online' ? '벡터 데이터베이스 정상' : '데이터베이스 상태 확인 필요'}
      />
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('search')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // 다크모드 상태 초기화 및 로컬 스토리지에서 복원
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true')
    } else {
      setIsDarkMode(prefersDark)
    }
  }, [])

  // 다크모드 상태 변경 시 HTML 클래스 및 로컬 스토리지 업데이트
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', isDarkMode.toString())
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const getTabInfo = (tab: string) => {
    const tabs = {
      search: {
        title: '검색',
        description: '의미론적, 키워드, 하이브리드 검색',
        icon: Search,
        color: 'from-blue-500 to-cyan-500'
      },
      recommendations: {
        title: '추천',
        description: 'AI 기반 유사 노트 추천',
        icon: Sparkles,
        color: 'from-purple-500 to-pink-500'
      },
      advanced: {
        title: '고급 기능',
        description: '요약, 태깅, 지식 그래프',
        icon: Target,
        color: 'from-orange-500 to-red-500'
      },
      performance: {
        title: '성능',
        description: '실시간 성능 모니터링',
        icon: TrendingUp,
        color: 'from-green-500 to-emerald-500'
      }
    }
    return tabs[tab as keyof typeof tabs]
  }

  const tabInfo = getTabInfo(activeTab)
  const TabIcon = tabInfo.icon

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
        {/* Header */}
        <header className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Title */}
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Markdown MCP Server
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    AI-Powered Vault Management
                  </p>
                </div>
              </div>

              {/* Status and Controls */}
              <div className="flex items-center gap-4">
                <SystemStatus />
                
                {/* Help Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHelp(!showHelp)}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  도움말
                </Button>
                
                {/* Dark Mode Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="w-4 h-4 mr-2" />
                      Light
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 mr-2" />
                      Dark
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Current Tab Info */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 bg-gradient-to-br ${tabInfo.color} rounded-lg`}>
                <TabIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {tabInfo.title}
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              {tabInfo.description}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-1 shadow-lg">
                <TabsTrigger 
                  value="search" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="recommendations" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Recommendations</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="advanced" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
                >
                  <Target className="w-4 h-4" />
                  <span className="hidden sm:inline">Advanced</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="performance" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Performance</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <div className="space-y-6 mt-6">
                <TabsContent value="search" className="mt-0">
                  <SearchTab />
                </TabsContent>

                <TabsContent value="recommendations" className="mt-0">
                  <RecommendationsTab />
                </TabsContent>

                <TabsContent value="advanced" className="mt-0">
                  <AdvancedFeaturesTab />
                </TabsContent>

                <TabsContent value="performance" className="mt-0">
                  <PerformanceTab />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">사용법 가이드</h3>
                <Button variant="outline" size="sm" onClick={() => setShowHelp(false)}>
                  닫기
                </Button>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">🔍 검색</h4>
                  <p>의미론적, 키워드, 하이브리드 검색을 통해 노트를 찾을 수 있습니다. 최근 검색어는 자동으로 저장됩니다.</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">✨ 추천</h4>
                  <p>AI가 유사한 노트를 추천해줍니다. 유사도 점수와 함께 관련 노트를 확인할 수 있습니다.</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🎯 고급 기능</h4>
                  <p>텍스트 요약, 스마트 태깅, 지식 그래프 생성 등 AI 기반 고급 기능을 활용하세요.</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">📊 성능</h4>
                  <p>실시간 성능 모니터링과 최적화 권장사항을 확인할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
