import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  Search, 
  Brain, 
  BarChart3, 
  Sparkles,
  Target
} from 'lucide-react';
import RecommendationsTab from './RecommendationsTab';
import AdvancedFeaturesTab from './AdvancedFeaturesTab';

const MainTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('recommendations');

  const tabs = [
    {
      id: 'recommendations',
      title: '지능형 추천',
      description: 'AI 기반 노트 추천 및 연결',
      icon: Brain,
      color: 'text-purple-600',
      badge: 'New'
    },
    {
      id: 'search',
      title: '검색',
      description: '의미론적 검색 및 필터링',
      icon: Search,
      color: 'text-blue-600'
    },
    {
      id: 'analytics',
      title: '분석',
      description: '성능 대시보드 및 통계',
      icon: BarChart3,
      color: 'text-green-600'
    },
    {
      id: 'advanced',
      title: '고급 기능',
      description: '요약, 태깅, 그래프 생성',
      icon: Sparkles,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* 헤더 */}
      <Card className="sticky top-0 z-50 w-full border-b rounded-none" style={{ backgroundColor: 'hsl(var(--background) / 0.95)', backdropFilter: 'blur(12px)' }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold gradient-text">
                MCP JS - 지능형 지식 관리
              </h1>
              <Badge variant="secondary" className="ml-2">
                AI Powered
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                <Target className="h-3 w-3 mr-1" />
                마음근력 프로젝트
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* 탭 헤더 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl mb-4">
                지식 관리 시스템
              </CardTitle>
              <CardDescription className="text-center max-w-2xl mx-auto">
                AI 기반으로 노트를 분석하고, 관련성을 발견하며, 지식 그래프를 구축하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <tab.icon className={`h-5 w-5 ${tab.color}`} />
                      <span className="font-medium">{tab.title}</span>
                      {tab.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {tab.badge}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs opacity-70">{tab.description}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </CardContent>
          </Card>

          {/* 추천 탭 */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-purple-600" />
                  지능형 노트 추천 시스템
                </CardTitle>
                <CardDescription>
                  AI가 분석한 유사성과 연결성을 바탕으로 관련 노트를 추천합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecommendationsTab />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 검색 탭 */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-6 w-6 text-blue-600" />
                  고급 검색 시스템
                </CardTitle>
                <CardDescription>
                  의미론적 검색과 키워드 검색을 결합한 강력한 검색 기능
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">검색 기능</h3>
                  <p className="text-muted-foreground">
                    의미론적 검색, 키워드 검색, 필터링 기능이 준비 중입니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 분석 탭 */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                  성능 분석 대시보드
                </CardTitle>
                <CardDescription>
                  시스템 성능과 사용 통계를 실시간으로 모니터링
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">분석 대시보드</h3>
                  <p className="text-muted-foreground">
                    성능 메트릭, 사용 통계, 최적화 권장사항이 준비 중입니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 고급 기능 탭 */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-orange-600" />
                  고급 AI 기능
                </CardTitle>
                <CardDescription>
                  자동 요약, 스마트 태깅, 지식 그래프 생성 등 고급 기능
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdvancedFeaturesTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MainTabs; 