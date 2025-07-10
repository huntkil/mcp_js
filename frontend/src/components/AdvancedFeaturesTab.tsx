import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, FileText, Tags, Network, Sparkles, Brain } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080'

const AdvancedFeaturesTab = () => {
  const [text, setText] = useState('')
  const [summaryLength, setSummaryLength] = useState(200)
  const [vaultPath, setVaultPath] = useState('')

  const summarizeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`${API_BASE_URL}/api/advanced/summarize`, data)
      return response.data
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Text summarized successfully')
      } else {
        toast.error('Failed to summarize text')
      }
    },
    onError: (error) => {
      toast.error('Failed to summarize text: ' + error.message)
    }
  })

  const tagMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`${API_BASE_URL}/api/advanced/tag`, data)
      return response.data
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Tags extracted successfully')
      } else {
        toast.error('Failed to extract tags')
      }
    },
    onError: (error) => {
      toast.error('Failed to extract tags: ' + error.message)
    }
  })

  const knowledgeGraphMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`${API_BASE_URL}/api/advanced/knowledge-graph`, data)
      return response.data
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Knowledge graph generated successfully')
      } else {
        toast.error('Failed to generate knowledge graph')
      }
    },
    onError: (error) => {
      toast.error('Failed to generate knowledge graph: ' + error.message)
    }
  })

  const indexVaultMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`${API_BASE_URL}/api/advanced/index-vault`, data)
      return response.data
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Indexed ${data.indexed} notes successfully`)
      } else {
        toast.error('Failed to index vault')
      }
    },
    onError: (error) => {
      toast.error('Failed to index vault: ' + error.message)
    }
  })

  const handleSummarize = () => {
    if (!text.trim()) {
      toast.error('Please enter text to summarize')
      return
    }

    summarizeMutation.mutate({
      text: text.trim(),
      options: { maxLength: summaryLength }
    })
  }

  const handleTag = () => {
    if (!text.trim()) {
      toast.error('Please enter text to extract tags from')
      return
    }

    tagMutation.mutate({
      text: text.trim()
    })
  }

  const handleKnowledgeGraph = () => {
    if (!vaultPath.trim()) {
      toast.error('Please enter vault path')
      return
    }

    knowledgeGraphMutation.mutate({
      vaultPath: vaultPath.trim(),
      options: { maxNodes: 50, minConnections: 2 }
    })
  }

  const handleIndexVault = () => {
    if (!vaultPath.trim()) {
      toast.error('Please enter vault path')
      return
    }

    indexVaultMutation.mutate({
      vaultPath: vaultPath.trim()
    })
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Advanced AI Features
          </CardTitle>
          <CardDescription>
            Leverage AI for text summarization, smart tagging, and knowledge graph generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Vault Path</label>
            <Input
              placeholder="e.g., /path/to/your/obsidian/vault"
              value={vaultPath}
              onChange={(e) => setVaultPath(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Text Content</label>
            <Textarea
              placeholder="Enter text for summarization or tag extraction..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Summary Length</label>
            <Input
              type="number"
              value={summaryLength}
              onChange={(e) => setSummaryLength(parseInt(e.target.value))}
              min="50"
              max="1000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button 
          onClick={handleSummarize}
          disabled={summarizeMutation.isPending}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          {summarizeMutation.isPending ? 'Summarizing...' : 'Summarize'}
        </Button>
        
        <Button 
          onClick={handleTag}
          disabled={tagMutation.isPending}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Tags className="w-4 h-4" />
          {tagMutation.isPending ? 'Extracting...' : 'Extract Tags'}
        </Button>
        
        <Button 
          onClick={handleKnowledgeGraph}
          disabled={knowledgeGraphMutation.isPending}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Network className="w-4 h-4" />
          {knowledgeGraphMutation.isPending ? 'Generating...' : 'Knowledge Graph'}
        </Button>

        <Button 
          onClick={handleIndexVault}
          disabled={indexVaultMutation.isPending}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Brain className="w-4 h-4" />
          {indexVaultMutation.isPending ? 'Indexing...' : 'Index Vault'}
        </Button>
      </div>

      {/* Results */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="index">Index Status</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          {summarizeMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Text Summary
                </CardTitle>
                <CardDescription>
                  AI-generated summary of your text
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-slate-700 dark:text-slate-300">
                    {summarizeMutation.data.data?.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary">
                      Original: {summarizeMutation.data.data?.originalLength} chars
                    </Badge>
                    <Badge variant="outline">
                      Summary: {summarizeMutation.data.data?.summaryLength} chars
                    </Badge>
                    <Badge variant="outline">
                      Compression: {summarizeMutation.data.data?.compressionRatio}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tags">
          {tagMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="w-5 h-5" />
                  Extracted Tags
                </CardTitle>
                <CardDescription>
                  AI-extracted tags from your text
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tagMutation.data.data?.tags?.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  Confidence: {tagMutation.data.data?.confidence?.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="knowledge">
          {knowledgeGraphMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Knowledge Graph
                </CardTitle>
                <CardDescription>
                  Generated knowledge graph from your vault
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {knowledgeGraphMutation.data.data?.nodes?.length || 0}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Nodes</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {knowledgeGraphMutation.data.data?.edges?.length || 0}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Connections</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {knowledgeGraphMutation.data.data?.clusters?.length || 0}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Clusters</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Top Connected Notes:</h4>
                    {knowledgeGraphMutation.data.data?.topNodes?.slice(0, 5).map((node: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                        <span className="font-medium">{node.title}</span>
                        <Badge variant="outline">{node.connections} connections</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="index">
          {indexVaultMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Index Status
                </CardTitle>
                <CardDescription>
                  Vault indexing results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {indexVaultMutation.data.indexed || 0}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Indexed</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {indexVaultMutation.data.skipped || 0}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Skipped</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {indexVaultMutation.data.errors || 0}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Errors</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Duration: {indexVaultMutation.data.duration}ms
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdvancedFeaturesTab 