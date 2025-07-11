import express from 'express';
import searchService from '../services/searchService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /api/search/semantic:
 *   post:
 *     summary: 의미론적 검색 수행
 *     description: 벡터 기반 의미론적 검색을 수행합니다.
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: 검색 쿼리
 *                 example: "AI 기반 검색 기술"
 *               topK:
 *                 type: integer
 *                 description: 반환할 최대 결과 수
 *                 default: 10
 *                 example: 5
 *               threshold:
 *                 type: number
 *                 description: 유사도 임계값 (0-1)
 *                 default: 0.7
 *                 example: 0.8
 *               filter:
 *                 type: object
 *                 description: 필터 조건
 *                 example:
 *                   tags: ["ai", "search"]
 *                   filePath: "/research/"
 *     responses:
 *       200:
 *         description: 검색 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 query:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       score:
 *                         type: number
 *                       metadata:
 *                         type: object
 *                       matchType:
 *                         type: string
 *                       highlights:
 *                         type: array
 *                 totalFound:
 *                   type: integer
 *                 searchType:
 *                   type: string
 *                 metadata:
 *                   type: object
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/semantic', async (req, res) => {
  try {
    const { query, topK = 10, threshold = 0.7, filter = {} } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: '검색 쿼리가 필요합니다.'
      });
    }
    
    logger.info(`의미론적 검색 요청: "${query}"`);
    
    const results = await searchService.semanticSearch(query, {
      topK,
      threshold,
      filter
    });
    
    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    logger.error(`의미론적 검색 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/search/keyword:
 *   post:
 *     summary: 키워드 검색 수행
 *     description: 전통적인 키워드 기반 검색을 수행합니다.
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: 검색 쿼리
 *                 example: "프로젝트 계획"
 *               topK:
 *                 type: integer
 *                 description: 반환할 최대 결과 수
 *                 default: 10
 *                 example: 5
 *               caseSensitive:
 *                 type: boolean
 *                 description: 대소문자 구분 여부
 *                 default: false
 *                 example: false
 *               useRegex:
 *                 type: boolean
 *                 description: 정규식 사용 여부
 *                 default: false
 *                 example: false
 *               filter:
 *                 type: object
 *                 description: 필터 조건
 *                 example:
 *                   tags: ["project"]
 *     responses:
 *       200:
 *         description: 검색 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/keyword', async (req, res) => {
  try {
    const { 
      query, 
      topK = 10, 
      caseSensitive = false, 
      useRegex = false, 
      filter = {} 
    } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: '검색 쿼리가 필요합니다.'
      });
    }
    
    logger.info(`키워드 검색 요청: "${query}"`);
    
    const results = await searchService.keywordSearch(query, {
      topK,
      caseSensitive,
      useRegex,
      filter
    });
    
    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    logger.error(`키워드 검색 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/search/hybrid:
 *   post:
 *     summary: 하이브리드 검색 수행
 *     description: 의미론적 검색과 키워드 검색을 결합한 하이브리드 검색을 수행합니다.
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: 검색 쿼리
 *                 example: "AI 검색 기술 연구"
 *               topK:
 *                 type: integer
 *                 description: 반환할 최대 결과 수
 *                 default: 10
 *                 example: 5
 *               semanticWeight:
 *                 type: number
 *                 description: 의미론적 검색 가중치 (0-1)
 *                 default: 0.7
 *                 example: 0.8
 *               keywordWeight:
 *                 type: number
 *                 description: 키워드 검색 가중치 (0-1)
 *                 default: 0.3
 *                 example: 0.2
 *               threshold:
 *                 type: number
 *                 description: 최종 점수 임계값 (0-1)
 *                 default: 0.5
 *                 example: 0.6
 *               filter:
 *                 type: object
 *                 description: 필터 조건
 *                 example:
 *                   tags: ["ai", "research"]
 *     responses:
 *       200:
 *         description: 검색 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/hybrid', async (req, res) => {
  try {
    const { 
      query, 
      topK = 10, 
      semanticWeight = 0.7, 
      keywordWeight = 0.3, 
      threshold = 0.5, 
      filter = {} 
    } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: '검색 쿼리가 필요합니다.'
      });
    }
    
    // 가중치 검증
    if (Math.abs(semanticWeight + keywordWeight - 1) > 0.01) {
      return res.status(400).json({
        success: false,
        error: 'semanticWeight와 keywordWeight의 합이 1이어야 합니다.'
      });
    }
    
    logger.info(`하이브리드 검색 요청: "${query}"`);
    
    const results = await searchService.hybridSearch(query, {
      topK,
      semanticWeight,
      keywordWeight,
      threshold,
      filter
    });
    
    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    logger.error(`하이브리드 검색 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/search/suggest:
 *   get:
 *     summary: 검색 제안 조회
 *     description: 검색 쿼리에 대한 자동완성 제안을 제공합니다.
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: 검색 쿼리
 *         example: "AI"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 제안 개수
 *         default: 5
 *         example: 10
 *     responses:
 *       200:
 *         description: 제안 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 query:
 *                   type: string
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.get('/suggest', async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: '검색 쿼리가 필요합니다.'
      });
    }
    
    logger.info(`검색 제안 요청: "${q}"`);
    
    // 간단한 제안 로직 (실제로는 더 정교한 알고리즘 사용)
    const suggestions = await generateSuggestions(q, parseInt(limit));
    
    res.json({
      success: true,
      suggestions,
      query: q
    });
  } catch (error) {
    logger.error(`검색 제안 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/search/stats:
 *   get:
 *     summary: 검색 통계 조회
 *     description: 검색 시스템의 통계 정보를 조회합니다.
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     cacheSize:
 *                       type: integer
 *                     cacheTimeout:
 *                       type: integer
 *                     indexedNotes:
 *                       type: object
 *       500:
 *         description: 서버 오류
 */
router.get('/stats', async (req, res) => {
  try {
    logger.info('검색 통계 조회 요청');
    
    const stats = searchService.getSearchStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error(`검색 통계 조회 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/search/cache/clear:
 *   post:
 *     summary: 검색 캐시 정리
 *     description: 검색 결과 캐시를 정리합니다.
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: 캐시 정리 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: 서버 오류
 */
router.post('/cache/clear', async (req, res) => {
  try {
    logger.info('검색 캐시 정리 요청');
    
    searchService.clearCache();
    
    res.json({
      success: true,
      message: '검색 캐시가 정리되었습니다.'
    });
  } catch (error) {
    logger.error(`검색 캐시 정리 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/recommendations:
 *   get:
 *     summary: 추천 시스템 데이터 조회
 *     description: AI 추천 시스템의 추천 목록과 통계를 조회합니다.
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 추천 카테고리 필터
 *         example: "content"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [confidence, date, impact]
 *         description: 정렬 기준
 *         default: "confidence"
 *         example: "confidence"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, new, viewed, applied]
 *         description: 상태 필터
 *         default: "all"
 *         example: "new"
 *     responses:
 *       200:
 *         description: 추천 데이터 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       type:
 *                         type: string
 *                       confidence:
 *                         type: number
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       relatedNotes:
 *                         type: array
 *                         items:
 *                           type: string
 *                       impact:
 *                         type: string
 *                       effort:
 *                         type: string
 *                       category:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       status:
 *                         type: string
 *                 totalCount:
 *                   type: integer
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalRecommendations:
 *                       type: integer
 *                     appliedCount:
 *                       type: integer
 *                     averageConfidence:
 *                       type: number
 *                     topCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           count:
 *                             type: integer
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { category, sortBy = 'confidence', status = 'all' } = req.query;
    
    logger.info('추천 시스템 데이터 조회 요청');
    
    // 샘플 추천 데이터 생성 (실제로는 recommendationService에서 가져와야 함)
    const sampleRecommendations = [
      {
        id: '1',
        title: 'AI 기술 관련 노트 연결',
        description: '머신러닝과 딥러닝 노트들을 연결하여 지식 그래프를 강화하세요.',
        type: 'connection',
        confidence: 0.85,
        tags: ['AI', '머신러닝', '딥러닝'],
        relatedNotes: ['machine-learning.md', 'deep-learning.md', 'neural-networks.md'],
        impact: '높음',
        effort: 'medium',
        category: 'knowledge-graph',
        createdAt: new Date().toISOString(),
        status: 'new'
      },
      {
        id: '2',
        title: '마음근력 노트 요약 생성',
        description: '긴 마음근력 노트를 요약하여 핵심 내용을 빠르게 파악하세요.',
        type: 'content',
        confidence: 0.92,
        tags: ['마음근력', '요약', '개인개발'],
        relatedNotes: ['mind-strength.md'],
        impact: '중간',
        effort: 'low',
        category: 'summarization',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'viewed'
      },
      {
        id: '3',
        title: '태그 시스템 개선',
        description: '일관된 태그 시스템을 구축하여 노트 검색과 분류를 개선하세요.',
        type: 'improvement',
        confidence: 0.78,
        tags: ['태그', '분류', '검색'],
        relatedNotes: ['tagging-system.md', 'search-optimization.md'],
        impact: '높음',
        effort: 'high',
        category: 'organization',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        status: 'applied'
      },
      {
        id: '4',
        title: '새로운 연구 주제 발견',
        description: '기존 노트들을 분석하여 새로운 연구 주제와 아이디어를 발견하세요.',
        type: 'discovery',
        confidence: 0.88,
        tags: ['연구', '아이디어', '발견'],
        relatedNotes: ['research-ideas.md', 'innovation.md'],
        impact: '높음',
        effort: 'medium',
        category: 'research',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        status: 'new'
      }
    ];
    
    // 필터링
    let filteredRecommendations = sampleRecommendations;
    
    if (category && category !== 'all') {
      filteredRecommendations = filteredRecommendations.filter(rec => rec.category === category);
    }
    
    if (status && status !== 'all') {
      filteredRecommendations = filteredRecommendations.filter(rec => rec.status === status);
    }
    
    // 정렬
    filteredRecommendations.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                 case 'impact':
           const impactOrder = { '높음': 3, '중간': 2, '낮음': 1 };
           return impactOrder[b.impact] - impactOrder[a.impact];
        default:
          return 0;
      }
    });
    
    // 통계 계산
    const totalRecommendations = sampleRecommendations.length;
    const appliedCount = sampleRecommendations.filter(rec => rec.status === 'applied').length;
    const averageConfidence = sampleRecommendations.reduce((sum, rec) => sum + rec.confidence, 0) / totalRecommendations;
    
         const categoryCounts = sampleRecommendations.reduce((acc, rec) => {
       acc[rec.category] = (acc[rec.category] || 0) + 1;
       return acc;
     }, {});
    
    const topCategories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const categories = [...new Set(sampleRecommendations.map(rec => rec.category))];
    
    res.json({
      success: true,
      recommendations: filteredRecommendations,
      totalCount: filteredRecommendations.length,
      categories,
      stats: {
        totalRecommendations,
        appliedCount,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        topCategories
      }
    });
  } catch (error) {
    logger.error(`추천 시스템 데이터 조회 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 검색 제안 생성
 * @param {string} query - 검색 쿼리
 * @param {number} limit - 제안 개수
 */
async function generateSuggestions(query, limit = 5) {
  // 실제 구현에서는 더 정교한 알고리즘 사용
  // 여기서는 간단한 예시만 제공
  
  const suggestions = [];
  const queryLower = query.toLowerCase();
  
  // 인덱스된 노트에서 제안 생성
  const indexedNotes = searchService.getIndexedNotes(); // Fixed undefined reference
  
  for (const [, note] of indexedNotes) { // Removed unused filePath
    const title = note.metadata.title || '';
    const tags = note.metadata.tags || [];
    
    // 제목에서 제안
    if (title.toLowerCase().includes(queryLower)) {
      suggestions.push(title);
    }
    
    // 태그에서 제안
    for (const tag of tags) {
      if (tag.toLowerCase().includes(queryLower)) {
        suggestions.push(`#${tag}`);
      }
    }
    
    if (suggestions.length >= limit) break;
  }
  
  // 중복 제거 및 정렬
  return [...new Set(suggestions)].slice(0, limit);
}

export default router; 