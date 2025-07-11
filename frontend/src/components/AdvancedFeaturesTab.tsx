import React, { useState, useRef, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Sparkles, 
  Tags, 
  FileText, 
  Network, 
  Loader2,
  Copy,
  Check,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Lightbulb,
  Target,
  BookOpen,
  Users
} from 'lucide-react';
// useRef는 이미 위에서 import됨, next/dynamic은 사용하지 않으므로 제거

// 타입 정의
interface TaggingResult {
  success: boolean;
  tags?: Array<{ tag: string; confidence: number }>;
  detailedTags?: Array<{ tag: string; confidence: number; category: string }>;
  error?: string;
}

interface SummaryResult {
  success: boolean;
  summary?: string;
  compressionRatio?: number;
  error?: string;
}

interface GraphData {
  nodes: Array<{ id: string; group: number }>;
  links: Array<{ source: string; target: string; value: number }>;
}

interface GroupResult {
  success: boolean;
  tagGroups?: Array<{
    tag: string;
    count: number;
    notes: Array<{ title: string; content: string; tags?: string[] }>;
  }>;
  error?: string;
}

interface PatternResult {
  writingFrequency: {
    totalNotes: number;
    averageNotesPerMonth: number;
    mostActiveMonth: { month: string; noteCount: number };
  };
  tagPatterns: {
    topTags: Array<{ tag: string; count: number }>;
    totalUniqueTags: number;
    averageTagsPerNote: number;
  };
  connectionPatterns: {
    internalLinks: number;
    externalLinks: number;
    mostLinked: Array<{ title: string; linkCount: number }>;
    isolatedNotes: Array<{ title: string }>;
  };
  learningProgress?: {
    overallProgress: number;
    strengthAreas: string[];
    improvementAreas: string[];
    recommendations: string[];
  };
  learningStyle?: {
    preferredMethods: string[];
    strengths: string[];
    challenges: string[];
  };
}

interface InsightsResult {
  success: boolean;
  insights?: Array<{
    type: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    recommendations: string[];
  }>;
  error?: string;
}

// react-force-graph는 SSR 미지원이므로 dynamic import 사용(Next.js 환경 대응)
const ForceGraph2D = React.lazy(() => import('react-force-graph').then(mod => ({ default: mod.ForceGraph2D })));



const AdvancedFeaturesTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tagging');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // 자동 태깅 상태
  const [taggingContent, setTaggingContent] = useState('');
  const [taggingResult, setTaggingResult] = useState<TaggingResult | null>(null);

  // 자동 요약 상태
  const [summaryContent, setSummaryContent] = useState('');
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);

  // 지식 그래프 상태
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);

  // 노트 그룹화 상태
  const [groupNotesInput, setGroupNotesInput] = useState('');
  const [groupResult, setGroupResult] = useState<GroupResult | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const groupInputRef = useRef<HTMLTextAreaElement>(null);

  // 학습 패턴 분석 상태
  const [patternVaultPath, setPatternVaultPath] = useState('./test-vault');
  const [patternResult, setPatternResult] = useState<PatternResult | null>(null);
  const [patternLoading, setPatternLoading] = useState(false);
  const [patternError, setPatternError] = useState<string | null>(null);

  // 개인화 인사이트 상태
  const [insightsVaultPath, setInsightsVaultPath] = useState('./test-vault');
  const [userProfile, setUserProfile] = useState({
    interests: ['AI', '마음근력', '기술'],
    goals: [
      { title: 'AI 기술 마스터', priority: 'high' as const },
      { title: '마음근력 향상', priority: 'medium' as const },
      { title: '기술 트렌드 파악', priority: 'low' as const }
    ],
    learningStyle: 'visual',
    timeAvailable: 'medium'
  });
  const [insightsResult, setInsightsResult] = useState<InsightsResult | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  // 자동 태깅 실행
  const handleAutoTagging = async () => {
    if (!taggingContent.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/advanced/smart-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: taggingContent,
          maxTags: 10,
          confidence: 0.7
        }),
      });

      const result = await response.json();
      if (result.success) {
        setTaggingResult(result);
      } else {
        console.error('태깅 실패:', result.error);
      }
    } catch (error) {
      console.error('태깅 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 자동 요약 실행
  const handleAutoSummary = async () => {
    if (!summaryContent.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/advanced/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: summaryContent,
          maxLength: 200,
          style: 'concise'
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSummaryResult(result);
      } else {
        console.error('요약 실패:', result.error);
      }
    } catch (error) {
      console.error('요약 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 지식 그래프 빌드
  const handleBuildGraph = async () => {
    setGraphLoading(true);
    setGraphError(null);
    setGraphData(null);
    try {
      const res = await fetch('/api/advanced/knowledge-graph/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: [
            { id: '1', title: '마음근력', content: '정신적 인내력과 회복력을 의미합니다', tags: ['정신건강', '자기개발'] },
            { id: '2', title: '명상', content: '마음챙김과 집중력 향상', tags: ['정신건강', '집중력'] },
            { id: '3', title: '습관 형성', content: '지속적인 자기개발', tags: ['자기개발', '생산성'] },
            { id: '4', title: '스트레스 관리', content: '일상적인 스트레스 대처 방법', tags: ['정신건강', '웰빙'] },
            { id: '5', title: '목표 설정', content: '효과적인 목표 설정과 달성', tags: ['자기개발', '생산성'] }
          ],
          options: {
            similarityThreshold: 0.5,
            maxNeighbors: 3,
            linkTypes: ['tag', 'similarity']
          }
        })
      });
      if (!res.ok) throw new Error('그래프 생성 실패');
      const data = await res.json();
      setGraphData(data.data);
    } catch (e: unknown) {
      setGraphError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setGraphLoading(false);
    }
  };

  // 노트 그룹화 실행
  const handleGroupNotes = async () => {
    if (!groupNotesInput.trim()) return;
    setGroupLoading(true);
    setGroupResult(null);
    try {
      // 노트 입력: JSON 배열 또는 줄바꿈 구분(간단 예시)
      let notes: {title: string, content: string, tags?: string[]}[] = [];
      try {
        notes = JSON.parse(groupNotesInput);
      } catch {
        // 줄바꿈 구분 텍스트를 간단 파싱
        notes = groupNotesInput.split('\n').filter(Boolean).map((line, i) => ({
          title: `노트${i+1}`,
          content: line,
          tags: []
        }));
      }
      const response = await fetch('http://localhost:8080/api/advanced/tags/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const result = await response.json();
      if (result.success) {
        setGroupResult(result.data);
      } else {
        setGroupResult({ success: false, error: result.error });
      }
    } catch (e: unknown) {
      setGroupResult({ success: false, error: e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다' });
    } finally {
      setGroupLoading(false);
    }
  };

  // 학습 패턴 분석 실행
  const handleAnalyzePatterns = async () => {
    setPatternLoading(true);
    setPatternError(null);
    setPatternResult(null);
    try {
      const res = await fetch('/api/advanced/learning-patterns/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultPath: patternVaultPath,
          options: {}
        })
      });
      if (!res.ok) throw new Error('패턴 분석 실패');
      const data = await res.json();
      setPatternResult(data.data);
    } catch (e: unknown) {
      setPatternError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setPatternLoading(false);
    }
  };

  // 개인화 인사이트 생성
  const handleGenerateInsights = async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    setInsightsResult(null);
    try {
      const res = await fetch('/api/advanced/personalized-insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultPath: insightsVaultPath,
          userProfile,
          options: {}
        })
      });
      if (!res.ok) throw new Error('인사이트 생성 실패');
      const data = await res.json();
      setInsightsResult(data.data);
    } catch (e: unknown) {
      setInsightsError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setInsightsLoading(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="tagging"><Tags className="w-4 h-4 mr-1" />자동 태깅</TabsTrigger>
        <TabsTrigger value="summarize"><FileText className="w-4 h-4 mr-1" />자동 요약</TabsTrigger>
        <TabsTrigger value="group"><Sparkles className="w-4 h-4 mr-1" />노트 그룹화</TabsTrigger>
        <TabsTrigger value="graph"><Network className="w-4 h-4 mr-1" />지식 그래프</TabsTrigger>
        <TabsTrigger value="patterns"><Activity className="w-4 h-4 mr-1" />학습 패턴</TabsTrigger>
        <TabsTrigger value="insights"><Lightbulb className="w-4 h-4 mr-1" />개인화 인사이트</TabsTrigger>
      </TabsList>

        {/* 자동 태깅 탭 */}
        <TabsContent value="tagging" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-blue-600" />
                자동 태깅 생성
              </CardTitle>
              <CardDescription>
                노트 내용을 분석하여 관련 태그를 자동으로 생성합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">노트 내용</label>
                <Textarea
                  placeholder="태그를 생성할 노트 내용을 입력하세요..."
                  value={taggingContent}
                  onChange={(e) => setTaggingContent(e.target.value)}
                  rows={6}
                />
              </div>
              
              <Button 
                onClick={handleAutoTagging} 
                disabled={isLoading || !taggingContent.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    태그 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    자동 태깅 생성
                  </>
                )}
              </Button>

              {taggingResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">생성된 태그</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {taggingResult.tags?.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {taggingResult.detailedTags && (
                      <div className="space-y-2">
                        <h4 className="font-medium">상세 정보</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {taggingResult.detailedTags.map((tag: { tag: string; confidence: number; category: string }, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="text-sm">#{tag.tag}</span>
                              <span className="text-xs text-muted-foreground">
                                신뢰도: {(tag.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 자동 요약 탭 */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                자동 요약 생성
              </CardTitle>
              <CardDescription>
                긴 노트 내용을 AI가 분석하여 핵심 내용을 요약합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">원본 내용</label>
                <Textarea
                  placeholder="요약할 노트 내용을 입력하세요..."
                  value={summaryContent}
                  onChange={(e) => setSummaryContent(e.target.value)}
                  rows={6}
                />
              </div>
              
              <Button 
                onClick={handleAutoSummary} 
                disabled={isLoading || !summaryContent.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    요약 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    자동 요약 생성
                  </>
                )}
              </Button>

              {summaryResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">요약 결과</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm leading-relaxed">{summaryResult.summary}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        압축률: {summaryResult.compressionRatio}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(summaryResult.summary, 'summary')}
                      >
                        {copied === 'summary' ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            복사됨
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            복사
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 노트 그룹화 탭 */}
        <TabsContent value="group" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-green-600" />
                태그 기반 노트 그룹화
              </CardTitle>
              <CardDescription>
                여러 노트를 입력하면 태그별로 자동 그룹화합니다. (JSON 배열 또는 줄바꿈 텍스트)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                ref={groupInputRef}
                placeholder={`예시: [
  {"title":"마음근력","content":"정신적 인내력","tags":["근력"]},
  {"title":"명상","content":"집중력 향상","tags":["집중"]}
] 또는
마음근력에 대한 노트
명상에 대한 노트`}
                value={groupNotesInput}
                onChange={e => setGroupNotesInput(e.target.value)}
                rows={6}
              />
              <Button onClick={handleGroupNotes} disabled={groupLoading || !groupNotesInput.trim()} className="w-full">
                {groupLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />그룹화 중...</>) : (<><Sparkles className="h-4 w-4 mr-2" />노트 그룹화</>)}
              </Button>
              {groupResult && (
                <div className="mt-4 space-y-4">
                  {groupResult.error && <div className="text-red-500">{groupResult.error}</div>}
                  {groupResult.tagGroups && groupResult.tagGroups.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {groupResult.tagGroups.map((group: { tag: string; count: number; notes: { title: string; content: string; tags?: string[] }[] }, idx: number) => (
                        <Card key={idx} className="bg-muted">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Badge variant="secondary">#{group.tag}</Badge>
                              <span className="text-xs text-muted-foreground">{group.count}개 노트</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {group.notes.slice(0, 3).map((note: { title: string; content: string; tags?: string[] }, i: number) => (
                              <div key={i} className="p-2 rounded bg-background border text-xs mb-1">
                                <span className="font-medium">{note.title || `노트${i+1}`}</span>: {note.content?.slice(0, 40)}
                              </div>
                            ))}
                            {group.notes.length > 3 && <div className="text-xs text-muted-foreground">...외 {group.notes.length-3}개</div>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">그룹화된 태그가 없습니다.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 지식 그래프 탭 */}
        <TabsContent value="graph" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-6 w-6 text-blue-600" />
                지식 그래프 시각화
              </CardTitle>
              <CardDescription>
                노트 간 연결 구조를 그래프로 시각화합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleBuildGraph} disabled={graphLoading}>
                {graphLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Network className="w-4 h-4 mr-2" />}
                그래프 생성
              </Button>
              {graphError && <div className="text-red-500 mt-2">{graphError}</div>}
              {graphData && (
                <div className="w-full h-[500px] mt-4 border rounded">
                  <Suspense fallback={<div className="text-center py-8">그래프 로딩 중...</div>}>
                    <ForceGraph2D
                      graphData={graphData}
                      nodeLabel="id"
                      nodeAutoColorBy="group"
                      linkDirectionalParticles={2}
                      linkDirectionalArrowLength={4}
                      width={800}
                      height={500}
                    />
                  </Suspense>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 학습 패턴 탭 */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-green-600" />
                학습 패턴 분석
              </CardTitle>
              <CardDescription>
                노트 작성 패턴, 태그 사용, 연결 구조 등을 분석하여 학습 진도를 파악합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Vault 경로 (예: ./test-vault)"
                    value={patternVaultPath}
                    onChange={(e) => setPatternVaultPath(e.target.value)}
                    rows={2}
                  />
                  <Button onClick={handleAnalyzePatterns} disabled={patternLoading}>
                    {patternLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
                    분석 실행
                  </Button>
                </div>
                
                {patternError && <div className="text-red-500">{patternError}</div>}
                
                {patternResult && (
                  <div className="space-y-6">
                    {/* 작성 빈도 분석 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          작성 빈도 분석
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{patternResult.writingFrequency.totalNotes}</div>
                            <div className="text-sm text-muted-foreground">총 노트 수</div>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{patternResult.writingFrequency.averageNotesPerMonth}</div>
                            <div className="text-sm text-muted-foreground">월평균 노트</div>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{patternResult.writingFrequency.mostActiveMonth.month}</div>
                            <div className="text-sm text-muted-foreground">가장 활발한 월</div>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{patternResult.writingFrequency.mostActiveMonth.noteCount}</div>
                            <div className="text-sm text-muted-foreground">해당 월 노트 수</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 태그 패턴 분석 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Tags className="h-5 w-5" />
                          태그 사용 패턴
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">가장 많이 사용된 태그</h4>
                            <div className="flex flex-wrap gap-2">
                              {patternResult.tagPatterns.topTags.slice(0, 5).map((tag: { tag: string; count: number }, index: number) => (
                                <Badge key={index} variant="secondary">
                                  {tag.tag} ({tag.count})
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted rounded">
                              <div className="text-lg font-bold">{patternResult.tagPatterns.totalUniqueTags}</div>
                              <div className="text-sm text-muted-foreground">고유 태그 수</div>
                            </div>
                            <div className="p-3 bg-muted rounded">
                              <div className="text-lg font-bold">{patternResult.tagPatterns.averageTagsPerNote.toFixed(1)}</div>
                              <div className="text-sm text-muted-foreground">노트당 평균 태그</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 연결 패턴 분석 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Network className="h-5 w-5" />
                          연결 패턴 분석
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-muted rounded">
                            <div className="text-lg font-bold">{patternResult.connectionPatterns.internalLinks}</div>
                            <div className="text-sm text-muted-foreground">내부 링크</div>
                          </div>
                          <div className="p-3 bg-muted rounded">
                            <div className="text-lg font-bold">{patternResult.connectionPatterns.externalLinks}</div>
                            <div className="text-sm text-muted-foreground">외부 링크</div>
                          </div>
                          <div className="p-3 bg-muted rounded">
                            <div className="text-lg font-bold">{patternResult.connectionPatterns.mostLinked.length}</div>
                            <div className="text-sm text-muted-foreground">인기 노트</div>
                          </div>
                          <div className="p-3 bg-muted rounded">
                            <div className="text-lg font-bold">{patternResult.connectionPatterns.isolatedNotes.length}</div>
                            <div className="text-sm text-muted-foreground">고립된 노트</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 학습 진도 분석 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          학습 진도 분석
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-muted rounded">
                            <div className="text-lg font-bold">{patternResult.learningProgress.totalNotes}</div>
                            <div className="text-sm text-muted-foreground">총 노트 수</div>
                          </div>
                          <div className="p-3 bg-muted rounded">
                            <div className="text-lg font-bold">{patternResult.learningProgress.averageNoteSize}</div>
                            <div className="text-sm text-muted-foreground">평균 노트 크기</div>
                          </div>
                          <div className="p-3 bg-muted rounded">
                            <div className="text-lg font-bold">{patternResult.learningProgress.growthRate}%</div>
                            <div className="text-sm text-muted-foreground">성장률</div>
                          </div>
                          <div className="p-3 bg-muted rounded">
                            <div className="text-lg font-bold">{patternResult.learningProgress.totalSize}</div>
                            <div className="text-sm text-muted-foreground">총 크기 (bytes)</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 학습 스타일 분석 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          학습 스타일 분석
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">선호 주제</h4>
                            <div className="flex flex-wrap gap-2">
                              {patternResult.learningStyle.preferredTopics.map((topic: { topic: string; count: number }, index: number) => (
                                <Badge key={index} variant="outline">
                                  {topic.topic} ({topic.count})
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted rounded">
                              <div className="text-lg font-bold">{patternResult.learningStyle.writingStyle.structuredNotes}</div>
                              <div className="text-sm text-muted-foreground">구조화된 노트</div>
                            </div>
                            <div className="p-3 bg-muted rounded">
                              <div className="text-lg font-bold">{patternResult.learningStyle.organizationPattern.structuredRatio}%</div>
                              <div className="text-sm text-muted-foreground">구조화 비율</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 개인화 인사이트 탭 */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
                개인화 인사이트
              </CardTitle>
              <CardDescription>
                AI가 분석한 개인 맞춤형 학습 조언, 지식 갭 분석, 학습 로드맵을 제공합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 사용자 프로필 입력 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      사용자 프로필
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">관심 분야</label>
                        <Textarea
                          placeholder="관심 분야를 쉼표로 구분하여 입력 (예: AI, 마음근력, 기술)"
                          value={userProfile.interests.join(', ')}
                          onChange={(e) => setUserProfile({
                            ...userProfile,
                            interests: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                          })}
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">학습 목표</label>
                        <Textarea
                          placeholder="학습 목표를 한 줄씩 입력"
                          value={userProfile.goals.map(g => g.title).join('\n')}
                          onChange={(e) => setUserProfile({
                            ...userProfile,
                            goals: e.target.value.split('\n').map(s => s.trim()).filter(s => s).map(title => ({ title, priority: 'medium' }))
                          })}
                          rows={3}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 분석 실행 */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Vault 경로 (예: ./test-vault)"
                    value={insightsVaultPath}
                    onChange={(e) => setInsightsVaultPath(e.target.value)}
                    rows={2}
                  />
                  <Button onClick={handleGenerateInsights} disabled={insightsLoading}>
                    {insightsLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Lightbulb className="w-4 h-4 mr-2" />}
                    인사이트 생성
                  </Button>
                </div>
                
                {insightsError && <div className="text-red-500">{insightsError}</div>}
                
                {insightsResult && (
                  <div className="space-y-6">
                    {/* 학습 조언 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          AI 학습 조언
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {insightsResult.learningAdvice.writingHabits.map((habit: { type: string; advice: string }, index: number) => (
                            <div key={index} className="p-3 bg-muted rounded-lg">
                              <div className="font-medium text-sm text-muted-foreground mb-1">
                                {habit.type === 'frequency' ? '작성 빈도' : 
                                 habit.type === 'depth' ? '노트 깊이' : '노트 품질'}
                              </div>
                              <div className="text-sm">{habit.advice}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 지식 갭 분석 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          지식 갭 분석
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {insightsResult.knowledgeGaps.missingTopics.map((gap: { interest: string; reason: string }, index: number) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="font-medium mb-1">{gap.interest}</div>
                              <div className="text-sm text-muted-foreground">{gap.reason}</div>
                            </div>
                          ))}
                          {insightsResult.knowledgeGaps.weakConnections.map((connection: { topic: string; recommendation: string }, index: number) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="font-medium mb-1">{connection.topic}</div>
                              <div className="text-sm text-muted-foreground">{connection.recommendation}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 학습 로드맵 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          학습 로드맵
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">현재 수준: {insightsResult.learningRoadmap.currentLevel}</h4>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">단기 목표 (1-2개월)</h4>
                            <div className="space-y-2">
                              {insightsResult.learningRoadmap.shortTermGoals.map((goal: { goal: string; description: string }, index: number) => (
                                <div key={index} className="p-2 bg-muted rounded">
                                  <div className="font-medium text-sm">{goal.goal}</div>
                                  <div className="text-xs text-muted-foreground">{goal.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">중기 목표 (3-4개월)</h4>
                            <div className="space-y-2">
                              {insightsResult.learningRoadmap.mediumTermGoals.map((goal: { goal: string; description: string }, index: number) => (
                                <div key={index} className="p-2 bg-muted rounded">
                                  <div className="font-medium text-sm">{goal.goal}</div>
                                  <div className="text-xs text-muted-foreground">{goal.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 개인화 추천 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          개인화 추천
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">다음 작성할 노트</h4>
                            <div className="space-y-2">
                              {insightsResult.personalizedRecommendations.nextNotes.map((note: { title: string; description: string }, index: number) => (
                                <div key={index} className="p-2 border rounded">
                                  <div className="font-medium text-sm">{note.title}</div>
                                  <div className="text-xs text-muted-foreground">{note.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">관련 주제</h4>
                            <div className="flex flex-wrap gap-2">
                              {insightsResult.personalizedRecommendations.relatedTopics.map((topic: { topic: string }, index: number) => (
                                <Badge key={index} variant="outline">
                                  {topic.topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 목표 진행도 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          목표 진행도
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted rounded">
                              <div className="text-lg font-bold">{insightsResult.goalTracking.progressMetrics.completionRate}%</div>
                              <div className="text-sm text-muted-foreground">완료율</div>
                            </div>
                            <div className="p-3 bg-muted rounded">
                              <div className="text-lg font-bold">{insightsResult.goalTracking.progressMetrics.activeRate}%</div>
                              <div className="text-sm text-muted-foreground">활성율</div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">진행 중인 목표</h4>
                            <div className="space-y-2">
                              {insightsResult.goalTracking.inProgressGoals.map((goal: { goal: string; progress: number; nextSteps: string }, index: number) => (
                                <div key={index} className="p-2 border rounded">
                                  <div className="font-medium text-sm">{goal.goal}</div>
                                  <div className="text-xs text-muted-foreground">진행률: {goal.progress}%</div>
                                  <div className="text-xs text-muted-foreground">{goal.nextSteps}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
    </Tabs>
  );
};

export default AdvancedFeaturesTab; 