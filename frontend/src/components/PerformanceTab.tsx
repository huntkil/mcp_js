import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Activity, Database, Clock, Zap, AlertTriangle } from 'lucide-react'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitor</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time system performance and health monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Activity className="w-4 h-4 mr-2" />
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button onClick={refreshAll}>
            <Zap className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(stats?.status || 'unknown')}`}></div>
              <span className="font-medium">{getStatusText(stats?.status || 'unknown')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Indexed Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalNotes || 0}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Total notes in vault</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vector Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.vectorCount || 0}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Embedded vectors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.uptime || '0s'}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Server uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>
            Real-time performance indicators and system health
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Response Time */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Average Response Time</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {stats?.avgResponseTime || 0}ms
              </span>
            </div>
            <Progress 
              value={Math.min((stats?.avgResponseTime || 0) / 1000 * 100, 100)} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0ms</span>
              <span>1000ms</span>
            </div>
          </div>

          {/* Memory Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Memory Usage</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {stats?.memoryUsage || 0}MB
              </span>
            </div>
            <Progress 
              value={Math.min((stats?.memoryUsage || 0) / 1000 * 100, 100)} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0MB</span>
              <span>1000MB</span>
            </div>
          </div>

          {/* Cache Hit Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Cache Hit Rate</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {stats?.cacheHitRate || 0}%
              </span>
            </div>
            <Progress 
              value={stats?.cacheHitRate || 0} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Error Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Error Rate</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {stats?.errorRate || 0}%
              </span>
            </div>
            <Progress 
              value={Math.min((stats?.errorRate || 0) * 10, 100)} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span>10%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Feature Status
          </CardTitle>
          <CardDescription>
            Status of advanced AI features and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {status?.features && Object.entries(status.features).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium capitalize">
                  {feature.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <Badge variant={enabled ? 'default' : 'secondary'} className="text-xs">
                  {enabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      {recommendations?.recommendations && recommendations.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Performance Recommendations
            </CardTitle>
            <CardDescription>
              AI-generated recommendations to improve system performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.recommendations.map((rec: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    rec.priority === 'critical' ? 'bg-red-500' :
                    rec.priority === 'high' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {rec.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {rec.priority} priority
                      </Badge>
                      {rec.impact && (
                        <Badge variant="outline" className="text-xs">
                          {rec.impact} impact
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest system events and operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentActivity?.map((activity: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {activity.timestamp}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.duration}ms
                </Badge>
              </div>
            )) || (
              <div className="text-center py-8 text-slate-500">
                No recent activity
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceTab 