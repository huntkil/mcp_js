import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Target, 
  Sparkles, 
  Copy, 
  Loader2,
  Tag,
  MessageSquare,
  Network
} from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'

interface AdvancedFeatureResult {
  success: boolean
  result: Record<string, unknown>
  processingTime?: number
  metadata?: Record<string, unknown>
}

const API_BASE_URL = 'http://localhost:8080'

const AdvancedFeaturesTab = () => {
  const [inputText, setInputText] = useState('')
  const [selectedFeature, setSelectedFeature] = useState('summarize')
  const [showResult, setShowResult] = useState(false)
  const [currentResult, setCurrentResult] = useState<AdvancedFeatureResult | null>(null)

  const featureMutation = useMutation({
    mutationFn: async (data: { feature: string; text: string }) => {
      const endpoints = {
        summarize: '/api/advanced/summarize',
        tags: '/api/advanced/smart-tags',
        graph: '/api/advanced/knowledge-graph'
      }
      
      const response = await axios.post(`${API_BASE_URL}${endpoints[data.feature as keyof typeof endpoints]}`, {
        text: data.text
      })
      return response.data
    },
    onSuccess: (data: AdvancedFeatureResult) => {
      if (data.success) {
        setCurrentResult(data)
        setShowResult(true)
        toast.success('처리가 완료되었습니다')
      } else {
        toast.error('처리에 실패했습니다')
      }
    },
    onError: (error: Error) => {
      toast.error('처리 실패: ' + error.message)
    }
  })

  const handleProcess = () => {
    if (!inputText.trim()) {
      toast.error('텍스트를 입력해주세요')
      return
    }
    featureMutation.mutate({ feature: selectedFeature, text: inputText.trim() })
  }

  const handleCopyResult = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('결과가 클립보드에 복사되었습니다')
  }

  const getFeatureInfo = (feature: string) => {
    const features = {
      summarize: {
        title: '자동 요약',
        description: '긴 텍스트를 핵심 내용으로 요약합니다',
        icon: MessageSquare,
        color: 'from-blue-500 to-cyan-500'
      },
      tags: {
        title: '스마트 태깅',
        description: '텍스트에서 관련 태그를 자동으로 추출합니다',
        icon: Tag,
        color: 'from-green-500 to-emerald-500'
      },
      graph: {
        title: '지식 그래프',
        description: '텍스트의 개념과 관계를 시각화합니다',
        icon: Network,
        color: 'from-purple-500 to-pink-500'
      }
    }
    return features[feature as keyof typeof features]
  }

  const renderResult = (result: AdvancedFeatureResult) => {
    if (!result.success) return null

    switch (selectedFeature) {
      case 'summarize':
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2">요약 결과</h4>
              <p className="text-sm leading-relaxed">{result.result.summary as string}</p>
            </div>
            {result.result.keyPoints && (
              <div>
                <h4 className="font-medium mb-2">주요 포인트</h4>
                <ul className="space-y-1">
                  {(result.result.keyPoints as string[]).map((point: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )

      case 'tags':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">추출된 태그</h4>
              <div className="flex flex-wrap gap-2">
                {(result.result.tags as string[])?.map((tag: string, index: number) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-sm px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
            {result.result.confidence && (
              <div>
                <h4 className="font-medium mb-2">태그 신뢰도</h4>
                <div className="space-y-2">
                  {Object.entries(result.result.confidence as Record<string, number>).map(([tag, score]: [string, number]) => (
                    <div key={tag} className="flex items-center gap-2">
                      <span className="text-sm min-w-[80px]">#{tag}</span>
                      <Progress value={score * 100} className="flex-1 h-2" />
                      <span className="text-sm text-slate-500">{(score * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'graph':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">개념 노드</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(result.result.nodes as Array<{label: string; type: string}>)?.map((node, index: number) => (
                  <div key={index} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="font-medium text-sm">{node.label}</div>
                    <div className="text-xs text-slate-500">{node.type}</div>
                  </div>
                ))}
              </div>
            </div>
            {result.result.relationships && (
              <div>
                <h4 className="font-medium mb-3">관계</h4>
                <div className="space-y-2">
                  {(result.result.relationships as Array<{source: string; relationship: string; target: string}>)?.map((rel, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded">
                      <span className="font-medium">{rel.source}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-slate-600 dark:text-slate-300">{rel.relationship}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-medium">{rel.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return <pre className="text-sm">{JSON.stringify(result.result, null, 2)}</pre>
    }
  }

  const featureInfo = getFeatureInfo(selectedFeature)
  const FeatureIcon = featureInfo.icon

  return (
    <div className="space-y-8">
      {/* 기능 선택 */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            AI 고급 기능
          </CardTitle>
          <CardDescription className="text-base">
            텍스트 분석, 요약, 태깅, 지식 그래프 등 AI 기반 고급 기능을 활용하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 기능 선택 탭 */}
          <Tabs value={selectedFeature} onValueChange={setSelectedFeature} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100/50 dark:bg-slate-700/50 rounded-xl p-1">
              <TabsTrigger 
                value="summarize" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-slate-600 data-[state=active]:shadow-md transition-all duration-200 rounded-lg"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">요약</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tags" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-slate-600 data-[state=active]:shadow-md transition-all duration-200 rounded-lg"
              >
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">태깅</span>
              </TabsTrigger>
              <TabsTrigger 
                value="graph" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-slate-600 data-[state=active]:shadow-md transition-all duration-200 rounded-lg"
              >
                <Network className="w-4 h-4" />
                <span className="hidden sm:inline">그래프</span>
              </TabsTrigger>
            </TabsList>

            {/* 기능별 설명 */}
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={`p-2 bg-gradient-to-br ${featureInfo.color} rounded-lg`}>
                  <FeatureIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-medium">{featureInfo.title}</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400">{featureInfo.description}</p>
            </div>

            {/* 입력 영역 */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  분석할 텍스트
                </label>
                <Textarea
                  placeholder="분석하고 싶은 텍스트를 입력하세요..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={6}
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 resize-none"
                />
              </div>
              
              <Button 
                onClick={handleProcess}
                disabled={featureMutation.isPending}
                className={`w-full h-12 bg-gradient-to-r ${featureInfo.color} hover:opacity-90 text-white shadow-lg`}
              >
                {featureMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    처리 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {featureInfo.title} 실행
                  </div>
                )}
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* 결과 모달 */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FeatureIcon className="w-5 h-5" />
              {featureInfo.title} 결과
            </DialogTitle>
            <DialogDescription>
              처리 시간: {currentResult?.processingTime?.toFixed(2)}초
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {currentResult && renderResult(currentResult)}
            
            <div className="flex gap-2 pt-4 border-t">
              {currentResult?.result && (
                <Button
                  onClick={() => handleCopyResult(JSON.stringify(currentResult.result, null, 2))}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  결과 복사
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowResult(false)}>
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdvancedFeaturesTab 