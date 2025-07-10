import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, FileText, Brain, Hash, Zap } from 'lucide-react'
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
  metadata?: any
}

const API_BASE_URL = 'http://localhost:8080'

const SearchTab = () => {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('semantic')
  const [options, setOptions] = useState({
    maxResults: 10,
    similarityThreshold: 0.3,
    caseSensitive: false,
    useRegex: false
  })

  const searchMutation = useMutation({
    mutationFn: async (searchData: any) => {
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
    onError: (error) => {
      toast.error('Search failed: ' + error.message)
    }
  })

  const handleSearch = () => {
    if (!query.trim()) {
      toast.error('Please enter a search query')
      return
    }

    searchMutation.mutate({
      type: searchType,
      query: query.trim(),
      options
    })
  }

  const results = searchMutation.data?.results || []

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Your Vault
          </CardTitle>
          <CardDescription>
            Search through your Markdown files using semantic, keyword, or hybrid search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={searchType} onValueChange={setSearchType}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="semantic" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Semantic
              </TabsTrigger>
              <TabsTrigger value="keyword" className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Keyword
              </TabsTrigger>
              <TabsTrigger value="hybrid" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Hybrid
              </TabsTrigger>
            </TabsList>

            <TabsContent value="semantic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Results</label>
                  <Input
                    type="number"
                    value={options.maxResults}
                    onChange={(e) => setOptions(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Similarity Threshold</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={options.similarityThreshold}
                    onChange={(e) => setOptions(prev => ({ ...prev, similarityThreshold: parseFloat(e.target.value) }))}
                    min="0"
                    max="1"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="keyword" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Results</label>
                  <Input
                    type="number"
                    value={options.maxResults}
                    onChange={(e) => setOptions(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                    min="1"
                    max="50"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={options.caseSensitive}
                      onChange={(e) => setOptions(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                    />
                    <span className="text-sm">Case Sensitive</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={options.useRegex}
                      onChange={(e) => setOptions(prev => ({ ...prev, useRegex: e.target.checked }))}
                    />
                    <span className="text-sm">Use Regex</span>
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hybrid" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Results</label>
                  <Input
                    type="number"
                    value={options.maxResults}
                    onChange={(e) => setOptions(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Similarity Threshold</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={options.similarityThreshold}
                    onChange={(e) => setOptions(prev => ({ ...prev, similarityThreshold: parseFloat(e.target.value) }))}
                    min="0"
                    max="1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Semantic Weight</label>
                  <Input
                    type="number"
                    step="0.1"
                    defaultValue="0.7"
                    min="0"
                    max="1"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Input
              placeholder="Enter your search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={searchMutation.isPending}
            >
              {searchMutation.isPending ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Search Results
            </CardTitle>
            <CardDescription>
              Found {searchMutation.data.totalFound} results for "{searchMutation.data.query}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No results found
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card key={result.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{result.metadata.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {result.metadata.fileName}
                          </p>
                          {result.metadata.content && (
                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                              {result.metadata.content.substring(0, 200)}...
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{result.matchType}</Badge>
                            <Badge variant="secondary">Score: {result.score.toFixed(3)}</Badge>
                            {result.metadata.tags && result.metadata.tags.map((tag, i) => (
                              <Badge key={i} variant="outline">#{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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