import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { MarkdownManager } from './MarkdownManager.js';
import { ObsidianManager } from './ObsidianManager.js';
import logger from './utils/logger.js';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import searchRoutes from './routes/searchRoutes.js';
import advancedFeaturesRoutes from './routes/advancedFeaturesRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';

const app = express();
app.use(express.json());

const basePath = process.env.BASE_PATH || '/Users/gukho/Library/Mobile Documents/iCloud~md~obsidian/Documents/My Card';
const markdownManager = new MarkdownManager(basePath);
const obsidianManager = new ObsidianManager(basePath);

const port = process.env.PORT || 8080;

// Swagger 설정
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Markdown MCP HTTP Server',
    version: '1.0.0',
    description: 'Obsidian Vault 및 Markdown 파일 관리 REST API',
  },
  servers: [
    { url: `http://localhost:${port}` }
  ],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./src/server.js', './src/routes/*.js'], // JSDoc 주석에서 API 추출
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// OpenAPI 스펙 JSON 다운로드 엔드포인트
app.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API 라우트 등록
app.use('/api/search', searchRoutes);
app.use('/api/advanced', advancedFeaturesRoutes);
app.use('/api/performance', performanceRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: 서버 상태 확인
 *     description: 서버가 정상적으로 동작 중인지 확인합니다.
 *     responses:
 *       200:
 *         description: 서버 상태 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: running
 *                 server:
 *                   type: string
 *                   example: Markdown MCP HTTP Server
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 availableEndpoints:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["GET /tools - 사용 가능한 툴 목록", "POST /tools/obsidian/getAllTags - 모든 태그 목록"]
 */

/**
 * @swagger
 * /tools:
 *   get:
 *     summary: 사용 가능한 툴 목록
 *     description: 서버에서 제공하는 모든 MCP 툴의 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: 툴 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tools:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: obsidian.getAllTags
 *                       description:
 *                         type: string
 *                         example: 모든 태그 목록 추출
 */

/**
 * @swagger
 * /tools/obsidian/getAllTags:
 *   post:
 *     summary: 모든 태그 목록 추출
 *     description: Obsidian Vault 내의 모든 고유 태그 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: 태그 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["project", "health", "diary"]
 */

/**
 * @swagger
 * /tools/obsidian/generateVaultStats:
 *   post:
 *     summary: Vault 통계 생성
 *     description: Obsidian Vault의 전체 통계 정보를 반환합니다.
 *     responses:
 *       200:
 *         description: Vault 통계
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalFiles:
 *                       type: integer
 *                       example: 332
 *                     totalSize:
 *                       type: integer
 *                       description: 전체 파일 크기(byte)
 *                       example: 1536000
 *                     totalWords:
 *                       type: integer
 *                       example: 172203
 *                     totalLinks:
 *                       type: integer
 *                       example: 1958
 *                     totalTags:
 *                       type: integer
 *                       example: 1006
 *                     fileTypes:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example: {".md": 332, ".pdf": 10}
 *                     topTags:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example: {"project": 30, "health": 25}
 *                     recentFiles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           file:
 *                             type: string
 *                             example: "Health/2024-07-10.md"
 *                           modified:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-07-10T09:00:00Z"
 *                           size:
 *                             type: integer
 *                             example: 2048
 *                           words:
 *                             type: integer
 *                             example: 1200
 */

/**
 * @swagger
 * /tools/obsidian/getRecentlyModifiedNotes:
 *   post:
 *     summary: 최근 수정된 노트 목록
 *     description: 최근 n일 이내에 수정된 노트 목록을 반환합니다.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 default: 7
 *                 example: 7
 *               limit:
 *                 type: integer
 *                 default: 20
 *                 example: 10
 *     responses:
 *       200:
 *         description: 최근 수정된 노트 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       file:
 *                         type: string
 *                         example: "Health/2024-07-10.md"
 *                       modified:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-07-10T09:00:00Z"
 */

/**
 * @swagger
 * /tools/obsidian/extractTodos:
 *   post:
 *     summary: TODO 작업 추출
 *     description: 모든 노트에서 TODO 작업을 추출합니다.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filePath:
 *                 type: string
 *                 description: 특정 파일만 추출할 경우 파일 경로
 *                 example: "Health/2024-07-10.md"
 *               status:
 *                 type: string
 *                 enum: [all, pending, completed]
 *                 default: all
 *                 description: TODO 상태 필터
 *                 example: "pending"
 *     responses:
 *       200:
 *         description: TODO 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       file:
 *                         type: string
 *                         example: "Health/2024-07-10.md"
 *                       line:
 *                         type: integer
 *                         example: 12
 *                       content:
 *                         type: string
 *                         example: "- [ ] TODO: 운동하기"
 *                       completed:
 *                         type: boolean
 *                         example: false
 */

/**
 * @swagger
 * /tools/markdown/listFiles:
 *   post:
 *     summary: 마크다운 파일 목록 조회
 *     description: 지정한 디렉토리(및 하위 디렉토리)에서 마크다운 파일 목록을 반환합니다.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               directory:
 *                 type: string
 *                 description: 검색할 디렉토리 경로
 *                 example: "Health"
 *               recursive:
 *                 type: boolean
 *                 default: false
 *                 description: 하위 디렉토리까지 검색 여부
 *                 example: true
 *               pattern:
 *                 type: string
 *                 default: '*.md'
 *                 description: 파일명 패턴
 *                 example: '*.md'
 *     responses:
 *       200:
 *         description: 파일 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Health/2024-07-10.md", "test.md"]
 */

/**
 * @swagger
 * /tools/markdown/searchContent:
 *   post:
 *     summary: 마크다운 내용 검색
 *     description: 지정한 디렉토리 내 파일에서 키워드/정규식 등으로 내용을 검색합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               directory:
 *                 type: string
 *                 description: 검색할 디렉토리
 *                 example: "Health"
 *               query:
 *                 type: string
 *                 description: 단일 검색 키워드
 *                 example: "운동"
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 여러 검색 키워드 배열
 *                 example: ["운동", "건강"]
 *               mode:
 *                 type: string
 *                 enum: [and, or]
 *                 default: or
 *                 description: 여러 키워드 검색 모드
 *                 example: "or"
 *               caseSensitive:
 *                 type: boolean
 *                 default: false
 *                 description: 대소문자 구분 여부
 *                 example: false
 *               isRegex:
 *                 type: boolean
 *                 default: false
 *                 description: query를 정규식으로 처리할지 여부
 *                 example: false
 *               filenamePattern:
 *                 type: string
 *                 description: 파일명 패턴 (와일드카드/정규식)
 *                 example: '*.md'
 *     responses:
 *       200:
 *         description: 검색 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       file:
 *                         type: string
 *                         example: "Health/2024-07-10.md"
 *                       line:
 *                         type: integer
 *                         example: 15
 *                       content:
 *                         type: string
 *                         example: "운동은 건강에 좋다."
 *                       match:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["운동"]
 */

// 기본 상태 확인
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    server: 'Markdown MCP HTTP Server',
    version: '1.0.0',
    availableEndpoints: [
      'GET /tools - 사용 가능한 툴 목록',
      'POST /tools/obsidian/getAllTags - 모든 태그 목록',
      'POST /tools/obsidian/generateVaultStats - Vault 통계',
      'POST /tools/obsidian/getRecentlyModifiedNotes - 최근 수정된 노트',
      'POST /tools/obsidian/extractTodos - TODO 추출',
      'POST /tools/markdown/listFiles - 파일 목록',
      'POST /tools/markdown/searchContent - 내용 검색',
      'POST /api/search/semantic - 의미론적 검색',
      'POST /api/search/keyword - 키워드 검색',
      'POST /api/search/hybrid - 하이브리드 검색',
      'POST /api/advanced/summarize - 자동 요약 생성',
      'POST /api/advanced/smart-tags - 스마트 태그 생성',
      'POST /api/advanced/similar-notes - 유사 노트 찾기',
      'POST /api/advanced/knowledge-graph - 지식 그래프 생성',
      'POST /api/advanced/auto-backlinks - 자동 백링크 생성',
      'POST /api/advanced/smart-template - 스마트 템플릿 생성',
      'GET /api/performance/stats - 성능 통계 조회',
      'POST /api/performance/test - 성능 테스트 실행'
    ]
  });
});

// 사용 가능한 툴 목록
app.get('/tools', (req, res) => {
  res.json({
    tools: [
      { name: 'obsidian.getAllTags', description: '모든 태그 목록 추출' },
      { name: 'obsidian.generateVaultStats', description: 'Vault 통계 생성' },
      { name: 'obsidian.getRecentlyModifiedNotes', description: '최근 수정된 노트 목록' },
      { name: 'obsidian.getRecentlyCreatedNotes', description: '최근 생성된 노트 목록' },
      { name: 'obsidian.extractTodos', description: 'TODO 작업 추출' },
      { name: 'obsidian.extractLinks', description: '노트에서 링크 추출' },
      { name: 'obsidian.createDailyNote', description: '데일리 노트 생성' },
      { name: 'markdown.listFiles', description: '마크다운 파일 목록 조회' },
      { name: 'markdown.searchContent', description: '마크다운 내용 검색' },
      { name: 'markdown.manageFrontmatter', description: 'Frontmatter 관리' }
    ]
  });
});

// Obsidian 툴들
app.post('/tools/obsidian/getAllTags', async (req, res) => {
  try {
    const tags = await obsidianManager.getAllTags();
    res.json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/tools/obsidian/generateVaultStats', async (req, res) => {
  try {
    const stats = await obsidianManager.generateVaultStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/tools/obsidian/getRecentlyModifiedNotes', async (req, res) => {
  try {
    const { days = 7, limit = 20 } = req.body;
    const notes = await obsidianManager.getRecentlyModifiedNotes(days, limit);
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/tools/obsidian/getRecentlyCreatedNotes', async (req, res) => {
  try {
    const { days = 7, limit = 20 } = req.body;
    const notes = await obsidianManager.getRecentlyCreatedNotes(days, limit);
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/tools/obsidian/extractTodos', async (req, res) => {
  try {
    const { filePath, status = 'all' } = req.body;
    const todos = await obsidianManager.extractTodos(filePath, status);
    res.json({ success: true, data: todos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/tools/obsidian/extractLinks', async (req, res) => {
  try {
    const { filePath } = req.body;
    const links = await obsidianManager.extractLinks(filePath);
    res.json({ success: true, data: links });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/tools/obsidian/createDailyNote', async (req, res) => {
  try {
    const { date, template, folder } = req.body;
    const result = await obsidianManager.createDailyNote(date, template, folder);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Markdown 툴들
app.post('/tools/markdown/listFiles', async (req, res) => {
  try {
    const { directory = '', recursive = false, pattern = '*.md' } = req.body;
    const files = await markdownManager.listFiles(directory, recursive, pattern);
    res.json({ success: true, data: files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/tools/markdown/searchContent', async (req, res) => {
  try {
    const { directory = '', query, keywords, mode = 'or', caseSensitive = false, isRegex = false, filenamePattern } = req.body;
    const results = await markdownManager.searchContent(directory, { query, keywords, mode, caseSensitive, isRegex, filenamePattern });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/tools/markdown/manageFrontmatter', async (req, res) => {
  try {
    const { filePath, action, metadata } = req.body;
    const result = await markdownManager.manageFrontmatter(filePath, action, metadata);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 서버 시작
const server = app.listen(port, () => {
  logger.info(`Markdown MCP HTTP Server running at http://localhost:${port}`);
  logger.info('Available endpoints:');
  logger.info('  GET  / - 서버 상태 확인');
  logger.info('  GET  /tools - 사용 가능한 툴 목록');
  logger.info('  POST /tools/obsidian/* - Obsidian 관련 툴');
  logger.info('  POST /tools/markdown/* - Markdown 관련 툴');
  logger.info('  POST /api/search/* - 검색 API');
  logger.info('  POST /api/advanced/* - 고급 기능 API');
  logger.info('  GET  /api/performance/* - 성능 모니터링 API');
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('\nShutting down server...');
  server.close(() => {
    process.exit(0);
  });
});

export default app; 