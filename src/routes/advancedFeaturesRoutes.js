import express from 'express';
import advancedFeatures from '../services/advancedFeatures.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /api/advanced/summarize:
 *   post:
 *     summary: 노트 자동 요약 생성
 *     description: AI를 사용하여 노트 내용을 자동으로 요약합니다.
 *     tags: [Advanced Features]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 요약할 노트 내용
 *                 example: "이것은 매우 긴 노트 내용입니다..."
 *               maxLength:
 *                 type: integer
 *                 description: 최대 요약 길이
 *                 default: 200
 *                 example: 150
 *               style:
 *                 type: string
 *                 description: 요약 스타일 (concise, detailed, bullet)
 *                 default: "concise"
 *                 example: "concise"
 *     responses:
 *       200:
 *         description: 요약 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 summary:
 *                   type: string
 *                 keywords:
 *                   type: array
 *                   items:
 *                     type: string
 *                 originalLength:
 *                   type: integer
 *                 summaryLength:
 *                   type: integer
 *                 compressionRatio:
 *                   type: string
 *                 style:
 *                   type: string
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/summarize', async (req, res) => {
  try {
    const { content, maxLength = 200, style = 'concise' } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: '노트 내용이 필요합니다.'
      });
    }
    
    logger.info('자동 요약 생성 요청');
    
    const result = await advancedFeatures.generateSummary(content, {
      maxLength,
      style
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`자동 요약 생성 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced/smart-tags:
 *   post:
 *     summary: 스마트 태그 자동 생성
 *     description: 노트 내용을 분석하여 관련 태그를 자동으로 생성합니다.
 *     tags: [Advanced Features]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 태그를 생성할 노트 내용
 *                 example: "AI 기술과 머신러닝에 대한 연구 내용..."
 *               maxTags:
 *                 type: integer
 *                 description: 최대 태그 수
 *                 default: 10
 *                 example: 8
 *               confidence:
 *                 type: number
 *                 description: 최소 신뢰도 (0-1)
 *                 default: 0.8
 *                 example: 0.7
 *     responses:
 *       200:
 *         description: 스마트 태그 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/smart-tags', async (req, res) => {
  try {
    const { content, maxTags = 10, confidence = 0.8 } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: '노트 내용이 필요합니다.'
      });
    }
    
    logger.info('스마트 태그 생성 요청');
    
    const result = await advancedFeatures.generateSmartTags(content, {
      maxTags,
      confidence
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`스마트 태그 생성 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced/similar-notes:
 *   post:
 *     summary: 유사한 노트 찾기
 *     description: 특정 노트와 유사한 다른 노트들을 찾습니다.
 *     tags: [Advanced Features]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - noteId
 *               - allNotes
 *             properties:
 *               noteId:
 *                 type: string
 *                 description: 기준 노트 ID
 *                 example: "/research/ai-paper.md"
 *               allNotes:
 *                 type: array
 *                 description: 모든 노트 목록
 *                 items:
 *                   type: object
 *               threshold:
 *                 type: number
 *                 description: 유사도 임계값 (0-1)
 *                 default: 0.7
 *                 example: 0.6
 *               maxResults:
 *                 type: integer
 *                 description: 최대 결과 수
 *                 default: 5
 *                 example: 3
 *               method:
 *                 type: string
 *                 description: 유사도 계산 방법 (content, tags, hybrid)
 *                 default: "content"
 *                 example: "hybrid"
 *     responses:
 *       200:
 *         description: 유사 노트 검색 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/similar-notes', async (req, res) => {
  try {
    const { 
      noteId, 
      allNotes, 
      threshold = 0.7, 
      maxResults = 5, 
      method = 'content' 
    } = req.body;
    
    if (!noteId || !allNotes || !Array.isArray(allNotes)) {
      return res.status(400).json({
        success: false,
        error: '노트 ID와 모든 노트 목록이 필요합니다.'
      });
    }
    
    logger.info(`유사 노트 검색 요청: ${noteId}`);
    
    const result = await advancedFeatures.findSimilarNotes(noteId, allNotes, {
      threshold,
      maxResults,
      method
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`유사 노트 검색 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced/knowledge-graph:
 *   post:
 *     summary: 지식 그래프 생성
 *     description: 노트들 간의 관계를 분석하여 지식 그래프를 생성합니다.
 *     tags: [Advanced Features]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notes
 *             properties:
 *               notes:
 *                 type: array
 *                 description: 분석할 노트 목록
 *                 items:
 *                   type: object
 *               includeTags:
 *                 type: boolean
 *                 description: 태그 관계 포함 여부
 *                 default: true
 *                 example: true
 *               includeLinks:
 *                 type: boolean
 *                 description: 링크 관계 포함 여부
 *                 default: true
 *                 example: true
 *               maxConnections:
 *                 type: integer
 *                 description: 노트당 최대 연결 수
 *                 default: 10
 *                 example: 8
 *     responses:
 *       200:
 *         description: 지식 그래프 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/knowledge-graph', async (req, res) => {
  try {
    const { 
      notes, 
      includeTags = true, 
      includeLinks = true, 
      maxConnections = 10 
    } = req.body;
    
    if (!notes || !Array.isArray(notes)) {
      return res.status(400).json({
        success: false,
        error: '노트 목록이 필요합니다.'
      });
    }
    
    logger.info('지식 그래프 생성 요청');
    
    const result = await advancedFeatures.generateKnowledgeGraph(notes, {
      includeTags,
      includeLinks,
      maxConnections
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`지식 그래프 생성 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced/auto-backlinks:
 *   post:
 *     summary: 자동 백링크 생성
 *     description: 노트 간의 참조 관계를 분석하여 자동으로 백링크를 생성합니다.
 *     tags: [Advanced Features]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - noteId
 *               - allNotes
 *             properties:
 *               noteId:
 *                 type: string
 *                 description: 대상 노트 ID
 *                 example: "/research/ai-paper.md"
 *               allNotes:
 *                 type: array
 *                 description: 모든 노트 목록
 *                 items:
 *                   type: object
 *               includeContent:
 *                 type: boolean
 *                 description: 내용 기반 백링크 포함 여부
 *                 default: true
 *                 example: true
 *               includeTags:
 *                 type: boolean
 *                 description: 태그 기반 백링크 포함 여부
 *                 default: true
 *                 example: true
 *     responses:
 *       200:
 *         description: 자동 백링크 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/auto-backlinks', async (req, res) => {
  try {
    const { 
      noteId, 
      allNotes, 
      includeContent = true, 
      includeTags = true 
    } = req.body;
    
    if (!noteId || !allNotes || !Array.isArray(allNotes)) {
      return res.status(400).json({
        success: false,
        error: '노트 ID와 모든 노트 목록이 필요합니다.'
      });
    }
    
    logger.info(`자동 백링크 생성 요청: ${noteId}`);
    
    const result = await advancedFeatures.generateAutoBacklinks(noteId, allNotes, {
      includeContent,
      includeTags
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`자동 백링크 생성 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced/smart-template:
 *   post:
 *     summary: 스마트 템플릿 생성
 *     description: 컨텍스트에 맞는 스마트 템플릿을 생성합니다.
 *     tags: [Advanced Features]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateType
 *             properties:
 *               templateType:
 *                 type: string
 *                 description: 템플릿 타입
 *                 example: "meeting"
 *                 enum: [meeting, project, research, daily, weekly, monthly, book-review, code-review]
 *               context:
 *                 type: object
 *                 description: 템플릿 생성 컨텍스트
 *                 example:
 *                   project: "AI Research Project"
 *                   participants: ["John", "Jane"]
 *                   date: "2024-01-15"
 *               customFields:
 *                 type: object
 *                 description: 사용자 정의 필드
 *                 example:
 *                   agenda: ["Project Update", "Next Steps"]
 *                   actionItems: true
 *     responses:
 *       200:
 *         description: 스마트 템플릿 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/smart-template', async (req, res) => {
  try {
    const { templateType, context = {}, customFields = {} } = req.body;
    
    if (!templateType || typeof templateType !== 'string') {
      return res.status(400).json({
        success: false,
        error: '템플릿 타입이 필요합니다.'
      });
    }
    
    logger.info(`스마트 템플릿 생성 요청: ${templateType}`);
    
    const result = await advancedFeatures.generateSmartTemplate(templateType, context, {
      customFields
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`스마트 템플릿 생성 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced/features/status:
 *   get:
 *     summary: 고급 기능 상태 조회
 *     description: 현재 활성화된 고급 기능들의 상태를 조회합니다.
 *     tags: [Advanced Features]
 *     responses:
 *       200:
 *         description: 기능 상태 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 features:
 *                   type: object
 *                   properties:
 *                     autoSummarization:
 *                       type: boolean
 *                     smartTagging:
 *                       type: boolean
 *                     noteSimilarity:
 *                       type: boolean
 *                     knowledgeGraph:
 *                       type: boolean
 *                     autoBacklinks:
 *                       type: boolean
 *                     smartTemplates:
 *                       type: boolean
 *                 config:
 *                   type: object
 *       500:
 *         description: 서버 오류
 */
router.get('/features/status', async (req, res) => {
  try {
    logger.info('고급 기능 상태 조회');
    
    res.json({
      success: true,
      features: advancedFeatures.features,
      config: advancedFeatures.config
    });
  } catch (error) {
    logger.error(`고급 기능 상태 조회 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced/features/configure:
 *   post:
 *     summary: 고급 기능 설정 변경
 *     description: 고급 기능들의 설정을 변경합니다.
 *     tags: [Advanced Features]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               features:
 *                 type: object
 *                 description: 활성화할 기능들
 *                 example:
 *                   autoSummarization: true
 *                   smartTagging: true
 *                   noteSimilarity: false
 *               config:
 *                 type: object
 *                 description: 설정 값들
 *                 example:
 *                   summaryLength: 150
 *                   similarityThreshold: 0.6
 *                   maxSimilarNotes: 3
 *     responses:
 *       200:
 *         description: 설정 변경 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/features/configure', async (req, res) => {
  try {
    const { features, config } = req.body;
    
    logger.info('고급 기능 설정 변경 요청');
    
    // 기능 활성화/비활성화
    if (features) {
      Object.assign(advancedFeatures.features, features);
    }
    
    // 설정 변경
    if (config) {
      Object.assign(advancedFeatures.config, config);
    }
    
    res.json({
      success: true,
      message: '설정이 성공적으로 변경되었습니다.',
      features: advancedFeatures.features,
      config: advancedFeatures.config
    });
  } catch (error) {
    logger.error(`고급 기능 설정 변경 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 