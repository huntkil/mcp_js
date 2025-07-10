#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TestClient {
    constructor() {
        this.client = null;
        this.serverProcess = null;
    }

    async start() {
        console.log('🚀 Markdown MCP Server 테스트 클라이언트 시작...\n');

        // 서버 프로세스 시작
        this.serverProcess = spawn('node', ['src/index.js'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: __dirname
        });

        // 서버 로그 출력
        this.serverProcess.stderr.on('data', (data) => {
            console.log(`[서버] ${data.toString().trim()}`);
        });

        // 클라이언트 생성
        const transport = new StdioClientTransport(
            this.serverProcess.stdout,
            this.serverProcess.stdin
        );

        this.client = new Client({
            name: 'test-client',
            version: '1.0.0'
        }, {
            capabilities: {
                tools: {}
            }
        });

        await this.client.connect(transport);
        console.log('✅ 서버에 연결되었습니다.\n');
    }

    async testBasicOperations() {
        console.log('📝 기본 CRUD 작업 테스트...\n');

        // 1. 파일 생성
        console.log('1. 파일 생성 테스트');
        try {
            const createResult = await this.client.callTool('create_markdown', {
                file_path: 'test-file.md',
                content: '# 테스트 파일\n\n이것은 테스트 파일입니다.\n\n## 섹션 1\n\n내용이 여기에 있습니다.\n\n#tag1 #tag2'
            });
            console.log('✅ 파일 생성 성공:', createResult.content[0].text);
        } catch (error) {
            console.log('❌ 파일 생성 실패:', error.message);
        }

        // 2. 파일 읽기
        console.log('\n2. 파일 읽기 테스트');
        try {
            const readResult = await this.client.callTool('read_markdown', {
                file_path: 'test-file.md'
            });
            console.log('✅ 파일 읽기 성공:', readResult.content[0].text.substring(0, 100) + '...');
        } catch (error) {
            console.log('❌ 파일 읽기 실패:', error.message);
        }

        // 3. 파일 목록 조회
        console.log('\n3. 파일 목록 조회 테스트');
        try {
            const listResult = await this.client.callTool('list_markdown_files', {
                directory: '.',
                recursive: false
            });
            console.log('✅ 파일 목록 조회 성공:', listResult.content[0].text);
        } catch (error) {
            console.log('❌ 파일 목록 조회 실패:', error.message);
        }

        // 4. 검색 테스트
        console.log('\n4. 검색 테스트');
        try {
            const searchResult = await this.client.callTool('search_markdown', {
                directory: '.',
                query: '테스트'
            });
            console.log('✅ 검색 성공:', searchResult.content[0].text);
        } catch (error) {
            console.log('❌ 검색 실패:', error.message);
        }

        // 5. Obsidian 링크 추출
        console.log('\n5. Obsidian 링크 추출 테스트');
        try {
            const linksResult = await this.client.callTool('extract_obsidian_links', {
                file_path: 'test-file.md'
            });
            console.log('✅ 링크 추출 성공:', linksResult.content[0].text);
        } catch (error) {
            console.log('❌ 링크 추출 실패:', error.message);
        }

        // 6. 태그로 파일 검색
        console.log('\n6. 태그 검색 테스트');
        try {
            const tagResult = await this.client.callTool('find_files_by_tag', {
                tag: 'tag1'
            });
            console.log('✅ 태그 검색 성공:', tagResult.content[0].text);
        } catch (error) {
            console.log('❌ 태그 검색 실패:', error.message);
        }

        // 7. 그래프 데이터 생성
        console.log('\n7. 그래프 데이터 생성 테스트');
        try {
            const graphResult = await this.client.callTool('generate_graph_data', {});
            console.log('✅ 그래프 데이터 생성 성공:', graphResult.content[0].text.substring(0, 200) + '...');
        } catch (error) {
            console.log('❌ 그래프 데이터 생성 실패:', error.message);
        }

        // 8. Vault 통계
        console.log('\n8. Vault 통계 테스트');
        try {
            const statsResult = await this.client.callTool('generate_vault_stats', {});
            console.log('✅ Vault 통계 생성 성공:', statsResult.content[0].text.substring(0, 200) + '...');
        } catch (error) {
            console.log('❌ Vault 통계 생성 실패:', error.message);
        }

        // 9. 파일 업데이트
        console.log('\n9. 파일 업데이트 테스트');
        try {
            const updateResult = await this.client.callTool('update_markdown', {
                file_path: 'test-file.md',
                content: '# 업데이트된 테스트 파일\n\n이 파일은 업데이트되었습니다.\n\n## 새로운 섹션\n\n새로운 내용입니다.\n\n#updated #test',
                append: false
            });
            console.log('✅ 파일 업데이트 성공:', updateResult.content[0].text);
        } catch (error) {
            console.log('❌ 파일 업데이트 실패:', error.message);
        }

        // 10. 파일 삭제
        console.log('\n10. 파일 삭제 테스트');
        try {
            const deleteResult = await this.client.callTool('delete_markdown', {
                file_path: 'test-file.md'
            });
            console.log('✅ 파일 삭제 성공:', deleteResult.content[0].text);
        } catch (error) {
            console.log('❌ 파일 삭제 실패:', error.message);
        }
    }

    async testAdvancedFeatures() {
        console.log('\n🔧 고급 기능 테스트...\n');

        // 1. 데일리 노트 생성
        console.log('1. 데일리 노트 생성 테스트');
        try {
            const dailyResult = await this.client.callTool('create_daily_note', {
                date: '2024-01-15',
                template: '## 오늘의 할 일\n\n- [ ] \n\n## 메모\n\n',
                folder: 'daily'
            });
            console.log('✅ 데일리 노트 생성 성공:', dailyResult.content[0].text);
        } catch (error) {
            console.log('❌ 데일리 노트 생성 실패:', error.message);
        }

        // 2. 템플릿 관리
        console.log('\n2. 템플릿 관리 테스트');
        try {
            const templateResult = await this.client.callTool('manage_template', {
                action: 'create',
                template_name: 'meeting',
                content: '# 회의록\n\n## 참석자\n\n## 안건\n\n## 결정사항\n\n## 다음 액션 아이템\n\n'
            });
            console.log('✅ 템플릿 생성 성공:', templateResult.content[0].text);
        } catch (error) {
            console.log('❌ 템플릿 생성 실패:', error.message);
        }

        // 3. Frontmatter 검색
        console.log('\n3. Frontmatter 검색 테스트');
        try {
            const frontmatterResult = await this.client.callTool('search_by_frontmatter', {
                filters: [
                    { field: 'title', value: 'Test', operator: 'contains' }
                ]
            });
            console.log('✅ Frontmatter 검색 성공:', frontmatterResult.content[0].text);
        } catch (error) {
            console.log('❌ Frontmatter 검색 실패:', error.message);
        }

        // 4. TODO 추출
        console.log('\n4. TODO 추출 테스트');
        try {
            const todoResult = await this.client.callTool('extract_todos', {
                status: 'all'
            });
            console.log('✅ TODO 추출 성공:', todoResult.content[0].text);
        } catch (error) {
            console.log('❌ TODO 추출 실패:', error.message);
        }

        // 5. 노트 유사성
        console.log('\n5. 노트 유사성 테스트');
        try {
            const similarityResult = await this.client.callTool('find_similar_notes', {
                file_path: 'daily/2024-01-15.md',
                limit: 3
            });
            console.log('✅ 노트 유사성 검색 성공:', similarityResult.content[0].text);
        } catch (error) {
            console.log('❌ 노트 유사성 검색 실패:', error.message);
        }
    }

    async stop() {
        if (this.client) {
            await this.client.close();
        }
        if (this.serverProcess) {
            this.serverProcess.kill();
        }
        console.log('\n🛑 테스트 클라이언트 종료');
    }

    async run() {
        try {
            await this.start();
            await this.testBasicOperations();
            await this.testAdvancedFeatures();
        } catch (error) {
            console.error('❌ 테스트 중 오류 발생:', error);
        } finally {
            await this.stop();
        }
    }
}

// 테스트 실행
const testClient = new TestClient();
testClient.run(); 