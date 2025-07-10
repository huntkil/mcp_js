import { promises as fs } from 'fs';
import { join, dirname, resolve } from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

export class MarkdownManager {
    constructor(basePath = process.cwd()) {
        this.basePath = resolve(basePath);
    }
    
    /**
     * 파일 읽기
     * @param {string} filePath - 파일 경로
     * @param {string} encoding - 인코딩 (기본값: utf8)
     * @returns {Promise<string>} 파일 내용
     */
    async readFile(filePath, encoding = 'utf8') {
        const fullPath = this.getFullPath(filePath);
        this.validatePath(fullPath);
        
        try {
            return await fs.readFile(fullPath, encoding);
        } catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }
    
    /**
     * 파일 생성
     * @param {string} filePath - 파일 경로
     * @param {string} content - 파일 내용
     * @param {boolean} overwrite - 덮어쓰기 여부
     * @returns {Promise<boolean>} 성공 여부
     */
    async createFile(filePath, content, overwrite = false) {
        const fullPath = this.getFullPath(filePath);
        this.validatePath(fullPath);
        
        try {
            if (!overwrite && await this.fileExists(fullPath)) {
                throw new Error('File already exists');
            }
            
            await fs.mkdir(dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content, 'utf8');
            return true;
        } catch (error) {
            throw new Error(`Failed to create file: ${error.message}`);
        }
    }
    
    /**
     * 파일 수정
     * @param {string} filePath - 파일 경로
     * @param {string} content - 새로운 내용
     * @param {boolean} append - 추가 여부
     * @returns {Promise<boolean>} 성공 여부
     */
    async updateFile(filePath, content, append = false) {
        const fullPath = this.getFullPath(filePath);
        this.validatePath(fullPath);
        
        try {
            if (append) {
                const existingContent = await this.readFile(filePath);
                content = existingContent + '\n' + content;
            }
            
            await fs.writeFile(fullPath, content, 'utf8');
            return true;
        } catch (error) {
            throw new Error(`Failed to update file: ${error.message}`);
        }
    }
    
    /**
     * 파일 삭제
     * @param {string} filePath - 파일 경로
     * @returns {Promise<boolean>} 성공 여부
     */
    async deleteFile(filePath) {
        const fullPath = this.getFullPath(filePath);
        this.validatePath(fullPath);
        
        try {
            await fs.unlink(fullPath);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }
    
    /**
     * 파일 목록 조회
     * @param {string} directory - 디렉토리 경로
     * @param {boolean} recursive - 재귀 검색 여부
     * @param {string} pattern - 파일 패턴
     * @returns {Promise<string[]>} 파일 목록
     */
    async listFiles(directory, recursive = false, pattern = '*.md') {
        const searchPath = this.getFullPath(directory);
        this.validatePath(searchPath);
        
        try {
            const globPattern = recursive ? 
                join(searchPath, '**', pattern) : 
                join(searchPath, pattern);
            
            const files = await glob(globPattern);
            return files.map(file => file.replace(this.basePath, '').replace(/^\//, ''));
        } catch (error) {
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }
    
    /**
     * 내용 검색 (확장 버전)
     * @param {string} directory - 검색할 디렉토리
     * @param {Object} options - 검색 옵션
     * @param {string} options.query - 단일 검색 키워드 (keywords와 함께 사용 불가)
     * @param {string[]} options.keywords - 여러 검색 키워드 배열
     * @param {string} options.mode - 'and' 또는 'or' (기본값: 'or')
     * @param {boolean} options.caseSensitive - 대소문자 구분 여부 (기본값: false)
     * @param {boolean} options.isRegex - query를 정규식으로 처리할지 여부 (기본값: false)
     * @param {string} options.filenamePattern - 파일명 패턴 (정규식 또는 와일드카드)
     * @returns {Promise<Array>} 검색 결과
     */
    async searchContent(directory, options = {}) {
        const {
            query,
            keywords = [],
            mode = 'or',
            caseSensitive = false,
            isRegex = false,
            filenamePattern
        } = options;

        // query와 keywords는 동시에 사용할 수 없음
        if (query && keywords.length > 0) {
            throw new Error('Cannot use both query and keywords simultaneously');
        }

        // query나 keywords 중 하나는 반드시 필요
        if (!query && keywords.length === 0) {
            throw new Error('Either query or keywords must be provided');
        }

        let files = await this.listFiles(directory, true);
        
        // 파일명 패턴 필터링
        if (filenamePattern) {
            try {
                // 와일드카드 패턴을 정규식으로 변환
                const regexPattern = filenamePattern
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*')
                    .replace(/\?/g, '.');
                const fileRegex = new RegExp(regexPattern, caseSensitive ? '' : 'i');
                files = files.filter(file => fileRegex.test(file));
            } catch (error) {
                throw new Error(`Invalid filename pattern: ${error.message}`);
            }
        }

        const results = [];
        
        for (const file of files) {
            try {
                const content = await this.readFile(file);
                const lines = content.split('\n');
                
                lines.forEach((line, index) => {
                    let match = false;
                    
                    if (keywords.length > 0) {
                        // 여러 키워드 검색
                        if (mode === 'and') {
                            // 모든 키워드가 포함되어야 함
                            match = keywords.every(keyword => {
                                const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
                                return regex.test(line);
                            });
                        } else {
                            // 하나라도 포함되면 됨
                            match = keywords.some(keyword => {
                                const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
                                return regex.test(line);
                            });
                        }
                    } else if (query) {
                        // 단일 키워드/정규식 검색
                        try {
                            let regex;
                            if (isRegex) {
                                regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
                            } else {
                                // 일반 문자열을 정규식으로 이스케이프
                                const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                regex = new RegExp(escapedQuery, caseSensitive ? 'g' : 'gi');
                            }
                            match = regex.test(line);
                        } catch (error) {
                            console.error(`Invalid regex pattern: ${query}`, error.message);
                            return; // 이 라인은 건너뛰기
                        }
                    }
                    
                    if (match) {
                        results.push({
                            file,
                            line: index + 1,
                            content: line.trim(),
                            match: line.match(new RegExp(query || keywords.join('|'), caseSensitive ? 'g' : 'gi'))
                        });
                    }
                });
            } catch (error) {
                console.error(`Error searching in ${file}:`, error.message);
            }
        }
        
        return results;
    }
    
    /**
     * Frontmatter 관리
     * @param {string} filePath - 파일 경로
     * @param {string} action - 액션 (get, set, update, remove)
     * @param {Object} metadata - 메타데이터
     * @returns {Promise<Object>} 작업 결과
     */
    async manageFrontmatter(filePath, action, metadata = null) {
        const fullPath = this.getFullPath(filePath);
        this.validatePath(fullPath);
        
        try {
            const fileContent = await this.readFile(filePath);
            const { data, content } = matter(fileContent);
            
            switch (action) {
                case 'get': {
                    return { metadata: data, success: true };
                }
                
                case 'set': {
                    if (!metadata) throw new Error('Metadata is required for set operation');
                    const newContent = matter.stringify(content, metadata);
                    await this.updateFile(filePath, newContent);
                    return { metadata, success: true };
                }
                
                case 'update': {
                    if (!metadata) throw new Error('Metadata is required for update operation');
                    const updatedData = { ...data, ...metadata };
                    const updatedContent = matter.stringify(content, updatedData);
                    await this.updateFile(filePath, updatedContent);
                    return { metadata: updatedData, success: true };
                }
                
                case 'remove': {
                    await this.updateFile(filePath, content);
                    return { success: true };
                }
                
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (error) {
            throw new Error(`Failed to manage frontmatter: ${error.message}`);
        }
    }
    
    // 유틸리티 메서드들
    getFullPath(filePath) {
        return resolve(this.basePath, filePath);
    }
    
    validatePath(fullPath) {
        if (!fullPath.startsWith(this.basePath)) {
            throw new Error('Invalid file path: outside base directory');
        }
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
} 