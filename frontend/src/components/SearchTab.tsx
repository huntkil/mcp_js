import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { VirtualList } from './ui/virtual-list';
import { useDebounce, usePerformanceMonitor } from '../hooks/usePerformance';
import { 
  Search, 
  FileText, 
  Clock, 
  TrendingUp,
  Filter
} from 'lucide-react';

interface SearchResult {
  fileName: string;
  title: string;
  content: string;
  similarity: number;
  tags?: string[];
  lastModified?: string;
}

interface SearchOptions {
  includeContent: boolean;
  includeTags: boolean;
  similarityThreshold: number;
  maxResults: number;
  sortBy: 'relevance' | 'date' | 'title';
}

const SearchTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<SearchOptions>({
    includeContent: true,
    includeTags: true,
    similarityThreshold: 0.1,
    maxResults: 50,
    sortBy: 'relevance'
  });

  // 성능 모니터링
  const { renderCount } = usePerformanceMonitor('SearchTab');

  // 디바운스된 검색
  const debouncedSearch = useDebounce(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/search/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: term,
          options
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.data.results || []);
      }
    } catch (error) {
      console.error('검색 실패:', error);
    } finally {
      setLoading(false);
    }
  }, 300);

  // 검색 실행
  const handleSearch = useCallback((term: string) => {
    debouncedSearch(term);
  }, [debouncedSearch]);

  // 검색어 변경 시 검색 실행
  React.useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, handleSearch]);

  // 정렬된 결과
  const sortedResults = useMemo(() => {
    if (!results.length) return [];
    
    return [...results].sort((a, b) => {
      switch (options.sortBy) {
        case 'relevance':
          return b.similarity - a.similarity;
        case 'date':
          return new Date(b.lastModified || '').getTime() - new Date(a.lastModified || '').getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [results, options.sortBy]);

  // 검색 결과 렌더링
  const renderSearchResult = useCallback((result: SearchResult, index: number) => (
    <Card key={`${result.fileName}-${index}`} className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-lg">{result.title}</h4>
              <Badge variant="secondary">
                {(result.similarity * 100).toFixed(1)}%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {result.fileName}
            </p>
            <p className="text-sm line-clamp-2 mb-3">
              {result.content.substring(0, 200)}...
            </p>
            
            {/* 태그 표시 */}
            {result.tags && result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {result.tags.slice(0, 5).map((tag, tagIndex) => (
                  <Badge key={tagIndex} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
                {result.tags.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{result.tags.length - 5}
                  </Badge>
                )}
              </div>
            )}
            
            {/* 유사도 바 */}
            <div className="flex items-center gap-2">
              <Progress 
                value={result.similarity * 100} 
                className="flex-1 h-2"
              />
              <span className="text-xs text-muted-foreground">
                {result.similarity > 0.8 ? '매우 높음' : 
                 result.similarity > 0.6 ? '높음' : 
                 result.similarity > 0.4 ? '보통' : '낮음'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 ml-4">
            {result.lastModified && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(result.lastModified).toLocaleDateString()}
              </div>
            )}
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ), []);

  return (
    <div className="space-y-6">
      {/* 검색 헤더 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6 text-blue-600" />
            지능형 검색
            {renderCount > 1 && (
              <Badge variant="outline" className="text-xs">
                렌더링: {renderCount}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            의미 기반 검색으로 관련 노트를 찾습니다. 벡터 데이터베이스의 603개 벡터를 활용합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="검색어를 입력하세요..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 검색 옵션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            검색 옵션
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">최대 결과 수</label>
              <select
                value={options.maxResults}
                onChange={(e) => setOptions(prev => ({ ...prev, maxResults: Number(e.target.value) }))}
                className="w-full p-2 border rounded"
              >
                <option value={10}>10개</option>
                <option value={25}>25개</option>
                <option value={50}>50개</option>
                <option value={100}>100개</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">유사도 임계값</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={options.similarityThreshold}
                  onChange={(e) => setOptions(prev => ({ ...prev, similarityThreshold: Number(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-sm">{(options.similarityThreshold * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">정렬 기준</label>
              <select
                value={options.sortBy}
                onChange={(e) => setOptions(prev => ({ ...prev, sortBy: e.target.value as 'relevance' | 'date' | 'title' }))}
                className="w-full p-2 border rounded"
              >
                <option value="relevance">관련도</option>
                <option value="date">날짜</option>
                <option value="title">제목</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">검색 범위</label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={options.includeContent}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeContent: e.target.checked }))}
                  />
                  내용 포함
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={options.includeTags}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeTags: e.target.checked }))}
                  />
                  태그 포함
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 검색 결과 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            검색 결과
            {results.length > 0 && (
              <Badge variant="secondary">
                {results.length}개 결과
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p>검색 중...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>검색어를 입력하여 노트를 찾아보세요</p>
            </div>
          ) : (
            <VirtualList
              items={sortedResults}
              height={600}
              itemHeight={180}
              renderItem={renderSearchResult}
              overscanCount={3}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchTab; 