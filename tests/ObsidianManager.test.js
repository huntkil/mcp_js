import { promises as fs } from 'fs';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import path from 'path';
import { ObsidianManager } from '../src/ObsidianManager.js';

const testDir = '/tmp/obsidian-test';
const testNotePath = path.join(testDir, 'test-note.md');
const anotherNotePath = path.join(testDir, 'another-note.md');
const dailyDir = path.join(testDir, 'daily');
const templatesDir = path.join(testDir, '.templates');

let manager;

beforeEach(async () => {
    // 테스트 디렉토리/파일 생성
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(dailyDir, { recursive: true });
    await fs.mkdir(templatesDir, { recursive: true });
    await fs.writeFile(testNotePath, '# Test Note\n\n- [ ] 할 일1\n- [x] 완료된 일\n\n## Section\n내용', 'utf8');
    await fs.writeFile(anotherNotePath, '# Another Note\n\n- [ ] 할 일2\n\n## Section\n내용', 'utf8');
    manager = new ObsidianManager(testDir);
});

afterEach(async () => {
    // 테스트 디렉토리 정리
    await fs.rm(testDir, { recursive: true, force: true });
});

describe('ObsidianManager', () => {
    
    test('should extract links from markdown file', async () => {
        const content = `# Test Document

This is a test with [[internal link]] and [external link](https://example.com).

Also has ![[embedded file]] and #tag.

Another [[link with alias|alias]] and #another-tag.`;

        await fs.writeFile(`${testDir}/test.md`, content);
        const links = await manager.extractLinks('test.md');
        
        expect(links.internal).toHaveLength(2);
        expect(links.external).toHaveLength(1);
        expect(links.embeds).toHaveLength(1);
        expect(links.tags).toHaveLength(2);
        
        expect(links.internal[0].link).toBe('internal link');
        expect(links.external[0].url).toBe('https://example.com');
        expect(links.embeds[0].file).toBe('embedded file');
        expect(links.tags[0].tag).toBe('tag');
    });
    
    test('should find backlinks', async () => {
        // Create target file
        await fs.writeFile(`${testDir}/target.md`, '# Target File');
        
        // Create files that link to target
        await fs.writeFile(`${testDir}/file1.md`, 'This links to [[target]]');
        await fs.writeFile(`${testDir}/file2.md`, 'This also links to [[target|alias]]');
        await fs.writeFile(`${testDir}/file3.md`, 'This does not link to anything');
        
        const backlinks = await manager.findBacklinks('target.md');
        
        expect(backlinks).toHaveLength(2);
        expect(backlinks.some(b => b.file === 'file1.md')).toBe(true);
        expect(backlinks.some(b => b.file === 'file2.md')).toBe(true);
    });
    
    test('should find files by tag', async () => {
        await fs.writeFile(`${testDir}/file1.md`, '# File 1\nThis has #project tag');
        await fs.writeFile(`${testDir}/file2.md`, '# File 2\nThis has #project and #important tags');
        await fs.writeFile(`${testDir}/file3.md`, '# File 3\nNo relevant tags');
        
        const results = await manager.findFilesByTag('project');
        
        expect(results).toHaveLength(2);
        expect(results.some(r => r.file === 'file1.md')).toBe(true);
        expect(results.some(r => r.file === 'file2.md')).toBe(true);
    });
    
    test('should get all tags', async () => {
        await fs.writeFile(`${testDir}/file1.md`, '# File 1\n#project #important');
        await fs.writeFile(`${testDir}/file2.md`, '# File 2\n#project #urgent');
        await fs.writeFile(`${testDir}/file3.md`, '# File 3\n#important #urgent');
        
        const tags = await manager.getAllTags();
        
        expect(tags).toContain('project');
        expect(tags).toContain('important');
        expect(tags).toContain('urgent');
        expect(tags).toHaveLength(3);
    });
    
    test('should generate graph data', async () => {
        await fs.writeFile(`${testDir}/file1.md`, '# File 1\nLinks to [[file2]]');
        await fs.writeFile(`${testDir}/file2.md`, '# File 2\nLinks to [[file3]]');
        await fs.writeFile(`${testDir}/file3.md`, '# File 3\nNo links');
        
        const graphData = await manager.generateGraphData();
        
        // 테스트 디렉토리에 다른 파일들도 있으므로 최소 3개 이상의 노드가 있어야 함
        expect(graphData.nodes.length).toBeGreaterThanOrEqual(3);
        expect(graphData.edges).toHaveLength(2);
        expect(graphData.nodes.some(n => n.id === 'file1')).toBe(true);
        expect(graphData.edges.some(e => e.source === 'file1' && e.target === 'file2')).toBe(true);
    });
    
    test('should generate tag graph data', async () => {
        await fs.writeFile(`${testDir}/file1.md`, '# File 1\n#project #important');
        await fs.writeFile(`${testDir}/file2.md`, '# File 2\n#project #urgent');
        
        const graphData = await manager.generateTagGraphData();
        
        expect(graphData.nodes).toHaveLength(3); // project, important, urgent
        expect(graphData.edges).toHaveLength(2); // project-important, project-urgent (important-urgent은 같은 파일에 없음)
        expect(graphData.nodes.some(n => n.id === 'project')).toBe(true);
    });
    
    test('should analyze file relations', async () => {
        await fs.writeFile(`${testDir}/target.md`, '# Target\nLinks to [[other]] and [external](https://example.com)\n#tag');
        await fs.writeFile(`${testDir}/other.md`, '# Other\nLinks to [[target]]');
        
        const relations = await manager.analyzeFileRelations('target.md');
        
        expect(relations.outgoing).toHaveLength(1);
        expect(relations.incoming).toHaveLength(1);
        expect(relations.external).toHaveLength(1);
        expect(relations.tags).toHaveLength(1);
    });
    
    test('should create Obsidian links', () => {
        const link1 = manager.createObsidianLink('target');
        const link2 = manager.createObsidianLink('target', 'Display Text');
        
        expect(link1).toBe('[[target]]');
        expect(link2).toBe('[[target|Display Text]]');
    });
    
    test('should add tag to file', async () => {
        await fs.writeFile(`${testDir}/test.md`, '# Test File\nSome content');
        
        const result = await manager.addTag('test.md', 'new-tag');
        
        expect(result).toBe(true);
        
        const content = await fs.readFile(`${testDir}/test.md`, 'utf8');
        expect(content).toContain('#new-tag');
    });
    
    test('should not add duplicate tag', async () => {
        await fs.writeFile(`${testDir}/test.md`, '# Test File\n#existing-tag\nSome content');
        
        const result = await manager.addTag('test.md', 'existing-tag');
        
        expect(result).toBe(false);
    });
    
    test('should remove tag from file', async () => {
        await fs.writeFile(`${testDir}/test.md`, '# Test File\n#tag-to-remove\nSome content');
        
        const result = await manager.removeTag('test.md', 'tag-to-remove');
        
        expect(result).toBe(true);
        
        const content = await fs.readFile(`${testDir}/test.md`, 'utf8');
        expect(content).not.toContain('#tag-to-remove');
    });
    
    test('should handle non-existent tag removal', async () => {
        await fs.writeFile(`${testDir}/test.md`, '# Test File\nSome content');
        
        const result = await manager.removeTag('test.md', 'non-existent');
        
        expect(result).toBe(false);
    });

    // 데일리 노트/템플릿 관리 테스트
    test('should create daily note', async () => {
        const result = await manager.createDailyNote('2024-01-15', '## 테스트\n\n내용', 'daily');
        expect(result.success).toBe(true);
        expect(result.filePath).toBe('daily/2024-01-15.md');
        expect(result.date).toBe('2024-01-15');
    });

    test('should manage templates', async () => {
        // 템플릿 생성
        const createResult = await manager.manageTemplate('create', 'test-template', '# 템플릿\n\n내용');
        expect(createResult.success).toBe(true);
        expect(createResult.templateName).toBe('test-template');

        // 템플릿 조회
        const getResult = await manager.manageTemplate('get', 'test-template');
        expect(getResult.success).toBe(true);
        expect(getResult.content).toContain('# 템플릿');

        // 템플릿 목록
        const listResult = await manager.manageTemplate('list', 'test-template');
        expect(listResult.success).toBe(true);
        expect(Array.isArray(listResult.templates)).toBe(true);

        // 템플릿 삭제
        const deleteResult = await manager.manageTemplate('delete', 'test-template');
        expect(deleteResult.success).toBe(true);
    });

    test('should list daily notes', async () => {
        const result = await manager.listDailyNotes('2024-01-01', '2024-01-31', 'daily');
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
            expect(result[0]).toHaveProperty('date');
            expect(result[0]).toHaveProperty('filePath');
        }
    });

    // Frontmatter 기반 검색/필터 테스트
    test('should search by frontmatter', async () => {
        // 테스트 파일 생성
        const testContent = `---
title: Test Note
tags: [test, example]
status: draft
---

# Test Note

This is a test note.`;
        await fs.writeFile(`${testDir}/frontmatter-test.md`, testContent, 'utf8');

        const result = await manager.searchByFrontmatter([
            { field: 'title', value: 'Test Note', operator: 'equals' }
        ]);
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
            expect(result[0].frontmatter.title).toBe('Test Note');
        }
    });

    test('should update frontmatter batch', async () => {
        const result = await manager.updateFrontmatterBatch(
            [{ field: 'title', value: 'Test Note', operator: 'equals' }],
            { status: 'published' },
            true // dryRun
        );
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('updated');
        expect(result).toHaveProperty('changes');
    });

    // 첨부파일 관리 테스트
    test('should list attachments', async () => {
        const result = await manager.listAttachments(['png', 'jpg']);
        expect(Array.isArray(result)).toBe(true);
    });

    test('should analyze attachment usage', async () => {
        const result = await manager.analyzeAttachmentUsage(['png', 'jpg']);
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('used');
        expect(result).toHaveProperty('unused');
        expect(result).toHaveProperty('details');
    });

    // 노트 통계/분석 테스트
    test('should generate vault stats', async () => {
        const result = await manager.generateVaultStats();
        expect(result).toHaveProperty('totalFiles');
        expect(result).toHaveProperty('totalWords');
        expect(result).toHaveProperty('totalLinks');
        expect(result).toHaveProperty('totalTags');
        expect(result).toHaveProperty('recentFiles');
    });

    test('should get file stats', async () => {
        const result = await manager.getFileStats('test-note.md');
        expect(result).toHaveProperty('file');
        expect(result).toHaveProperty('size');
        expect(result).toHaveProperty('words');
        expect(result).toHaveProperty('lines');
        expect(result).toHaveProperty('links');
        expect(result).toHaveProperty('readingTime');
        expect(result).toHaveProperty('complexity');
    });

    // 최근 노트 목록 테스트
    test('should get recently modified notes', async () => {
        const result = await manager.getRecentlyModifiedNotes(7, 10);
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
            expect(result[0]).toHaveProperty('file');
            expect(result[0]).toHaveProperty('modified');
            expect(result[0]).toHaveProperty('words');
        }
    });

    test('should get recently created notes', async () => {
        const result = await manager.getRecentlyCreatedNotes(7, 10);
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
            expect(result[0]).toHaveProperty('file');
            expect(result[0]).toHaveProperty('created');
            expect(result[0]).toHaveProperty('words');
        }
    });

    test('should get activity summary', async () => {
        const result = await manager.getActivitySummary(30);
        expect(result).toHaveProperty('period');
        expect(result).toHaveProperty('totalFiles');
        expect(result).toHaveProperty('createdInPeriod');
        expect(result).toHaveProperty('modifiedInPeriod');
        expect(result).toHaveProperty('dailyActivity');
        expect(result).toHaveProperty('topActiveFiles');
    });

    // 노트 리네이밍/이동 테스트
    test('should rename note with link updates', async () => {
        const result = await manager.renameNote('test-note.md', 'renamed-note.md', true);
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('oldPath');
        expect(result).toHaveProperty('newPath');
        expect(result).toHaveProperty('filesToUpdate');
    });

    test('should move note', async () => {
        const result = await manager.moveNote('test-note.md', 'moved', true);
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('oldPath');
        expect(result).toHaveProperty('newPath');
    });

    test('should check link integrity', async () => {
        const result = await manager.checkLinkIntegrity();
        expect(result).toHaveProperty('totalFiles');
        expect(result).toHaveProperty('brokenLinks');
        expect(result).toHaveProperty('orphanedFiles');
        expect(result).toHaveProperty('summary');
    });

    // 아웃라인 추출 테스트
    test('should extract outline', async () => {
        const result = await manager.extractOutline('test-note.md', 3);
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
            expect(result[0]).toHaveProperty('level');
            expect(result[0]).toHaveProperty('title');
            expect(result[0]).toHaveProperty('line');
            expect(result[0]).toHaveProperty('children');
            expect(result[0]).toHaveProperty('id');
        }
    });

    test('should convert outline to markdown', async () => {
        const outline = [
            { level: 1, title: '제목 1', children: [] },
            { level: 2, title: '제목 1-1', children: [] }
        ];
        const result = manager.outlineToMarkdown(outline, true);
        expect(typeof result).toBe('string');
        expect(result).toContain('제목 1');
        expect(result).toContain('제목 1-1');
    });

    test('should convert outline to JSON', async () => {
        const outline = [
            { level: 1, title: '제목 1', children: [] }
        ];
        const result = manager.outlineToJson(outline);
        expect(typeof result).toBe('string');
        const parsed = JSON.parse(result);
        expect(Array.isArray(parsed)).toBe(true);
    });

    test('should split note by sections', async () => {
        const result = await manager.splitNoteBySections('test-note.md', 'sections');
        expect(result).toHaveProperty('originalFile');
        expect(result).toHaveProperty('sections');
        expect(result).toHaveProperty('files');
    });

    // Zettelkasten ID 관리 테스트
    test('should generate zettel ID', () => {
        const result = manager.generateZettelId('TEST');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(10);
    });

    test('should add zettel ID to file', async () => {
        const result = await manager.addZettelId('test-note.md', null, true);
        expect(result).toHaveProperty('file');
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('changes');
    });

    test('should find file by zettel ID', async () => {
        const result = await manager.findFileByZettelId('1234567890123');
        expect(Array.isArray(result)).toBe(true);
    });

    test('should list all zettel IDs', async () => {
        const result = await manager.listAllZettelIds();
        expect(Array.isArray(result)).toBe(true);
    });

    // TODO 작업 관리 테스트
    test('should extract todos', async () => {
        const result = await manager.extractTodos(null, 'all');
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
            expect(result[0]).toHaveProperty('file');
            expect(result[0]).toHaveProperty('line');
            expect(result[0]).toHaveProperty('completed');
            expect(result[0]).toHaveProperty('task');
            expect(result[0]).toHaveProperty('context');
        }
    });

    test('should get todo stats', async () => {
        const result = await manager.getTodoStats();
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('completed');
        expect(result).toHaveProperty('pending');
        expect(result).toHaveProperty('completionRate');
        expect(result).toHaveProperty('byFile');
        expect(result).toHaveProperty('byPriority');
    });

    test('should toggle todo', async () => {
        const result = await manager.toggleTodo('test-note.md', 1);
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('file');
        expect(result).toHaveProperty('line');
        expect(result).toHaveProperty('previousState');
        expect(result).toHaveProperty('newState');
    });

    test('should add todo', async () => {
        const result = await manager.addTodo('test-note.md', '새로운 할 일');
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('file');
        expect(result).toHaveProperty('task');
        expect(result).toHaveProperty('line');
    });

    test('should search todos', async () => {
        const result = await manager.searchTodos('할 일', 'pending', 'high');
        expect(Array.isArray(result)).toBe(true);
    });

    // 노트 유사도 추천 테스트
    test('should calculate similarity', async () => {
        const result = await manager.calculateSimilarity('test-note.md', 'another-note.md');
        expect(result).toHaveProperty('file1');
        expect(result).toHaveProperty('file2');
        expect(result).toHaveProperty('overall');
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('tags');
        expect(result).toHaveProperty('frontmatter');
        expect(result).toHaveProperty('links');
        expect(result).toHaveProperty('details');
    });

    test('should find similar notes', async () => {
        const result = await manager.findSimilarNotes('test-note.md', 5, 0.1);
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
            expect(result[0]).toHaveProperty('file1');
            expect(result[0]).toHaveProperty('file2');
            expect(result[0]).toHaveProperty('overall');
        }
    });

    test('should find related note groups', async () => {
        const result = await manager.findRelatedNoteGroups('test-note.md', 0.3);
        expect(result).toHaveProperty('source');
        expect(result).toHaveProperty('groups');
        expect(Array.isArray(result.groups)).toBe(true);
    });
}); 