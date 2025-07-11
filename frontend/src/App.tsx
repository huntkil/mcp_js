import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Search, FileText, Settings, BarChart3, Plus, Upload } from 'lucide-react'
import { ThemeToggle } from './components/ThemeToggle'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('search')
  const [settings, setSettings] = useState<{
    apiUrl: string
    embeddingService: string
    autoIndex: boolean
    darkMode: boolean
  }>(() => {
    const saved = localStorage.getItem('app-settings')
    return saved ? JSON.parse(saved) : {
      apiUrl: 'http://localhost:8080',
      embeddingService: 'local',
      autoIndex: true,
      darkMode: false
    }
  })
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Markdown MCP Dashboard</h1>
            <p className="text-muted-foreground">Manage and search your markdown files with AI-powered insights</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Documents</CardTitle>
                <CardDescription>
                  Search through your markdown files using semantic search and AI-powered insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="search" className="sr-only">Search</Label>
                                         <Input
                       id="search"
                       placeholder="Search your documents..."
                       value={searchQuery}
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                       className="w-full"
                     />
                  </div>
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">AI Technology</Badge>
                        <span className="text-xs text-muted-foreground">2 days ago</span>
                      </div>
                      <h3 className="font-semibold mb-1">Artificial Intelligence Overview</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        Comprehensive guide to artificial intelligence concepts, applications, and future trends...
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">Machine Learning</Badge>
                        <span className="text-xs text-muted-foreground">1 week ago</span>
                      </div>
                      <h3 className="font-semibold mb-1">Machine Learning Fundamentals</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        Introduction to machine learning algorithms, supervised and unsupervised learning...
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">Psychology</Badge>
                        <span className="text-xs text-muted-foreground">3 days ago</span>
                      </div>
                      <h3 className="font-semibold mb-1">Mental Strength Development</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        Techniques and strategies for building mental resilience and emotional intelligence...
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Document Management</CardTitle>
                    <CardDescription>
                      Upload, organize, and manage your markdown files
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New File
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">ai-technology.md</h4>
                        <p className="text-sm text-muted-foreground">AI Technology Overview</p>
                      </div>
                    </div>
                    <Badge variant="outline">2.3 KB</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">machine-learning.md</h4>
                        <p className="text-sm text-muted-foreground">Machine Learning Fundamentals</p>
                      </div>
                    </div>
                    <Badge variant="outline">1.8 KB</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">mind-strength.md</h4>
                        <p className="text-sm text-muted-foreground">Mental Strength Development</p>
                      </div>
                    </div>
                    <Badge variant="outline">3.1 KB</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Words</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12,847</div>
                  <p className="text-xs text-muted-foreground">
                    +1,234 from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Search Queries</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-muted-foreground">
                    +23 from last week
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.4 MB</div>
                  <Progress value={65} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    65% of available space
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your recent document activities and searches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Searched for "machine learning"</span>
                    <span className="text-xs text-muted-foreground ml-auto">2 hours ago</span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Updated ai-technology.md</span>
                    <span className="text-xs text-muted-foreground ml-auto">1 day ago</span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Created new file mind-strength.md</span>
                    <span className="text-xs text-muted-foreground ml-auto">3 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Configure your markdown management preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="api-url">API Server URL</Label>
                  <Input
                    id="api-url"
                    placeholder="http://localhost:8080"
                    value={settings.apiUrl}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiUrl: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="embedding-service">Embedding Service</Label>
                  <select
                    id="embedding-service"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    value={settings.embeddingService}
                    onChange={(e) => setSettings(prev => ({ ...prev, embeddingService: e.target.value }))}
                  >
                    <option value="local">Local Embedding Service</option>
                    <option value="python">Python Embedding Server</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-index"
                    className="rounded border-gray-300"
                    checked={settings.autoIndex}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoIndex: e.target.checked }))}
                  />
                  <Label htmlFor="auto-index">Auto-index new files</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dark-mode"
                    className="rounded border-gray-300"
                    checked={settings.darkMode}
                    onChange={(e) => setSettings(prev => ({ ...prev, darkMode: e.target.checked }))}
                  />
                  <Label htmlFor="dark-mode">Dark mode</Label>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={async () => {
                    setIsSaving(true)
                    try {
                      // 로컬 스토리지에 설정 저장
                      localStorage.setItem('app-settings', JSON.stringify(settings))
                      
                      // 실제로는 여기서 백엔드 API에 설정을 저장
                      await new Promise(resolve => setTimeout(resolve, 1000)) // 시뮬레이션
                      console.log('Settings saved:', settings)
                      toast({
                        title: "Settings saved",
                        description: "Your settings have been saved successfully.",
                      })
                    } catch (error) {
                      console.error('Failed to save settings:', error)
                      toast({
                        title: "Error",
                        description: "Failed to save settings. Please try again.",
                        variant: "destructive",
                      })
                    } finally {
                      setIsSaving(false)
                    }
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}

export default App
