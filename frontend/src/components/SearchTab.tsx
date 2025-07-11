import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, FileText, Brain, Hash, Zap, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'

interface SearchResult {
  id: string
  score: number
  metadata: {
    title: string
    fileName: string
    content?: string
    tags?: string[]
    created?: string // Added for sorting by date
  }
  matchType: string
  highlights?: string[]
}

interface SearchResponse {
  success: boolean
  query: string
  results: SearchResult[]
  totalFound: number
  searchType: string
  metadata?: Record<string, unknown>
}

const API_BASE_URL = 'http://localhost:8080'

const RECENT_KEY = 'mcp_recent_searches'
const MAX_RECENT = 10

// 하이라이트 텍스트에서 검색어 부분을 컬러로 강조
function highlightText(text: string, query: string) {
  if (!query) return text
  // escape regex
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(safe, 'gi')
  const parts = text.split(regex)
  const matches = text.match(regex)
  if (!matches) return text
  return parts.reduce((acc, part, i) => {
    acc.push(part)
    if (i < matches.length) {
      acc.push(
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 px-1 rounded">
          {matches[i]}
        </mark>
      )
    }
    return acc
  }, [] as React.ReactNode[])
}

const sortOptions = [
  { value: 'score', label: '유사도순' },
  { value: 'file', label: '파일명순' },
  { value: 'date', label: '최신순' },
]

// 스켈레톤 로딩 컴포넌트
const SearchResultSkeleton = () => (
  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-700/50 animate-pulse">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="w-16 h-4 bg-slate-200 dark:bg-slate-600 rounded"></div>
        <div className="w-20 h-4 bg-slate-200 dark:bg-slate-600 rounded"></div>
      </div>
      <div className="w-32 h-3 bg-slate-200 dark:bg-slate-600 rounded"></div>
    </div>
    <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-600 rounded mb-2"></div>
    <div className="w-full h-4 bg-slate-200 dark:bg-slate-600 rounded mb-2"></div>
    <div className="w-2/3 h-4 bg-slate-200 dark:bg-slate-600 rounded mb-2"></div>
    <div className="flex gap-2">
      <div className="w-12 h-5 bg-slate-200 dark:bg-slate-600 rounded"></div>
      <div className="w-16 h-5 bg-slate-200 dark:bg-slate-600 rounded"></div>
    </div>
  </div>
)

const SearchTab = () => {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('semantic')
  const [options, setOptions] = useState({
    maxResults: 10,
    similarityThreshold: 0.3,
    caseSensitive: false,
    useRegex: false
  })
  const [recent, setRecent] = useState<string[]>([])
  const [showRecent, setShowRecent] = useState(false)
  const [sortBy, setSortBy] = useState('score')
  const [showSort, setShowSort] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 최근 검색어 로드
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_KEY)
    if (stored) setRecent(JSON.parse(stored))
  }, [])

  // 최근 검색어 저장
  const saveRecent = (q: string) => {
    if (!q.trim()) return
    let arr = [q.trim(), ...recent.filter(r => r !== q.trim())]
    if (arr.length > MAX_RECENT) arr = arr.slice(0, MAX_RECENT)
    setRecent(arr)
    localStorage.setItem(RECENT_KEY, JSON.stringify(arr))
  }

  // 최근 검색어 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowRecent(false)
      }
    }
    if (showRecent) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showRecent])

  const searchMutation = useMutation({
    mutationFn: async (searchData: { type: string; query: string; options: typeof options }) => {
      const endpoint = searchData.type === 'semantic' 
        ? '/api/search/semantic'
        : searchData.type === 'keyword'
        ? '/api/search/keyword'
        : '/api/search/hybrid'
      
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        query: searchData.query,
        options: searchData.options
      })
      return response.data
    },
    onSuccess: (data: SearchResponse) => {
      if (data.success) {
        toast.success(`Found ${data.totalFound} results`)
      } else {
        toast.error('Search failed')
      }
    },
    onError: (error: Error) => {
      toast.error('Search failed: ' + error.message)
    }
  })

  const handleSearch = (q?: string) => {
    const searchQ = typeof q === 'string' ? q : query
    if (!searchQ.trim()) {
      toast.error('Please enter a search query')
      return
    }
    searchMutation.mutate({
      type: searchType,
      query: searchQ.trim(),
      options
    })
    saveRecent(searchQ)
    setShowRecent(false)
  }

  const handleInputFocus = () => {
    if (recent.length > 0) setShowRecent(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    if (recent.length > 0) setShowRecent(true)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
    if (e.key === 'ArrowDown' && recent.length > 0) {
      setShowRecent(true)
      // 포커스 이동은 추후 개선
    }
  }

  const handleRecentClick = (q: string) => {
    setQuery(q)
    handleSearch(q)
  }

  const results = searchMutation.data?.results || []

  // 정렬 적용
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score
    if (sortBy === 'file') return (a.metadata.fileName || '').localeCompare(b.metadata.fileName || '')
    if (sortBy === 'date') return new Date(b.metadata.created || 0).getTime() - new Date(a.metadata.created || 0).getTime()
    return 0
  })

  return (
    <div className="space-y-8">
      {/* 고정 검색 입력창 + 최근 검색어 드롭다운 */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-white/90 dark:from-slate-900/90 to-transparent pb-2 mb-2">
        <div className="relative max-w-2xl mx-auto">
          <Input
            ref={inputRef}
            placeholder="Enter your search query..."
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            className="h-12 text-lg bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 shadow-md"
            autoComplete="off"
          />
          {showRecent && recent.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto animate-fade-in"
            >
              {recent.map((r, i) => (
                <div
                  key={r + i}
                  className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-base"
                  onClick={() => handleRecentClick(r)}
                >
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Search Form */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            Search Your Vault
          </CardTitle>
          <CardDescription className="text-base">
            Search through your Markdown files using semantic, keyword, or hybrid search with AI-powered intelligence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Type Selection */}
          <Tabs value={searchType} onValueChange={setSearchType} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100/50 dark:bg-slate-700/50 rounded-xl p-1">
              <TabsTrigger 
                value="semantic" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-slate-600 data-[state=active]:shadow-md transition-all duration-200 rounded-lg"
              >
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Semantic</span>
              </TabsTrigger>
              <TabsTrigger 
                value="keyword" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-slate-600 data-[state=active]:shadow-md transition-all duration-200 rounded-lg"
              >
                <Hash className="w-4 h-4" />
                <span className="hidden sm:inline">Keyword</span>
              </TabsTrigger>
              <TabsTrigger 
                value="hybrid" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-slate-600 data-[state=active]:shadow-md transition-all duration-200 rounded-lg"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Hybrid</span>
              </TabsTrigger>
            </TabsList>

            {/* Search Options */}
            <div className="mt-6">
              <TabsContent value="semantic" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Max Results</label>
                    <Input
                      type="number"
                      value={options.maxResults}
                      onChange={(e) => setOptions(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                      min="1"
                      max="50"
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Similarity Threshold</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={options.similarityThreshold}
                      onChange={(e) => setOptions(prev => ({ ...prev, similarityThreshold: parseFloat(e.target.value) }))}
                      min="0"
                      max="1"
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="keyword" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Max Results</label>
                    <Input
                      type="number"
                      value={options.maxResults}
                      onChange={(e) => setOptions(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                      min="1"
                      max="50"
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Search Options</label>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options.caseSensitive}
                          onChange={(e) => setOptions(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                          className="rounded border-slate-300 dark:border-slate-600"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Case Sensitive</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options.useRegex}
                          onChange={(e) => setOptions(prev => ({ ...prev, useRegex: e.target.checked }))}
                          className="rounded border-slate-300 dark:border-slate-600"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Use Regex</span>
                      </label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="hybrid" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Max Results</label>
                    <Input
                      type="number"
                      value={options.maxResults}
                      onChange={(e) => setOptions(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                      min="1"
                      max="50"
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Similarity Threshold</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={options.similarityThreshold}
                      onChange={(e) => setOptions(prev => ({ ...prev, similarityThreshold: parseFloat(e.target.value) }))}
                      min="0"
                      max="1"
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Search Options</label>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options.caseSensitive}
                          onChange={(e) => setOptions(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                          className="rounded border-slate-300 dark:border-slate-600"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Case Sensitive</span>
                      </label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>

            {/* Search Input and Button */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter your search query..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-12 text-lg bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button 
                onClick={() => handleSearch()} 
                disabled={searchMutation.isPending}
                className="h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {searchMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search
                  </div>
                )}
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchMutation.data && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-500" />
                Search Results
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
                  {searchMutation.data.totalFound} results found
                </Badge>
                {/* 정렬 드롭다운 */}
                <div className="relative">
                  <button
                    className="flex items-center gap-1 px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    onClick={() => setShowSort(!showSort)}
                    type="button"
                  >
                    {sortOptions.find(o => o.value === sortBy)?.label}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {showSort && (
                    <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg z-50">
                      {sortOptions.map(opt => (
                        <div
                          key={opt.value}
                          className={`px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 ${sortBy === opt.value ? 'font-bold text-blue-600 dark:text-blue-300' : ''}`}
                          onClick={() => { setSortBy(opt.value); setShowSort(false) }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardTitle>
            <CardDescription>
              Showing results for "{searchMutation.data.query}" using {searchMutation.data.searchType} search
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchMutation.isPending ? (
              // 로딩 스켈레톤
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SearchResultSkeleton key={i} />
                ))}
              </div>
            ) : sortedResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No results found</h3>
                <p className="text-slate-500 dark:text-slate-400">Try adjusting your search query or parameters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedResults.map((result) => (
                  <div 
                    key={result.id} 
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-600 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {result.matchType}
                        </Badge>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Score: {(result.score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {result.metadata.fileName}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {result.metadata.title || result.metadata.fileName}
                    </h3>
                    {result.highlights && result.highlights.length > 0 && (
                      <div className="mb-2">
                        {result.highlights.map((hl, hi) => (
                          <p key={hi} className="text-sm text-slate-600 dark:text-slate-300">
                            {highlightText(hl, query)}
                          </p>
                        ))}
                      </div>
                    )}
                    {result.metadata.tags && result.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.metadata.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SearchTab 