import request from 'supertest';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 테스트용 임시 디렉토리 생성
const testDir = join(__dirname, '../test-temp');
const testFiles = [
  {
    path: 'test1.md',
    content: `---
title: Test Note 1
tags: [test, example]
---

# Test Note 1

This is a test note with some content.

- [ ] TODO: Test task 1
- [x] TODO: Completed task
- [ ] TODO: Test task 2

[[test2]] is linked here.
#test #example
`
  },
  {
    path: 'test2.md',
    content: `---
title: Test Note 2
status: draft
---

# Test Note 2

This is another test note.

- [ ] TODO: Another task
- [ ] TODO: Yet another task

[[test1]] is linked back.
#test #markdown
`
  },
  {
    path: 'Health/test3.md',
    content: `---
title: Health Note
category: health
---

# Health Note

Health related content.

#health #wellness
`
  }
];

// 서버 모듈을 동적으로 import
let app;

describe('HTTP Server Integration Tests', () => {
  beforeAll(async () => {
    // 테스트 디렉토리 생성
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(join(testDir, 'Health'), { recursive: true });
    
    // 테스트 파일들 생성
    for (const file of testFiles) {
      await fs.writeFile(join(testDir, file.path), file.content);
    }
    
    // 환경 변수 설정
    process.env.BASE_PATH = testDir;
    
    // 서버 모듈 import
    const serverModule = await import('../src/server.js');
    app = serverModule.default || express();
  });

  afterAll(async () => {
    // 테스트 디렉토리 정리
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('GET /', () => {
    it('should return server status', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body).toHaveProperty('server', 'Markdown MCP HTTP Server');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('availableEndpoints');
      expect(Array.isArray(response.body.availableEndpoints)).toBe(true);
    });
  });

  describe('GET /tools', () => {
    it('should return available tools list', async () => {
      const response = await request(app)
        .get('/tools')
        .expect(200);

      expect(response.body).toHaveProperty('tools');
      expect(Array.isArray(response.body.tools)).toBe(true);
      expect(response.body.tools.length).toBeGreaterThan(0);
      
      // 특정 툴들이 있는지 확인
      const toolNames = response.body.tools.map(tool => tool.name);
      expect(toolNames).toContain('obsidian.getAllTags');
      expect(toolNames).toContain('obsidian.generateVaultStats');
      expect(toolNames).toContain('markdown.listFiles');
    });
  });

  describe('POST /tools/obsidian/getAllTags', () => {
    it('should return all tags from vault', async () => {
      const response = await request(app)
        .post('/tools/obsidian/getAllTags')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // 테스트 파일에 있는 태그들이 포함되어 있는지 확인
      const tags = response.body.data;
      expect(tags).toContain('test');
      expect(tags).toContain('example');
      expect(tags).toContain('markdown');
      expect(tags).toContain('health');
      expect(tags).toContain('wellness');
    });
  });

  describe('POST /tools/obsidian/generateVaultStats', () => {
    it('should return vault statistics', async () => {
      const response = await request(app)
        .post('/tools/obsidian/generateVaultStats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      const stats = response.body.data;
      expect(stats).toHaveProperty('totalFiles');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('totalWords');
      expect(stats).toHaveProperty('totalLinks');
      expect(stats).toHaveProperty('totalTags');
      expect(stats).toHaveProperty('fileTypes');
      
      // 테스트 파일 수 확인
      expect(stats.totalFiles).toBeGreaterThanOrEqual(3);
    });
  });

  describe('POST /tools/obsidian/getRecentlyModifiedNotes', () => {
    it('should return recently modified notes', async () => {
      const response = await request(app)
        .post('/tools/obsidian/getRecentlyModifiedNotes')
        .send({ days: 7, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /tools/obsidian/extractTodos', () => {
    it('should extract todos from all files', async () => {
      const response = await request(app)
        .post('/tools/obsidian/extractTodos')
        .send({ status: 'all' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // TODO가 있는지 확인
      const todos = response.body.data;
      expect(todos.length).toBeGreaterThan(0);
    });

    it('should extract pending todos only', async () => {
      const response = await request(app)
        .post('/tools/obsidian/extractTodos')
        .send({ status: 'pending' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      const todos = response.body.data;
      // 모든 TODO가 pending 상태인지 확인
      todos.forEach(todo => {
        expect(todo.completed).toBe(false);
      });
    });
  });

  describe('POST /tools/obsidian/extractLinks', () => {
    it('should extract links from specific file', async () => {
      const response = await request(app)
        .post('/tools/obsidian/extractLinks')
        .send({ filePath: 'test1.md' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      const links = response.body.data;
      expect(links).toHaveProperty('internal');
      expect(links).toHaveProperty('external');
      expect(links).toHaveProperty('embeds');
      expect(links).toHaveProperty('tags');
      
      // test1.md에는 test2 링크가 있어야 함
      expect(links.internal.some(link => link.link === 'test2')).toBe(true);
    });
  });

  describe('POST /tools/markdown/listFiles', () => {
    it('should list files in root directory', async () => {
      const response = await request(app)
        .post('/tools/markdown/listFiles')
        .send({ directory: '', recursive: false })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      const files = response.body.data;
      expect(files).toContain('test1.md');
      expect(files).toContain('test2.md');
    });

    it('should list files recursively', async () => {
      const response = await request(app)
        .post('/tools/markdown/listFiles')
        .send({ directory: '', recursive: true })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      const files = response.body.data;
      expect(files).toContain('test1.md');
      expect(files).toContain('test2.md');
      expect(files).toContain('Health/test3.md');
    });

    it('should list files in specific directory', async () => {
      const response = await request(app)
        .post('/tools/markdown/listFiles')
        .send({ directory: 'Health', recursive: false })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      const files = response.body.data;
      expect(files).toContain('Health/test3.md');
    });
  });

  describe('POST /tools/markdown/searchContent', () => {
    it('should search content with query', async () => {
      const response = await request(app)
        .post('/tools/markdown/searchContent')
        .send({ 
          directory: '', 
          query: 'test',
          caseSensitive: false 
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      const results = response.body.data;
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search with multiple keywords in OR mode', async () => {
      const response = await request(app)
        .post('/tools/markdown/searchContent')
        .send({ 
          directory: '', 
          keywords: ['test', 'health'],
          mode: 'or',
          caseSensitive: false 
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      const results = response.body.data;
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search with filename pattern', async () => {
      const response = await request(app)
        .post('/tools/markdown/searchContent')
        .send({ 
          directory: '', 
          query: 'test',
          filenamePattern: 'test*.md',
          caseSensitive: false 
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      const results = response.body.data;
      // test*.md 패턴에 맞는 파일들만 검색되어야 함
      const files = [...new Set(results.map(r => r.file))];
      files.forEach(file => {
        expect(file).toMatch(/^test\d+\.md$/);
      });
    });
  });

  describe('POST /tools/markdown/manageFrontmatter', () => {
    it('should get frontmatter from file', async () => {
      const response = await request(app)
        .post('/tools/markdown/manageFrontmatter')
        .send({ 
          filePath: 'test1.md',
          action: 'get'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('metadata');
      
      const metadata = response.body.data.metadata;
      expect(metadata).toHaveProperty('title', 'Test Note 1');
      expect(metadata).toHaveProperty('tags');
    });

    it('should update frontmatter', async () => {
      const newMetadata = { status: 'published', author: 'test' };
      
      const response = await request(app)
        .post('/tools/markdown/manageFrontmatter')
        .send({ 
          filePath: 'test1.md',
          action: 'update',
          metadata: newMetadata
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('metadata');
      
      const metadata = response.body.data.metadata;
      expect(metadata).toHaveProperty('status', 'published');
      expect(metadata).toHaveProperty('author', 'test');
      expect(metadata).toHaveProperty('title', 'Test Note 1'); // 기존 데이터 유지
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid file path', async () => {
      const response = await request(app)
        .post('/tools/markdown/searchContent')
        .send({ 
          directory: 'non-existent',
          query: 'test'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should handle invalid search parameters', async () => {
      const response = await request(app)
        .post('/tools/markdown/searchContent')
        .send({ 
          directory: '',
          query: '[invalid',
          isRegex: true
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 에러가 발생해도 빈 배열을 반환해야 함
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
}); 