/* global describe, test, expect */
import logger from '../utils/logger.js';

/**
 * 3주차 검색 API 및 하이브리드 검색 테스트
 */

// 모킹 검색 서비스 생성
function createMockSearchService() {
  const cache = new Map();
  const indexedNotes = new Map();
  
  // 테스트용 노트 데이터 생성
  const testNotes = [
    {
      id: '/test/ai-search.md',
      metadata: {
        title: 'AI 검색 기술 연구',
        tags: ['ai', 'search', 'research'],
        content: 'AI 기반 검색 기술에 대한 연구 내용입니다.',
        filePath: '/test/ai-search.md',
        fileName: 'ai-search.md'
      }
    },
    {
      id: '/test/project-plan.md',
      metadata: {
        title: '프로젝트 계획',
        tags: ['project', 'planning'],
        content: '프로젝트 계획과 일정 관리에 대한 내용입니다.',
        filePath: '/test/project-plan.md',
        fileName: 'project-plan.md'
      }
    },
    {
      id: '/test/technology-review.md',
      metadata: {
        title: '기술 리뷰',
        tags: ['technology', 'review'],
        content: '최신 기술 동향과 리뷰 내용입니다.',
        filePath: '/test/technology-review.md',
        fileName: 'technology-review.md'
      }
    }
  ];
  
  // 테스트 데이터 초기화
  testNotes.forEach(note => {
    indexedNotes.set(note.id, note);
  });
  
  return {
    async semanticSearch(query, options = {}) {
      const { topK = 10, threshold = 0.7, filter = {} } = options;
      
      logger.info(`모킹 의미론적 검색: "${query}"`);
      
      // 캐시 확인
      const cacheKey = this.generateCacheKey('semantic', query, options);
      if (cache.has(cacheKey)) {
        logger.info('캐시된 의미론적 검색 결과 반환');
        return cache.get(cacheKey);
      }
      
      // 모킹 의미론적 검색 결과 생성
      const results = [];
      for (const [id, note] of indexedNotes) {
        if (this.applyFilter(note.metadata, filter)) {
          const score = this.calculateSemanticScore(query, note);
          if (score >= threshold) {
            results.push({
              id,
              score,
              metadata: note.metadata,
              matchType: 'semantic',
              highlights: this.extractSemanticHighlights(query, note.metadata)
            });
          }
        }
      }
      
      // 점수순 정렬
      results.sort((a, b) => b.score - a.score);
      const topResults = results.slice(0, topK);
      
      // 캐시 저장
      const result = {
        query,
        results: topResults,
        totalFound: results.length,
        searchType: 'semantic',
        metadata: {
          queryEmbedding: 1536,
          threshold,
          filter
        }
      };
      
      cache.set(cacheKey, result);
      return result;
    },
    
    async keywordSearch(query, options = {}) {
      const { topK = 10, caseSensitive = false, useRegex = false, filter = {} } = options;
      
      logger.info(`모킹 키워드 검색: "${query}"`);
      
      // 캐시 확인
      const cacheKey = this.generateCacheKey('keyword', query, options);
      if (cache.has(cacheKey)) {
        logger.info('캐시된 키워드 검색 결과 반환');
        return cache.get(cacheKey);
      }
      
      // 모킹 키워드 검색 결과 생성
      const results = [];
      for (const [id, note] of indexedNotes) {
        if (this.applyFilter(note.metadata, filter)) {
          const score = this.calculateKeywordScore(query, note, caseSensitive, useRegex);
          if (score > 0) {
            results.push({
              id,
              score,
              metadata: note.metadata,
              matchType: 'keyword',
              highlights: this.extractHighlights(query, note.metadata, caseSensitive, useRegex)
            });
          }
        }
      }
      
      // 점수순 정렬
      results.sort((a, b) => b.score - a.score);
      const topResults = results.slice(0, topK);
      
      // 캐시 저장
      const result = {
        query,
        results: topResults,
        totalFound: results.length,
        searchType: 'keyword',
        metadata: {
          caseSensitive,
          useRegex,
          filter
        }
      };
      
      cache.set(cacheKey, result);
      return result;
    },
    
    async hybridSearch(query, options = {}) {
      const { 
        topK = 10, 
        semanticWeight = 0.7, 
        keywordWeight = 0.3, 
        threshold = 0.5,
        filter = {}
      } = options;
      
      logger.info(`모킹 하이브리드 검색: "${query}"`);
      
      // 의미론적 검색과 키워드 검색 병렬 실행
      const [semanticResults, keywordResults] = await Promise.all([
        this.semanticSearch(query, { topK: topK * 2, threshold: 0.3, filter }),
        this.keywordSearch(query, { topK: topK * 2, filter })
      ]);
      
      // 결과 병합
      const mergedResults = this.mergeSearchResults(
        semanticResults.results, 
        keywordResults.results, 
        semanticWeight, 
        keywordWeight
      );
      
      // 임계값 필터링 및 상위 결과 선택
      const filteredResults = mergedResults
        .filter(result => result.score >= threshold)
        .slice(0, topK);
      
      return {
        query,
        results: filteredResults,
        totalFound: mergedResults.length,
        searchType: 'hybrid',
        metadata: {
          semanticWeight,
          keywordWeight,
          threshold,
          filter,
          semanticResults: semanticResults.results.length,
          keywordResults: keywordResults.results.length
        }
      };
    },
    
    calculateSemanticScore(query, note) {
      // 간단한 의미론적 점수 계산 (실제로는 임베딩 유사도 사용)
      const queryWords = query.toLowerCase().split(/\s+/);
      const contentWords = note.metadata.content.toLowerCase().split(/\s+/);
      const titleWords = note.metadata.title.toLowerCase().split(/\s+/);
      
      let score = 0;
      queryWords.forEach(word => {
        if (contentWords.includes(word)) score += 0.3;
        if (titleWords.includes(word)) score += 0.5;
        if (note.metadata.tags.includes(word)) score += 0.2;
      });
      
      return Math.min(score, 1.0);
    },
    
    calculateKeywordScore(query, note, caseSensitive = false, useRegex = false) {
      const content = caseSensitive ? note.metadata.content : note.metadata.content.toLowerCase();
      const searchQuery = caseSensitive ? query : query.toLowerCase();
      
      if (useRegex) {
        try {
          const regex = new RegExp(searchQuery, caseSensitive ? 'g' : 'gi');
          const matches = content.match(regex);
          return matches ? matches.length * 0.1 : 0;
        } catch (error) {
          return 0;
        }
      } else {
        const matches = content.split(searchQuery).length - 1;
        return matches * 0.1;
      }
    },
    
    mergeSearchResults(semanticResults, keywordResults, semanticWeight, keywordWeight) {
      const mergedMap = new Map();
      
      // 의미론적 검색 결과 추가
      semanticResults.forEach(result => {
        mergedMap.set(result.id, {
          ...result,
          score: result.score * semanticWeight
        });
      });
      
      // 키워드 검색 결과 병합
      keywordResults.forEach(result => {
        if (mergedMap.has(result.id)) {
          const existing = mergedMap.get(result.id);
          existing.score += result.score * keywordWeight;
          existing.matchType = 'hybrid';
        } else {
          mergedMap.set(result.id, {
            ...result,
            score: result.score * keywordWeight
          });
        }
      });
      
      return Array.from(mergedMap.values());
    },
    
    extractHighlights(query, metadata, caseSensitive = false, useRegex = false) {
      const content = metadata.content;
      const highlights = [];
      
      if (useRegex) {
        try {
          const regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
          let match;
          while ((match = regex.exec(content)) !== null) {
            highlights.push({
              text: match[0],
              start: match.index,
              end: match.index + match[0].length
            });
          }
        } catch (error) {
          // 정규식 오류 무시
        }
      } else {
        const searchQuery = caseSensitive ? query : query.toLowerCase();
        const contentLower = caseSensitive ? content : content.toLowerCase();
        let index = contentLower.indexOf(searchQuery);
        
        while (index !== -1) {
          highlights.push({
            text: content.substring(index, index + query.length),
            start: index,
            end: index + query.length
          });
          index = contentLower.indexOf(searchQuery, index + 1);
        }
      }
      
      return highlights.slice(0, 5); // 최대 5개 하이라이트
    },
    
    extractSemanticHighlights(query, metadata) {
      // 의미론적 하이라이트 (키워드 기반)
      const queryWords = query.toLowerCase().split(/\s+/);
      const highlights = [];
      
      queryWords.forEach(word => {
        if (metadata.content.toLowerCase().includes(word)) {
          const index = metadata.content.toLowerCase().indexOf(word);
          highlights.push({
            text: metadata.content.substring(index, index + word.length),
            start: index,
            end: index + word.length,
            type: 'semantic'
          });
        }
      });
      
      return highlights.slice(0, 3); // 최대 3개 하이라이트
    },
    
    applyFilter(metadata, filter) {
      if (!filter || Object.keys(filter).length === 0) return true;
      
      // 태그 필터
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag => 
          metadata.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }
      
      // 파일 경로 필터
      if (filter.filePath) {
        if (!metadata.filePath.includes(filter.filePath)) {
          return false;
        }
      }
      
      return true;
    },
    
    async generateSuggestions(query, limit = 5) {
      // 간단한 검색 제안 생성
      const suggestions = [
        `${query} 기술`,
        `${query} 연구`,
        `${query} 방법`,
        `${query} 도구`,
        `${query} 예제`
      ];
      
      return suggestions.slice(0, limit);
    },
    
    generateCacheKey(type, query, options) {
      return `${type}:${query}:${JSON.stringify(options)}`;
    },
    
    getSearchStats() {
      return {
        cacheSize: cache.size,
        cacheTimeout: 300000, // 5분
        indexedNotes: {
          totalNotes: indexedNotes.size,
          notes: Array.from(indexedNotes.keys())
        }
      };
    }
  };
}

describe('Search System Tests', () => {
  const mockSearchService = createMockSearchService();
  
  describe('Semantic Search', () => {
    test('should perform semantic search successfully', async () => {
      const results = await mockSearchService.semanticSearch('AI 검색 기술', {
        topK: 5,
        threshold: 0.5
      });
      
      expect(results).toBeDefined();
      expect(results.query).toBe('AI 검색 기술');
      expect(results.searchType).toBe('semantic');
      expect(Array.isArray(results.results)).toBe(true);
      expect(results.totalFound).toBeGreaterThanOrEqual(0);
      expect(results.metadata).toBeDefined();
    });
    
    test('should apply filters correctly', async () => {
      const results = await mockSearchService.semanticSearch('기술', {
        topK: 5,
        threshold: 0.3,
        filter: { tags: ['research'] }
      });
      
      expect(results).toBeDefined();
      expect(results.results.every(result => 
        result.metadata.tags.includes('research')
      )).toBe(true);
    });
  });
  
  describe('Keyword Search', () => {
    test('should perform keyword search successfully', async () => {
      const results = await mockSearchService.keywordSearch('프로젝트', {
        topK: 5,
        caseSensitive: false
      });
      
      expect(results).toBeDefined();
      expect(results.query).toBe('프로젝트');
      expect(results.searchType).toBe('keyword');
      expect(Array.isArray(results.results)).toBe(true);
      expect(results.totalFound).toBeGreaterThanOrEqual(0);
    });
    
    test('should handle case sensitive search', async () => {
      const results = await mockSearchService.keywordSearch('Project', {
        topK: 5,
        caseSensitive: true
      });
      
      expect(results).toBeDefined();
      expect(results.metadata.caseSensitive).toBe(true);
    });
  });
  
  describe('Hybrid Search', () => {
    test('should perform hybrid search successfully', async () => {
      const results = await mockSearchService.hybridSearch('AI 기술 연구', {
        topK: 5,
        semanticWeight: 0.7,
        keywordWeight: 0.3,
        threshold: 0.5
      });
      
      expect(results).toBeDefined();
      expect(results.query).toBe('AI 기술 연구');
      expect(results.searchType).toBe('hybrid');
      expect(Array.isArray(results.results)).toBe(true);
      expect(results.metadata.semanticWeight).toBe(0.7);
      expect(results.metadata.keywordWeight).toBe(0.3);
    });
  });
  
  describe('Search Suggestions', () => {
    test('should generate search suggestions', async () => {
      const suggestions = await mockSearchService.generateSuggestions('AI', 5);
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeLessThanOrEqual(5);
      expect(suggestions.every(suggestion => 
        typeof suggestion === 'string' && suggestion.includes('AI')
      )).toBe(true);
    });
  });
  
  describe('Search Statistics', () => {
    test('should return search statistics', () => {
      const stats = mockSearchService.getSearchStats();
      
      expect(stats).toBeDefined();
      expect(stats.cacheSize).toBeGreaterThanOrEqual(0);
      expect(stats.cacheTimeout).toBe(300000);
      expect(stats.indexedNotes.totalNotes).toBeGreaterThan(0);
      expect(Array.isArray(stats.indexedNotes.notes)).toBe(true);
    });
  });
  
  describe('Cache Functionality', () => {
    test('should generate cache keys correctly', () => {
      const cacheKey = mockSearchService.generateCacheKey('test', 'query', {});
      
      expect(typeof cacheKey).toBe('string');
      expect(cacheKey).toContain('test');
      expect(cacheKey).toContain('query');
    });
  });
  
  describe('Performance Tests', () => {
    test('should handle multiple concurrent searches', async () => {
      const startTime = Date.now();
      
      const searchPromises = [
        mockSearchService.semanticSearch('기술', { topK: 3 }),
        mockSearchService.keywordSearch('프로젝트', { topK: 3 }),
        mockSearchService.hybridSearch('AI', { topK: 3 })
      ];
      
      const results = await Promise.all(searchPromises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(3);
      expect(results.every(result => result.success !== false)).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // 1초 이내
    });
  });
}); 