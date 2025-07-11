import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  Search, 
  Link, 
  Brain, 
  TrendingUp, 
  Target,
  ArrowRight,
  Zap
} from 'lucide-react';

interface Recommendation {
  note: {
    fileName: string;
    title: string;
    content: string;
  };
  similarity: number;
  breakdown: {
    content: number;
    title: number;
    tags: number;
  };
}

interface BacklinkSuggestion {
  sourceNote: {
    title: string;
    fileName: string;
  };
  targetNote: {
    title: string;
    fileName: string;
  };
  similarity: number;
  reason: string;
  suggestedLink: string;
}

interface ConnectionSuggestion {
  targetNote: {
    title: string;
    fileName: string;
  };
  similarity: number;
  reason: string;
  impact: number;
  priority: number;
  suggestedActions: string[];
}

const RecommendationsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('similar-notes');
  const [loading, setLoading] = useState(false);
  const [targetNote, setTargetNote] = useState('');
  const [similarNotes, setSimilarNotes] = useState<Recommendation[]>([]);
  const [backlinks, setBacklinks] = useState<BacklinkSuggestion[]>([]);
  const [connections, setConnections] = useState<ConnectionSuggestion[]>([]);
  const [options, setOptions] = useState({
    maxRecommendations: 5,
    similarityThreshold: 0.1
  });

  const findSimilarNotes = async () => {
    if (!targetNote.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/advanced/recommendations/similar-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetNote: {
            fileName: targetNote,
            title: targetNote.split('/').pop()?.replace('.md', '') || targetNote,
            content: targetNote
          },
          options
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSimilarNotes(data.data.recommendations);
      }
    } catch (error) {
      console.error('유사 노트 검색 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const suggestBacklinks = async () => {
    if (!targetNote.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/advanced/recommendations/backlinks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetNote: {
            fileName: targetNote,
            title: targetNote.split('/').pop()?.replace('.md', '') || targetNote,
            content: targetNote
          },
          options
        }),
      });

      const data = await response.json();
      if (data.success) {
        setBacklinks(data.data.suggestions);
      }
    } catch (error) {
      console.error('백링크 제안 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const strengthenConnections = async () => {
    if (!targetNote.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/advanced/recommendations/strengthen-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetNote: {
            fileName: targetNote,
            title: targetNote.split('/').pop()?.replace('.md', '') || targetNote,
            content: targetNote
          },
          options
        }),
      });

      const data = await response.json();
      if (data.success) {
        setConnections(data.data.suggestions);
      }
    } catch (error) {
      console.error('연결 강화 제안 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'similar-notes') {
      findSimilarNotes();
    } else if (value === 'backlinks') {
      suggestBacklinks();
    } else if (value === 'connections') {
      strengthenConnections();
    }
  };



  const getPriorityColor = (priority: number) => {
    if (priority >= 0.8) return 'bg-red-500';
    if (priority >= 0.6) return 'bg-orange-500';
    if (priority >= 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">지능형 노트 추천</h2>
        <p className="text-muted-foreground">
          AI 기반으로 관련 노트를 찾고 지식 그래프를 강화하세요
        </p>
      </div>

      {/* 입력 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            대상 노트 설정
          </CardTitle>
          <CardDescription>
            분석할 노트의 파일 경로를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="예: Life_Philosophy/마음근력_0711_Summary.md"
              value={targetNote}
              onChange={(e) => setTargetNote(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => handleTabChange(activeTab)}
              disabled={loading || !targetNote.trim()}
            >
              {loading ? '분석 중...' : '분석 시작'}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">최대 추천 수</label>
              <Input
                type="number"
                value={options.maxRecommendations}
                onChange={(e) => setOptions(prev => ({ 
                  ...prev, 
                  maxRecommendations: parseInt(e.target.value) || 5 
                }))}
                min="1"
                max="20"
              />
            </div>
            <div>
              <label className="text-sm font-medium">유사도 임계값</label>
              <Input
                type="number"
                step="0.1"
                value={options.similarityThreshold}
                onChange={(e) => setOptions(prev => ({ 
                  ...prev, 
                  similarityThreshold: parseFloat(e.target.value) || 0.1 
                }))}
                min="0"
                max="1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 추천 탭 */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="similar-notes" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            유사 노트
          </TabsTrigger>
          <TabsTrigger value="backlinks" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            백링크 제안
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            연결 강화
          </TabsTrigger>
        </TabsList>

        {/* 유사 노트 탭 */}
        <TabsContent value="similar-notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                유사한 노트 추천
              </CardTitle>
              <CardDescription>
                내용과 주제가 유사한 노트들을 찾아드립니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {similarNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>유사한 노트를 찾기 위해 분석을 시작하세요</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {similarNotes.map((rec, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{rec.note.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {rec.note.fileName}
                            </p>
                            <p className="text-sm line-clamp-2">
                              {rec.note.content.substring(0, 150)}...
                            </p>
                            
                            {/* 유사도 세부 분석 */}
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">전체 유사도:</span>
                                <div className="flex items-center gap-2">
                                  <Progress 
                                    value={rec.similarity * 100} 
                                    className="w-20 h-2"
                                  />
                                  <Badge variant="secondary">
                                    {(rec.similarity * 100).toFixed(1)}%
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <span>내용:</span>
                                  <Badge variant="outline" className="text-xs">
                                    {(rec.breakdown.content * 100).toFixed(1)}%
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>제목:</span>
                                  <Badge variant="outline" className="text-xs">
                                    {(rec.breakdown.title * 100).toFixed(1)}%
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>태그:</span>
                                  <Badge variant="outline" className="text-xs">
                                    {(rec.breakdown.tags * 100).toFixed(1)}%
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Button variant="outline" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 백링크 제안 탭 */}
        <TabsContent value="backlinks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                백링크 제안
              </CardTitle>
              <CardDescription>
                현재 노트에서 참조할 수 있는 관련 노트들을 제안합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backlinks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>백링크 제안을 위해 분석을 시작하세요</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {backlinks.map((backlink, index) => (
                    <Card key={index} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{backlink.targetNote.title}</h4>
                              <Badge variant="secondary">
                                {(backlink.similarity * 100).toFixed(1)}% 유사
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {backlink.targetNote.fileName}
                            </p>
                            <p className="text-sm text-muted-foreground mb-3">
                              {backlink.reason}
                            </p>
                            <div className="bg-muted p-3 rounded-md">
                              <code className="text-sm">
                                {backlink.suggestedLink}
                              </code>
                            </div>
                          </div>
                          
                          <Button variant="outline" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 연결 강화 탭 */}
        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                연결 강화 제안
              </CardTitle>
              <CardDescription>
                지식 그래프를 강화할 수 있는 연결점들을 제안합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>연결 강화 제안을 위해 분석을 시작하세요</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map((connection, index) => (
                    <Card key={index} className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{connection.targetNote.title}</h4>
                              <Badge 
                                variant="secondary"
                                className={getPriorityColor(connection.priority)}
                              >
                                우선순위: {(connection.priority * 100).toFixed(1)}%
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {connection.targetNote.fileName}
                            </p>
                            <p className="text-sm text-muted-foreground mb-3">
                              {connection.reason}
                            </p>
                            
                            {/* 영향도 및 제안 액션 */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">영향도:</span>
                                <Progress 
                                  value={connection.impact * 100} 
                                  className="w-20 h-2"
                                />
                                <Badge variant="outline">
                                  {(connection.impact * 100).toFixed(1)}%
                                </Badge>
                              </div>
                              
                              <div className="space-y-1">
                                <span className="text-sm font-medium">제안 액션:</span>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {connection.suggestedActions.map((action, actionIndex) => (
                                    <li key={actionIndex} className="flex items-center gap-2">
                                      <Zap className="h-3 w-3" />
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <Button variant="outline" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecommendationsTab; 