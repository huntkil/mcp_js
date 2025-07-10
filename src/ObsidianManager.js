import { promises as fs } from 'fs';
import { join, dirname, resolve, basename, extname } from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

export class ObsidianManager {
    constructor(basePath) {
        this.basePath = resolve(basePath);
    }
    
    /**
     * 옵시디언 링크 추출
     * @param {string} filePath - 파일 경로
     * @returns {Promise<Object>} 링크 정보
     */
    async extractLinks(filePath) {
        const content = await fs.readFile(this.getFullPath(filePath), 'utf8');
        const lines = content.split('\n');
        const links = {
            internal: [], // [[내부 링크]]
            external: [], // [외부 링크](URL)
            embeds: [],   // ![[임베드]]
            tags: []      // #태그
        };
        
        // 정규식 패턴들
        const externalLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
        const embedPattern = /!\[\[([^\]]+)\]\]/g;
        const tagPattern = /#([a-zA-Z0-9가-힣_-]+)/g;
        
        lines.forEach((line, index) => {
            // 내부 링크 추출 (임베드 제외)
            let match;
            const internalLinkPattern = /\[\[([^\]]+)\]\]/g;
            while ((match = internalLinkPattern.exec(line)) !== null) {
                // 임베드가 아닌 경우만 추가
                if (!line.includes('![[', match.index - 1)) {
                    links.internal.push({
                        link: match[1],
                        line: index + 1,
                        context: line.trim()
                    });
                }
            }
            
            // 외부 링크 추출
            while ((match = externalLinkPattern.exec(line)) !== null) {
                links.external.push({
                    text: match[1],
                    url: match[2],
                    line: index + 1,
                    context: line.trim()
                });
            }
            
            // 임베드 추출
            while ((match = embedPattern.exec(line)) !== null) {
                links.embeds.push({
                    file: match[1],
                    line: index + 1,
                    context: line.trim()
                });
            }
            
            // 태그 추출
            while ((match = tagPattern.exec(line)) !== null) {
                links.tags.push({
                    tag: match[1],
                    line: index + 1,
                    context: line.trim()
                });
            }
        });
        
        return links;
    }
    
    /**
     * 백링크 찾기 (이 파일을 참조하는 다른 파일들)
     * @param {string} filePath - 대상 파일 경로
     * @returns {Promise<Array>} 백링크 정보
     */
    async findBacklinks(filePath) {
        const targetFileName = basename(filePath, extname(filePath));
        const files = await glob(join(this.basePath, '**/*.md'));
        const backlinks = [];
        
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            if (relativePath === filePath) continue; // 자기 자신 제외
            
            try {
                const content = await fs.readFile(file, 'utf8');
                const lines = content.split('\n');
                
                lines.forEach((line, index) => {
                    // [[파일명]] 또는 [[파일명|별칭]] 패턴 찾기
                    const linkPattern = new RegExp(`\\[\\[${targetFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\|[^\\]]+)?\\]\\]`, 'gi');
                    if (linkPattern.test(line)) {
                        backlinks.push({
                            file: relativePath,
                            line: index + 1,
                            context: line.trim()
                        });
                    }
                });
            } catch (error) {
                console.error(`Error reading file ${file}:`, error.message);
            }
        }
        
        return backlinks;
    }
    
    /**
     * 태그로 파일 검색
     * @param {string} tag - 검색할 태그
     * @param {boolean} caseSensitive - 대소문자 구분 여부
     * @returns {Promise<Array>} 태그가 포함된 파일들
     */
    async findFilesByTag(tag, caseSensitive = false) {
        const files = await glob(join(this.basePath, '**/*.md'));
        const results = [];
        
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            try {
                const content = await fs.readFile(file, 'utf8');
                const lines = content.split('\n');
                
                lines.forEach((line, index) => {
                    const tagPattern = new RegExp(`#${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, caseSensitive ? 'g' : 'gi');
                    if (tagPattern.test(line)) {
                        results.push({
                            file: relativePath,
                            line: index + 1,
                            context: line.trim(),
                            tag: tag
                        });
                    }
                });
            } catch (error) {
                console.error(`Error reading file ${file}:`, error.message);
            }
        }
        
        return results;
    }
    
    /**
     * 모든 태그 목록 추출
     * @returns {Promise<Array>} 고유한 태그 목록
     */
    async getAllTags() {
        const files = await glob(join(this.basePath, '**/*.md'));
        const tagSet = new Set();
        
        for (const file of files) {
            try {
                const content = await fs.readFile(file, 'utf8');
                const tagPattern = /#([a-zA-Z0-9가-힣_-]+)/g;
                let match;
                
                while ((match = tagPattern.exec(content)) !== null) {
                    tagSet.add(match[1]);
                }
            } catch (error) {
                console.error(`Error reading file ${file}:`, error.message);
            }
        }
        
        return Array.from(tagSet).sort();
    }
    
    /**
     * 그래프 데이터 생성 (노드와 엣지)
     * @returns {Promise<Object>} 그래프 데이터
     */
    async generateGraphData() {
        const files = await glob(join(this.basePath, '**/*.md'));
        const nodes = [];
        const edges = [];
        const fileMap = new Map();
        
        // 노드 생성
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            const fileName = basename(relativePath, extname(relativePath));
            
            nodes.push({
                id: fileName,
                label: fileName,
                path: relativePath,
                type: 'file'
            });
            
            fileMap.set(fileName, relativePath);
        }
        
        // 엣지 생성 (링크 관계)
        for (const file of files) {
            const sourceFileName = basename(file, extname(file));
            try {
                const content = await fs.readFile(file, 'utf8');
                const internalLinkPattern = /\[\[([^\]]+)\]\]/g;
                let match;
                
                while ((match = internalLinkPattern.exec(content)) !== null) {
                    const targetFileName = match[1].split('|')[0]; // 별칭 제거
                    
                    if (fileMap.has(targetFileName)) {
                        edges.push({
                            source: sourceFileName,
                            target: targetFileName,
                            type: 'link'
                        });
                    }
                }
            } catch (error) {
                console.error(`Error reading file ${file}:`, error.message);
            }
        }
        
        return { nodes, edges };
    }
    
    /**
     * 태그 그래프 데이터 생성
     * @returns {Promise<Object>} 태그 그래프 데이터
     */
    async generateTagGraphData() {
        const files = await glob(join(this.basePath, '**/*.md'));
        const tagNodes = new Map();
        const tagEdges = new Set();
        
        for (const file of files) {
            const content = await fs.readFile(file, 'utf8');
            const tagPattern = /#([a-zA-Z0-9가-힣_-]+)/g;
            const tags = [];
            let match;
            
            while ((match = tagPattern.exec(content)) !== null) {
                tags.push(match[1]);
            }
            
            // 태그 노드 추가
            tags.forEach(tag => {
                if (!tagNodes.has(tag)) {
                    tagNodes.set(tag, {
                        id: tag,
                        label: tag,
                        type: 'tag',
                        count: 0
                    });
                }
                tagNodes.get(tag).count++;
            });
            
            // 태그 간 엣지 생성 (같은 파일에 있는 태그들)
            for (let i = 0; i < tags.length; i++) {
                for (let j = i + 1; j < tags.length; j++) {
                    const edgeKey = [tags[i], tags[j]].sort().join('->');
                    tagEdges.add(edgeKey);
                }
            }
        }
        
        const edges = Array.from(tagEdges).map(edge => {
            const [source, target] = edge.split('->');
            return { source, target, type: 'tag-relation' };
        });
        
        return {
            nodes: Array.from(tagNodes.values()),
            edges
        };
    }
    
    /**
     * 파일의 링크 관계 분석
     * @param {string} filePath - 분석할 파일 경로
     * @returns {Promise<Object>} 링크 관계 정보
     */
    async analyzeFileRelations(filePath) {
        const links = await this.extractLinks(filePath);
        const backlinks = await this.findBacklinks(filePath);
        
        return {
            outgoing: links.internal,
            incoming: backlinks,
            external: links.external,
            embeds: links.embeds,
            tags: links.tags
        };
    }
    
    /**
     * 옵시디언 링크 생성
     * @param {string} targetFileName - 대상 파일명
     * @param {string} displayText - 표시 텍스트 (선택사항)
     * @returns {string} 옵시디언 링크 형식
     */
    createObsidianLink(targetFileName, displayText = null) {
        if (displayText) {
            return `[[${targetFileName}|${displayText}]]`;
        }
        return `[[${targetFileName}]]`;
    }
    
    /**
     * 태그 추가
     * @param {string} filePath - 파일 경로
     * @param {string} tag - 추가할 태그
     * @returns {Promise<boolean>} 성공 여부
     */
    async addTag(filePath, tag) {
        const fullPath = this.getFullPath(filePath);
        try {
            const content = await fs.readFile(fullPath, 'utf8');
            const tagPattern = new RegExp(`#${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
            
            if (!tagPattern.test(content)) {
                const newContent = content + `\n#${tag}`;
                await fs.writeFile(fullPath, newContent, 'utf8');
                return true;
            }
            return false; // 이미 태그가 존재
        } catch (error) {
            throw new Error(`Failed to add tag: ${error.message}`);
        }
    }
    
    /**
     * 태그 제거
     * @param {string} filePath - 파일 경로
     * @param {string} tag - 제거할 태그
     * @returns {Promise<boolean>} 성공 여부
     */
    async removeTag(filePath, tag) {
        const fullPath = this.getFullPath(filePath);
        try {
            const content = await fs.readFile(fullPath, 'utf8');
            const tagPattern = new RegExp(`\\s*#${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'gi');
            const newContent = content.replace(tagPattern, '');
            
            if (newContent !== content) {
                await fs.writeFile(fullPath, newContent, 'utf8');
                return true;
            }
            return false; // 태그가 존재하지 않음
        } catch (error) {
            throw new Error(`Failed to remove tag: ${error.message}`);
        }
    }
    
    /**
     * 데일리 노트 생성
     * @param {string} date - 날짜 (YYYY-MM-DD 형식, 기본값: 오늘)
     * @param {string} template - 템플릿 내용 (선택사항)
     * @param {string} folder - 저장할 폴더 (선택사항)
     * @returns {Promise<Object>} 생성 결과
     */
    async createDailyNote(date = null, template = null, folder = '') {
        const targetDate = date ? new Date(date) : new Date();
        const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const fileName = `${dateStr}.md`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;
        
        let content = `# ${dateStr}\n\n`;
        
        if (template) {
            content += template;
        } else {
            // 기본 템플릿
            content += `## 📝 오늘의 할 일\n\n- [ ] \n\n` +
                      `## 📚 읽은 것\n\n\n` +
                      `## 💡 아이디어\n\n\n` +
                      `## 📌 메모\n\n\n`;
        }
        
        try {
            await fs.writeFile(this.getFullPath(filePath), content, 'utf8');
            return {
                success: true,
                filePath,
                date: dateStr,
                content
            };
        } catch (error) {
            throw new Error(`Failed to create daily note: ${error.message}`);
        }
    }
    
    /**
     * 템플릿 관리
     * @param {string} action - 'create', 'get', 'list', 'delete'
     * @param {string} templateName - 템플릿 이름
     * @param {string} content - 템플릿 내용
     * @returns {Promise<Object>} 작업 결과
     */
    async manageTemplate(action, templateName, content = null) {
        const templatesDir = '.templates';
        const templatePath = `${templatesDir}/${templateName}.md`;
        
        try {
            switch (action) {
                case 'create': {
                    if (!content) throw new Error('Template content is required');
                    await fs.writeFile(this.getFullPath(templatePath), content, 'utf8');
                    return { success: true, templateName, message: 'Template created' };
                }
                
                case 'get': {
                    const templateContent = await fs.readFile(this.getFullPath(templatePath), 'utf8');
                    return { success: true, templateName, content: templateContent };
                }
                
                case 'list': {
                    const templates = await glob(join(this.basePath, `${templatesDir}/**/*.md`));
                    return { success: true, templates };
                }
                
                case 'delete': {
                    await fs.unlink(this.getFullPath(templatePath));
                    return { success: true, templateName, message: 'Template deleted' };
                }
                
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (error) {
            throw new Error(`Template operation failed: ${error.message}`);
        }
    }
    
    /**
     * 데일리 노트 목록 조회
     * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
     * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
     * @param {string} folder - 폴더 경로 (선택사항)
     * @returns {Promise<Array>} 데일리 노트 목록
     */
    async listDailyNotes(startDate, endDate, folder = '') {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const notes = [];
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const fileName = `${dateStr}.md`;
            const filePath = folder ? `${folder}/${fileName}` : fileName;
            
            try {
                const exists = await fs.access(this.getFullPath(filePath)).then(() => true).catch(() => false);
                if (exists) {
                    const content = await fs.readFile(this.getFullPath(filePath), 'utf8');
                    notes.push({
                        date: dateStr,
                        filePath,
                        exists: true,
                        content: content.substring(0, 200) + '...' // 미리보기
                    });
                } else {
                    notes.push({
                        date: dateStr,
                        filePath,
                        exists: false
                    });
                }
            } catch (error) {
                console.error(`Error checking daily note ${filePath}:`, error.message);
            }
        }
        
        return notes;
    }
    
    /**
     * Frontmatter 기반 파일 검색
     * @param {Object} filters - 검색 필터 조건
     * @param {string} filters.field - 검색할 필드명
     * @param {string} filters.value - 검색할 값
     * @param {string} filters.operator - 연산자 ('equals', 'contains', 'exists', 'not_exists')
     * @returns {Promise<Array>} 검색 결과
     */
    async searchByFrontmatter(filters) {
        const files = await glob(join(this.basePath, '**/*.md'));
        const results = [];
        
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            try {
                const content = await fs.readFile(file, 'utf8');
                const { data: frontmatter } = matter(content);
                
                let match = true;
                for (const filter of filters) {
                    const { field, value, operator = 'equals' } = filter;
                    
                    switch (operator) {
                        case 'equals': {
                            match = match && frontmatter[field] === value;
                            break;
                        }
                        case 'contains': {
                            match = match && frontmatter[field] && 
                                   frontmatter[field].toString().includes(value);
                            break;
                        }
                        case 'exists': {
                            match = match && Object.prototype.hasOwnProperty.call(frontmatter, field);
                            break;
                        }
                        case 'not_exists': {
                            match = match && !Object.prototype.hasOwnProperty.call(frontmatter, field);
                            break;
                        }
                        case 'in': {
                            match = match && Array.isArray(value) && 
                                   value.includes(frontmatter[field]);
                            break;
                        }
                    }
                    
                    if (!match) break;
                }
                
                if (match) {
                    results.push({
                        file: relativePath,
                        frontmatter,
                        content: content.substring(0, 200) + '...'
                    });
                }
            } catch (error) {
                console.error(`Error reading file ${file}:`, error.message);
            }
        }
        
        return results;
    }
    
    /**
     * Frontmatter 일괄 변경
     * @param {Array} filters - 검색 필터 조건
     * @param {Object} updates - 업데이트할 필드와 값
     * @param {boolean} dryRun - 실제 변경하지 않고 미리보기만 (기본값: false)
     * @returns {Promise<Object>} 변경 결과
     */
    async updateFrontmatterBatch(filters, updates, dryRun = false) {
        const files = await this.searchByFrontmatter(filters);
        const results = {
            total: files.length,
            updated: 0,
            errors: [],
            changes: []
        };
        
        for (const file of files) {
            try {
                const fullPath = this.getFullPath(file.file);
                const content = await fs.readFile(fullPath, 'utf8');
                const { data: frontmatter, content: markdownContent } = matter(content);
                
                // 업데이트 적용
                const originalFrontmatter = { ...frontmatter };
                Object.assign(frontmatter, updates);
                
                if (!dryRun) {
                    const newContent = matter.stringify(markdownContent, frontmatter);
                    await fs.writeFile(fullPath, newContent, 'utf8');
                }
                
                results.updated++;
                results.changes.push({
                    file: file.file,
                    original: originalFrontmatter,
                    updated: frontmatter
                });
            } catch (error) {
                results.errors.push({
                    file: file.file,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    /**
     * Frontmatter 필드 추가/제거
     * @param {Array} filters - 검색 필터 조건
     * @param {Array} addFields - 추가할 필드들 [{field: 'status', value: 'todo'}]
     * @param {Array} removeFields - 제거할 필드들 ['old_field']
     * @param {boolean} dryRun - 실제 변경하지 않고 미리보기만
     * @returns {Promise<Object>} 변경 결과
     */
    async modifyFrontmatterFields(filters, addFields = [], removeFields = [], dryRun = false) {
        const files = await this.searchByFrontmatter(filters);
        const results = {
            total: files.length,
            updated: 0,
            errors: [],
            changes: []
        };
        
        for (const file of files) {
            try {
                const fullPath = this.getFullPath(file.file);
                const content = await fs.readFile(fullPath, 'utf8');
                const { data: frontmatter, content: markdownContent } = matter(content);
                
                const originalFrontmatter = { ...frontmatter };
                
                // 필드 추가
                for (const { field, value } of addFields) {
                    frontmatter[field] = value;
                }
                
                // 필드 제거
                for (const field of removeFields) {
                    delete frontmatter[field];
                }
                
                if (!dryRun) {
                    const newContent = matter.stringify(markdownContent, frontmatter);
                    await fs.writeFile(fullPath, newContent, 'utf8');
                }
                
                results.updated++;
                results.changes.push({
                    file: file.file,
                    original: originalFrontmatter,
                    updated: frontmatter
                });
            } catch (error) {
                results.errors.push({
                    file: file.file,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    /**
     * 첨부파일 목록 조회
     * @param {Array} extensions - 검색할 파일 확장자 (기본값: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'pdf'])
     * @returns {Promise<Array>} 첨부파일 목록
     */
    async listAttachments(extensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'pdf']) {
        const patterns = extensions.map(ext => `**/*.${ext}`);
        const files = [];
        
        for (const pattern of patterns) {
            const matches = await glob(join(this.basePath, pattern));
            files.push(...matches);
        }
        
        const result = [];
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            try {
                const stats = await fs.stat(file);
                result.push({
                    file: relativePath,
                    size: stats.size,
                    modified: stats.mtime,
                    type: extname(file).substring(1)
                });
            } catch (e) {
                // 파일이 없을 경우 무시
            }
        }
        return result;
    }
    
    /**
     * 첨부파일 사용 여부 분석
     * @param {Array} extensions - 검색할 파일 확장자
     * @returns {Promise<Object>} 사용 여부 분석 결과
     */
    async analyzeAttachmentUsage(extensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'pdf']) {
        const attachments = await this.listAttachments(extensions);
        const markdownFiles = await glob(join(this.basePath, '**/*.md'));
        const usage = {};
        
        // 각 첨부파일의 사용 여부 확인
        for (const attachment of attachments) {
            const fileName = basename(attachment.file);
            const fileNameWithoutExt = basename(attachment.file, extname(attachment.file));
            usage[attachment.file] = {
                file: attachment.file,
                used: false,
                references: []
            };
            
            // 마크다운 파일에서 참조 검색
            for (const mdFile of markdownFiles) {
                const relativePath = mdFile.replace(this.basePath, '').replace(/^\//, '');
                try {
                    const content = await fs.readFile(mdFile, 'utf8');
                    
                    // 다양한 참조 패턴 검색
                    const patterns = [
                        new RegExp(`!\\[\\[${fileName}\\]\\]`, 'g'), // ![[filename]]
                        new RegExp(`!\\[\\[${fileNameWithoutExt}\\]\\]`, 'g'), // ![[filename-without-ext]]
                        new RegExp(`\\[([^\\]]+)\\]\\(${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'), // [text](filename)
                        new RegExp(`\\[([^\\]]+)\\]\\(${fileNameWithoutExt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g') // [text](filename-without-ext)
                    ];
                    
                    for (const pattern of patterns) {
                        if (pattern.test(content)) {
                            usage[attachment.file].used = true;
                            usage[attachment.file].references.push(relativePath);
                            break;
                        }
                    }
                } catch (error) {
                    console.error(`Error reading file ${mdFile}:`, error.message);
                }
            }
        }
        
        return {
            total: attachments.length,
            used: Object.values(usage).filter(u => u.used).length,
            unused: Object.values(usage).filter(u => !u.used).length,
            details: Object.values(usage)
        };
    }
    
    /**
     * 미사용 첨부파일 정리
     * @param {Array} extensions - 검색할 파일 확장자
     * @param {boolean} dryRun - 실제 삭제하지 않고 미리보기만 (기본값: true)
     * @param {string} backupDir - 백업 디렉토리 (선택사항)
     * @returns {Promise<Object>} 정리 결과
     */
    async cleanupUnusedAttachments(extensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'pdf'], dryRun = true, backupDir = null) {
        const analysis = await this.analyzeAttachmentUsage(extensions);
        const unusedFiles = analysis.details.filter(f => !f.used);
        const results = {
            total: unusedFiles.length,
            deleted: 0,
            backedUp: 0,
            errors: [],
            files: []
        };
        
        for (const file of unusedFiles) {
            try {
                const fullPath = this.getFullPath(file.file);
                
                // 백업 생성
                if (backupDir && !dryRun) {
                    const backupPath = join(this.basePath, backupDir, basename(file.file));
                    await fs.mkdir(dirname(backupPath), { recursive: true });
                    await fs.copyFile(fullPath, backupPath);
                    results.backedUp++;
                }
                
                // 파일 삭제
                if (!dryRun) {
                    await fs.unlink(fullPath);
                    results.deleted++;
                }
                
                results.files.push({
                    file: file.file,
                    action: dryRun ? 'would_delete' : 'deleted',
                    backedUp: backupDir && !dryRun
                });
            } catch (error) {
                results.errors.push({
                    file: file.file,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    /**
     * Vault 통계 생성
     * @returns {Promise<Object>} Vault 통계 정보
     */
    async generateVaultStats() {
        const files = await glob(join(this.basePath, '**/*.md'));
        const stats = {
            totalFiles: files.length,
            totalSize: 0,
            totalWords: 0,
            totalLinks: 0,
            totalTags: 0,
            fileTypes: {},
            topTags: {},
            topReferencedFiles: {},
            recentFiles: [],
            averageFileSize: 0,
            averageWordsPerFile: 0
        };
        
        const fileDetails = [];
        
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            let fileStats;
            try {
                fileStats = await fs.stat(file);
            } catch (e) {
                continue;
            }
            try {
                const content = await fs.readFile(file, 'utf8');
                
                // 기본 통계
                const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
                const links = await this.extractLinks(relativePath);
                const linkCount = links.internal.length + links.external.length;
                const tagCount = links.tags.length;
                
                stats.totalSize += fileStats.size;
                stats.totalWords += wordCount;
                stats.totalLinks += linkCount;
                stats.totalTags += tagCount;
                
                // 파일 타입별 통계
                const folder = dirname(relativePath);
                stats.fileTypes[folder] = (stats.fileTypes[folder] || 0) + 1;
                
                // 태그별 통계
                links.tags.forEach(tag => {
                    stats.topTags[tag.tag] = (stats.topTags[tag.tag] || 0) + 1;
                });
                
                // 최근 파일
                fileDetails.push({
                    file: relativePath,
                    size: fileStats.size,
                    words: wordCount,
                    links: linkCount,
                    tags: tagCount,
                    modified: fileStats.mtime,
                    created: fileStats.birthtime
                });
                
            } catch (error) {
                console.error(`Error reading file ${file}:`, error.message);
            }
        }
        
        // 평균 계산
        if (files.length > 0) {
            stats.averageFileSize = Math.round(stats.totalSize / files.length);
            stats.averageWordsPerFile = Math.round(stats.totalWords / files.length);
        }
        
        // 최근 파일 정렬
        stats.recentFiles = fileDetails
            .sort((a, b) => b.modified - a.modified)
            .slice(0, 10)
            .map(f => ({
                file: f.file,
                modified: f.modified,
                size: f.size,
                words: f.words
            }));
        
        // 상위 태그 정렬
        stats.topTags = Object.entries(stats.topTags)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
        
        // 상위 참조 파일 계산
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            const backlinks = await this.findBacklinks(relativePath);
            if (backlinks.length > 0) {
                stats.topReferencedFiles[relativePath] = backlinks.length;
            }
        }
        
        stats.topReferencedFiles = Object.entries(stats.topReferencedFiles)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
        
        return stats;
    }
    
    /**
     * 파일별 상세 통계
     * @param {string} filePath - 파일 경로
     * @returns {Promise<Object>} 파일 상세 통계
     */
    async getFileStats(filePath) {
        const fullPath = this.getFullPath(filePath);
        let stats;
        try {
            stats = await fs.stat(fullPath);
        } catch (e) {
            throw new Error(`File not found: ${filePath}`);
        }
        const content = await fs.readFile(fullPath, 'utf8');
        const { data: frontmatter } = matter(content);
        
        const lines = content.split('\n');
        const words = content.split(/\s+/).filter(word => word.length > 0);
        const characters = content.length;
        const links = await this.extractLinks(filePath);
        const backlinks = await this.findBacklinks(filePath);
        
        return {
            file: filePath,
            size: stats.size,
            lines: lines.length,
            words: words.length,
            characters,
            links: {
                internal: links.internal.length,
                external: links.external.length,
                embeds: links.embeds.length,
                tags: links.tags.length,
                backlinks: backlinks.length
            },
            frontmatter: Object.keys(frontmatter).length,
            modified: stats.mtime,
            created: stats.birthtime,
            readingTime: Math.ceil(words.length / 200), // 분 단위 (평균 200단어/분)
            complexity: this.calculateComplexity(content)
        };
    }
    
    /**
     * 텍스트 복잡도 계산
     * @param {string} content - 텍스트 내용
     * @returns {Object} 복잡도 정보
     */
    calculateComplexity(content) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = content.split(/\s+/).filter(word => word.length > 0);
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        
        return {
            sentences: sentences.length,
            averageSentenceLength: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
            uniqueWords: uniqueWords.size,
            vocabularyDiversity: words.length > 0 ? Math.round((uniqueWords.size / words.length) * 100) / 100 : 0
        };
    }
    
    /**
     * 최근 수정된 노트 목록
     * @param {number} days - 최근 n일 (기본값: 7)
     * @param {number} limit - 최대 결과 수 (기본값: 20)
     * @returns {Promise<Array>} 최근 수정된 노트 목록
     */
    async getRecentlyModifiedNotes(days = 7, limit = 20) {
        const files = await glob(join(this.basePath, '**/*.md'));
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const recentFiles = [];
        
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            let stats;
            try {
                stats = await fs.stat(file);
            } catch (e) {
                continue;
            }
            
            if (stats.mtime >= cutoffDate) {
                try {
                    const content = await fs.readFile(file, 'utf8');
                    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
                    
                    recentFiles.push({
                        file: relativePath,
                        modified: stats.mtime,
                        size: stats.size,
                        words: wordCount,
                        daysAgo: Math.floor((new Date() - stats.mtime) / (1000 * 60 * 60 * 24))
                    });
                } catch (error) {
                    console.error(`Error reading file ${file}:`, error.message);
                }
            }
        }
        
        return recentFiles
            .sort((a, b) => b.modified - a.modified)
            .slice(0, limit);
    }
    
    /**
     * 최근 생성된 노트 목록
     * @param {number} days - 최근 n일 (기본값: 7)
     * @param {number} limit - 최대 결과 수 (기본값: 20)
     * @returns {Promise<Array>} 최근 생성된 노트 목록
     */
    async getRecentlyCreatedNotes(days = 7, limit = 20) {
        const files = await glob(join(this.basePath, '**/*.md'));
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const recentFiles = [];
        
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            let stats;
            try {
                stats = await fs.stat(file);
            } catch (e) {
                continue;
            }
            
            if (stats.birthtime >= cutoffDate) {
                try {
                    const content = await fs.readFile(file, 'utf8');
                    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
                    
                    recentFiles.push({
                        file: relativePath,
                        created: stats.birthtime,
                        modified: stats.mtime,
                        size: stats.size,
                        words: wordCount,
                        daysAgo: Math.floor((new Date() - stats.birthtime) / (1000 * 60 * 60 * 24))
                    });
                } catch (error) {
                    console.error(`Error reading file ${file}:`, error.message);
                }
            }
        }
        
        return recentFiles
            .sort((a, b) => b.created - a.created)
            .slice(0, limit);
    }
    
    /**
     * 활동 요약 (최근 n일)
     * @param {number} days - 최근 n일 (기본값: 30)
     * @returns {Promise<Object>} 활동 요약
     */
    async getActivitySummary(days = 30) {
        const files = await glob(join(this.basePath, '**/*.md'));
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const activity = {
            period: `${days}일`,
            totalFiles: files.length,
            createdInPeriod: 0,
            modifiedInPeriod: 0,
            totalWordsAdded: 0,
            dailyActivity: {},
            topActiveFiles: []
        };
        
        const fileActivity = [];
        
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            let stats;
            try {
                stats = await fs.stat(file);
            } catch (e) {
                continue;
            }
            
            let isCreated = false;
            let isModified = false;
            
            if (stats.birthtime >= cutoffDate) {
                activity.createdInPeriod++;
                isCreated = true;
            }
            
            if (stats.mtime >= cutoffDate) {
                activity.modifiedInPeriod++;
                isModified = true;
            }
            
            if (isCreated || isModified) {
                try {
                    const content = await fs.readFile(file, 'utf8');
                    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
                    
                    fileActivity.push({
                        file: relativePath,
                        created: stats.birthtime,
                        modified: stats.mtime,
                        words: wordCount,
                        activity: isCreated ? 'created' : 'modified'
                    });
                    
                    // 일별 활동 계산
                    const dateKey = stats.mtime.toISOString().split('T')[0];
                    if (!activity.dailyActivity[dateKey]) {
                        activity.dailyActivity[dateKey] = { created: 0, modified: 0 };
                    }
                    
                    if (isCreated) activity.dailyActivity[dateKey].created++;
                    if (isModified) activity.dailyActivity[dateKey].modified++;
                    
                } catch (error) {
                    console.error(`Error reading file ${file}:`, error.message);
                }
            }
        }
        
        // 상위 활동 파일
        activity.topActiveFiles = fileActivity
            .sort((a, b) => b.modified - a.modified)
            .slice(0, 10)
            .map(f => ({
                file: f.file,
                lastModified: f.modified,
                words: f.words,
                activity: f.activity
            }));
        
        return activity;
    }
    
    // 유틸리티 메서드
    getFullPath(filePath) {
        return resolve(this.basePath, filePath);
    }

    /**
     * 노트 리네이밍 및 링크 자동 업데이트
     * @param {string} oldPath - 기존 파일 경로
     * @param {string} newPath - 새로운 파일 경로
     * @param {boolean} dryRun - 실제 변경하지 않고 미리보기만 (기본값: false)
     * @returns {Promise<Object>} 리네이밍 결과
     */
    async renameNote(oldPath, newPath, dryRun = false) {
        const oldFullPath = this.getFullPath(oldPath);
        const newFullPath = this.getFullPath(newPath);
        const oldFileName = basename(oldPath, extname(oldPath));
        const newFileName = basename(newPath, extname(newPath));
        
        const results = {
            success: false,
            oldPath,
            newPath,
            oldFileName,
            newFileName,
            filesToUpdate: [],
            errors: []
        };
        
        try {
            // 1. 파일 존재 확인
            if (!await this.markdownManager.fileExists(oldPath)) {
                throw new Error(`Source file ${oldPath} does not exist`);
            }
            
            // 2. 대상 파일이 이미 존재하는지 확인
            if (await this.markdownManager.fileExists(newPath)) {
                throw new Error(`Target file ${newPath} already exists`);
            }
            
            // 3. 링크를 업데이트해야 할 파일들 찾기
            const filesToUpdate = await this.findFilesWithLink(oldFileName);
            results.filesToUpdate = filesToUpdate;
            
            if (!dryRun) {
                // 4. 파일 이동
                await fs.rename(oldFullPath, newFullPath);
                
                // 5. 모든 관련 파일의 링크 업데이트
                for (const file of filesToUpdate) {
                    try {
                        const content = await fs.readFile(this.getFullPath(file), 'utf8');
                        let updatedContent = content;
                        
                        // 다양한 링크 패턴 업데이트
                        const patterns = [
                            // [[oldFileName]] -> [[newFileName]]
                            new RegExp(`\\[\\[${oldFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g'),
                            // [[oldFileName|alias]] -> [[newFileName|alias]]
                            new RegExp(`\\[\\[${oldFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\|([^\\]]+)\\]\\]`, 'g'),
                            // ![[oldFileName]] -> ![[newFileName]]
                            new RegExp(`!\\[\\[${oldFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g')
                        ];
                        
                        patterns.forEach((pattern, index) => {
                            if (index === 1) {
                                // 별칭이 있는 경우
                                updatedContent = updatedContent.replace(pattern, `[[${newFileName}|$1]]`);
                            } else {
                                updatedContent = updatedContent.replace(pattern, `[[${newFileName}]]`);
                            }
                        });
                        
                        if (updatedContent !== content) {
                            await fs.writeFile(this.getFullPath(file), updatedContent, 'utf8');
                        }
                    } catch (error) {
                        results.errors.push({
                            file,
                            error: error.message
                        });
                    }
                }
            }
            
            results.success = true;
            
        } catch (error) {
            results.errors.push({
                operation: 'rename',
                error: error.message
            });
        }
        
        return results;
    }
    
    /**
     * 특정 파일명을 참조하는 모든 파일 찾기
     * @param {string} fileName - 검색할 파일명
     * @returns {Promise<Array>} 참조하는 파일 목록
     */
    async findFilesWithLink(fileName) {
        const files = await glob(join(this.basePath, '**/*.md'));
        const referencingFiles = [];
        
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            try {
                const content = await fs.readFile(file, 'utf8');
                
                // 다양한 링크 패턴 검색
                const patterns = [
                    new RegExp(`\\[\\[${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g'),
                    new RegExp(`\\[\\[${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\|([^\\]]+)\\]\\]`, 'g'),
                    new RegExp(`!\\[\\[${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g')
                ];
                
                for (const pattern of patterns) {
                    if (pattern.test(content)) {
                        referencingFiles.push(relativePath);
                        break;
                    }
                }
            } catch (error) {
                console.error(`Error reading file ${file}:`, error.message);
            }
        }
        
        return referencingFiles;
    }
    
    /**
     * 노트 이동 (폴더 변경)
     * @param {string} oldPath - 기존 파일 경로
     * @param {string} newFolder - 새로운 폴더 경로
     * @param {boolean} dryRun - 실제 변경하지 않고 미리보기만 (기본값: false)
     * @returns {Promise<Object>} 이동 결과
     */
    async moveNote(oldPath, newFolder, dryRun = false) {
        const fileName = basename(oldPath);
        const newPath = newFolder ? `${newFolder}/${fileName}` : fileName;
        
        return await this.renameNote(oldPath, newPath, dryRun);
    }
    
    /**
     * 링크 무결성 검사
     * @param {string} filePath - 검사할 파일 경로 (선택사항, 없으면 전체 검사)
     * @returns {Promise<Object>} 링크 무결성 검사 결과
     */
    async checkLinkIntegrity(filePath = null) {
        const files = filePath ? [filePath] : await glob(join(this.basePath, '**/*.md'));
        const results = {
            totalFiles: files.length,
            brokenLinks: [],
            orphanedFiles: [],
            summary: {
                totalLinks: 0,
                brokenLinks: 0,
                orphanedFiles: 0
            }
        };
        
        const allReferencedFiles = new Set();
        
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            try {
                const links = await this.extractLinks(relativePath);
                
                // 내부 링크 검사
                for (const link of links.internal) {
                    results.summary.totalLinks++;
                    allReferencedFiles.add(link.link);
                    
                    const targetFile = `${link.link}.md`;
                    if (!await this.markdownManager.fileExists(targetFile)) {
                        results.brokenLinks.push({
                            source: relativePath,
                            target: link.link,
                            line: link.line,
                            context: link.context
                        });
                        results.summary.brokenLinks++;
                    }
                }
            } catch (error) {
                console.error(`Error reading file ${file}:`, error.message);
            }
        }
        
        // 고아 파일 검사 (참조되지 않는 파일)
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            const fileName = basename(relativePath, extname(relativePath));
            
            if (!allReferencedFiles.has(fileName)) {
                results.orphanedFiles.push(relativePath);
                results.summary.orphanedFiles++;
            }
        }
        
        return results;
    }
    
    /**
     * 노트 아웃라인 추출
     * @param {string} filePath - 파일 경로
     * @param {number} maxDepth - 최대 깊이 (기본값: 6)
     * @returns {Promise<Array>} 아웃라인 구조
     */
    async extractOutline(filePath, maxDepth = 6) {
        const content = await fs.readFile(this.getFullPath(filePath), 'utf8');
        const lines = content.split('\n');
        const outline = [];
        const stack = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            
            if (match) {
                const level = match[1].length;
                const title = match[2].trim();
                
                if (level <= maxDepth) {
                    const item = {
                        level,
                        title,
                        line: i + 1,
                        children: [],
                        id: this.generateHeadingId(title)
                    };
                    
                    // 스택에서 적절한 부모 찾기
                    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                        stack.pop();
                    }
                    
                    if (stack.length === 0) {
                        outline.push(item);
                    } else {
                        stack[stack.length - 1].children.push(item);
                    }
                    
                    stack.push(item);
                }
            }
        }
        
        return outline;
    }
    
    /**
     * 아웃라인을 마크다운으로 변환
     * @param {Array} outline - 아웃라인 구조
     * @param {boolean} includeLineNumbers - 줄 번호 포함 여부 (기본값: false)
     * @returns {string} 마크다운 형식의 아웃라인
     */
    outlineToMarkdown(outline, includeLineNumbers = false) {
        const result = [];
        
        const processItem = (item, depth = 0) => {
            const indent = '  '.repeat(depth);
            const prefix = includeLineNumbers ? `[${item.line}] ` : '';
            result.push(`${indent}- ${prefix}${item.title}`);
            
            for (const child of item.children) {
                processItem(child, depth + 1);
            }
        };
        
        for (const item of outline) {
            processItem(item);
        }
        
        return result.join('\n');
    }
    
    /**
     * 아웃라인을 JSON으로 변환
     * @param {Array} outline - 아웃라인 구조
     * @returns {string} JSON 형식의 아웃라인
     */
    outlineToJson(outline) {
        return JSON.stringify(outline, null, 2);
    }
    
    /**
     * 제목에서 ID 생성 (Obsidian 스타일)
     * @param {string} title - 제목
     * @returns {string} ID
     */
    generateHeadingId(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // 특수문자 제거
            .replace(/\s+/g, '-') // 공백을 하이픈으로
            .replace(/-+/g, '-') // 연속된 하이픈을 하나로
            .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
    }
    
    /**
     * Zettelkasten ID 생성
     * @param {string} prefix - ID 접두사 (선택사항)
     * @returns {string} Zettelkasten ID
     */
    generateZettelId(prefix = '') {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const id = `${timestamp}${random.toString().padStart(3, '0')}`;
        return prefix ? `${prefix}-${id}` : id;
    }
    
    /**
     * 파일에 Zettelkasten ID 추가
     * @param {string} filePath - 파일 경로
     * @param {string} id - Zettelkasten ID (자동 생성 시 null)
     * @param {boolean} updateFrontmatter - Frontmatter에 추가 여부 (기본값: true)
     * @returns {Promise<Object>} ID 추가 결과
     */
    async addZettelId(filePath, id = null, updateFrontmatter = true) {
        const zettelId = id || this.generateZettelId();
        const results = {
            file: filePath,
            id: zettelId,
            success: false,
            changes: []
        };
        
        try {
            const content = await fs.readFile(this.getFullPath(filePath), 'utf8');
            const { data: frontmatter, content: markdownContent } = matter(content);
            
            let updated = false;
            
            if (updateFrontmatter) {
                // Frontmatter에 ID 추가
                if (!frontmatter.id) {
                    frontmatter.id = zettelId;
                    const updatedContent = matter.stringify(markdownContent, frontmatter);
                    await fs.writeFile(this.getFullPath(filePath), updatedContent, 'utf8');
                    updated = true;
                    results.changes.push('frontmatter_id_added');
                }
            }
            
            // 파일명에서 ID 추가 (파일명에 ID가 없는 경우)
            const fileName = basename(filePath, extname(filePath));
            if (!fileName.match(/^\d{13,16}/)) { // 13-16자리 숫자로 시작하지 않는 경우
                const newFileName = `${zettelId}-${fileName}`;
                const newPath = filePath.replace(fileName, newFileName);
                
                await fs.rename(this.getFullPath(filePath), this.getFullPath(newPath));
                results.file = newPath;
                results.changes.push('filename_updated');
                updated = true;
            }
            
            if (updated) {
                results.success = true;
            }
            
        } catch (error) {
            results.error = error.message;
        }
        
        return results;
    }
    
    /**
     * Zettelkasten ID로 파일 검색
     * @param {string} id - Zettelkasten ID
     * @returns {Promise<Array>} 검색 결과
     */
    async findFileByZettelId(id) {
        const files = await glob(join(this.basePath, '**/*.md'));
        const results = [];
        
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            const fileName = basename(relativePath, extname(relativePath));
            
            try {
                const content = await fs.readFile(file, 'utf8');
                const { data: frontmatter } = matter(content);
                
                // 파일명에서 ID 검색
                if (fileName.startsWith(id) || fileName.includes(`-${id}-`)) {
                    results.push({
                        file: relativePath,
                        matchType: 'filename',
                        id: id
                    });
                }
                
                // Frontmatter에서 ID 검색
                if (frontmatter.id === id) {
                    results.push({
                        file: relativePath,
                        matchType: 'frontmatter',
                        id: id
                    });
                }
                
            } catch (error) {
                console.error(`Error reading file ${file}:`, error.message);
            }
        }
        
        return results;
    }
    
    /**
     * 모든 Zettelkasten ID 목록
     * @returns {Promise<Array>} ID 목록
     */
    async listAllZettelIds() {
        const files = await glob(join(this.basePath, '**/*.md'));
        const ids = [];
        
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            const fileName = basename(relativePath, extname(relativePath));
            
            try {
                const content = await fs.readFile(file, 'utf8');
                const { data: frontmatter } = matter(content);
                
                // 파일명에서 ID 추출
                const filenameMatch = fileName.match(/^(\d{13,16})/);
                if (filenameMatch) {
                    ids.push({
                        file: relativePath,
                        id: filenameMatch[1],
                        source: 'filename'
                    });
                }
                
                // Frontmatter에서 ID 추출
                if (frontmatter.id) {
                    ids.push({
                        file: relativePath,
                        id: frontmatter.id,
                        source: 'frontmatter'
                    });
                }
                
            } catch (error) {
                console.error(`Error reading file ${file}:`, error.message);
            }
        }
        
        return ids;
    }
    
    /**
     * Zettelkasten ID 일괄 추가
     * @param {Array} filters - 검색 필터 조건
     * @param {boolean} updateFrontmatter - Frontmatter 업데이트 여부
     * @param {boolean} updateFilename - 파일명 업데이트 여부
     * @returns {Promise<Object>} 일괄 추가 결과
     */
    async batchAddZettelIds(filters = [], updateFrontmatter = true, _updateFilename = true) {
        const files = filters.length > 0 ? 
            await this.searchByFrontmatter(filters) : 
            await glob(join(this.basePath, '**/*.md')).then(files => 
                files.map(f => ({ file: f.replace(this.basePath, '').replace(/^\//, '') }))
            );
        
        const results = {
            total: files.length,
            updated: 0,
            errors: [],
            details: []
        };
        
        for (const file of files) {
            const filePath = file.file || file;
            try {
                const result = await this.addZettelId(filePath, null, updateFrontmatter);
                if (result.success) {
                    results.updated++;
                }
                results.details.push(result);
            } catch (error) {
                results.errors.push({
                    file: filePath,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    /**
     * 섹션별로 노트 분할
     * @param {string} filePath - 파일 경로
     * @param {string} outputDir - 출력 디렉토리 (선택사항)
     * @returns {Promise<Object>} 분할 결과
     */
    async splitNoteBySections(filePath, outputDir = null) {
        const content = await fs.readFile(this.getFullPath(filePath), 'utf8');
        const lines = content.split('\n');
        const sections = [];
        let currentSection = {
            title: 'Introduction',
            level: 0,
            content: [],
            startLine: 1
        };
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            
            if (match && i > 0) {
                // 이전 섹션 저장
                currentSection.endLine = i;
                currentSection.content = lines.slice(currentSection.startLine - 1, i);
                sections.push(currentSection);
                
                // 새 섹션 시작
                currentSection = {
                    title: match[2].trim(),
                    level: match[1].length,
                    content: [],
                    startLine: i + 1
                };
            }
        }
        
        // 마지막 섹션 처리
        currentSection.endLine = lines.length;
        currentSection.content = lines.slice(currentSection.startLine - 1);
        sections.push(currentSection);
        
        const results = {
            originalFile: filePath,
            sections: sections.length,
            files: []
        };
        
        // outputDir이 있으면 디렉토리 생성
        if (outputDir) {
            await fs.mkdir(this.getFullPath(outputDir), { recursive: true });
        }
        
        // 각 섹션을 별도 파일로 저장
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const fileName = `${this.generateHeadingId(section.title)}.md`;
            const targetPath = outputDir ? `${outputDir}/${fileName}` : fileName;
            
            const sectionContent = section.content.join('\n');
            
            try {
                await fs.writeFile(this.getFullPath(targetPath), sectionContent, 'utf8');
                results.files.push({
                    title: section.title,
                    file: targetPath,
                    lines: section.content.length,
                    level: section.level
                });
            } catch (error) {
                console.error(`Error creating section file ${targetPath}:`, error.message);
            }
        }
        
        return results;
    }
    
    /**
     * TODO 작업 추출
     * @param {string} filePath - 파일 경로 (선택사항, 없으면 전체 검색)
     * @param {string} status - 상태 필터 ('all', 'pending', 'completed')
     * @returns {Promise<Array>} TODO 작업 목록
     */
    async extractTodos(filePath = null, status = 'all') {
        const files = filePath ? [filePath] : await glob(join(this.basePath, '**/*.md'));
        const todos = [];
        
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            try {
                const content = await fs.readFile(file, 'utf8');
                const lines = content.split('\n');
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const todoMatch = line.match(/^(\s*)- \[([ xX])\] (.+)$/);
                    
                    if (todoMatch) {
                        const [, indent, checkbox, task] = todoMatch;
                        const isCompleted = checkbox.toLowerCase() === 'x';
                        
                        if (status === 'all' || 
                            (status === 'pending' && !isCompleted) || 
                            (status === 'completed' && isCompleted)) {
                            
                            todos.push({
                                file: relativePath,
                                line: i + 1,
                                indent: indent.length,
                                completed: isCompleted,
                                task: task.trim(),
                                context: this.getTaskContext(lines, i)
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Error reading file ${file}:`, error.message);
            }
        }
        
        return todos;
    }
    
    /**
     * 작업 컨텍스트 추출
     * @param {Array} lines - 파일의 모든 줄
     * @param {number} lineIndex - 작업이 있는 줄 인덱스
     * @returns {string} 컨텍스트
     */
    getTaskContext(lines, lineIndex) {
        const context = [];
        const start = Math.max(0, lineIndex - 2);
        const end = Math.min(lines.length, lineIndex + 3);
        
        for (let i = start; i < end; i++) {
            if (i === lineIndex) {
                context.push(`> ${lines[i]}`);
            } else {
                context.push(lines[i]);
            }
        }
        
        return context.join('\n');
    }
    
    /**
     * TODO 작업 통계
     * @returns {Promise<Object>} TODO 통계
     */
    async getTodoStats() {
        const todos = await this.extractTodos();
        const stats = {
            total: todos.length,
            completed: todos.filter(t => t.completed).length,
            pending: todos.filter(t => !t.completed).length,
            completionRate: 0,
            byFile: {},
            byPriority: {},
            recentActivity: []
        };
        
        if (stats.total > 0) {
            stats.completionRate = Math.round((stats.completed / stats.total) * 100);
        }
        
        // 파일별 통계
        todos.forEach(todo => {
            if (!stats.byFile[todo.file]) {
                stats.byFile[todo.file] = { total: 0, completed: 0, pending: 0 };
            }
            stats.byFile[todo.file].total++;
            if (todo.completed) {
                stats.byFile[todo.file].completed++;
            } else {
                stats.byFile[todo.file].pending++;
            }
        });
        
        // 우선순위별 통계 (우선순위 태그 추출)
        todos.forEach(todo => {
            const priorityMatch = todo.task.match(/#(high|medium|low|urgent|important)/i);
            const priority = priorityMatch ? priorityMatch[1].toLowerCase() : 'normal';
            
            if (!stats.byPriority[priority]) {
                stats.byPriority[priority] = { total: 0, completed: 0, pending: 0 };
            }
            stats.byPriority[priority].total++;
            if (todo.completed) {
                stats.byPriority[priority].completed++;
            } else {
                stats.byPriority[priority].pending++;
            }
        });
        
        return stats;
    }
    
    /**
     * TODO 작업 완료/미완료 토글
     * @param {string} filePath - 파일 경로
     * @param {number} lineNumber - 줄 번호
     * @returns {Promise<Object>} 토글 결과
     */
    async toggleTodo(filePath, lineNumber) {
        const results = {
            success: false,
            file: filePath,
            line: lineNumber,
            previousState: null,
            newState: null
        };
        
        try {
            const content = await fs.readFile(this.getFullPath(filePath), 'utf8');
            const lines = content.split('\n');
            
            if (lineNumber > 0 && lineNumber <= lines.length) {
                const line = lines[lineNumber - 1];
                const todoMatch = line.match(/^(\s*)- \[([ xX])\] (.+)$/);
                
                if (todoMatch) {
                    const [, indent, checkbox, task] = todoMatch;
                    const isCompleted = checkbox.toLowerCase() === 'x';
                    
                    results.previousState = isCompleted;
                    results.newState = !isCompleted;
                    
                    // 체크박스 토글
                    const newCheckbox = isCompleted ? ' ' : 'x';
                    lines[lineNumber - 1] = `${indent}- [${newCheckbox}] ${task}`;
                    
                    // 파일 업데이트
                    await fs.writeFile(this.getFullPath(filePath), lines.join('\n'), 'utf8');
                    results.success = true;
                }
            }
        } catch (error) {
            results.error = error.message;
        }
        
        return results;
    }
    
    /**
     * TODO 작업 추가
     * @param {string} filePath - 파일 경로
     * @param {string} task - 작업 내용
     * @param {number} lineNumber - 삽입할 줄 번호 (선택사항)
     * @returns {Promise<Object>} 추가 결과
     */
    async addTodo(filePath, task, lineNumber = null) {
        const results = {
            success: false,
            file: filePath,
            task,
            line: null
        };
        
        try {
            const content = await fs.readFile(this.getFullPath(filePath), 'utf8');
            const lines = content.split('\n');
            
            const todoLine = `- [ ] ${task}`;
            
            if (lineNumber && lineNumber > 0 && lineNumber <= lines.length) {
                lines.splice(lineNumber - 1, 0, todoLine);
                results.line = lineNumber;
            } else {
                lines.push(todoLine);
                results.line = lines.length;
            }
            
            await fs.writeFile(this.getFullPath(filePath), lines.join('\n'), 'utf8');
            results.success = true;
            
        } catch (error) {
            results.error = error.message;
        }
        
        return results;
    }
    
    /**
     * TODO 작업 검색
     * @param {string} query - 검색 쿼리
     * @param {string} status - 상태 필터
     * @param {string} priority - 우선순위 필터
     * @returns {Promise<Array>} 검색 결과
     */
    async searchTodos(query, status = 'all', priority = null) {
        const todos = await this.extractTodos(null, status);
        
        return todos.filter(todo => {
            let matches = true;
            
            // 텍스트 검색
            if (query && !todo.task.toLowerCase().includes(query.toLowerCase())) {
                matches = false;
            }
            
            // 우선순위 필터
            if (priority) {
                const taskPriority = todo.task.match(/#(high|medium|low|urgent|important)/i);
                const taskPriorityValue = taskPriority ? taskPriority[1].toLowerCase() : 'normal';
                if (taskPriorityValue !== priority.toLowerCase()) {
                    matches = false;
                }
            }
            
            return matches;
        });
    }
    
    /**
     * 노트 유사도 계산
     * @param {string} filePath1 - 첫 번째 파일 경로
     * @param {string} filePath2 - 두 번째 파일 경로
     * @returns {Promise<Object>} 유사도 정보
     */
    async calculateSimilarity(filePath1, filePath2) {
        try {
            const content1 = await fs.readFile(this.getFullPath(filePath1), 'utf8');
            const content2 = await fs.readFile(this.getFullPath(filePath2), 'utf8');
            
            const { data: frontmatter1 } = matter(content1);
            const { data: frontmatter2 } = matter(content2);
            
            // 텍스트 유사도 계산
            const textSimilarity = this.calculateTextSimilarity(content1, content2);
            
            // 태그 유사도 계산
            const links1 = await this.extractLinks(filePath1);
            const links2 = await this.extractLinks(filePath2);
            const tagSimilarity = this.calculateTagSimilarity(links1.tags, links2.tags);
            
            // Frontmatter 유사도 계산
            const frontmatterSimilarity = this.calculateFrontmatterSimilarity(frontmatter1, frontmatter2);
            
            // 링크 유사도 계산
            const linkSimilarity = this.calculateLinkSimilarity(links1.internal, links2.internal);
            
            // 종합 유사도 점수
            const overallSimilarity = (
                textSimilarity * 0.4 +
                tagSimilarity * 0.3 +
                frontmatterSimilarity * 0.2 +
                linkSimilarity * 0.1
            );
            
            return {
                file1: filePath1,
                file2: filePath2,
                overall: Math.round(overallSimilarity * 100) / 100,
                text: Math.round(textSimilarity * 100) / 100,
                tags: Math.round(tagSimilarity * 100) / 100,
                frontmatter: Math.round(frontmatterSimilarity * 100) / 100,
                links: Math.round(linkSimilarity * 100) / 100,
                details: {
                    commonTags: this.findCommonTags(links1.tags, links2.tags),
                    commonLinks: this.findCommonLinks(links1.internal, links2.internal),
                    commonFrontmatter: this.findCommonFrontmatter(frontmatter1, frontmatter2)
                }
            };
        } catch (error) {
            throw new Error(`Error calculating similarity: ${error.message}`);
        }
    }
    
    /**
     * 텍스트 유사도 계산 (Jaccard 유사도)
     * @param {string} text1 - 첫 번째 텍스트
     * @param {string} text2 - 두 번째 텍스트
     * @returns {number} 유사도 점수 (0-1)
     */
    calculateTextSimilarity(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
        const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    
    /**
     * 태그 유사도 계산
     * @param {Array} tags1 - 첫 번째 태그 목록
     * @param {Array} tags2 - 두 번째 태그 목록
     * @returns {number} 유사도 점수 (0-1)
     */
    calculateTagSimilarity(tags1, tags2) {
        const tagSet1 = new Set(tags1.map(t => t.tag));
        const tagSet2 = new Set(tags2.map(t => t.tag));
        
        const intersection = new Set([...tagSet1].filter(x => tagSet2.has(x)));
        const union = new Set([...tagSet1, ...tagSet2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    
    /**
     * Frontmatter 유사도 계산
     * @param {Object} frontmatter1 - 첫 번째 Frontmatter
     * @param {Object} frontmatter2 - 두 번째 Frontmatter
     * @returns {number} 유사도 점수 (0-1)
     */
    calculateFrontmatterSimilarity(frontmatter1, frontmatter2) {
        const keys1 = new Set(Object.keys(frontmatter1));
        const keys2 = new Set(Object.keys(frontmatter2));
        
        const intersection = new Set([...keys1].filter(x => keys2.has(x)));
        const union = new Set([...keys1, ...keys2]);
        
        if (union.size === 0) return 0;
        
        let valueSimilarity = 0;
        let commonKeys = 0;
        
        for (const key of intersection) {
            if (frontmatter1[key] === frontmatter2[key]) {
                valueSimilarity += 1;
            }
            commonKeys++;
        }
        
        const keySimilarity = intersection.size / union.size;
        const valueSimilarityScore = commonKeys > 0 ? valueSimilarity / commonKeys : 0;
        
        return (keySimilarity + valueSimilarityScore) / 2;
    }
    
    /**
     * 링크 유사도 계산
     * @param {Array} links1 - 첫 번째 링크 목록
     * @param {Array} links2 - 두 번째 링크 목록
     * @returns {number} 유사도 점수 (0-1)
     */
    calculateLinkSimilarity(links1, links2) {
        const linkSet1 = new Set(links1.map(l => l.link));
        const linkSet2 = new Set(links2.map(l => l.link));
        
        const intersection = new Set([...linkSet1].filter(x => linkSet2.has(x)));
        const union = new Set([...linkSet1, ...linkSet2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    
    /**
     * 공통 태그 찾기
     * @param {Array} tags1 - 첫 번째 태그 목록
     * @param {Array} tags2 - 두 번째 태그 목록
     * @returns {Array} 공통 태그 목록
     */
    findCommonTags(tags1, tags2) {
        const tagSet1 = new Set(tags1.map(t => t.tag));
        const tagSet2 = new Set(tags2.map(t => t.tag));
        
        return [...tagSet1].filter(x => tagSet2.has(x));
    }
    
    /**
     * 공통 링크 찾기
     * @param {Array} links1 - 첫 번째 링크 목록
     * @param {Array} links2 - 두 번째 링크 목록
     * @returns {Array} 공통 링크 목록
     */
    findCommonLinks(links1, links2) {
        const linkSet1 = new Set(links1.map(l => l.link));
        const linkSet2 = new Set(links2.map(l => l.link));
        
        return [...linkSet1].filter(x => linkSet2.has(x));
    }
    
    /**
     * 공통 Frontmatter 필드 찾기
     * @param {Object} frontmatter1 - 첫 번째 Frontmatter
     * @param {Object} frontmatter2 - 두 번째 Frontmatter
     * @returns {Array} 공통 필드 목록
     */
    findCommonFrontmatter(frontmatter1, frontmatter2) {
        const keys1 = new Set(Object.keys(frontmatter1));
        const keys2 = new Set(Object.keys(frontmatter2));
        
        return [...keys1].filter(x => keys2.has(x) && frontmatter1[x] === frontmatter2[x]);
    }
    
    /**
     * 유사한 노트 추천
     * @param {string} filePath - 기준 파일 경로
     * @param {number} limit - 추천 개수 (기본값: 5)
     * @param {number} minSimilarity - 최소 유사도 (기본값: 0.1)
     * @returns {Promise<Array>} 유사한 노트 목록
     */
    async findSimilarNotes(filePath, limit = 5, minSimilarity = 0.1) {
        const files = await glob(join(this.basePath, '**/*.md'));
        const similarities = [];
        
        for (const file of files) {
            const relativePath = file.replace(this.basePath, '').replace(/^\//, '');
            if (relativePath !== filePath) {
                try {
                    const similarity = await this.calculateSimilarity(filePath, relativePath);
                    if (similarity.overall >= minSimilarity) {
                        similarities.push(similarity);
                    }
                } catch (error) {
                    console.error(`Error calculating similarity for ${relativePath}:`, error.message);
                }
            }
        }
        
        return similarities
            .sort((a, b) => b.overall - a.overall)
            .slice(0, limit);
    }
    
    /**
     * 관련 노트 그룹 찾기
     * @param {string} filePath - 기준 파일 경로
     * @param {number} minSimilarity - 최소 유사도 (기본값: 0.3)
     * @returns {Promise<Object>} 관련 노트 그룹
     */
    async findRelatedNoteGroups(filePath, minSimilarity = 0.3) {
        const similarNotes = await this.findSimilarNotes(filePath, 20, minSimilarity);
        const groups = [];
        const processed = new Set();
        
        for (const note of similarNotes) {
            if (processed.has(note.file2)) continue;
            
            const group = [note.file2];
            processed.add(note.file2);
            
            // 이 노트와 유사한 다른 노트들 찾기
            for (const otherNote of similarNotes) {
                if (otherNote.file2 !== note.file2 && !processed.has(otherNote.file2)) {
                    try {
                        const similarity = await this.calculateSimilarity(note.file2, otherNote.file2);
                        if (similarity.overall >= minSimilarity) {
                            group.push(otherNote.file2);
                            processed.add(otherNote.file2);
                        }
                    } catch (error) {
                        console.error(`Error calculating group similarity:`, error.message);
                    }
                }
            }
            
            if (group.length > 1) {
                groups.push({
                    center: note.file2,
                    members: group,
                    averageSimilarity: note.overall
                });
            }
        }
        
        return {
            source: filePath,
            groups: groups.sort((a, b) => b.averageSimilarity - a.averageSimilarity)
        };
    }
} 