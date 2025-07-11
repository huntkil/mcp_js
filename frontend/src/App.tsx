import React, { useState, useEffect } from 'react'
import { Moon, Sun, Github, ExternalLink, ChevronRight, Copy, Check, Search, BarChart3, Sparkles, Settings, Database, Cpu, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu'
import './index.css'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

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

  return (
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
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-4 py-8 space-y-16">
          {/* Hero Section */}
          <Card className="text-center p-8">
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h1 className="hero-title gradient-text">
                  MCP JS
                </h1>
                <p className="text-xl md:text-2xl max-w-3xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Next-generation knowledge management system powered by AI and vector search
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="btn-animate" asChild>
                  <a href="#installation">
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="btn-animate" asChild>
                  <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    View on GitHub
                  </a>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {stats.map((stat, index) => (
                  <Card key={index} className="card-hover">
                    <CardContent className="text-center p-4">
                      <div className="flex items-center justify-center mb-2">
                        <stat.icon className={`h-8 w-8 ${stat.color}`} />
                      </div>
                      <div className="text-3xl font-bold stat-counter" style={{ color: stat.color.replace('text-', '#').replace('-600', '') }}>
                        {stat.value}
                      </div>
                      <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features Section */}
          <div id="features" className="space-y-8">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="section-title">Features</CardTitle>
                <CardDescription className="max-w-2xl mx-auto">
                  Everything you need to build a powerful knowledge management system
                </CardDescription>
              </CardHeader>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="card-hover group fade-in">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* API Documentation */}
          <div id="api" className="space-y-8">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="section-title">API Documentation</CardTitle>
                <CardDescription>
                  Simple and powerful REST API for integrating with your applications
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  {apiEndpoints.map((endpoint, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center space-x-4">
                          <Badge className={`github-badge ${endpoint.method.toLowerCase()}`}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono">{endpoint.path}</code>
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>{endpoint.description}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <CodeBlock 
                          code={endpoint.example} 
                          language="bash" 
                          id={`api-${index}`}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Installation Guide */}
          <div id="installation" className="space-y-8">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="section-title">Installation</CardTitle>
                <CardDescription>
                  Get started with MCP JS in minutes
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="subsection-title">Quick Start</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock 
                      code={`# Clone the repository
git clone https://github.com/your-repo/mcp-js.git
cd mcp-js

# Install dependencies
npm install

# Start the development server
npm run dev`} 
                      language="bash"
                      id="install-1"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="subsection-title">Environment Variables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock 
                      code={`# .env
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key
VECTOR_DB_PATH=./data/vector-db.json`} 
                      language="bash"
                      id="env-1"
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="subsection-title">Docker Installation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock 
                      code={`# Using Docker Compose
docker-compose up -d

# Or build manually
docker build -t mcp-js .
docker run -p 3000:3000 mcp-js`} 
                      language="bash"
                      id="docker-1"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="subsection-title">Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock 
                      code={`{
  "search": {
    "maxResults": 50,
    "threshold": 0.7
  },
  "indexing": {
    "batchSize": 100,
    "autoIndex": true
  }
}`} 
                      language="json"
                      id="config-1"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Project Structure */}
          <div className="space-y-8">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="section-title">Project Structure</CardTitle>
                <CardDescription>
                  Understanding the codebase organization
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="file-tree space-y-1">
                  <div className="file-tree-item">
                    <span className="file-tree-icon text-blue-600">📁</span>
                    <span className="file-tree-name">mcp-js/</span>
                  </div>
                  <div className="ml-4 space-y-1">
                    <div className="file-tree-item">
                      <span className="file-tree-icon text-green-600">📁</span>
                      <span className="file-tree-name">frontend/</span>
                      <span className="file-tree-comment"># React frontend application</span>
                    </div>
                    <div className="file-tree-item">
                      <span className="file-tree-icon text-green-600">📁</span>
                      <span className="file-tree-name">src/</span>
                      <span className="file-tree-comment"># Backend source code</span>
                    </div>
                    <div className="file-tree-item">
                      <span className="file-tree-icon text-green-600">📁</span>
                      <span className="file-tree-name">services/</span>
                      <span className="file-tree-comment"># Core services</span>
                    </div>
                    <div className="file-tree-item">
                      <span className="file-tree-icon text-green-600">📁</span>
                      <span className="file-tree-name">routes/</span>
                      <span className="file-tree-comment"># API routes</span>
                    </div>
                    <div className="file-tree-item">
                      <span className="file-tree-icon text-green-600">📁</span>
                      <span className="file-tree-name">tests/</span>
                      <span className="file-tree-comment"># Test files</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <Card className="border-t mt-16 rounded-none" style={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-4">MCP JS</h3>
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Next-generation knowledge management system powered by AI and vector search.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Links</h3>
                <div className="space-y-2 text-sm">
                  <a href="#" className="block footer-link" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Documentation
                  </a>
                  <a href="#" className="block footer-link" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    API Reference
                  </a>
                  <a href="#" className="block footer-link" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Contributing
                  </a>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Connect</h3>
                <div className="space-y-2 text-sm">
                  <a href="https://github.com/your-repo" className="flex items-center footer-link" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                  <a href="mailto:contact@example.com" className="flex items-center footer-link" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Contact
                  </a>
                </div>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              © 2024 MCP JS. MIT License.
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  )
}

export default App
