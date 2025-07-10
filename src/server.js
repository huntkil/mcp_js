import express from 'express';
import { MarkdownManager } from './MarkdownManager.js';
import { ObsidianManager } from './ObsidianManager.js';
import logger from './logger.js';

const app = express();
app.use(express.json());

const basePath = process.env.BASE_PATH || '/Users/gukho/Library/Mobile Documents/iCloud~md~obsidian/Documents/My Card';
const markdownManager = new MarkdownManager(basePath);
const obsidianManager = new ObsidianManager(basePath);

const port = process.env.PORT || 8080;

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
      'POST /tools/markdown/searchContent - 내용 검색'
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
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('\nShutting down server...');
  server.close(() => {
    process.exit(0);
  });
});

export default app; 