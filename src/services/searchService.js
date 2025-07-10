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
      const results = await this.vectorDatabase.query(queryEmbedding, limit * 2, filter);

      // 디버깅을 위한 점수 로그
      if (results.length > 0) {
        logger.info(`[SEARCH][DEBUG] 벡터 검색 결과 점수: ${results.slice(0, 5).map(r => `${r.id}: ${r.score.toFixed(4)}`).join(', ')}`);
      } else {
        logger.info(`[SEARCH][DEBUG] 벡터 검색 결과 없음`);
      }
      
      // 결과 후처리 및 가중치 적용
      const processedResults = await this.processSearchResults(results, {
        query: processedQuery,
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
      useCache = true,
      searchContent = true // 본문 내용 검색 추가
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
          const score = this.calculateKeywordScore(query, note, caseSensitive, useRegex, searchContent);
          
          if (score > 0) {
            // 필터 적용
            if (this.applyFilter(note.metadata, filter)) {
              results.push({
                id: filePath,
                score,
                metadata: note.metadata,
                matchType: 'keyword',
                highlights: this.extractHighlights(query, note.metadata, caseSensitive, useRegex, searchContent)
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
          filter,
          searchContent
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
    const { query, useWeightedEmbedding } = options;
    
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
   * @param {Object} note - 노트 객체
   * @param {boolean} caseSensitive - 대소문자 구분
   * @param {boolean} useRegex - 정규식 사용
   * @param {boolean} searchContent - 본문 내용 검색 여부
   */
  calculateKeywordScore(query, note, caseSensitive = false, useRegex = false, searchContent = true) {
    let score = 0;
    const searchText = caseSensitive ? query : query.toLowerCase();
    
    // 메타데이터 검색
    if (note.metadata) {
      const title = caseSensitive ? note.metadata.title : note.metadata.title?.toLowerCase();
      const tags = Array.isArray(note.metadata.tags) ? note.metadata.tags.join(' ') : note.metadata.tags || '';
      const tagsLower = caseSensitive ? tags : tags.toLowerCase();
      
      // 제목 매칭 (높은 가중치)
      if (title && this.hasMatch(searchText, title, useRegex)) {
        score += 10;
      }
      
      // 태그 매칭 (중간 가중치)
      if (tagsLower && this.hasMatch(searchText, tagsLower, useRegex)) {
        score += 5;
      }
    }
    
    // 본문 내용 검색 (새로 추가)
    if (searchContent && note.content) {
      const content = caseSensitive ? note.content : note.content.toLowerCase();
      
      // 정확한 매칭
      if (this.hasExactMatch(searchText, content)) {
        score += 8;
      }
      
      // 부분 매칭
      if (this.hasMatch(searchText, content, useRegex)) {
        score += 3;
      }
      
      // 단어 빈도 기반 점수
      const wordCount = this.countWordOccurrences(searchText, content);
      score += wordCount * 2;
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
   * 하이라이팅 추출
   * @param {string} query - 검색 쿼리
   * @param {Object} metadata - 메타데이터
   * @param {boolean} caseSensitive - 대소문자 구분
   * @param {boolean} useRegex - 정규식 사용
   * @param {boolean} searchContent - 본문 내용 검색 여부
   */
  extractHighlights(query, metadata, caseSensitive = false, useRegex = false, searchContent = true) {
    const highlights = [];
    const searchText = caseSensitive ? query : query.toLowerCase();
    
    // 제목 하이라이팅
    if (metadata.title) {
      const title = caseSensitive ? metadata.title : metadata.title.toLowerCase();
      if (this.hasMatch(searchText, title, useRegex)) {
        highlights.push({
          field: 'title',
          text: metadata.title,
          matches: this.findMatches(searchText, metadata.title, useRegex)
        });
      }
    }
    
    // 태그 하이라이팅
    if (metadata.tags && Array.isArray(metadata.tags)) {
      const tagsText = metadata.tags.join(' ');
      const tagsLower = caseSensitive ? tagsText : tagsText.toLowerCase();
      if (this.hasMatch(searchText, tagsLower, useRegex)) {
        highlights.push({
          field: 'tags',
          text: tagsText,
          matches: this.findMatches(searchText, tagsText, useRegex)
        });
      }
    }
    
    // 본문 내용 하이라이팅 (새로 추가)
    if (searchContent && metadata.content) {
      const content = caseSensitive ? metadata.content : metadata.content.toLowerCase();
      if (this.hasMatch(searchText, content, useRegex)) {
        // 본문에서 매칭된 부분 주변 텍스트 추출
        const context = this.extractContext(searchText, metadata.content, 100);
        highlights.push({
          field: 'content',
          text: context,
          matches: this.findMatches(searchText, context, useRegex)
        });
      }
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
        text: Array.isArray(metadata.tags) ? metadata.tags.join(', ') : (typeof metadata.tags === 'string' ? metadata.tags : ''),
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

  /**
   * 단어 발생 횟수 계산
   * @param {string} word - 찾을 단어
   * @param {string} text - 검색할 텍스트
   * @returns {number} 발생 횟수
   */
  countWordOccurrences(word, text) {
    if (!word || !text) return 0;
    
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  /**
   * 매칭된 부분 찾기
   * @param {string} query - 검색 쿼리
   * @param {string} text - 검색할 텍스트
   * @param {boolean} useRegex - 정규식 사용
   * @returns {Array} 매칭된 부분 배열
   */
  findMatches(query, text, useRegex = false) {
    const matches = [];
    
    if (!query || !text) return matches;
    
    if (useRegex) {
      try {
        const regex = new RegExp(query, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0]
          });
        }
      } catch (error) {
        // 정규식 오류 시 일반 텍스트 검색으로 폴백
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index !== -1) {
          matches.push({
            start: index,
            end: index + query.length,
            text: text.substring(index, index + query.length)
          });
        }
      }
    } else {
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      let index = 0;
      
      while ((index = lowerText.indexOf(lowerQuery, index)) !== -1) {
        matches.push({
          start: index,
          end: index + query.length,
          text: text.substring(index, index + query.length)
        });
        index += query.length;
      }
    }
    
    return matches;
  }

  /**
   * 매칭된 부분 주변 컨텍스트 추출
   * @param {string} query - 검색 쿼리
   * @param {string} text - 전체 텍스트
   * @param {number} contextLength - 컨텍스트 길이
   * @returns {string} 컨텍스트 텍스트
   */
  extractContext(query, text, contextLength = 100) {
    if (!query || !text) return '';
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text.substring(0, contextLength);
    
    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(text.length, index + query.length + contextLength / 2);
    
    let context = text.substring(start, end);
    
    // 문장 경계 조정
    if (start > 0) {
      const sentenceStart = context.indexOf('.') + 1;
      if (sentenceStart > 0 && sentenceStart < contextLength / 2) {
        context = context.substring(sentenceStart);
      }
    }
    
    if (end < text.length) {
      const sentenceEnd = context.lastIndexOf('.');
      if (sentenceEnd > contextLength / 2) {
        context = context.substring(0, sentenceEnd + 1);
      }
    }
    
    return context.trim();
  }

  /**
   * 매칭 확인
   * @param {string} query - 검색 쿼리
   * @param {string} text - 검색할 텍스트
   * @param {boolean} useRegex - 정규식 사용
   * @returns {boolean} 매칭 여부
   */
  hasMatch(query, text, useRegex = false) {
    if (!query || !text) return false;
    
    if (useRegex) {
      try {
        const regex = new RegExp(query, 'i');
        return regex.test(text);
      } catch (error) {
        // 정규식 오류 시 일반 텍스트 검색으로 폴백
        return text.toLowerCase().includes(query.toLowerCase());
      }
    } else {
      return text.toLowerCase().includes(query.toLowerCase());
    }
  }
}

export default new SearchService(); 