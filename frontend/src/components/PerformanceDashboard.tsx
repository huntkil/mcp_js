import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { 
  Activity, 
  Zap, 
  Database, 
  Cpu, 
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Gauge,
  HardDrive
} from 'lucide-react';

interface PerformanceMetrics {
  vectorCount: number;
  searchLatency: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  indexingStatus: 'idle' | 'running' | 'completed' | 'error';
  lastIndexed: string;
  embeddingService: 'local' | 'python' | 'hybrid';
  optimizationLevel: 'low' | 'medium' | 'high';
}

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  status: 'pending' | 'applied' | 'ignored';
  category: 'search' | 'memory' | 'indexing' | 'cache';
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    vectorCount: 603,
    searchLatency: 45,
    memoryUsage: 65,
    cpuUsage: 30,
    cacheHitRate: 78,
    indexingStatus: 'completed',
    lastIndexed: new Date().toISOString(),
    embeddingService: 'local',
    optimizationLevel: 'medium'
  });

  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([
    {
      id: '1',
      title: '벡터 캐싱 활성화',
      description: '자주 사용되는 벡터를 메모리에 캐싱하여 검색 속도를 향상시킵니다.',
      impact: 'high',
      status: 'applied',
      category: 'cache'
    },
    {
      id: '2',
      title: '인덱스 압축',
      description: '벡터 인덱스를 압축하여 메모리 사용량을 20% 줄입니다.',
      impact: 'medium',
      status: 'pending',
      category: 'memory'
    },
    {
      id: '3',
      title: '배치 검색 최적화',
      description: '여러 검색을 배치로 처리하여 전체 처리량을 향상시킵니다.',
      impact: 'high',
      status: 'applied',
      category: 'search'
    },
    {
      id: '4',
      title: 'Python 임베딩 서비스 복구',
      description: 'Python 임베딩 서비스를 복구하여 더 정확한 벡터를 생성합니다.',
      impact: 'medium',
      status: 'pending',
      category: 'indexing'
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // 성능 메트릭 가져오기
  const fetchMetrics = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('http://localhost:8080/api/performance/metrics');
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('성능 메트릭 가져오기 실패:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 최적화 제안 적용
  const applyOptimization = async (suggestionId: string) => {
    try {
      const response = await fetch('http://localhost:8080/api/performance/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestionId }),
      });
      
      if (response.ok) {
        setSuggestions(prev => 
          prev.map(s => 
            s.id === suggestionId ? { ...s, status: 'applied' as const } : s
          )
        );
        await fetchMetrics(); // 메트릭 새로고침
      }
    } catch (error) {
      console.error('최적화 적용 실패:', error);
    }
  };

  // 성능 상태 계산
  const performanceStatus = useMemo(() => {
    const score = (
      (100 - metrics.searchLatency / 2) * 0.4 +
      (100 - metrics.memoryUsage) * 0.3 +
      metrics.cacheHitRate * 0.3
    );
    
    if (score >= 80) return { level: 'excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { level: 'good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 40) return { level: 'fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'poor', color: 'text-red-600', bg: 'bg-red-100' };
  }, [metrics]);

  // 성능 점수 계산
  const performanceScore = useMemo(() => {
    return Math.round(
      (100 - metrics.searchLatency / 2) * 0.4 +
      (100 - metrics.memoryUsage) * 0.3 +
      metrics.cacheHitRate * 0.3
    );
  }, [metrics]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* 성능 개요 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-blue-600" />
                성능 대시보드
              </CardTitle>
              <CardDescription>
                시스템 성능과 최적화 상태를 실시간으로 모니터링합니다.
              </CardDescription>
            </div>
            <Button onClick={fetchMetrics} disabled={isRefreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 전체 성능 점수 */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${performanceStatus.bg} mb-4`}>
                <Gauge className={`h-10 w-10 ${performanceStatus.color}`} />
              </div>
              <h3 className="text-2xl font-bold mb-2">{performanceScore}</h3>
              <p className="text-sm text-muted-foreground capitalize">{performanceStatus.level}</p>
              <Badge className={`mt-2 ${performanceStatus.color} ${performanceStatus.bg}`}>
                {performanceStatus.level === 'excellent' ? '우수' :
                 performanceStatus.level === 'good' ? '양호' :
                 performanceStatus.level === 'fair' ? '보통' : '개선 필요'}
              </Badge>
            </div>

            {/* 검색 성능 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold">검색 성능</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>응답 시간</span>
                    <span>{metrics.searchLatency}ms</span>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - metrics.searchLatency)} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>캐시 적중률</span>
                    <span>{metrics.cacheHitRate}%</span>
                  </div>
                  <Progress value={metrics.cacheHitRate} className="h-2" />
                </div>
              </div>
            </div>

            {/* 시스템 리소스 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold">시스템 리소스</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>메모리 사용량</span>
                    <span>{metrics.memoryUsage}%</span>
                  </div>
                  <Progress value={metrics.memoryUsage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU 사용량</span>
                    <span>{metrics.cpuUsage}%</span>
                  </div>
                  <Progress value={metrics.cpuUsage} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 상세 메트릭 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">벡터 수</p>
                <p className="text-2xl font-bold">{metrics.vectorCount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">임베딩 서비스</p>
                <p className="text-lg font-semibold capitalize">{metrics.embeddingService}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">최적화 레벨</p>
                <p className="text-lg font-semibold capitalize">{metrics.optimizationLevel}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {getStatusIcon(metrics.indexingStatus)}
              <div>
                <p className="text-sm text-muted-foreground">인덱싱 상태</p>
                <p className="text-lg font-semibold capitalize">{metrics.indexingStatus}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최적화 제안 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            최적화 제안
          </CardTitle>
          <CardDescription>
            성능 향상을 위한 자동 최적화 제안사항입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{suggestion.title}</h4>
                    <Badge className={getImpactColor(suggestion.impact)}>
                      {suggestion.impact === 'high' ? '높음' :
                       suggestion.impact === 'medium' ? '보통' : '낮음'}
                    </Badge>
                    {suggestion.status === 'applied' && (
                      <Badge variant="secondary" className="text-green-600">
                        적용됨
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                </div>
                {suggestion.status === 'pending' && (
                  <Button 
                    onClick={() => applyOptimization(suggestion.id)}
                    size="sm"
                    variant="outline"
                  >
                    적용
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard; 