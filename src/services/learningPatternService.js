import logger from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

class LearningPatternService {
  constructor() {
    this.logger = logger;
  }

  /**
   * 학습 패턴 분석 실행
   */
  async analyzeLearningPatterns(vaultPath, options = {}) {
    try {
      this.logger.info('학습 패턴 분석 시작');
      
      const patterns = {
        writingFrequency: await this.analyzeWritingFrequency(vaultPath, options),
        tagPatterns: await this.analyzeTagPatterns(vaultPath, options),
        connectionPatterns: await this.analyzeConnectionPatterns(vaultPath, options),
        learningProgress: await this.analyzeLearningProgress(vaultPath, options),
        learningStyle: await this.analyzeLearningStyle(vaultPath, options)
      };

      this.logger.info('학습 패턴 분석 완료');
      return {
        success: true,
        data: patterns
      };
    } catch (error) {
      this.logger.error('학습 패턴 분석 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 노트 작성 빈도 분석
   */
  async analyzeWritingFrequency(vaultPath, options) {
    try {
      const files = await this.getMarkdownFiles(vaultPath);
      const frequencyData = {};

      for (const file of files) {
        const stats = await fs.stat(file);
        const date = stats.mtime.toISOString().split('T')[0];
        const month = date.substring(0, 7);
        
        if (!frequencyData[month]) {
          frequencyData[month] = { count: 0, files: [] };
        }
        frequencyData[month].count++;
        frequencyData[month].files.push({
          name: path.basename(file),
          date: date,
          size: stats.size
        });
      }

      // 월별 통계 계산
      const monthlyStats = Object.entries(frequencyData).map(([month, data]) => ({
        month,
        noteCount: data.count,
        totalSize: data.files.reduce((sum, file) => sum + file.size, 0),
        averageSize: Math.round(data.files.reduce((sum, file) => sum + file.size, 0) / data.count),
        files: data.files
      }));

      return {
        monthlyStats,
        totalNotes: files.length,
        averageNotesPerMonth: Math.round(files.length / Object.keys(frequencyData).length),
        mostActiveMonth: monthlyStats.reduce((max, stat) => 
          stat.noteCount > max.noteCount ? stat : max
        )
      };
    } catch (error) {
      this.logger.error('작성 빈도 분석 오류:', error);
      throw error;
    }
  }

  /**
   * 태그 사용 패턴 분석
   */
  async analyzeTagPatterns(vaultPath, options) {
    try {
      const files = await this.getMarkdownFiles(vaultPath);
      const tagStats = {};
      const tagCombinations = {};

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const tags = this.extractTags(content);
        
        // 개별 태그 통계
        for (const tag of tags) {
          if (!tagStats[tag]) {
            tagStats[tag] = { count: 0, files: [] };
          }
          tagStats[tag].count++;
          tagStats[tag].files.push(path.basename(file));
        }

        // 태그 조합 통계
        if (tags.length > 1) {
          const combination = tags.sort().join('+');
          if (!tagCombinations[combination]) {
            tagCombinations[combination] = { count: 0, files: [] };
          }
          tagCombinations[combination].count++;
          tagCombinations[combination].files.push(path.basename(file));
        }
      }

      // 태그 순위 정렬
      const topTags = Object.entries(tagStats)
        .map(([tag, data]) => ({ tag, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const topCombinations = Object.entries(tagCombinations)
        .map(([combination, data]) => ({ combination, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        topTags,
        topCombinations,
        totalUniqueTags: Object.keys(tagStats).length,
        averageTagsPerNote: Object.values(tagStats).reduce((sum, data) => sum + data.count, 0) / files.length
      };
    } catch (error) {
      this.logger.error('태그 패턴 분석 오류:', error);
      throw error;
    }
  }

  /**
   * 연결 패턴 분석
   */
  async analyzeConnectionPatterns(vaultPath, options) {
    try {
      const files = await this.getMarkdownFiles(vaultPath);
      const connectionStats = {
        internalLinks: 0,
        externalLinks: 0,
        backlinks: {},
        mostLinked: [],
        isolatedNotes: []
      };

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const links = this.extractLinks(content);
        
        for (const link of links) {
          if (link.startsWith('http')) {
            connectionStats.externalLinks++;
          } else {
            connectionStats.internalLinks++;
            const targetFile = this.resolveInternalLink(link, vaultPath);
            if (targetFile) {
              if (!connectionStats.backlinks[targetFile]) {
                connectionStats.backlinks[targetFile] = 0;
              }
              connectionStats.backlinks[targetFile]++;
            }
          }
        }
      }

      // 가장 많이 링크된 노트 찾기
      connectionStats.mostLinked = Object.entries(connectionStats.backlinks)
        .map(([file, count]) => ({ file: path.basename(file), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 고립된 노트 찾기 (링크가 없는 노트)
      connectionStats.isolatedNotes = files
        .filter(file => !connectionStats.backlinks[file])
        .map(file => path.basename(file));

      return connectionStats;
    } catch (error) {
      this.logger.error('연결 패턴 분석 오류:', error);
      throw error;
    }
  }

  /**
   * 학습 진도 분석
   */
  async analyzeLearningProgress(vaultPath, options) {
    try {
      const files = await this.getMarkdownFiles(vaultPath);
      const progressData = {
        totalNotes: files.length,
        totalSize: 0,
        averageNoteSize: 0,
        growthRate: 0,
        complexityTrend: []
      };

      let totalSize = 0;
      const monthlyGrowth = {};

      for (const file of files) {
        const stats = await fs.stat(file);
        const content = await fs.readFile(file, 'utf-8');
        const month = stats.mtime.toISOString().substring(0, 7);
        
        totalSize += stats.size;
        
        if (!monthlyGrowth[month]) {
          monthlyGrowth[month] = { count: 0, size: 0, complexity: 0 };
        }
        monthlyGrowth[month].count++;
        monthlyGrowth[month].size += stats.size;
        monthlyGrowth[month].complexity += this.calculateComplexity(content);
      }

      progressData.totalSize = totalSize;
      progressData.averageNoteSize = Math.round(totalSize / files.length);
      
      // 성장률 계산
      const months = Object.keys(monthlyGrowth).sort();
      if (months.length > 1) {
        const firstMonth = monthlyGrowth[months[0]].count;
        const lastMonth = monthlyGrowth[months[months.length - 1]].count;
        progressData.growthRate = ((lastMonth - firstMonth) / firstMonth * 100).toFixed(2);
      }

      // 복잡도 트렌드
      progressData.complexityTrend = months.map(month => ({
        month,
        averageComplexity: Math.round(monthlyGrowth[month].complexity / monthlyGrowth[month].count),
        noteCount: monthlyGrowth[month].count
      }));

      return progressData;
    } catch (error) {
      this.logger.error('학습 진도 분석 오류:', error);
      throw error;
    }
  }

  /**
   * 학습 스타일 분석
   */
  async analyzeLearningStyle(vaultPath, options) {
    try {
      const files = await this.getMarkdownFiles(vaultPath);
      const styleData = {
        preferredTopics: [],
        writingStyle: {},
        organizationPattern: {},
        depthAnalysis: {}
      };

      const topicFrequency = {};
      const writingPatterns = {
        longNotes: 0,
        shortNotes: 0,
        structuredNotes: 0,
        freeformNotes: 0
      };

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const fileName = path.basename(file, '.md');
        
        // 주제 분석
        const topics = this.extractTopics(content);
        for (const topic of topics) {
          topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
        }

        // 작성 스타일 분석
        const wordCount = content.split(/\s+/).length;
        if (wordCount > 500) writingPatterns.longNotes++;
        else writingPatterns.shortNotes++;

        if (content.includes('##') || content.includes('###')) {
          writingPatterns.structuredNotes++;
        } else {
          writingPatterns.freeformNotes++;
        }
      }

      styleData.preferredTopics = Object.entries(topicFrequency)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      styleData.writingStyle = writingPatterns;
      styleData.organizationPattern = {
        structuredRatio: (writingPatterns.structuredNotes / files.length * 100).toFixed(1),
        averageLength: writingPatterns.longNotes > writingPatterns.shortNotes ? '긴 노트' : '짧은 노트'
      };

      return styleData;
    } catch (error) {
      this.logger.error('학습 스타일 분석 오류:', error);
      throw error;
    }
  }

  /**
   * 마크다운 파일 목록 가져오기
   */
  async getMarkdownFiles(vaultPath) {
    const files = [];
    const processDirectory = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await processDirectory(fullPath);
        } else if (entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    };

    await processDirectory(vaultPath);
    return files;
  }

  /**
   * 태그 추출
   */
  extractTags(content) {
    const tagRegex = /#([a-zA-Z0-9가-힣_]+)/g;
    const tags = [];
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    
    return [...new Set(tags)];
  }

  /**
   * 링크 추출
   */
  extractLinks(content) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [];
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      links.push(match[2]);
    }
    
    return links;
  }

  /**
   * 내부 링크 해석
   */
  resolveInternalLink(link, vaultPath) {
    if (link.startsWith('http')) return null;
    
    // Obsidian 링크 형식 처리
    const cleanLink = link.replace(/^\[\[|\]\]$/g, '');
    const filePath = path.join(vaultPath, cleanLink + '.md');
    
    return filePath;
  }

  /**
   * 주제 추출
   */
  extractTopics(content) {
    const topics = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('#')) {
        const topic = line.replace(/^#+\s*/, '').trim();
        if (topic) topics.push(topic);
      }
    }
    
    return topics;
  }

  /**
   * 복잡도 계산
   */
  calculateComplexity(content) {
    const wordCount = content.split(/\s+/).length;
    const linkCount = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
    const tagCount = (content.match(/#([a-zA-Z0-9가-힣_]+)/g) || []).length;
    const headingCount = (content.match(/^#+\s/gm) || []).length;
    
    return wordCount + linkCount * 10 + tagCount * 5 + headingCount * 20;
  }
}

export default new LearningPatternService(); 