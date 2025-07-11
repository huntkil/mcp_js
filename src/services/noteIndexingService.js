import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
import embeddingService from './embeddingService.js';
import vectorDatabase from './vectorDatabase.js';
import logger from '../utils/logger.js';

class NoteIndexingService {
  constructor() {
    this.indexedNotes = new Map(); // 메모리 캐시
    this.indexVersion = '1.0.0';
  }

  /**
   * 노트 인덱싱 초기화
   * @param {string} vaultPath - Obsidian Vault 경로
   */
  async initialize(vaultPath) {
    try {
      logger.info(`노트 인덱싱 서비스 초기화: ${vaultPath}`);
      
      // 벡터 데이터베이스 초기화
      await vectorDatabase.initialize();
      
      // 기존 인덱스 로드
      await this.loadIndexedNotes();
      
      logger.info('노트 인덱싱 서비스 초기화 완료');
    } catch (error) {
      logger.error(`노트 인덱싱 초기화 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 전체 Vault 인덱싱
   * @param {string} vaultPath - Obsidian Vault 경로
   * @param {Object} options - 인덱싱 옵션
   */
  async indexVault(vaultPath, options = {}) {
    const {
      forceReindex = false,
      batchSize = 100, // 50에서 100으로 증가
      includeAttachments = false,
      maxFileSize = 1024 * 1024 // 1MB
    } = options;

    try {
      logger.info(`[INDEX][START] Vault 인덱싱 시작: ${vaultPath}`);
      
      // Markdown 파일 찾기
      const markdownFiles = await this.findMarkdownFiles(vaultPath, includeAttachments);
      logger.info(`[INDEX][FILES] 발견된 Markdown 파일: ${markdownFiles.length}개`);
      
      // 인덱싱할 파일 필터링
      const filesToIndex = await this.filterFilesForIndexing(markdownFiles, forceReindex, maxFileSize);
      logger.info(`[INDEX][FILTER] 인덱싱할 파일: ${filesToIndex.length}개`);
      
      if (filesToIndex.length === 0) {
        logger.info('[INDEX][EMPTY] 인덱싱할 파일이 없습니다.');
        return { indexed: 0, skipped: 0, errors: 0 };
      }
      
      // 배치 처리
      logger.info(`[INDEX][BATCH] 배치 처리 시작: ${filesToIndex.length}개 파일`);
      const results = await this.processBatch(filesToIndex, batchSize, { forceReindex });
      
      // 인덱스 상태 저장
      await this.saveIndexedNotes();
      
      logger.info(`[INDEX][COMPLETE] Vault 인덱싱 완료: ${results.indexed}개 인덱싱, ${results.skipped}개 스킵, ${results.errors}개 오류`);
      
      return results;
    } catch (error) {
      logger.error(`[INDEX][ERROR] Vault 인덱싱 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 단일 노트 인덱싱
   * @param {string} filePath - 노트 파일 경로
   * @param {Object} options - 인덱싱 옵션
   */
  async indexNote(filePath, options = {}) {
    const {
      forceReindex = false
      // includeMetadata = true // Unused variable removed
    } = options;

    try {
      logger.info(`노트 인덱싱 시작: ${filePath}`);
      
      // 파일 존재 확인
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new Error('파일이 아닙니다.');
      }
      
      // 파일 해시 계산
      const fileHash = await this.calculateFileHash(filePath);
      
      // 이미 인덱싱되었는지 확인
      if (!forceReindex && this.isAlreadyIndexed(filePath, fileHash)) {
        logger.info(`[INDEX][SKIP] 이미 인덱싱됨: ${filePath}`);
        return { indexed: false, reason: 'already_indexed' };
      }
      
      // 노트 내용 읽기 및 파싱
      const noteContent = await this.parseNote(filePath);
      
      // 텍스트 청킹
      const chunks = this.createChunks(noteContent);
      
      // 청크별 임베딩 생성
      const embeddings = await this.generateEmbeddings(chunks);
      
      // 벡터 데이터베이스에 저장
      await this.storeVectors(filePath, embeddings, chunks, noteContent.metadata);
      
      // 인덱스 상태 업데이트
      this.updateIndexStatus(filePath, fileHash, noteContent.metadata, noteContent.content);
      
      logger.info(`[INDEX][SUCCESS] 노트 인덱싱 완료: ${filePath} (${chunks.length}개 청크)`);
      
      return { 
        indexed: true, 
        chunks: chunks.length, 
        metadata: noteContent.metadata 
      };
    } catch (error) {
      logger.error(`[INDEX][FAIL] 노트 인덱싱 실패: ${filePath} - ${error.message}`);
      throw error;
    }
  }

  /**
   * Markdown 파일 찾기
   * @param {string} vaultPath - Vault 경로
   * @param {boolean} includeAttachments - 첨부파일 포함 여부
   */
  async findMarkdownFiles(vaultPath, includeAttachments = false) {
    try {
      const patterns = ['**/*.md'];
      if (includeAttachments) {
        patterns.push('**/*.{txt,json,yaml,yml}');
      }
      
      const files = await glob(patterns, {
        cwd: vaultPath,
        absolute: true,
        ignore: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.obsidian/**',
          '**/Trash/**'
        ]
      });
      
      return files;
    } catch (error) {
      logger.error(`Markdown 파일 검색 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 인덱싱할 파일 필터링
   * @param {string[]} files - 파일 목록
   * @param {boolean} forceReindex - 강제 재인덱싱
   * @param {number} maxFileSize - 최대 파일 크기
   */
  async filterFilesForIndexing(files, forceReindex = false, maxFileSize = 1024 * 1024) {
    const filesToIndex = [];
    let skippedCount = 0;
    let sizeFilteredCount = 0;
    let alreadyIndexedCount = 0;
    
    logger.info(`[INDEX][FILTER] 필터링 시작: ${files.length}개 파일, forceReindex: ${forceReindex}`);
    
    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        
        // 파일 크기 체크
        if (stats.size > maxFileSize) {
          logger.warn(`[INDEX][FILTER] 파일이 너무 큼 (${stats.size} bytes): ${file}`);
          sizeFilteredCount++;
          continue;
        }
        
        // 이미 인덱싱되었는지 체크
        if (!forceReindex && this.isAlreadyIndexed(file)) {
          alreadyIndexedCount++;
          continue;
        }
        
        filesToIndex.push(file);
      } catch (error) {
        logger.warn(`[INDEX][FILTER] 파일 접근 실패: ${file} - ${error.message}`);
        skippedCount++;
      }
    }
    
    logger.info(`[INDEX][FILTER] 필터링 완료: ${filesToIndex.length}개 인덱싱, ${alreadyIndexedCount}개 이미 인덱싱됨, ${sizeFilteredCount}개 크기 초과, ${skippedCount}개 접근 실패`);
    
    return filesToIndex;
  }

  /**
   * 배치 처리
   * @param {string[]} files - 파일 목록
   * @param {number} batchSize - 배치 크기
   * @param {Object} options - 옵션
   */
  async processBatch(files, batchSize = 100, options = {}) {
    const { forceReindex = false } = options;
    const results = { indexed: 0, skipped: 0, errors: 0 };
    
    // 병렬 처리 개선: 더 큰 배치로 처리
    const maxConcurrency = 10; // 동시 처리할 배치 수
    
    for (let i = 0; i < files.length; i += batchSize * maxConcurrency) {
      const batchGroup = files.slice(i, i + batchSize * maxConcurrency);
      logger.info(`[INDEX][BATCH] 배치 그룹 처리: ${i + 1}-${Math.min(i + batchSize * maxConcurrency, files.length)}/${files.length}`);
      
      // 배치 그룹을 더 작은 배치로 나누어 병렬 처리
      const batchPromises = [];
      for (let j = 0; j < batchGroup.length; j += batchSize) {
        const batch = batchGroup.slice(j, j + batchSize);
        const batchPromise = this.processSingleBatch(batch, { forceReindex });
        batchPromises.push(batchPromise);
      }
      
      const batchResults = await Promise.all(batchPromises);
      
      // 결과 집계
      batchResults.forEach(result => {
        results.indexed += result.indexed;
        results.skipped += result.skipped;
        results.errors += result.errors;
      });
    }
    
    return results;
  }

  /**
   * 단일 배치 처리
   * @param {string[]} batch - 배치 파일 목록
   * @param {Object} options - 옵션
   */
  async processSingleBatch(batch, options = {}) {
    const { forceReindex = false } = options;
    const results = { indexed: 0, skipped: 0, errors: 0 };
    
    const batchPromises = batch.map(async (file) => {
      try {
        const result = await this.indexNote(file, { forceReindex });
        if (result.indexed) {
          results.indexed++;
        } else {
          results.skipped++;
        }
      } catch (error) {
        logger.error(`배치 처리 오류: ${file} - ${error.message}`);
        results.errors++;
      }
    });
    
    await Promise.all(batchPromises);
    return results;
  }

  /**
   * 노트 파싱
   * @param {string} filePath - 파일 경로
   */
  async parseNote(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { data: frontmatter, content: markdownContent } = matter(content);
      
      // 메타데이터 추출
      const metadata = {
        title: frontmatter.title || path.basename(filePath, '.md'),
        tags: frontmatter.tags || [],
        aliases: frontmatter.aliases || [],
        created: frontmatter.created || new Date().toISOString(),
        modified: frontmatter.modified || new Date().toISOString(),
        filePath: filePath,
        fileName: path.basename(filePath),
        fileSize: (await fs.stat(filePath)).size,
        wordCount: markdownContent.split(/\s+/).length
      };
      
      return {
        content: markdownContent,
        metadata,
        frontmatter
      };
    } catch (error) {
      logger.error(`노트 파싱 실패: ${filePath} - ${error.message}`);
      throw error;
    }
  }

  /**
   * 텍스트 청킹
   * @param {Object} noteContent - 노트 내용
   */
  createChunks(noteContent) {
    const { content, metadata } = noteContent;
    
    // 기본 청킹
    const baseChunks = embeddingService.chunkText(content, 1000, 200);
    
    // 청크별 메타데이터 추가
    const chunks = baseChunks.map((chunk, index) => ({
      id: `${metadata.filePath}-chunk-${index}`,
      content: chunk,
      metadata: {
        ...metadata,
        chunkIndex: index,
        chunkCount: baseChunks.length,
        chunkType: 'content'
      }
    }));
    
    // 제목과 태그를 별도 청크로 추가
    const titleChunk = {
      id: `${metadata.filePath}-title`,
      content: `${metadata.title} ${(Array.isArray(metadata.tags) ? metadata.tags.join(' ') : (typeof metadata.tags === 'string' ? metadata.tags : ''))}`,
      metadata: {
        ...metadata,
        chunkIndex: -1,
        chunkCount: baseChunks.length + 1,
        chunkType: 'title'
      }
    };
    
    return [titleChunk, ...chunks];
  }

  /**
   * 임베딩 생성
   * @param {Array} chunks - 청크 배열
   */
  async generateEmbeddings(chunks) {
    try {
      const texts = chunks.map(chunk => chunk.content);
      const embeddings = await embeddingService.embedBatch(texts);
      
      return chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index]
      }));
    } catch (error) {
      logger.error(`임베딩 생성 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 벡터 저장
   * @param {string} filePath - 파일 경로
   * @param {Array} embeddings - 임베딩 배열
   * @param {Array} chunks - 청크 배열
   * @param {Object} metadata - 메타데이터
   */
  async storeVectors(filePath, embeddings, _chunks, _metadata) {
    try {
      const vectors = embeddings.map((item, _index) => ({
        id: item.id,
        values: item.embedding,
        metadata: {
          ...item.metadata,
          originalFilePath: filePath,
          indexedAt: new Date().toISOString()
        }
      }));
      
      await vectorDatabase.upsertBatch(vectors);
      logger.info(`벡터 저장 완료: ${filePath} (${vectors.length}개)`);
    } catch (error) {
      logger.error(`벡터 저장 실패: ${filePath} - ${error.message}`);
      throw error;
    }
  }

  /**
   * 파일 해시 계산
   * @param {string} filePath - 파일 경로
   */
  async calculateFileHash(filePath) {
    try {
      const content = await fs.readFile(filePath);
      const crypto = await import('crypto');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      logger.error(`파일 해시 계산 실패: ${filePath} - ${error.message}`);
      return null;
    }
  }

  /**
   * 이미 인덱싱되었는지 확인
   * @param {string} filePath - 파일 경로
   * @param {string} fileHash - 파일 해시
   */
  isAlreadyIndexed(filePath, fileHash = null) {
    const indexedNote = this.indexedNotes.get(filePath);
    if (!indexedNote) return false;
    
    if (fileHash && indexedNote.fileHash !== fileHash) {
      return false; // 파일이 변경됨
    }
    
    return true;
  }

  /**
   * 인덱스 상태 업데이트
   * @param {string} filePath - 파일 경로
   * @param {string} fileHash - 파일 해시
   * @param {Object} metadata - 메타데이터
   * @param {string} content - 본문 내용
   */
  updateIndexStatus(filePath, fileHash, metadata, content = '') {
    this.indexedNotes.set(filePath, {
      fileHash,
      metadata: {
        ...metadata,
        content: content.substring(0, 10000) // 본문 내용 저장 (10KB 제한)
      },
      indexedAt: new Date().toISOString()
    });
  }

  /**
   * 인덱스된 노트 로드
   */
  async loadIndexedNotes() {
    try {
      const indexPath = path.join(process.cwd(), 'data', 'note-index.json');
      const data = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(data);
      
      this.indexedNotes = new Map(Object.entries(index.notes || {}));
      logger.info(`인덱스 로드 완료: ${this.indexedNotes.size}개 노트`);
    } catch (error) {
      logger.warn(`인덱스 로드 실패: ${error.message}`);
      this.indexedNotes = new Map();
    }
  }

  /**
   * 인덱스된 노트 저장
   */
  async saveIndexedNotes() {
    try {
      const indexPath = path.join(process.cwd(), 'data', 'note-index.json');
      await fs.mkdir(path.dirname(indexPath), { recursive: true });
      
      const index = {
        version: this.indexVersion,
        updatedAt: new Date().toISOString(),
        notes: Object.fromEntries(this.indexedNotes)
      };
      
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
      logger.info(`인덱스 저장 완료: ${this.indexedNotes.size}개 노트`);
    } catch (error) {
      logger.error(`인덱스 저장 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 노트 삭제
   * @param {string} filePath - 파일 경로
   */
  async deleteNote(filePath) {
    try {
      logger.info(`노트 삭제: ${filePath}`);
      
      // 벡터 데이터베이스에서 삭제
      const indexedNote = this.indexedNotes.get(filePath);
      if (indexedNote) {
        const chunkCount = indexedNote.metadata.chunkCount || 1;
        const idsToDelete = [];
        
        // 제목 청크
        idsToDelete.push(`${filePath}-title`);
        
        // 내용 청크들
        for (let i = 0; i < chunkCount; i++) {
          idsToDelete.push(`${filePath}-chunk-${i}`);
        }
        
        await vectorDatabase.deleteBatch(idsToDelete);
        this.indexedNotes.delete(filePath);
        
        logger.info(`노트 삭제 완료: ${filePath}`);
      }
    } catch (error) {
      logger.error(`노트 삭제 실패: ${filePath} - ${error.message}`);
      throw error;
    }
  }

  /**
   * 인덱스된 노트 목록 반환
   */
  getIndexedNotes() {
    return this.indexedNotes;
  }

  /**
   * 인덱스 통계 조회
   */
  getIndexStats() {
    const stats = {
      totalNotes: this.indexedNotes.size,
      totalChunks: 0,
      totalSize: 0,
      lastUpdated: null,
      tags: new Set(),
      fileTypes: new Map()
    };
    
    for (const [filePath, note] of this.indexedNotes) {
      stats.totalChunks += note.metadata.chunkCount || 1;
      stats.totalSize += note.metadata.fileSize || 0;
      
      if (!stats.lastUpdated || note.indexedAt > stats.lastUpdated) {
        stats.lastUpdated = note.indexedAt;
      }
      
      // 태그 수집
      note.metadata.tags?.forEach(tag => stats.tags.add(tag));
      
      // 파일 타입 수집
      const ext = path.extname(filePath);
      stats.fileTypes.set(ext, (stats.fileTypes.get(ext) || 0) + 1);
    }
    
    return {
      ...stats,
      tags: Array.from(stats.tags),
      fileTypes: Object.fromEntries(stats.fileTypes)
    };
  }

  /**
   * 총 노트 수 조회
   */
  getTotalNotes() {
    return this.indexedNotes.size;
  }
}

const noteIndexingService = new NoteIndexingService();
export default noteIndexingService;
export { noteIndexingService }; 