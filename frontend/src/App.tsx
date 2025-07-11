import React, { useState, useEffect } from 'react'
import { Moon, Sun, Github, ExternalLink, Copy, Check, Search, BarChart3, Sparkles, Settings, Database, Cpu, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu'

import MainTabs from '@/components/MainTabs'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import EnhancedSearch from '@/components/EnhancedSearch'
import './index.css'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('app')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(id)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const CodeBlock = ({ code, language = 'bash', id }: { code: string; language?: string; id: string }) => (
    <Card className="relative group">
      <div className="absolute right-2 top-2 code-copy-btn z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(code, id)}
          className="h-8 w-8 p-0 btn-animate"
        >
          {copiedCode === id ? (
            <Check className="h-4 w-4 success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <CardContent className="p-4">
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto border">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </CardContent>
    </Card>
  )

  const features = [
    {
      icon: Search,
      title: 'Advanced Search',
      description: 'Powerful semantic search with vector embeddings and natural language processing',
      color: 'text-blue-600'
    },
    {
      icon: Zap,
      title: 'High Performance',
      description: 'Optimized indexing and search algorithms for lightning-fast results',
      color: 'text-green-600'
    },
    {
      icon: Sparkles,
      title: 'AI Integration',
      description: 'Built-in AI features for content analysis, recommendations, and summarization',
      color: 'text-purple-600'
    },
    {
      icon: Settings,
      title: 'Developer Friendly',
      description: 'RESTful API, comprehensive documentation, and easy integration',
      color: 'text-orange-600'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Real-time performance metrics and usage analytics',
      color: 'text-indigo-600'
    },
    {
      icon: Database,
      title: 'Secure & Private',
      description: 'Local processing with optional cloud features for enhanced privacy',
      color: 'text-red-600'
    }
  ]

  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/search',
      description: 'Search notes and content',
      example: `curl -X GET "http://localhost:3000/api/search?q=artificial intelligence" \\
  -H "Content-Type: application/json"`
    },
    {
      method: 'POST',
      path: '/api/index',
      description: 'Index new content',
      example: `curl -X POST "http://localhost:3000/api/index" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Your content here", "metadata": {...}}'`
    },
    {
      method: 'GET',
      path: '/api/health',
      description: 'Check service health',
      example: `curl -X GET "http://localhost:3000/api/health"`
    }
  ]

  const stats = [
    { value: '10K+', label: 'Notes Indexed', icon: Database, color: 'text-blue-600' },
    { value: '99.9%', label: 'Uptime', icon: Cpu, color: 'text-green-600' },
    { value: '<100ms', label: 'Search Speed', icon: Zap, color: 'text-purple-600' }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'search':
        return <EnhancedSearch />
      case 'recommendations':
      case 'advanced':
      case 'performance':
        return <MainTabs />
      default:
        return <Dashboard />
    }
  }

  return (
    <>
      {viewMode === 'app' ? (
        <div className="flex h-screen bg-background">
          {/* 사이드바 */}
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* 메인 콘텐츠 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 헤더 */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-14 items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                  <h1 className="text-lg font-semibold">
                    {activeTab === 'dashboard' && '대시보드'}
                    {activeTab === 'search' && '검색'}
                    {activeTab === 'recommendations' && 'AI 추천'}
                    {activeTab === 'advanced' && '고급 기능'}
                    {activeTab === 'performance' && '성능'}
                    {activeTab === 'notes' && '노트 관리'}
                    {activeTab === 'tags' && '태그'}
                    {activeTab === 'insights' && '인사이트'}
                    {activeTab === 'settings' && '설정'}
                  </h1>
                </div>

                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setViewMode('landing')}
                  >
                    랜딩 보기
                  </Button>
                  <Button variant="outline" size="sm" onClick={toggleTheme}>
                    {theme === 'light' ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </header>

            {/* 콘텐츠 영역 */}
            <main className="flex-1 overflow-auto">
              {renderContent()}
            </main>
          </div>
        </div>
      ) : (
        <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
          {/* Header */}
          <Card className="sticky top-0 z-50 w-full border-b rounded-none" style={{ backgroundColor: 'hsl(var(--background) / 0.95)', backdropFilter: 'blur(12px)' }}>
            <CardContent className="p-0">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-xl font-bold gradient-text">
                    MCP JS
                  </h1>
                  <Separator orientation="vertical" className="h-6" />
                  <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>AI-Powered Knowledge Management</span>
                </div>
                
                <nav className="hidden md:flex items-center space-x-6">
                  <NavigationMenu>
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <div className="grid gap-3 p-4 w-[400px]">
                            <div className="grid grid-cols-2 gap-2">
                              {features.slice(0, 4).map((feature) => (
                                <a
                                  key={feature.title}
                                  href="#features"
                                  className="block p-3 rounded-md transition-colors"
                                  style={{ '--tw-bg-opacity': '0.5' } as React.CSSProperties}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--accent))'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <div className="text-2xl mb-2">{feature.icon && <feature.icon className="h-6 w-6" />}</div>
                                  <div className="font-medium text-sm">{feature.title}</div>
                                </a>
                              ))}
                            </div>
                          </div>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink href="#api" className="nav-item px-4 py-2 rounded-md">
                          API
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink href="#installation" className="nav-item px-4 py-2 rounded-md">
                          Installation
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
                </nav>

                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setViewMode('app')}
                  >
                    앱 보기
                  </Button>
                  <Button variant="outline" size="sm" onClick={toggleTheme}>
                    {theme === 'light' ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hero Section */}
          <section className="py-20 px-4">
            <div className="container mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
                AI-Powered Knowledge Management
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Transform your notes into intelligent insights with advanced search, AI recommendations, and powerful analytics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6">
                  Get Started
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </Button>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-20 px-4 bg-muted/50">
            <div className="container mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature) => (
                  <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className={`text-3xl mb-4 ${feature.color}`}>
                        {feature.icon && <feature.icon className="h-8 w-8" />}
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-20 px-4">
            <div className="container mx-auto">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                {stats.map((stat) => (
                  <div key={stat.label} className="space-y-2">
                    <div className={`text-4xl font-bold ${stat.color}`}>
                      {stat.icon && <stat.icon className="h-12 w-12 mx-auto mb-4" />}
                      {stat.value}
                    </div>
                    <p className="text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* API Section */}
          <section id="api" className="py-20 px-4 bg-muted/50">
            <div className="container mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">API Reference</h2>
              <div className="space-y-6">
                {apiEndpoints.map((endpoint, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {endpoint.path}
                        </code>
                      </div>
                      <CardDescription>{endpoint.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock code={endpoint.example} language="bash" id={`api-${index}`} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Installation Section */}
          <section id="installation" className="py-20 px-4">
            <div className="container mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Quick Installation</h2>
              <div className="max-w-2xl mx-auto space-y-6">
                <CodeBlock 
                  code={`npm install mcp-js
npm run dev`} 
                  language="bash" 
                  id="install" 
                />
                <p className="text-center text-muted-foreground">
                  That's it! Your AI-powered knowledge management system is ready to use.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 px-4 border-t">
            <div className="container mx-auto text-center">
              <p className="text-muted-foreground">
                Built with ❤️ using React, TypeScript, and Tailwind CSS
              </p>
            </div>
          </footer>
        </div>
      )}
    </>
  )
}

export default App
