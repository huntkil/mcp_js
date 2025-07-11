import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Zap, 
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Database
} from 'lucide-react';

interface PerformanceData {
  uptime: string;
  cache: {
    hits: number;
    misses: number;
    size: number;
    maxSize: number;
  };
  memory: {
    rss: string;
    heapUsed: string;
    heapUsagePercentage: string;
  };
  optimizations: {
    caching: boolean;
    compression: boolean;
    batching: boolean;
    parallel: boolean;
  };
  notes: number;
  vectors: number;
}

interface PerformanceReport {
  timestamp: string;
  summary: {
    status: string;
    message: string;
  };
  details: any;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    category: string;
  }>;
}

const fetchPerformanceStats = async (): Promise<PerformanceData> => {
  const response = await fetch('http://localhost:8080/api/performance/stats');
  if (!response.ok) throw new Error('Failed to fetch performance stats');
  return response.json();
};

const fetchPerformanceReport = async (): Promise<PerformanceReport> => {
  const response = await fetch('http://localhost:8080/api/performance/report');
  if (!response.ok) throw new Error('Failed to fetch performance report');
  return response.json();
};

const clearCache = async (): Promise<void> => {
  const response = await fetch('http://localhost:8080/api/performance/cache/clear', {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to clear cache');
};

const optimizeMemory = async (): Promise<void> => {
  const response = await fetch('http://localhost:8080/api/performance/memory/optimize', {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to optimize memory');
};

export const PerformanceDashboard: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['performance-stats'],
    queryFn: fetchPerformanceStats,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const { data: report, isLoading: reportLoading, refetch: refetchReport } = useQuery({
    queryKey: ['performance-report'],
    queryFn: fetchPerformanceReport,
    refetchInterval: autoRefresh ? refreshInterval * 2 : false,
  });

  const handleClearCache = async () => {
    try {
      await clearCache();
      refetchStats();
      refetchReport();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const handleOptimizeMemory = async () => {
    try {
      await optimizeMemory();
      refetchStats();
      refetchReport();
    } catch (error) {
      console.error('Failed to optimize memory:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-yellow-100 text-yellow-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (statsLoading || reportLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading performance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">실시간 성능 대시보드</h2>
          <Badge variant={report?.summary?.status === 'healthy' ? 'default' : 'destructive'}>
            {report?.summary?.status || 'unknown'}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '자동 새로고침 ON' : '자동 새로고침 OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchStats();
              refetchReport();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">서버 가동시간</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.uptime || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              마지막 재시작 이후
            </p>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">메모리 사용량</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.memory?.heapUsagePercentage || 'N/A'}%</div>
            <Progress 
              value={parseFloat(stats?.memory?.heapUsagePercentage || '0')} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.memory?.heapUsed || 'N/A'} / {stats?.memory?.rss || 'N/A'}
            </p>
          </CardContent>
        </Card>

        {/* Cache Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">캐시 성능</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.cache && (stats.cache.hits + stats.cache.misses) > 0 
                ? Math.round((stats.cache.hits / (stats.cache.hits + stats.cache.misses)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Hit Rate ({stats?.cache?.hits || 0} hits, {stats?.cache?.misses || 0} misses)
            </p>
          </CardContent>
        </Card>

        {/* Data Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">데이터 통계</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.notes || 0}</div>
            <p className="text-xs text-muted-foreground">
              노트 {stats?.notes || 0}개, 벡터 {stats?.vectors || 0}개
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cpu className="h-5 w-5 mr-2" />
            최적화 설정
          </CardTitle>
          <CardDescription>
            현재 활성화된 성능 최적화 기능들
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats?.optimizations && Object.entries(stats.optimizations).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm capitalize">{key}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report?.recommendations && report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              성능 권장사항
            </CardTitle>
            <CardDescription>
              시스템 성능 개선을 위한 권장사항
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.recommendations.map((rec) => (
                <div key={rec.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Badge className={getPriorityColor(rec.priority)}>
                    {rec.priority}
                  </Badge>
                  <div className="flex-1">
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button onClick={handleClearCache} variant="outline">
          <Zap className="h-4 w-4 mr-2" />
          캐시 정리
        </Button>
        <Button onClick={handleOptimizeMemory} variant="outline">
          <Database className="h-4 w-4 mr-2" />
          메모리 최적화
        </Button>
      </div>
    </div>
  );
}; 