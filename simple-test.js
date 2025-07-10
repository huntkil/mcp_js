#!/usr/bin/env node

import { MarkdownManager } from './src/MarkdownManager.js';
import { ObsidianManager } from './src/ObsidianManager.js';
import { promises as fs } from 'fs';
import { join } from 'path';

class SimpleTest {
    constructor() {
        this.markdownManager = new MarkdownManager('.');
        this.obsidianManager = new ObsidianManager('.');
        this.testDir = 'test-output';
    }

    async setup() {
        console.log('🚀 간단한 로컬 테스트 시작...\n');
        
        // 테스트 디렉토리 생성
        try {
            await fs.mkdir(this.testDir, { recursive: true });
            console.log('✅ 테스트 디렉토리 생성됨');
        } catch (error) {
            console.log('⚠️ 테스트 디렉토리 이미 존재함');
        }
    }

    async testBasicOperations() {
        console.log('\n📝 기본 CRUD 작업 테스트...\n');

        const testFile = join(this.testDir, 'test-basic.md');
        const testContent = `# 기본 테스트 파일

이것은 기본 테스트 파일입니다.

## 섹션 1

내용이 여기에 있습니다.

## 섹션 2

다른 내용입니다.

#tag1 #tag2 #test`;

        // 1. 파일 생성
        console.log('1. 파일 생성 테스트');
        try {
            await this.markdownManager.createFile(testFile, testContent);
            console.log('✅ 파일 생성 성공');
        } catch (error) {
            console.log('❌ 파일 생성 실패:', error.message);
        }

        // 2. 파일 읽기
        console.log('\n2. 파일 읽기 테스트');
        try {
            const content = await this.markdownManager.readFile(testFile);
            console.log('✅ 파일 읽기 성공');
            console.log('   내용 미리보기:', content.substring(0, 100) + '...');
        } catch (error) {
            console.log('❌ 파일 읽기 실패:', error.message);
        }

        // 3. 파일 목록 조회
        console.log('\n3. 파일 목록 조회 테스트');
        try {
            const files = await this.markdownManager.listFiles(this.testDir);
            console.log('✅ 파일 목록 조회 성공:', files);
        } catch (error) {
            console.log('❌ 파일 목록 조회 실패:', error.message);
        }

        // 4. 검색 테스트
        console.log('\n4. 검색 테스트');
        try {
            const results = await this.markdownManager.searchContent(this.testDir, {
                query: '테스트'
            });
            console.log('✅ 검색 성공:', results.length, '개 결과');
            if (results.length > 0) {
                console.log('   첫 번째 결과:', results[0]);
            }
        } catch (error) {
            console.log('❌ 검색 실패:', error.message);
        }

        // 5. 파일 업데이트
        console.log('\n5. 파일 업데이트 테스트');
        try {
            await this.markdownManager.updateFile(testFile, '\n\n## 새로운 섹션\n\n업데이트된 내용입니다.\n\n#updated', true);
            console.log('✅ 파일 업데이트 성공');
        } catch (error) {
            console.log('❌ 파일 업데이트 실패:', error.message);
        }

        // 6. Frontmatter 관리
        console.log('\n6. Frontmatter 관리 테스트');
        try {
            await this.markdownManager.manageFrontmatter(testFile, 'set', {
                title: '테스트 파일',
                tags: ['test', 'markdown'],
                status: 'draft'
            });
            console.log('✅ Frontmatter 설정 성공');
        } catch (error) {
            console.log('❌ Frontmatter 설정 실패:', error.message);
        }

        // 7. Frontmatter 읽기
        console.log('\n7. Frontmatter 읽기 테스트');
        try {
            const frontmatter = await this.markdownManager.manageFrontmatter(testFile, 'get');
            console.log('✅ Frontmatter 읽기 성공:', frontmatter.metadata);
        } catch (error) {
            console.log('❌ Frontmatter 읽기 실패:', error.message);
        }
    }

    async testObsidianFeatures() {
        console.log('\n🔧 Obsidian 특화 기능 테스트...\n');

        const testFile = join(this.testDir, 'test-obsidian.md');
        const testContent = `# Obsidian 테스트 파일

이것은 Obsidian 기능을 테스트하는 파일입니다.

## 링크 테스트

- 내부 링크: [[another-file]]
- 외부 링크: [Google](https://google.com)
- 임베드: ![[image.png]]

## 태그 테스트

#project #important #obsidian

## TODO 테스트

- [ ] 첫 번째 할 일
- [x] 완료된 할 일
- [ ] 두 번째 할 일

## 섹션 1

내용이 여기에 있습니다.

## 섹션 2

다른 내용입니다.`;

        // 1. 테스트 파일 생성
        console.log('1. Obsidian 테스트 파일 생성');
        try {
            await this.markdownManager.createFile(testFile, testContent);
            console.log('✅ Obsidian 테스트 파일 생성 성공');
        } catch (error) {
            console.log('❌ Obsidian 테스트 파일 생성 실패:', error.message);
        }

        // 2. 링크 추출
        console.log('\n2. 링크 추출 테스트');
        try {
            const links = await this.obsidianManager.extractLinks(testFile);
            console.log('✅ 링크 추출 성공:');
            console.log('   내부 링크:', links.internal.length, '개');
            console.log('   외부 링크:', links.external.length, '개');
            console.log('   임베드:', links.embeds.length, '개');
            console.log('   태그:', links.tags.length, '개');
        } catch (error) {
            console.log('❌ 링크 추출 실패:', error.message);
        }

        // 3. 태그로 파일 검색
        console.log('\n3. 태그 검색 테스트');
        try {
            const tagResults = await this.obsidianManager.findFilesByTag('project');
            console.log('✅ 태그 검색 성공:', tagResults.length, '개 결과');
        } catch (error) {
            console.log('❌ 태그 검색 실패:', error.message);
        }

        // 4. 모든 태그 조회
        console.log('\n4. 모든 태그 조회 테스트');
        try {
            const allTags = await this.obsidianManager.getAllTags();
            console.log('✅ 모든 태그 조회 성공:', allTags);
        } catch (error) {
            console.log('❌ 모든 태그 조회 실패:', error.message);
        }

        // 5. 그래프 데이터 생성
        console.log('\n5. 그래프 데이터 생성 테스트');
        try {
            const graphData = await this.obsidianManager.generateGraphData();
            console.log('✅ 그래프 데이터 생성 성공:');
            console.log('   노드:', graphData.nodes.length, '개');
            console.log('   엣지:', graphData.edges.length, '개');
        } catch (error) {
            console.log('❌ 그래프 데이터 생성 실패:', error.message);
        }

        // 6. TODO 추출
        console.log('\n6. TODO 추출 테스트');
        try {
            const todos = await this.obsidianManager.extractTodos(testFile);
            console.log('✅ TODO 추출 성공:', todos.length, '개 TODO');
            todos.forEach(todo => {
                console.log(`   - ${todo.completed ? '[x]' : '[ ]'} ${todo.task} (${todo.file}:${todo.line})`);
            });
        } catch (error) {
            console.log('❌ TODO 추출 실패:', error.message);
        }

        // 7. Vault 통계
        console.log('\n7. Vault 통계 테스트');
        try {
            const stats = await this.obsidianManager.generateVaultStats();
            console.log('✅ Vault 통계 생성 성공:');
            console.log('   총 파일:', stats.totalFiles, '개');
            console.log('   총 단어:', stats.totalWords, '개');
            console.log('   총 링크:', stats.totalLinks, '개');
            console.log('   총 태그:', stats.totalTags, '개');
        } catch (error) {
            console.log('❌ Vault 통계 생성 실패:', error.message);
        }

        // 8. 아웃라인 추출
        console.log('\n8. 아웃라인 추출 테스트');
        try {
            const outline = await this.obsidianManager.extractOutline(testFile);
            console.log('✅ 아웃라인 추출 성공:', outline.length, '개 섹션');
            outline.forEach(item => {
                console.log(`   ${'  '.repeat(item.level)}${item.title} (라인 ${item.line})`);
            });
        } catch (error) {
            console.log('❌ 아웃라인 추출 실패:', error.message);
        }
    }

    async testAdvancedFeatures() {
        console.log('\n🚀 고급 기능 테스트...\n');

        // 1. 데일리 노트 생성
        console.log('1. 데일리 노트 생성 테스트');
        try {
            const dailyResult = await this.obsidianManager.createDailyNote('2024-01-15', '## 오늘의 할 일\n\n- [ ] \n\n## 메모\n\n', 'daily');
            console.log('✅ 데일리 노트 생성 성공:', dailyResult.filePath);
        } catch (error) {
            console.log('❌ 데일리 노트 생성 실패:', error.message);
        }

        // 2. 템플릿 관리
        console.log('\n2. 템플릿 관리 테스트');
        try {
            const templateResult = await this.obsidianManager.manageTemplate('create', 'meeting', '# 회의록\n\n## 참석자\n\n## 안건\n\n## 결정사항\n\n## 다음 액션 아이템\n\n');
            console.log('✅ 템플릿 생성 성공:', templateResult.templateName);
        } catch (error) {
            console.log('❌ 템플릿 생성 실패:', error.message);
        }

        // 3. Zettel ID 생성
        console.log('\n3. Zettel ID 생성 테스트');
        try {
            const zettelId = this.obsidianManager.generateZettelId('TEST');
            console.log('✅ Zettel ID 생성 성공:', zettelId);
        } catch (error) {
            console.log('❌ Zettel ID 생성 실패:', error.message);
        }

        // 4. 노트 유사성 계산
        console.log('\n4. 노트 유사성 계산 테스트');
        try {
            const testFile1 = join(this.testDir, 'similarity-test1.md');
            const testFile2 = join(this.testDir, 'similarity-test2.md');
            
            await this.markdownManager.createFile(testFile1, '# 파일 1\n\n이것은 첫 번째 파일입니다.\n\n#test #similarity');
            await this.markdownManager.createFile(testFile2, '# 파일 2\n\n이것은 두 번째 파일입니다.\n\n#test #similarity');
            
            const similarity = await this.obsidianManager.calculateSimilarity(testFile1, testFile2);
            console.log('✅ 노트 유사성 계산 성공:', similarity);
        } catch (error) {
            console.log('❌ 노트 유사성 계산 실패:', error.message);
        }
    }

    async cleanup() {
        console.log('\n🧹 정리 작업...\n');
        
        try {
            // 테스트 디렉토리 삭제
            await fs.rm(this.testDir, { recursive: true, force: true });
            console.log('✅ 테스트 디렉토리 정리 완료');
        } catch (error) {
            console.log('⚠️ 정리 중 오류:', error.message);
        }
    }

    async run() {
        try {
            await this.setup();
            await this.testBasicOperations();
            await this.testObsidianFeatures();
            await this.testAdvancedFeatures();
            console.log('\n🎉 모든 테스트 완료!');
        } catch (error) {
            console.error('❌ 테스트 중 오류 발생:', error);
        } finally {
            await this.cleanup();
        }
    }
}

// 테스트 실행
const simpleTest = new SimpleTest();
simpleTest.run(); 