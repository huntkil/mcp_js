import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { VirtualList } from './ui/virtual-list';
import { 
  Search, 
  FileText, 
  Clock, 
  TrendingUp,
  Zap,
  Star,
  Tag,
  Calendar,
  User,
  BookOpen,
  Lightbulb,
  Target,
  Sparkles,
  SortAsc,
  SortDesc
} from 'lucide-react';

interface SearchResult {
  fileName: string;
  title: string;
  content: string;
  similarity: number;
  tags?: string[];
  lastModified?: string;
  author?: string;
  category?: string;
  readCount?: number;
  rating?: number;
}

interface SearchOptions {
  includeContent: boolean;
  includeTags: boolean;
  similarityThreshold: number;
  maxResults: number;
  sortBy: 'relevance' | 'date' | 'title' | 'popularity';
  sortOrder: 'asc' | 'desc';
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

const EnhancedSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [options, setOptions] = useState<SearchOptions>({
    includeContent: true,
    includeTags: true,
    similarityThreshold: 0.7,
    maxResults: 50,
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const categories = [
    { id: 'all', name: '전체', icon: BookOpen },
    { id: 'mind-strength', name: '마음근력', icon: Target },
    { id: 'ai-technology', name: 'AI 기술', icon: Sparkles },
    { id: 'machine-learning', name: '머신러닝', icon: Lightbulb },
    { id: 'personal-development', name: '자기계발', icon: TrendingUp }
  ];

  const searchFilters = [
    { id: 'recent', label: '최근', icon: Clock },
    { id: 'popular', label: '인기', icon: Star },
    { id: 'tagged', label: '태그됨', icon: Tag },
    { id: 'ai-enhanced', label: 'AI 강화', icon: Zap }
  ];

  const performSearch = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    const startTime = performance.now();

    try {
      const response = await fetch('http://localhost:8080/api/search/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          options: {
            ...options,
            maxResults: options.maxResults,
            similarityThreshold: options.similarityThreshold
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data.results || []);
      } else {
        console.error('Search failed:', data.error);
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      const endTime = performance.now();
      setSearchTime(endTime - startTime);
      setIsLoading(false);
    }
  }, [options]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
      setSearchTime(0);
    }
  }, [debouncedQuery, performSearch]);

  const filteredResults = useMemo(() => {
    const filtered = [...results];

    // 정렬
    filtered.sort((a, b) => {
      switch (options.sortBy) {
        case 'relevance': {
          return options.sortOrder === 'desc' ? b.similarity - a.similarity : a.similarity - b.similarity;
        }
        case 'date': {
          const dateA = new Date(a.lastModified || '').getTime();
          const dateB = new Date(b.lastModified || '').getTime();
          return options.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        }
        case 'title': {
          return options.sortOrder === 'desc' 
            ? b.title.localeCompare(a.title)
            : a.title.localeCompare(b.title);
        }
        case 'popularity': {
          const popularityA = (a.readCount || 0) * (a.rating || 0);
          const popularityB = (b.readCount || 0) * (b.rating || 0);
          return options.sortOrder === 'desc' ? popularityB - popularityA : popularityA - popularityB;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [results, options]);

  const renderSearchResult = (result: SearchResult, index: number) => (
    <Card key={`${result.fileName}-${index}`} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg truncate">{result.title}</h3>
              <Badge variant="outline" className="text-xs">
                {(result.similarity * 100).toFixed(1)}%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {result.fileName}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {result.rating && (
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span className="text-xs">{result.rating.toFixed(1)}</span>
              </div>
            )}
            {result.readCount && (
              <div className="flex items-center space-x-1">
                <BookOpen className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">{result.readCount}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {options.includeContent && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {result.content}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            {result.lastModified && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(result.lastModified).toLocaleDateString()}</span>
              </div>
            )}
            {result.author && (
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{result.author}</span>
              </div>
            )}
          </div>
          
          {result.tags && result.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              {result.tags.slice(0, 3).map((tag, tagIndex) => (
                <Badge key={tagIndex} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {result.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{result.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">검색</h1>
          <p className="text-muted-foreground">
            AI 기반 의미론적 검색으로 노트를 찾아보세요
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Zap className="h-3 w-3 mr-1" />
            AI 검색
          </Badge>
        </div>
      </div>

      {/* 검색 입력 */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="검색어를 입력하세요 (예: 마음근력, AI 기술, 자기계발...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
          
          {isLoading && (
            <div className="mt-4">
              <Progress value={undefined} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">검색 중...</p>
            </div>
          )}
          
          {searchTime > 0 && !isLoading && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>검색 완료: {searchTime.toFixed(0)}ms</span>
              <span>•</span>
              <span>{filteredResults.length}개 결과</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 필터 및 옵션 */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* 카테고리 필터 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">카테고리</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setOptions(prev => ({ ...prev, category: category.id }))}
                >
                  <category.icon className="h-4 w-4 mr-2" />
                  {category.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 검색 필터 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">필터</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {searchFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <filter.icon className="h-4 w-4 mr-2" />
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 정렬 옵션 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">정렬</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setOptions(prev => ({ 
                  ...prev, 
                  sortBy: 'relevance',
                  sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc'
                }))}
              >
                {options.sortOrder === 'desc' ? <SortDesc className="h-4 w-4 mr-2" /> : <SortAsc className="h-4 w-4 mr-2" />}
                관련도
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setOptions(prev => ({ 
                  ...prev, 
                  sortBy: 'date',
                  sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc'
                }))}
              >
                {options.sortOrder === 'desc' ? <SortDesc className="h-4 w-4 mr-2" /> : <SortAsc className="h-4 w-4 mr-2" />}
                날짜
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setOptions(prev => ({ 
                  ...prev, 
                  sortBy: 'popularity',
                  sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc'
                }))}
              >
                {options.sortOrder === 'desc' ? <SortDesc className="h-4 w-4 mr-2" /> : <SortAsc className="h-4 w-4 mr-2" />}
                인기도
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 검색 옵션 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">옵션</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeContent"
                  checked={options.includeContent}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeContent: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="includeContent" className="text-sm">내용 포함</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeTags"
                  checked={options.includeTags}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeTags: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="includeTags" className="text-sm">태그 포함</label>
              </div>
              <div className="space-y-2">
                <label className="text-sm">유사도 임계값</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={options.similarityThreshold}
                  onChange={(e) => setOptions(prev => ({ 
                    ...prev, 
                    similarityThreshold: parseFloat(e.target.value) 
                  }))}
                  className="w-full"
                />
                <span className="text-xs text-muted-foreground">
                  {(options.similarityThreshold * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 결과 */}
      {filteredResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>검색 결과</CardTitle>
            <CardDescription>
              {filteredResults.length}개의 결과를 찾았습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VirtualList
              items={filteredResults}
              height={600}
              itemHeight={200}
              renderItem={renderSearchResult}
              className="space-y-4"
            />
          </CardContent>
        </Card>
      )}

      {/* 검색 제안 */}
      {query && filteredResults.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">검색 결과가 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              다른 검색어를 시도해보거나 검색 옵션을 조정해보세요
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => setQuery('마음근력')}>
                마음근력
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuery('AI')}>
                AI
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuery('자기계발')}>
                자기계발
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedSearch; 