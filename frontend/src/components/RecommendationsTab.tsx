import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Sparkles, 
  FileText, 
  Copy, 
  Loader2,
  Calendar,
  Tag
} from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'

interface Recommendation {
  id: string
  fileName: string
  title: string
  similarity: number
  reason: string
  tags?: string[]
  lastModified?: string
  content?: string
}

interface RecommendationResponse {
  success: boolean
  recommendations: Recommendation[]
  totalFound: number
  processingTime?: number
}

const API_BASE_URL = 'http://localhost:8080'

const RecommendationsTab = () => {
  const [query, setQuery] = useState('')
  const [showDetail, setShowDetail] = useState(false)
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null)

  const recommendationMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const response = await axios.post(`${API_BASE_URL}/api/recommendations`, {
        query: searchQuery,
        maxResults: 10
      })
      return response.data
    },
    onSuccess: (data: RecommendationResponse) => {
      if (data.success) {
        toast.success(`${data.totalFound}개의 추천 노트를 찾았습니다`)
      } else {
        toast.error('추천 검색에 실패했습니다')
      }
    },
    onError: (error: Error) => {
      toast.error('추천 검색 실패: ' + error.message)
    }
  })

  const handleSearch = () => {
    if (!query.trim()) {
      toast.error('검색어를 입력해주세요')
      return
    }
    recommendationMutation.mutate(query.trim())
  }

  const handleShowDetail = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation)
    setShowDetail(true)
  }

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('내용이 클립보드에 복사되었습니다')
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-600 dark:text-green-400'
    if (similarity >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getSimilarityBadge = (similarity: number) => {
    if (similarity >= 0.8) return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">매우 유사</Badge>
    if (similarity >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">유사</Badge>
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">관련</Badge>
  }

  const recommendations = recommendationMutation.data?.recommendations || []

  return (
    <div className="space-y-8">
      {/* 추천 검색 */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            AI 추천 시스템
          </CardTitle>
          <CardDescription className="text-base">
            현재 노트와 유사한 다른 노트들을 AI가 추천해드립니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                기준 노트 또는 주제
              </label>
              <Input
                placeholder="추천을 받고 싶은 노트의 제목이나 주제를 입력하세요..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="h-12 text-lg bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <Button 
              onClick={handleSearch}
              disabled={recommendationMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {recommendationMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  추천 검색 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  추천 검색
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 추천 결과 */}
      {recommendationMutation.data && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-purple-500" />
                추천 결과
              </div>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30">
                {recommendationMutation.data.totalFound}개 추천
              </Badge>
            </CardTitle>
            <CardDescription>
              "{query}"와 유사한 노트들을 찾았습니다
              {recommendationMutation.data.processingTime && (
                <span className="ml-2 text-slate-500">
                  (처리 시간: {recommendationMutation.data.processingTime.toFixed(2)}초)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendationMutation.isPending ? (
              // 로딩 스켈레톤
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-700/50 animate-pulse">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-4 bg-slate-200 dark:bg-slate-600 rounded"></div>
                        <div className="w-20 h-4 bg-slate-200 dark:bg-slate-600 rounded"></div>
                      </div>
                      <div className="w-32 h-3 bg-slate-200 dark:bg-slate-600 rounded"></div>
                    </div>
                    <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-600 rounded mb-2"></div>
                    <div className="w-full h-4 bg-slate-200 dark:bg-slate-600 rounded mb-2"></div>
                    <div className="w-2/3 h-4 bg-slate-200 dark:bg-slate-600 rounded"></div>
                  </div>
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">추천할 노트를 찾을 수 없습니다</h3>
                <p className="text-slate-500 dark:text-slate-400">다른 검색어를 시도해보세요</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((recommendation) => (
                  <div 
                    key={recommendation.id} 
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer"
                    onClick={() => handleShowDetail(recommendation)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getSimilarityBadge(recommendation.similarity)}
                        <span className={`text-sm font-medium ${getSimilarityColor(recommendation.similarity)}`}>
                          {(recommendation.similarity * 100).toFixed(1)}% 유사
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {recommendation.fileName}
                      </span>
                    </div>
                    
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {recommendation.title}
                    </h3>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                      {recommendation.reason}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        {recommendation.lastModified && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(recommendation.lastModified).toLocaleDateString()}
                          </div>
                        )}
                        {recommendation.tags && recommendation.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {recommendation.tags.length}개 태그
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (recommendation.content) {
                            handleCopyContent(recommendation.content)
                          }
                        }}
                        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        복사
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 상세 보기 모달 */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedRecommendation?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedRecommendation?.fileName} • {(selectedRecommendation?.similarity || 0) * 100}% 유사
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecommendation && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="font-medium mb-2">추천 이유</h4>
                <p className="text-sm leading-relaxed">{selectedRecommendation.reason}</p>
              </div>
              
              {selectedRecommendation.content && (
                <div>
                  <h4 className="font-medium mb-2">노트 내용</h4>
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans">{selectedRecommendation.content}</pre>
                  </div>
                </div>
              )}
              
              {selectedRecommendation.tags && selectedRecommendation.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">태그</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecommendation.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4 border-t">
                {selectedRecommendation.content && (
                  <Button
                    onClick={() => handleCopyContent(selectedRecommendation.content!)}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    내용 복사
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowDetail(false)}>
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RecommendationsTab 