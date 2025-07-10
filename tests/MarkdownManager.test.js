import { MarkdownManager } from '../src/MarkdownManager.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('MarkdownManager', () => {
    let manager;
    let testDir;
    
    beforeEach(async () => {
        testDir = await fs.mkdtemp('/tmp/markdown-test-');
        manager = new MarkdownManager(testDir);
    });
    
    afterEach(async () => {
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch (error) {
            console.error('Error cleaning up test directory:', error);
        }
    });
    
    test('should create a new markdown file', async () => {
        const filePath = 'test.md';
        const content = '# Test Document\n\nThis is a test.';
        
        const result = await manager.createFile(filePath, content);
        expect(result).toBe(true);
        
        const fileContent = await manager.readFile(filePath);
        expect(fileContent).toBe(content);
    });
    
    test('should read an existing markdown file', async () => {
        const filePath = 'read-test.md';
        const content = '# Read Test\n\nThis is content to read.';
        
        await manager.createFile(filePath, content);
        const readContent = await manager.readFile(filePath);
        
        expect(readContent).toBe(content);
    });
    
    test('should update an existing markdown file', async () => {
        const filePath = 'update-test.md';
        const originalContent = '# Original\n\nOriginal content.';
        const newContent = '# Updated\n\nUpdated content.';
        
        await manager.createFile(filePath, originalContent);
        const result = await manager.updateFile(filePath, newContent);
        
        expect(result).toBe(true);
        
        const updatedContent = await manager.readFile(filePath);
        expect(updatedContent).toBe(newContent);
    });
    
    test('should append content to existing file', async () => {
        const filePath = 'append-test.md';
        const originalContent = '# Original\n\nOriginal content.';
        const appendContent = '\n# Appended\n\nAppended content.';
        
        await manager.createFile(filePath, originalContent);
        const result = await manager.updateFile(filePath, appendContent, true);
        
        expect(result).toBe(true);
        
        const finalContent = await manager.readFile(filePath);
        expect(finalContent).toBe(originalContent + '\n' + appendContent);
    });
    
    test('should delete a markdown file', async () => {
        const filePath = 'delete-test.md';
        const content = '# Delete Test\n\nThis will be deleted.';
        
        await manager.createFile(filePath, content);
        const result = await manager.deleteFile(filePath);
        
        expect(result).toBe(true);
        
        // Verify file is deleted
        await expect(manager.readFile(filePath)).rejects.toThrow();
    });
    
    test('should list markdown files in directory', async () => {
        await manager.createFile('file1.md', '# File 1');
        await manager.createFile('file2.md', '# File 2');
        await manager.createFile('file3.txt', 'Not a markdown file');
        
        const files = await manager.listFiles('.');
        
        expect(files).toContain('file1.md');
        expect(files).toContain('file2.md');
        expect(files).not.toContain('file3.txt');
        expect(files).toHaveLength(2);
    });
    
    test('should search content in files', async () => {
        await manager.createFile('file1.md', '# Title\nThis is content about API');
        await manager.createFile('file2.md', '# Another\nNo relevant content here');
        
        const results = await manager.searchContent('.', { query: 'API' });
        
        expect(results).toHaveLength(1);
        expect(results[0].file).toBe('file1.md');
        expect(results[0].line).toBe(2);
        expect(results[0].content).toContain('API');
    });
    
    test('should handle case insensitive search', async () => {
        await manager.createFile('file1.md', '# Title\nThis is content about API');
        await manager.createFile('file2.md', '# Another\nThis is content about api');
        
        const results = await manager.searchContent('.', { query: 'api', caseSensitive: false });
        
        expect(results).toHaveLength(2);
    });
    
    test('should handle case sensitive search', async () => {
        await manager.createFile('file1.md', '# Title\nThis is content about API');
        await manager.createFile('file2.md', '# Another\nThis is content about api');
        
        const results = await manager.searchContent('.', { query: 'API', caseSensitive: true });
        
        expect(results).toHaveLength(1);
        expect(results[0].file).toBe('file1.md');
    });
    
    test('should search with multiple keywords in OR mode', async () => {
        await manager.createFile('file1.md', '# Title\nThis is content about API');
        await manager.createFile('file2.md', '# Another\nThis is content about Guide');
        await manager.createFile('file3.md', '# Another\nNo relevant content');
        
        const results = await manager.searchContent('.', { 
            keywords: ['API', 'Guide'], 
            mode: 'or' 
        });
        
        expect(results).toHaveLength(2);
        expect(results.some(r => r.file === 'file1.md')).toBe(true);
        expect(results.some(r => r.file === 'file2.md')).toBe(true);
    });
    
    test('should search with multiple keywords in AND mode', async () => {
        await manager.createFile('file1.md', '# Title\nThis is content about API and Guide');
        await manager.createFile('file2.md', '# Another\nThis is content about API only');
        await manager.createFile('file3.md', '# Another\nThis is content about Guide only');
        
        const results = await manager.searchContent('.', { 
            keywords: ['API', 'Guide'], 
            mode: 'and' 
        });
        
        expect(results).toHaveLength(1);
        expect(results[0].file).toBe('file1.md');
    });
    
    test('should search with regex pattern', async () => {
        await manager.createFile('file1.md', '# Title\nVersion 1.0.0 is released');
        await manager.createFile('file2.md', '# Another\nVersion 2.1.0 is available');
        await manager.createFile('file3.md', '# Another\nNo version info here');
        
        const results = await manager.searchContent('.', { 
            query: 'Version [0-9]', 
            isRegex: true 
        });
        
        expect(results).toHaveLength(2);
        expect(results.some(r => r.content.includes('1.0.0'))).toBe(true);
        expect(results.some(r => r.content.includes('2.1.0'))).toBe(true);
    });
    
    test('should search with filename pattern', async () => {
        await manager.createFile('README.md', '# README\nThis is README content');
        await manager.createFile('guide.md', '# Guide\nThis is guide content');
        await manager.createFile('other.md', '# Other\nThis is other content');
        
        const results = await manager.searchContent('.', { 
            query: 'content',
            filenamePattern: 'README*'
        });
        
        expect(results).toHaveLength(1);
        expect(results[0].file).toBe('README.md');
    });
    
    test('should search with wildcard filename pattern', async () => {
        await manager.createFile('README.md', '# README\nThis is README content');
        await manager.createFile('README-guide.md', '# README Guide\nThis is guide content');
        await manager.createFile('other.md', '# Other\nThis is other content');
        
        const results = await manager.searchContent('.', { 
            query: 'content',
            filenamePattern: 'README*'
        });
        
        expect(results).toHaveLength(2);
        expect(results.some(r => r.file === 'README.md')).toBe(true);
        expect(results.some(r => r.file === 'README-guide.md')).toBe(true);
    });
    
    test('should throw error when both query and keywords are provided', async () => {
        await expect(manager.searchContent('.', { 
            query: 'test', 
            keywords: ['test'] 
        })).rejects.toThrow('Cannot use both query and keywords simultaneously');
    });
    
    test('should throw error when neither query nor keywords are provided', async () => {
        await expect(manager.searchContent('.', {})).rejects.toThrow('Either query or keywords must be provided');
    });
    
    test('should handle invalid regex pattern gracefully', async () => {
        await manager.createFile('file1.md', '# Title\nThis is content');
        
        const results = await manager.searchContent('.', { 
            query: '[invalid', 
            isRegex: true 
        });
        
        // Invalid regex should not crash, just return no results
        expect(results).toHaveLength(0);
    });
    
    test('should handle invalid filename pattern', async () => {
        await expect(manager.searchContent('.', { 
            query: 'test',
            filenamePattern: '[invalid' 
        })).rejects.toThrow('Invalid filename pattern');
    });
    
    test('should manage frontmatter - get', async () => {
        const filePath = 'frontmatter-test.md';
        const content = `---
title: Test Document
tags: [test, markdown]
---

# Content
This is the content.`;
        
        await manager.createFile(filePath, content);
        const result = await manager.manageFrontmatter(filePath, 'get');
        
        expect(result.success).toBe(true);
        expect(result.metadata.title).toBe('Test Document');
        expect(result.metadata.tags).toEqual(['test', 'markdown']);
    });
    
    test('should manage frontmatter - set', async () => {
        const filePath = 'frontmatter-set-test.md';
        const content = '# Content\nThis is the content.';
        const metadata = { title: 'New Title', author: 'Test Author' };
        
        await manager.createFile(filePath, content);
        const result = await manager.manageFrontmatter(filePath, 'set', metadata);
        
        expect(result.success).toBe(true);
        expect(result.metadata).toEqual(metadata);
        
        // Verify the file has the new frontmatter
        const fileContent = await manager.readFile(filePath);
        expect(fileContent).toContain('title: New Title');
        expect(fileContent).toContain('author: Test Author');
    });
    
    test('should manage frontmatter - update', async () => {
        const filePath = 'frontmatter-update-test.md';
        const content = `---
title: Original Title
---

# Content`;
        
        await manager.createFile(filePath, content);
        const updateMetadata = { title: 'Updated Title', author: 'New Author' };
        const result = await manager.manageFrontmatter(filePath, 'update', updateMetadata);
        
        expect(result.success).toBe(true);
        expect(result.metadata.title).toBe('Updated Title');
        expect(result.metadata.author).toBe('New Author');
    });
    
    test('should manage frontmatter - remove', async () => {
        const filePath = 'frontmatter-remove-test.md';
        const content = `---
title: Test Title
---

# Content
This is the content.`;
        
        await manager.createFile(filePath, content);
        const result = await manager.manageFrontmatter(filePath, 'remove');
        
        expect(result.success).toBe(true);
        
        // Verify frontmatter is removed
        const fileContent = await manager.readFile(filePath);
        expect(fileContent).not.toContain('---');
        expect(fileContent).toContain('# Content');
    });
    
    test('should throw error for invalid file path', async () => {
        await expect(manager.readFile('../invalid-path.md')).rejects.toThrow('Invalid file path');
    });
    
    test('should throw error when file does not exist', async () => {
        await expect(manager.readFile('nonexistent.md')).rejects.toThrow('Failed to read file');
    });
    
    test('should throw error when trying to create file that exists without overwrite', async () => {
        await manager.createFile('test.md', '# Original');
        await expect(manager.createFile('test.md', '# New', false)).rejects.toThrow('File already exists');
    });
    
    test('should allow overwriting existing file', async () => {
        await manager.createFile('test.md', '# Original');
        const result = await manager.createFile('test.md', '# New', true);
        
        expect(result).toBe(true);
        
        const content = await manager.readFile('test.md');
        expect(content).toBe('# New');
    });
}); 