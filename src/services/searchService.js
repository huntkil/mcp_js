import embeddingService from './embeddingService.js';
import vectorDatabase from './vectorDatabase.js';
import noteIndexingService from './noteIndexingService.js';
import logger from '../utils/logger.js';

class SearchService {
  constructor() {
    this.embeddingService = embeddingService;
    this.vectorDatabase = vectorDatabase;
    this.cache = new Map(); // 검색 결과 캐시
    this.cacheTimeout = 5 * 60 * 1000; // 5분 캐시
  }

  /**
   * 개선된 의미론적 검색
   */
  async semanticSearch(query, options = {}) {
    const {
      limit = 10,
      threshold = 0.3,
      filter = {},
      useWeightedEmbedding = true
    } = options;

    try {
      // 쿼리 전처리
      const processedQuery = this.embeddingService.preprocessText(query);
      
      // 쿼리 임베딩 생성
      const queryEmbedding = await this.embeddingService.embedText(processedQuery);
      
      // 벡터 데이터베이스에서 유사한 벡터 검색
      const results = await this.vectorDatabase.query(queryEmbedding, {
        limit: limit * 2, // 더 많은 결과를 가져와서 필터링
        threshold: threshold * 0.8, // 더 낮은 임계값으로 시작
        filter
      });

      // 결과 후처리 및 가중치 적용
      const processedResults = await this.processSearchResults(results, {
        query: processedQuery,
        originalQuery: query,
        useWeightedEmbedding
      });

      // 최종 필터링 및 정렬
      const finalResults = processedResults
        .filter(result => result.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return {
        success: true,
        query: query,
        results: finalResults,
        totalFound: finalResults.length,
        searchType: 'semantic',
        metadata: {
          queryEmbedding: queryEmbedding.length,
          threshold,
          filter,
          processedQuery
        }
      };

    } catch (error) {
      logger.error('Semantic search failed:', error);
      return {
        success: false,
        error: error.message,
        query: query
      };
    }
  }

  /**
   * 키워드 검색 (기존 텍스트 검색)
   * @param {string} query - 검색 쿼리
   * @param {Object} options - 검색 옵션
   */
  async keywordSearch(query, options = {}) {
    const {
      topK = 10,
      caseSensitive = false,
      useRegex = false,
      filter = {},
      useCache = true
    } = options;

    try {
      logger.info(`키워드 검색 시작: "${query}"`);
      
      // 캐시 확인
      const cacheKey = this.generateCacheKey('keyword', query, options);
      if (useCache && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          logger.info('캐시된 키워드 검색 결과 반환');
          return cached.results;
        }
      }
      
      // 인덱스된 노트에서 키워드 검색
      const indexedNotes = noteIndexingService.getIndexedNotes();
      const results = [];
      
      for (const [filePath, note] of indexedNotes) {
        try {
          const score = this.calculateKeywordScore(query, note, caseSensitive, useRegex);
          
          if (score > 0) {
            // 필터 적용
            if (this.applyFilter(note.metadata, filter)) {
              results.push({
                id: filePath,
                score,
                metadata: note.metadata,
                matchType: 'keyword',
                highlights: this.extractHighlights(query, note.metadata, caseSensitive, useRegex)
              });
            }
          }
        } catch (error) {
          logger.warn(`키워드 검색 중 오류 (${filePath}): ${error.message}`);
        }
      }
      
      // 점수순 정렬
      results.sort((a, b) => b.score - a.score);
      
      // 상위 결과만 반환
      const topResults = results.slice(0, topK);
      
      // 캐시 저장
      if (useCache) {
        this.cache.set(cacheKey, {
          results: topResults,
          timestamp: Date.now()
        });
      }
      
      logger.info(`키워드 검색 완료: ${topResults.length}개 결과`);
      
      return {
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
    } catch (error) {
      logger.error(`키워드 검색 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 하이브리드 검색 (의미론적 + 키워드)
   * @param {string} query - 검색 쿼리
   * @param {Object} options - 검색 옵션
   */
  async hybridSearch(query, options = {}) {
    const {
      topK = 10,
      semanticWeight = 0.7,
      keywordWeight = 0.3,
      threshold = 0.5,
      filter = {},
      useCache = true
    } = options;

    try {
      logger.info(`하이브리드 검색 시작: "${query}"`);
      
      // 캐시 확인
      const cacheKey = this.generateCacheKey('hybrid', query, options);
      if (useCache && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          logger.info('캐시된 하이브리드 검색 결과 반환');
          return cached.results;
        }
      }
      
      // 병렬로 두 검색 수행
      const [semanticResults, keywordResults] = await Promise.all([
        this.semanticSearch(query, { topK: topK * 2, threshold: 0.3, filter, useCache: false }),
        this.keywordSearch(query, { topK: topK * 2, filter, useCache: false })
      ]);
      
      // 결과 병합 및 재점수화
      const mergedResults = this.mergeSearchResults(
        semanticResults.results,
        keywordResults.results,
        semanticWeight,
        keywordWeight
      );
      
      // 임계값 필터링 및 정렬
      const filteredResults = mergedResults
        .filter(result => result.hybridScore >= threshold)
        .sort((a, b) => b.hybridScore - a.hybridScore)
        .slice(0, topK);
      
      // 캐시 저장
      if (useCache) {
        this.cache.set(cacheKey, {
          results: filteredResults,
          timestamp: Date.now()
        });
      }
      
      logger.info(`하이브리드 검색 완료: ${filteredResults.length}개 결과`);
      
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
          semanticCount: semanticResults.results.length,
          keywordCount: keywordResults.results.length
        }
      };
    } catch (error) {
      logger.error(`하이브리드 검색 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 검색 결과 후처리 및 가중치 적용
   */
  async processSearchResults(results, options = {}) {
    const { query, originalQuery, useWeightedEmbedding } = options;
    
    return await Promise.all(results.map(async (result) => {
      let finalScore = result.score;
      
      // 메타데이터 가중치 적용
      if (useWeightedEmbedding && result.vectorMetadata) {
        const metadata = result.vectorMetadata;
        
        // 제목 매칭 가중치
        if (metadata.title && this.hasExactMatch(query, metadata.title)) {
          finalScore *= 1.5;
        }
        
        // 태그 매칭 가중치
        if (metadata.tags && metadata.tags.length > 0) {
          const tagMatches = metadata.tags.filter(tag => 
            this.hasExactMatch(query, tag)
          ).length;
          if (tagMatches > 0) {
            finalScore *= (1 + tagMatches * 0.2);
          }
        }
        
        // 파일명 매칭 가중치
        if (metadata.fileName && this.hasExactMatch(query, metadata.fileName)) {
          finalScore *= 1.3;
        }
      }
      
      // 하이라이트 생성
      const highlights = this.generateHighlights(result, query);
      
      return {
        ...result,
        score: Math.min(finalScore, 1.0), // 점수 상한선
        highlights
      };
    }));
  }

  /**
   * 정확한 매칭 확인
   */
  hasExactMatch(query, text) {
    if (!query || !text) return false;
    
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    // 완전 일치
    if (queryLower === textLower) return true;
    
    // 부분 일치 (단어 단위)
    const queryWords = queryLower.split(/\s+/);
    const textWords = textLower.split(/\s+/);
    
    return queryWords.some(word => 
      textWords.some(textWord => textWord.includes(word) || word.includes(textWord))
    );
  }

  /**
   * 개선된 하이라이트 생성
   */
  generateHighlights(result, query) {
    const highlights = [];
    
    if (!result.vectorMetadata) return highlights;
    
    const metadata = result.vectorMetadata;
    const queryLower = query.toLowerCase();
    
    // 제목 하이라이트
    if (metadata.title && this.hasExactMatch(query, metadata.title)) {
      highlights.push({
        field: 'title',
        matches: 1,
        text: metadata.title,
        type: 'semantic'
      });
    }
    
    // 태그 하이라이트
    if (metadata.tags && metadata.tags.length > 0) {
      const matchingTags = metadata.tags.filter(tag => 
        this.hasExactMatch(query, tag)
      );
      if (matchingTags.length > 0) {
        highlights.push({
          field: 'tags',
          matches: matchingTags.length,
          text: matchingTags.join(', '),
          type: 'semantic'
        });
      }
    }
    
    // 파일명 하이라이트
    if (metadata.fileName && this.hasExactMatch(query, metadata.fileName)) {
      highlights.push({
        field: 'fileName',
        matches: 1,
        text: metadata.fileName,
        type: 'semantic'
      });
    }
    
    return highlights;
  }

  /**
   * 키워드 점수 계산
   * @param {string} query - 검색 쿼리
   * @param {Object} note - 노트 정보
   * @param {boolean} caseSensitive - 대소문자 구분
   * @param {boolean} useRegex - 정규식 사용
   */
  calculateKeywordScore(query, note, caseSensitive = false, useRegex = false) {
    let score = 0;
    const searchText = caseSensitive ? query : query.toLowerCase();
    const title = caseSensitive ? note.metadata.title : note.metadata.title.toLowerCase();
    const tags = note.metadata.tags || [];
    const content = caseSensitive ? note.metadata.content : note.metadata.content.toLowerCase();
    
    // 제목 매칭 (가장 높은 가중치)
    if (useRegex) {
      try {
        const regex = new RegExp(searchText, caseSensitive ? '' : 'i');
        if (regex.test(title)) score += 10;
        if (regex.test(content)) score += 1;
      } catch (error) {
        // 잘못된 정규식은 무시
      }
    } else {
      if (title.includes(searchText)) score += 10;
      if (content.includes(searchText)) score += 1;
    }
    
    // 태그 매칭
    for (const tag of tags) {
      const tagText = caseSensitive ? tag : tag.toLowerCase();
      if (useRegex) {
        try {
          const regex = new RegExp(searchText, caseSensitive ? '' : 'i');
          if (regex.test(tagText)) score += 5;
        } catch (error) {
          // 잘못된 정규식은 무시
        }
      } else {
        if (tagText.includes(searchText)) score += 5;
      }
    }
    
    // 정확한 단어 매칭 보너스
    const words = searchText.split(/\s+/);
    for (const word of words) {
      if (word.length > 2) {
        const wordRegex = new RegExp(`\\b${word}\\b`, caseSensitive ? '' : 'i');
        if (wordRegex.test(title)) score += 2;
        if (wordRegex.test(content)) score += 0.5;
      }
    }
    
    return score;
  }

  /**
   * 검색 결과 병합
   * @param {Array} semanticResults - 의미론적 검색 결과
   * @param {Array} keywordResults - 키워드 검색 결과
   * @param {number} semanticWeight - 의미론적 가중치
   * @param {number} keywordWeight - 키워드 가중치
   */
  mergeSearchResults(semanticResults, keywordResults, semanticWeight, keywordWeight) {
    const mergedMap = new Map();
    
    // 의미론적 검색 결과 추가
    for (const result of semanticResults) {
      mergedMap.set(result.id, {
        ...result,
        semanticScore: result.score,
        keywordScore: 0,
        hybridScore: result.score * semanticWeight
      });
    }
    
    // 키워드 검색 결과 병합
    for (const result of keywordResults) {
      if (mergedMap.has(result.id)) {
        // 기존 결과 업데이트
        const existing = mergedMap.get(result.id);
        existing.keywordScore = result.score;
        existing.hybridScore = (existing.semanticScore * semanticWeight) + (result.score * keywordWeight);
        existing.matchType = 'hybrid';
        existing.keywordHighlights = result.highlights;
      } else {
        // 새 결과 추가
        mergedMap.set(result.id, {
          ...result,
          semanticScore: 0,
          keywordScore: result.score,
          hybridScore: result.score * keywordWeight
        });
      }
    }
    
    return Array.from(mergedMap.values());
  }

  /**
   * 하이라이트 추출 (키워드)
   * @param {string} query - 검색 쿼리
   * @param {Object} metadata - 메타데이터
   * @param {boolean} caseSensitive - 대소문자 구분
   * @param {boolean} useRegex - 정규식 사용
   */
  extractHighlights(query, metadata, caseSensitive = false, useRegex = false) {
    const highlights = [];
    const searchText = caseSensitive ? query : query.toLowerCase();
    const title = metadata.title || '';
    const content = metadata.content || '';
    
    // 제목 하이라이트
    if (useRegex) {
      try {
        const regex = new RegExp(searchText, caseSensitive ? 'g' : 'gi');
        const titleMatches = title.match(regex);
        if (titleMatches) {
          highlights.push({
            field: 'title',
            matches: titleMatches.length,
            text: title
          });
        }
      } catch (error) {
        // 잘못된 정규식은 무시
      }
    } else {
      if (title.toLowerCase().includes(searchText)) {
        highlights.push({
          field: 'title',
          matches: 1,
          text: title
        });
      }
    }
    
    // 내용 하이라이트 (첫 번째 매칭만)
    if (content.toLowerCase().includes(searchText)) {
      const index = content.toLowerCase().indexOf(searchText);
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + searchText.length + 50);
      const snippet = content.substring(start, end);
      
      highlights.push({
        field: 'content',
        matches: 1,
        text: snippet,
        position: { start, end }
      });
    }
    
    return highlights;
  }

  /**
   * 하이라이트 추출 (의미론적)
   * @param {string} query - 검색 쿼리
   * @param {Object} metadata - 메타데이터
   */
  extractSemanticHighlights(query, metadata) {
    const highlights = [];
    
    // 제목과 태그는 항상 포함
    if (metadata.title) {
      highlights.push({
        field: 'title',
        matches: 1,
        text: metadata.title,
        type: 'semantic'
      });
    }
    
    if (metadata.tags && metadata.tags.length > 0) {
      highlights.push({
        field: 'tags',
        matches: metadata.tags.length,
        text: metadata.tags.join(', '),
        type: 'semantic'
      });
    }
    
    // 청크 내용이 있으면 포함
    if (metadata.chunkContent) {
      highlights.push({
        field: 'content',
        matches: 1,
        text: metadata.chunkContent.substring(0, 200) + '...',
        type: 'semantic'
      });
    }
    
    return highlights;
  }

  /**
   * 필터 적용
   * @param {Object} metadata - 메타데이터
   * @param {Object} filter - 필터 조건
   */
  applyFilter(metadata, filter) {
    if (!filter || Object.keys(filter).length === 0) {
      return true;
    }
    
    for (const [key, value] of Object.entries(filter)) {
      if (key === 'tags' && Array.isArray(value)) {
        // 태그 필터: 하나라도 일치해야 함
        const noteTags = metadata.tags || [];
        const hasMatchingTag = value.some(tag => noteTags.includes(tag));
        if (!hasMatchingTag) return false;
      } else if (key === 'filePath' && typeof value === 'string') {
        // 파일 경로 필터
        if (!metadata.filePath.includes(value)) return false;
      } else if (key === 'created' && typeof value === 'object') {
        // 날짜 범위 필터
        const created = new Date(metadata.created);
        if (value.start && created < new Date(value.start)) return false;
        if (value.end && created > new Date(value.end)) return false;
      } else if (metadata[key] !== value) {
        // 일반 필터
        return false;
      }
    }
    
    return true;
  }

  /**
   * 노트 메타데이터 조회
   * @param {string} id - 노트 ID
   */
  getNoteMetadata(id) {
    // 청크 ID에서 원본 파일 경로 추출
    const filePath = id.replace(/-chunk-\d+$/, '').replace(/-title$/, '');
    const indexedNotes = noteIndexingService.getIndexedNotes();
    return indexedNotes.get(filePath)?.metadata;
  }

  /**
   * 캐시 키 생성
   * @param {string} type - 검색 타입
   * @param {string} query - 쿼리
   * @param {Object} options - 옵션
   */
  generateCacheKey(type, query, options) {
    const optionsStr = JSON.stringify(options);
    return `${type}:${query}:${optionsStr}`;
  }

  /**
   * 캐시 정리
   */
  clearCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
    logger.info('검색 캐시 정리 완료');
  }

  /**
   * 검색 통계 조회
   */
  getSearchStats() {
    return {
      cacheSize: this.cache.size,
      cacheTimeout: this.cacheTimeout,
      indexedNotes: noteIndexingService.getIndexStats()
    };
  }
}

export default new SearchService(); 