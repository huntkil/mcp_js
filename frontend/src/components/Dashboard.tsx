import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, 
  BarChart3, 
  Sparkles, 
  Settings, 
  Database, 
  Cpu, 
  Zap,
  FileText,
  Activity
} from 'lucide-react';

interface DashboardStats {
  totalNotes: number;
  indexedNotes: number;
  searchQueries: number;
  avgResponseTime: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'error';
  recentActivity: Array<{
    id: string;
    type: 'search' | 'index' | 'recommendation';
    description: string;
    timestamp: string;
    status: 'success' | 'pending' | 'error';
  }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalNotes: 0,
    indexedNotes: 0,
    searchQueries: 0,
    avgResponseTime: 0,
    systemHealth: 'good',
    recentActivity: []
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 실제 API 호출로 대체
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/performance/stats');
        const data = await response.json();
        
        if (data.success) {
          setStats({
            totalNotes: data.totalNotes || 0,
            indexedNotes: data.vectorCount || 0,
            searchQueries: data.search?.totalRequests || 0,
            avgResponseTime: data.search?.averageLatency || 0,
            systemHealth: data.status === 'healthy' ? 'excellent' : 'warning',
            recentActivity: [
              {
                id: '1',
                type: 'search',
                description: '마음근력 관련 검색',
                timestamp: new Date().toISOString(),
                status: 'success'
              },
              {
                id: '2',
                type: 'recommendation',
                description: 'AI 추천 생성',
                timestamp: new Date(Date.now() - 300000).toISOString(),
                status: 'success'
              }
            ]
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <Activity className="h-4 w-4" />;
      case 'good': return <Activity className="h-4 w-4" />;
      case 'warning': return <Activity className="h-4 w-4" />;
      case 'error': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const quickActions = [
    {
      title: '노트 검색',
      description: '의미론적 검색으로 노트 찾기',
      icon: Search,
      color: 'bg-blue-500',
      href: '/search'
    },
    {
      title: 'AI 추천',
      description: '개인화된 노트 추천',
      icon: Sparkles,
      color: 'bg-purple-500',
      href: '/recommendations'
    },
    {
      title: '성능 모니터링',
      description: '시스템 성능 확인',
      icon: BarChart3,
      color: 'bg-green-500',
      href: '/performance'
    },
    {
      title: '설정',
      description: '시스템 설정 관리',
      icon: Settings,
      color: 'bg-orange-500',
      href: '/settings'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">
            마음근력 노트 관리 시스템 현황
          </p>
        </div>
        <Badge className={getHealthColor(stats.systemHealth)}>
          {getHealthIcon(stats.systemHealth)}
          <span className="ml-1 capitalize">{stats.systemHealth}</span>
        </Badge>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 노트</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNotes}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.indexedNotes} 인덱싱됨
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">검색 쿼리</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.searchQueries}</div>
            <p className="text-xs text-muted-foreground">
              오늘 처리됨
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 응답시간</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              빠른 응답
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시스템 상태</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">정상</div>
            <p className="text-xs text-muted-foreground">
              모든 서비스 운영중
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 빠른 액션 */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>빠른 액션</CardTitle>
            <CardDescription>
              자주 사용하는 기능에 빠르게 접근하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                  onClick={() => window.location.href = action.href}
                >
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 최근 활동 */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>
              시스템에서 발생한 최근 이벤트들
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-100 text-green-600' :
                    activity.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {activity.type === 'search' && <Search className="h-3 w-3" />}
                    {activity.type === 'index' && <Database className="h-3 w-3" />}
                    {activity.type === 'recommendation' && <Sparkles className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 성능 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>성능 모니터링</CardTitle>
          <CardDescription>
            시스템 성능 및 사용량 통계
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="performance">성능</TabsTrigger>
              <TabsTrigger value="usage">사용량</TabsTrigger>
              <TabsTrigger value="trends">트렌드</TabsTrigger>
            </TabsList>
            <TabsContent value="performance" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU 사용률</span>
                    <span className="text-sm text-muted-foreground">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">메모리 사용률</span>
                    <span className="text-sm text-muted-foreground">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">디스크 사용률</span>
                    <span className="text-sm text-muted-foreground">32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="usage" className="space-y-4">
              <div className="text-center text-muted-foreground">
                사용량 통계 차트가 여기에 표시됩니다
              </div>
            </TabsContent>
            <TabsContent value="trends" className="space-y-4">
              <div className="text-center text-muted-foreground">
                트렌드 분석이 여기에 표시됩니다
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard; 