import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Clock, 
  Cpu, 
  MemoryStick, 
  HardDrive,
  BarChart3,
  RefreshCw,
  Play
} from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

interface PerformanceStats {
  cpu: number
  memory: number
  disk: number
  responseTime: number
  requestsPerSecond: number
  activeConnections: number
  vectorCount: number
  status: string
  uptime: number
  lastUpdate: string
}

interface TestResult {
  testName: string
  duration: number
  success: boolean
  error?: string
  metrics: Record<string, number>
}

const API_BASE_URL = 'http://localhost:8080'

const PerformanceDashboard = () => {
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])

  // 실시간 성능 통계
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['performance-stats'],
    queryFn: async (): Promise<PerformanceStats> => {
      const response = await axios.get(`${API_BASE_URL}/api/performance/stats`)
      return response.data
    },
    refetchInterval: 5000, // 5초마다 갱신
  })

  // 성능 테스트 실행
  const runPerformanceTests = async () => {
    setIsRunningTests(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/performance/run-tests`)
      setTestResults(response.data.results || [])
      toast.success('성능 테스트가 완료되었습니다')
    } catch {
      toast.error('성능 테스트 실행 중 오류가 발생했습니다')
    } finally {
      setIsRunningTests(false)
    }
  }

  // 성능 최적화 권장사항
  const { data: recommendations } = useQuery({
    queryKey: ['performance-recommendations'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/performance/recommendations`)
      return response.data
    },
    enabled: !!stats,
  })

  // 차트 데이터 생성
  const generateChartData = () => {
    if (!stats) return []
    
    return [
      { name: 'CPU', value: stats.cpu, color: '#3b82f6' },
      { name: 'Memory', value: stats.memory, color: '#10b981' },
      { name: 'Disk', value: stats.disk, color: '#f59e0b' },
    ]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      default: return 'text-slate-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">정상</Badge>
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">주의</Badge>
      case 'critical': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">위험</Badge>
      default: return <Badge variant="outline">알 수 없음</Badge>
    }
  }

  return (
    <div className="space-y-8">
      {/* 실시간 성능 모니터링 */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              실시간 성능 모니터링
            </div>
            <div className="flex items-center gap-2">
              {stats && getStatusBadge(stats.status)}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchStats()}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            시스템 리소스 사용량과 성능 지표를 실시간으로 모니터링합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {stats ? (
            <>
              {/* 주요 지표 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">CPU 사용률</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.cpu}%</div>
                  <Progress value={stats.cpu} className="mt-2 h-2" />
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <MemoryStick className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">메모리 사용률</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.memory}%</div>
                  <Progress value={stats.memory} className="mt-2 h-2" />
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-300">디스크 사용률</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.disk}%</div>
                  <Progress value={stats.disk} className="mt-2 h-2" />
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">응답 시간</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.responseTime}ms</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {stats.requestsPerSecond} req/s
                  </div>
                </div>
              </div>

              {/* 성능 차트 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">리소스 사용률</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 시스템 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">시스템 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">상태:</span>
                      <span className={getStatusColor(stats.status)}>{stats.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">업타임:</span>
                      <span>{Math.floor(stats.uptime / 3600)}시간 {Math.floor((stats.uptime % 3600) / 60)}분</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">벡터 수:</span>
                      <span>{stats.vectorCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">활성 연결:</span>
                      <span>{stats.activeConnections}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">마지막 업데이트</h4>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(stats.lastUpdate).toLocaleString()}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">성능 데이터를 불러올 수 없습니다</h3>
              <p className="text-slate-500 dark:text-slate-400">서버 연결을 확인해주세요</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 성능 테스트 */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            성능 테스트
          </CardTitle>
          <CardDescription>
            시스템 성능을 종합적으로 테스트하고 결과를 확인합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runPerformanceTests}
            disabled={isRunningTests}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {isRunningTests ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                테스트 실행 중...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                성능 테스트 실행
              </div>
            )}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">테스트 결과</h4>
              {testResults.map((result, index) => (
                <div key={index} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{result.testName}</span>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "성공" : "실패"}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    소요 시간: {result.duration}ms
                  </div>
                  {result.error && (
                    <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                      오류: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 성능 최적화 권장사항 */}
      {recommendations && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              성능 최적화 권장사항
            </CardTitle>
            <CardDescription>
              시스템 성능 향상을 위한 AI 기반 권장사항입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec: Record<string, unknown>, index: number) => (
                <div key={index} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    {rec.title as string}
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                    {rec.description as string}
                  </p>
                  {rec.impact && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      예상 개선 효과: {rec.impact as string}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PerformanceDashboard 