import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Link, Target, Users, TrendingUp, Search, FileText, Settings } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'

interface Recommendation {
  note: {
    fileName: string
    title: string
    content: string
  }
  similarity: number
  breakdown: {
    content: number
    tags: number
    title: number
  }
}

interface BacklinkSuggestion {
  sourceNote: {
    title: string
    fileName: string
  }
  targetNote: {
    title: string
    fileName: string
  }
  similarity: number
  reason: string
  suggestedLink: string
}

interface ConnectionSuggestion {
  targetNote: {
    title: string
    fileName: string
  }
  similarity: number
  reason: string
  impact: number
  priority: number
  suggestedActions: string[]
}

const API_BASE_URL = 'http://localhost:8080'

const RecommendationsTab = () => {
  const [targetNote, setTargetNote] = useState({
    fileName: '마음근력.md',
    title: '마음근력',
    content: '마음근력은 긍정적인 마음가짐과 인내심을 기르는 것이다. 일상생활에서 스트레스와 어려움을 견뎌내는 능력을 말한다. 마음근력을 기르기 위해서는 명상, 운동, 충분한 휴식이 필요하다.'
  })
  const [candidateNotes, setCandidateNotes] = useState('')
  const [options, setOptions] = useState({
    similarityThreshold: 0.3,
    maxRecommendations: 5
  })
  const [activeTab, setActiveTab] = useState('similar')

  const similarNotesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`${API_BASE_URL}/api/advanced/recommendations/similar-notes`, data)
      return response.data
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Found ${data.data.recommendations.length} similar notes`)
        setActiveTab('similar')
      } else {
        toast.error('Failed to get recommendations')
      }
    },
    onError: (error) => {
      toast.error('Failed to get recommendations: ' + error.message)
    }
  })

  const backlinksMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`${API_BASE_URL}/api/advanced/recommendations/backlinks`, data)
      return response.data
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Found ${data.data.suggestions.length} backlink suggestions`)
        setActiveTab('backlinks')
      } else {
        toast.error('Failed to get backlink suggestions')
      }
    },
    onError: (error) => {
      toast.error('Failed to get backlink suggestions: ' + error.message)
    }
  })

  const connectionsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`${API_BASE_URL}/api/advanced/recommendations/strengthen-connections`, data)
      return response.data
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Found ${data.data.suggestions.length} connection suggestions`)
        setActiveTab('connections')
      } else {
        toast.error('Failed to get connection suggestions')
      }
    },
    onError: (error) => {
      toast.error('Failed to get connection suggestions: ' + error.message)
    }
  })

  const handleSimilarNotes = () => {
    if (!targetNote.content.trim()) {
      toast.error('Please enter target note content')
      return
    }

    const candidateNotesArray = candidateNotes.trim() 
      ? candidateNotes.split('\n').map(note => {
          const [fileName, title, content] = note.split('|').map(s => s.trim())
          return { fileName, title, content }
        })
      : []

    similarNotesMutation.mutate({
      targetNote,
      candidateNotes: candidateNotesArray,
      options
    })
  }

  const handleBacklinks = () => {
    if (!targetNote.content.trim()) {
      toast.error('Please enter target note content')
      return
    }

    const allNotes = candidateNotes.trim() 
      ? candidateNotes.split('\n').map(note => {
          const [fileName, title, content] = note.split('|').map(s => s.trim())
          return { fileName, title, content }
        })
      : []

    backlinksMutation.mutate({
      targetNote,
      allNotes,
      options
    })
  }

  const handleConnections = () => {
    if (!targetNote.content.trim()) {
      toast.error('Please enter target note content')
      return
    }

    const allNotes = candidateNotes.trim() 
      ? candidateNotes.split('\n').map(note => {
          const [fileName, title, content] = note.split('|').map(s => s.trim())
          return { fileName, title, content }
        })
      : []

    connectionsMutation.mutate({
      targetNote,
      allNotes,
      options
    })
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.8) return 'bg-green-100 text-green-800 border-green-200'
    if (similarity > 0.6) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (similarity > 0.4) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getImpactColor = (impact: number) => {
    if (impact > 80) return 'bg-red-100 text-red-800 border-red-200'
    if (impact > 60) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (impact > 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI-Powered Recommendations
          </CardTitle>
          <CardDescription>
            Get intelligent recommendations for similar notes, backlinks, and connections using advanced AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Target Note File Name</label>
              <Input
                placeholder="e.g., 마음근력.md"
                value={targetNote.fileName}
                onChange={(e) => setTargetNote(prev => ({ ...prev, fileName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Target Note Title</label>
              <Input
                placeholder="e.g., 마음근력"
                value={targetNote.title}
                onChange={(e) => setTargetNote(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Target Note Content</label>
            <Textarea
              placeholder="Enter the content of the target note..."
              value={targetNote.content}
              onChange={(e) => setTargetNote(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Candidate Notes (Optional)</label>
            <Textarea
              placeholder="Enter candidate notes in format: fileName|title|content (one per line)"
              value={candidateNotes}
              onChange={(e) => setCandidateNotes(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-slate-500 mt-1">
              Format: fileName|title|content (one per line). Leave empty to use indexed notes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-sm font-medium">Max Recommendations</label>
              <Input
                type="number"
                value={options.maxRecommendations}
                onChange={(e) => setOptions(prev => ({ ...prev, maxRecommendations: parseInt(e.target.value) }))}
                min="1"
                max="20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={handleSimilarNotes}
          disabled={similarNotesMutation.isPending}
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          {similarNotesMutation.isPending ? 'Finding...' : 'Find Similar Notes'}
        </Button>
        
        <Button 
          onClick={handleBacklinks}
          disabled={backlinksMutation.isPending}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Link className="w-4 h-4" />
          {backlinksMutation.isPending ? 'Finding...' : 'Suggest Backlinks'}
        </Button>
        
        <Button 
          onClick={handleConnections}
          disabled={connectionsMutation.isPending}
          className="flex items-center gap-2"
          variant="outline"
        >
          <TrendingUp className="w-4 h-4" />
          {connectionsMutation.isPending ? 'Finding...' : 'Strengthen Connections'}
        </Button>
      </div>

      {/* Results */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="similar" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Similar Notes
          </TabsTrigger>
          <TabsTrigger value="backlinks" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Backlinks
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Connections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="similar">
          {similarNotesMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Similar Notes
                </CardTitle>
                <CardDescription>
                  Found {similarNotesMutation.data.data?.recommendations?.length || 0} similar notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {similarNotesMutation.data.data?.recommendations?.map((rec: Recommendation, index: number) => (
                  <Card key={index} className="mb-4 border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{rec.note.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {rec.note.fileName}
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                            {rec.note.content.substring(0, 200)}...
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getSimilarityColor(rec.similarity)}>
                              Similarity: {(rec.similarity * 100).toFixed(1)}%
                            </Badge>
                            <Badge variant="outline">Content: {(rec.breakdown.content * 100).toFixed(1)}%</Badge>
                            <Badge variant="outline">Tags: {(rec.breakdown.tags * 100).toFixed(1)}%</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="backlinks">
          {backlinksMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  Backlink Suggestions
                </CardTitle>
                <CardDescription>
                  Found {backlinksMutation.data.data?.suggestions?.length || 0} backlink suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {backlinksMutation.data.data?.suggestions?.map((suggestion: BacklinkSuggestion, index: number) => (
                  <Card key={index} className="mb-4 border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{suggestion.targetNote.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {suggestion.targetNote.fileName}
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                            {suggestion.reason}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className={getSimilarityColor(suggestion.similarity)}>
                              Similarity: {(suggestion.similarity * 100).toFixed(1)}%
                            </Badge>
                            <Badge variant="outline">{suggestion.suggestedLink}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connections">
          {connectionsMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Connection Suggestions
                </CardTitle>
                <CardDescription>
                  Found {connectionsMutation.data.data?.suggestions?.length || 0} connection suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connectionsMutation.data.data?.suggestions?.map((suggestion: ConnectionSuggestion, index: number) => (
                  <Card key={index} className="mb-4 border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{suggestion.targetNote.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {suggestion.targetNote.fileName}
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                            {suggestion.reason}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSimilarityColor(suggestion.similarity)}>
                              Similarity: {(suggestion.similarity * 100).toFixed(1)}%
                            </Badge>
                            <Badge className={getImpactColor(suggestion.impact)}>
                              Impact: {suggestion.impact.toFixed(1)}%
                            </Badge>
                            <Badge variant="outline">Priority: {suggestion.priority.toFixed(2)}</Badge>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-medium text-slate-600 mb-1">Suggested Actions:</p>
                            <ul className="text-xs text-slate-600 space-y-1">
                              {suggestion.suggestedActions.map((action, idx) => (
                                <li key={idx} className="flex items-center gap-1">
                                  <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default RecommendationsTab 