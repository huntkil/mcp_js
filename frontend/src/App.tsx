import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  FileText, 
  Brain, 
  Link, 
  Settings, 
  Database,
  Sparkles,
  Target,
  TrendingUp,
  Moon,
  Sun
} from 'lucide-react'
import SearchTab from './components/SearchTab'
import RecommendationsTab from './components/RecommendationsTab'
import AdvancedFeaturesTab from './components/AdvancedFeaturesTab'
import PerformanceTab from './components/PerformanceTab'

const queryClient = new QueryClient()

function App() {
  const [activeTab, setActiveTab] = useState('search')
  const [isDarkMode, setIsDarkMode] = useState(false)

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
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Online
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Ready
                  </Badge>
                </div>
                
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
      </div>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
