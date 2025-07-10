import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Activity, Database, Clock, Zap, AlertTriangle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080'

const PerformanceTab = () => {
  const [autoRefresh, setAutoRefresh] = useState(false)

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['performance-status'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/advanced/features/status`)
      return response.data
    },
    refetchInterval: autoRefresh ? 5000 : false
  })

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['performance-stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/performance/stats`)
      return response.data
    },
    refetchInterval: autoRefresh ? 5000 : false
  })

  const { data: recommendations, refetch: refetchRecommendations } = useQuery({
    queryKey: ['performance-recommendations'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/performance/recommendations`)
      return response.data
    },
    refetchInterval: autoRefresh ? 10000 : false
  })

  const refreshAll = () => {
    refetchStatus()
    refetchStats()
    refetchRecommendations()
    toast.success('Performance data refreshed')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'Healthy'
      case 'warning': return 'Warning'
      case 'critical': return 'Critical'
      default: return 'Unknown'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Performance Monitor
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Real-time system performance and health monitoring with AI-powered insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`transition-all duration-200 ${
              autoRefresh 
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400' 
                : ''
            }`}
          >
            <Activity className="w-4 h-4 mr-2" />
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button 
            onClick={refreshAll}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Zap className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                <Activity className="w-3 h-3 text-white" />
              </div>
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${getStatusColor(stats?.status || 'unknown')} animate-pulse`}></div>
              <span className="font-semibold text-lg">{getStatusText(stats?.status || 'unknown')}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Overall system health</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <FileText className="w-3 h-3 text-white" />
              </div>
              Indexed Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats?.totalNotes || 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total notes in vault</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Database className="w-3 h-3 text-white" />
              </div>
              Vector Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {stats?.vectorCount || 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Embedded vectors</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <div className="p-1.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                <Clock className="w-3 h-3 text-white" />
              </div>
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {stats?.uptime?.formatted || '0s'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Server uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Performance Metrics
          </CardTitle>
          <CardDescription className="text-base">
            Real-time performance indicators and system health monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Response Time */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Average Response Time</span>
              </div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {stats?.search?.averageLatency || 0}ms
              </span>
            </div>
            <Progress 
              value={Math.min((stats?.search?.averageLatency || 0) / 1000 * 100, 100)} 
              className="h-3 bg-slate-100 dark:bg-slate-700"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>0ms</span>
              <span>1000ms</span>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Memory Usage</span>
              </div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {stats?.memory?.heapUsed || '0MB'}
              </span>
            </div>
            <Progress 
              value={Math.min((parseFloat(stats?.memory?.heapUsagePercentage || '0')) || 0, 100)} 
              className="h-3 bg-slate-100 dark:bg-slate-700"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>0MB</span>
              <span>1000MB</span>
            </div>
          </div>

          {/* Cache Hit Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Cache Hit Rate</span>
              </div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {stats?.cache?.hitRatePercentage || '0%'}
              </span>
            </div>
            <Progress 
              value={(stats?.cache?.hitRate || 0) * 100} 
              className="h-3 bg-slate-100 dark:bg-slate-700"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Error Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Error Rate</span>
              </div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {stats?.requests?.successRate ? `${(100 - parseFloat(stats.requests.successRate)).toFixed(1)}%` : '0%'}
              </span>
            </div>
            <Progress 
              value={Math.min((100 - parseFloat(stats?.requests?.successRate || '100')) || 0, 100)} 
              className="h-3 bg-slate-100 dark:bg-slate-700"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations && recommendations.recommendations && recommendations.recommendations.length > 0 && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              Performance Recommendations
            </CardTitle>
            <CardDescription className="text-base">
              AI-powered suggestions to optimize your system performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.recommendations.map((rec: any, index: number) => (
                <div 
                  key={index}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-700/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-yellow-500 rounded-full mt-0.5">
                      <AlertTriangle className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                        {rec.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {rec.description}
                      </p>
                      {rec.impact && (
                        <Badge variant="outline" className="text-xs">
                          Impact: {rec.impact}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PerformanceTab 