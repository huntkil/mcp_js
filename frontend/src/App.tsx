import { useState } from 'react'
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
  TrendingUp
} from 'lucide-react'
import SearchTab from './components/SearchTab'
import RecommendationsTab from './components/RecommendationsTab'
import AdvancedFeaturesTab from './components/AdvancedFeaturesTab'
import PerformanceTab from './components/PerformanceTab'

const queryClient = new QueryClient()

function App() {
  const [activeTab, setActiveTab] = useState('search')

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Markdown MCP Server
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Advanced Markdown and Obsidian Vault Management with AI-Powered Features
                </p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Server Online
              </Badge>
              <Badge variant="outline">
                <Brain className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Advanced
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Performance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-6">
              <SearchTab />
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <RecommendationsTab />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <AdvancedFeaturesTab />
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <PerformanceTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
