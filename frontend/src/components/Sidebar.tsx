import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  Home,
  Search,
  Sparkles,
  BarChart3,
  Settings,
  FileText,
  Tag,
  Zap,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Lightbulb,
  Activity
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description?: string;
  color?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, 
  onToggle, 
  activeTab, 
  onTabChange 
}) => {

  const mainNavItems: NavItem[] = [
    {
      id: 'dashboard',
      title: '대시보드',
      icon: Home,
      description: '시스템 현황 및 통계',
      color: 'text-blue-600'
    },
    {
      id: 'search',
      title: '검색',
      icon: Search,
      badge: 'AI',
      description: '의미론적 검색',
      color: 'text-green-600'
    },
    {
      id: 'recommendations',
      title: 'AI 추천',
      icon: Sparkles,
      badge: 'NEW',
      description: '개인화된 추천',
      color: 'text-purple-600'
    },
    {
      id: 'advanced',
      title: '고급 기능',
      icon: Zap,
      description: 'AI 기반 고급 기능',
      color: 'text-orange-600'
    },
    {
      id: 'performance',
      title: '성능',
      icon: BarChart3,
      description: '성능 모니터링',
      color: 'text-indigo-600'
    }
  ];

  const secondaryNavItems: NavItem[] = [
    {
      id: 'notes',
      title: '노트 관리',
      icon: FileText,
      description: '노트 목록 및 관리',
      color: 'text-gray-600'
    },
    {
      id: 'tags',
      title: '태그',
      icon: Tag,
      description: '태그 관리',
      color: 'text-pink-600'
    },
    {
      id: 'insights',
      title: '인사이트',
      icon: Lightbulb,
      description: '학습 패턴 분석',
      color: 'text-yellow-600'
    }
  ];

  const utilityNavItems: NavItem[] = [
    {
      id: 'settings',
      title: '설정',
      icon: Settings,
      description: '시스템 설정',
      color: 'text-gray-600'
    }
  ];

  const renderNavItem = (item: NavItem) => {
    const isActive = activeTab === item.id;

    return (
      <Button
        key={item.id}
        variant={isActive ? "secondary" : "ghost"}
        className={`w-full justify-start h-auto p-3 transition-all duration-200 ${
          isCollapsed ? 'px-2' : 'px-3'
        } ${
          isActive 
            ? 'bg-secondary text-secondary-foreground shadow-sm' 
            : 'hover:bg-accent hover:text-accent-foreground'
        }`}
        onClick={() => onTabChange(item.id)}
      >
        <div className={`flex items-center space-x-3 w-full ${
          isCollapsed ? 'justify-center' : ''
        }`}>
          <div className={`flex-shrink-0 ${item.color}`}>
            <item.icon className="h-4 w-4" />
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">
                  {item.title}
                </span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {item.description}
                </p>
              )}
            </div>
          )}
        </div>
      </Button>
    );
  };

  return (
    <div className={`flex flex-col border-r bg-background transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">마음근력</h2>
              <p className="text-xs text-muted-foreground">노트 관리</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 네비게이션 */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* 메인 네비게이션 */}
          <div className="space-y-2">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                메인
              </h3>
            )}
            {mainNavItems.map(renderNavItem)}
          </div>

          <Separator />

          {/* 보조 네비게이션 */}
          <div className="space-y-2">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                도구
              </h3>
            )}
            {secondaryNavItems.map(renderNavItem)}
          </div>

          <Separator />

          {/* 유틸리티 네비게이션 */}
          <div className="space-y-2">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                시스템
              </h3>
            )}
            {utilityNavItems.map(renderNavItem)}
          </div>
        </div>
      </ScrollArea>

      {/* 푸터 */}
      <div className="p-4 border-t">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">시스템 상태</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Activity className="h-3 w-3 mr-1" />
                정상
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">벡터 DB</span>
              <span className="font-medium">603개</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Activity className="h-3 w-3" />
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 