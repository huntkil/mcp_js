import logger from '../utils/logger.js';

class AdvancedFeatures {
  constructor() {
    this.features = {
      autoSummarization: false,
      smartTagging: false,
      noteSimilarity: false,
      knowledgeGraph: false,
      autoBacklinks: false,
      smartTemplates: false
    };
    
    this.config = {
      summaryLength: 200,
      similarityThreshold: 0.7,
      maxSimilarNotes: 5,
      autoTagConfidence: 0.8
    };
  }

  /**
   * 자동 노트 요약 생성
   * @param {string} content - 노트 내용
   * @param {Object} options - 요약 옵션
   */
  async generateSummary(content, options = {}) {
    const { maxLength = this.config.summaryLength, style = 'concise' } = options;
    
    try {
      logger.info('자동 요약 생성 시작');
      
      // 간단한 요약 알고리즘 (실제로는 AI 모델 사용)
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = content.split(/\s+/).filter(w => w.length > 0);
      
      // 키워드 추출 (간단한 빈도 기반)
      const wordFreq = {};
      words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
        if (cleanWord.length > 3) {
          wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
        }
      });
      
      // 상위 키워드 선택
      const topKeywords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);
      
      // 문장 점수 계산
      const sentenceScores = sentences.map(sentence => {
        const sentenceWords = sentence.toLowerCase().split(/\s+/);
        const score = sentenceWords.reduce((sum, word) => {
          return sum + (topKeywords.includes(word) ? 1 : 0);
        }, 0);
        return { sentence, score };
      });
      
      // 상위 점수 문장 선택
      const topSentences = sentenceScores
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.ceil(sentences.length * 0.3))
        .map(item => item.sentence);
      
      // 요약 생성
      let summary = topSentences.join('. ');
      
      // 길이 제한
      if (summary.length > maxLength) {
        // 문장 단위로 자르기
        const sentences = summary.split('. ');
        let truncatedSummary = '';
        
        for (const sentence of sentences) {
          if ((truncatedSummary + sentence).length <= maxLength) {
            truncatedSummary += (truncatedSummary ? '. ' : '') + sentence;
          } else {
            break;
          }
        }
        
        summary = truncatedSummary || summary.substring(0, maxLength);
      }
      
      logger.info(`자동 요약 생성 완료: ${summary.length}자`);
      
      return {
        summary,
        keywords: topKeywords,
        originalLength: content.length,
        summaryLength: summary.length,
        compressionRatio: (summary.length / content.length * 100).toFixed(1) + '%',
        style
      };
    } catch (error) {
      logger.error(`자동 요약 생성 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 스마트 태그 자동 생성
   * @param {string} content - 노트 내용
   * @param {Object} options - 태그 옵션
   */
  async generateSmartTags(content, options = {}) {
    const { maxTags = 10, confidence = this.config.autoTagConfidence } = options;
    
    try {
      logger.info('스마트 태그 생성 시작');
      
      // 한국어 키워드 추출 (명사, 형용사 위주)
      const words = content.split(/\s+/);
      const wordFreq = {};
      
      words.forEach(word => {
        const cleanWord = word.replace(/[^\w가-힣]/g, '');
        // 2글자 이상의 한국어 단어나 3글자 이상의 영어 단어만 포함
        if ((cleanWord.length >= 2 && /[가-힣]/.test(cleanWord)) || 
            (cleanWord.length >= 3 && /^[a-zA-Z]+$/.test(cleanWord))) {
          if (!this.isStopWord(cleanWord)) {
            wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
          }
        }
      });
      
      // 상위 키워드를 태그로 변환
      const tags = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, maxTags)
        .map(([word, freq]) => ({
          tag: word,
          confidence: Math.min(freq / words.length * 10, 1.0),
          frequency: freq
        }))
        .filter(tag => tag.confidence >= confidence);
      
      // 카테고리별 태그 그룹화
      const categorizedTags = this.categorizeTags(tags);
      
      logger.info(`스마트 태그 생성 완료: ${tags.length}개 태그`);
      
      return {
        tags: tags.map(t => t.tag),
        detailedTags: tags,
        categorizedTags,
        totalTags: tags.length,
        averageConfidence: tags.length > 0 ? (tags.reduce((sum, t) => sum + t.confidence, 0) / tags.length).toFixed(3) : '0.000'
      };
    } catch (error) {
      logger.error(`스마트 태그 생성 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 노트 유사도 분석
   * @param {string} noteId - 기준 노트 ID
   * @param {Array} allNotes - 모든 노트 목록
   * @param {Object} options - 유사도 옵션
   */
  async findSimilarNotes(noteId, allNotes, options = {}) {
    const { 
      threshold = this.config.similarityThreshold, 
      maxResults = this.config.maxSimilarNotes,
      method = 'content' 
    } = options;
    
    try {
      logger.info(`노트 유사도 분석 시작: ${noteId}`);
      
      const targetNote = allNotes.find(note => note.id === noteId);
      if (!targetNote) {
        throw new Error('기준 노트를 찾을 수 없습니다.');
      }
      
      const similarities = [];
      
      for (const note of allNotes) {
        if (note.id === noteId) continue;
        
        let similarity = 0;
        
        switch (method) {
          case 'content':
            similarity = this.calculateContentSimilarity(targetNote.content, note.content);
            break;
          case 'tags':
            similarity = this.calculateTagSimilarity(targetNote.tags || [], note.tags || []);
            break;
          case 'hybrid': {
            const contentSim = this.calculateContentSimilarity(targetNote.content, note.content);
            const tagSim = this.calculateTagSimilarity(targetNote.tags || [], note.tags || []);
            similarity = (contentSim * 0.7) + (tagSim * 0.3);
            break;
          }
        }
        
        if (similarity >= threshold) {
          similarities.push({
            noteId: note.id,
            title: note.title,
            similarity,
            method,
            tags: note.tags || [],
            lastModified: note.lastModified
          });
        }
      }
      
      // 유사도 순으로 정렬
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      const results = similarities.slice(0, maxResults);
      
      logger.info(`노트 유사도 분석 완료: ${results.length}개 유사 노트 발견`);
      
      return {
        targetNote: {
          id: targetNote.id,
          title: targetNote.title
        },
        similarNotes: results,
        totalFound: similarities.length,
        threshold,
        method
      };
    } catch (error) {
      logger.error(`노트 유사도 분석 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 지식 그래프 생성
   * @param {Array} notes - 노트 목록
   * @param {Object} options - 그래프 옵션
   */
  async generateKnowledgeGraph(notes, options = {}) {
    const { 
      includeTags = true, 
      // includeLinks = true, // Unused variable removed
      // maxNodes = 100, // Unused variable removed
      minConnections = 2 
    } = options;
    
    try {
      logger.info('지식 그래프 생성 시작');
      
      const nodes = [];
      const edges = [];
      const nodeMap = new Map();
      
      // 노드 생성
      notes.forEach(note => {
        const nodeId = `note-${note.id}`;
        nodes.push({
          id: nodeId,
          label: note.title,
          type: 'note',
          metadata: {
            tags: note.tags || [],
            lastModified: note.lastModified,
            wordCount: note.content.split(/\s+/).length
          }
        });
        nodeMap.set(note.id, nodeId);
      });
      
      // 태그 노드 추가
      if (includeTags) {
        const tagNodes = new Map();
        notes.forEach(note => {
          (note.tags || []).forEach(tag => {
            if (!tagNodes.has(tag)) {
              const tagNodeId = `tag-${tag}`;
              nodes.push({
                id: tagNodeId,
                label: `#${tag}`,
                type: 'tag',
                metadata: { tag }
              });
              tagNodes.set(tag, tagNodeId);
            }
          });
        });
        
        // 태그-노트 연결
        notes.forEach(note => {
          const noteNodeId = nodeMap.get(note.id);
          (note.tags || []).forEach(tag => {
            const tagNodeId = tagNodes.get(tag);
            edges.push({
              source: noteNodeId,
              target: tagNodeId,
              type: 'tagged',
              weight: 1
            });
          });
        });
      }
      
      // 노트 간 연결 (내용 유사도 기반)
      for (let i = 0; i < notes.length; i++) {
        for (let j = i + 1; j < notes.length; j++) {
          const similarity = this.calculateContentSimilarity(notes[i].content, notes[j].content);
          if (similarity >= 0.3) {
            edges.push({
              source: nodeMap.get(notes[i].id),
              target: nodeMap.get(notes[j].id),
              type: 'similar',
              weight: similarity
            });
          }
        }
      }
      
      // 연결 수가 적은 노드 필터링
      const nodeConnections = new Map();
      edges.forEach(edge => {
        nodeConnections.set(edge.source, (nodeConnections.get(edge.source) || 0) + 1);
        nodeConnections.set(edge.target, (nodeConnections.get(edge.target) || 0) + 1);
      });
      
      let filteredNodes;
      if (minConnections <= 1) {
        // 연결 수와 상관없이 모든 노트 노드는 남긴다
        filteredNodes = nodes.filter(node => node.type === 'note');
      } else {
        filteredNodes = nodes.filter(node => 
          (nodeConnections.get(node.id) || 0) >= minConnections
        );
      }
      
      const filteredEdges = edges.filter(edge => 
        filteredNodes.some(n => n.id === edge.source) && 
        filteredNodes.some(n => n.id === edge.target)
      );
      
      logger.info(`지식 그래프 생성 완료: ${filteredNodes.length}개 노드, ${filteredEdges.length}개 연결`);
      
      return {
        nodes: filteredNodes,
        edges: filteredEdges,
        statistics: {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          filteredNodes: filteredNodes.length,
          filteredEdges: filteredEdges.length,
          averageConnections: filteredEdges.length / Math.max(filteredNodes.length, 1)
        }
      };
    } catch (error) {
      logger.error(`지식 그래프 생성 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 자동 백링크 생성
   * @param {string} noteId - 새로 생성된 노트 ID
   * @param {Array} allNotes - 모든 노트 목록
   * @param {Object} options - 백링크 옵션
   */
  async generateAutoBacklinks(noteId, allNotes, options = {}) {
    const { 
      threshold = 0.5, 
      maxBacklinks = 10,
      includeSimilar = true 
    } = options;
    
    try {
      logger.info(`자동 백링크 생성 시작: ${noteId}`);
      
      const targetNote = allNotes.find(note => note.id === noteId);
      if (!targetNote) {
        throw new Error('대상 노트를 찾을 수 없습니다.');
      }
      
      const backlinks = [];
      
      for (const note of allNotes) {
        if (note.id === noteId) continue;
        
        // 키워드 기반 백링크
        const keywordMatches = this.findKeywordMatches(targetNote.title, note.content);
        
        // 유사도 기반 백링크
        let similarityScore = 0;
        if (includeSimilar) {
          similarityScore = this.calculateContentSimilarity(targetNote.content, note.content);
        }
        
        if (keywordMatches.length > 0 || similarityScore >= threshold) {
          backlinks.push({
            sourceNoteId: note.id,
            sourceTitle: note.title,
            type: keywordMatches.length > 0 ? 'content' : 'tags',
            keywordMatches,
            similarityScore,
            context: this.extractContext(targetNote.title, note.content)
          });
        }
      }
      
      // 점수 계산 및 정렬
      backlinks.forEach(backlink => {
        backlink.score = (backlink.keywordMatches.length * 0.6) + (backlink.similarityScore * 0.4);
      });
      
      backlinks.sort((a, b) => b.score - a.score);
      
      const results = backlinks.slice(0, maxBacklinks);
      
      logger.info(`자동 백링크 생성 완료: ${results.length}개 백링크`);
      
      return {
        targetNote: noteId,
        backlinks: results,
        statistics: {
          totalBacklinks: backlinks.length,
          keywordBacklinks: results.filter(b => b.type === 'keyword').length,
          similarBacklinks: results.filter(b => b.type === 'similar').length
        },
        threshold
      };
    } catch (error) {
      logger.error(`자동 백링크 생성 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 스마트 템플릿 생성
   * @param {string} templateType - 템플릿 타입
   * @param {Object} context - 컨텍스트 정보
   * @param {Object} options - 템플릿 옵션
   */
  async generateSmartTemplate(templateType, context = {}, options = {}) {
    const { 
      includeDate = true, 
      includeTags = true,
      customFields = {} 
    } = options;
    
    try {
      logger.info(`스마트 템플릿 생성: ${templateType}`);
      
      const templates = {
        daily: {
          title: `{{date}} 일일 노트`,
          content: `# {{date}} 일일 노트

## 오늘의 목표
- [ ] 

## 진행 상황

### 오전

### 오후

## 배운 점

## 내일 계획

## 메모

`,
          tags: ['daily', '{{date}}']
        },
        meeting: {
          title: `{{title}} 회의록`,
          content: `# {{title}} 회의록

## 회의 정보
- **일시**: {{date}} {{time}}
- **참석자**: {{participants}}
- **장소**: {{location}}

## 안건
1. 

## 논의 내용

## 결정사항

## 액션 아이템
- [ ] 

## 다음 회의
- **일시**: 
- **안건**: 

`,
          tags: ['meeting', '{{project}}']
        },
        project: {
          title: `{{title}} 프로젝트`,
          content: `# {{title}} 프로젝트

## 프로젝트 개요
- **목표**: 
- **기간**: {{startDate}} ~ {{endDate}}
- **담당자**: {{assignee}}

## 목표

## 기술 스택

## 개발 단계

### 1단계: 

### 2단계: 

### 3단계: 

## 예상 결과

## 참고 자료

`,
          tags: ['project', '{{category}}']
        },
        research: {
          title: `{{title}} 연구`,
          content: `# {{title}} 연구

## 연구 개요

## 배경

## 방법론

## 결과

## 결론

## 참고 문헌

## 메모

`,
          tags: ['research', '{{field}}']
        }
      };
      
      const template = templates[templateType];
      if (!template) {
        throw new Error(`지원하지 않는 템플릿 타입: ${templateType}`);
      }
      
      // 템플릿 변수 치환
      let title = template.title;
      let content = template.content;
      let tags = template.tags;
      
      const variables = {
        date: includeDate ? new Date().toISOString().split('T')[0] : '',
        time: new Date().toLocaleTimeString(),
        ...context,
        ...customFields
      };
      
      // 변수 치환
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        title = title.replace(regex, value || '');
        content = content.replace(regex, value || '');
        tags = tags.map(tag => tag.replace(regex, value || ''));
      });
      
      // 빈 태그 제거
      tags = tags.filter(tag => tag && tag !== '');
      
      logger.info(`스마트 템플릿 생성 완료: ${templateType}`);
      
      return {
        templateType,
        title,
        content,
        tags,
        context,
        customFields,
        variables,
        metadata: {
          generatedAt: new Date().toISOString(),
          templateType,
          includeDate,
          includeTags
        }
      };
    } catch (error) {
      logger.error(`스마트 템플릿 생성 실패: ${error.message}`);
      throw error;
    }
  }

  // 헬퍼 메서드들
  isStopWord(word) {
    // 한국어 및 영어 스톱워드 리스트 (더 정교하게 수정)
    const stopWords = [
      // 영어 스톱워드
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'if', 'then', 'else', 'when', 'where', 'while', 'as', 'because', 'so', 'than', 'too', 'very',
      'can', 'will', 'just', 'from', 'into', 'about', 'over', 'after', 'before', 'between', 'through',
      'during', 'without', 'within', 'along', 'across', 'behind', 'beyond', 'under', 'above', 'up', 'down',
      'out', 'off', 'again', 'further', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      's', 't', 'can', 'will', 'don', 'should', 'now', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would', 'should', 'could', 'ought',
      'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
      'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
      'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
      'these', 'those', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
      'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
      'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
      'under', 'again', 'further', 'then', 'once',
      // 한국어 스톱워드 (조사, 접속사, 대명사 위주로 수정)
      '이', '그', '저', '것', '수', '등', '및', '또는', '그리고', '하지만', '그러나', '만약', '때', '곳',
      '나', '너', '우리', '그들', '이것', '저것', '무엇', '어떤', '어디', '언제', '왜', '어떻게',
      '가', '을', '를', '의', '에', '에서', '로', '으로', '와', '과', '도', '는', '은', '만', '까지',
      '부터', '까지', '마다', '마다', '마다', '마다', '마다', '마다', '마다', '마다', '마다', '마다'
    ];
    return stopWords.includes(word.toLowerCase());
  }

  categorizeTags(tags) {
    const categories = {
      technology: ['ai', 'ml', 'programming', 'software', 'hardware', 'database'],
      business: ['project', 'management', 'strategy', 'marketing', 'finance'],
      research: ['study', 'analysis', 'experiment', 'survey', 'data'],
      personal: ['daily', 'life', 'hobby', 'travel', 'family']
    };
    
    const categorized = {};
    
    tags.forEach(tag => {
      for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => tag.tag.includes(keyword))) {
          if (!categorized[category]) {
            categorized[category] = [];
          }
          categorized[category].push(tag);
        }
      }
    });
    
    return categorized;
  }

  calculateContentSimilarity(content1, content2) {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  calculateTagSimilarity(tags1, tags2) {
    if (tags1.length === 0 && tags2.length === 0) return 1;
    if (tags1.length === 0 || tags2.length === 0) return 0;
    
    const set1 = new Set(tags1);
    const set2 = new Set(tags2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  findKeywordMatches(keyword, content) {
    const matches = [];
    const keywordLower = keyword.toLowerCase();
    const contentLower = content.toLowerCase();
    
    let index = 0;
    while ((index = contentLower.indexOf(keywordLower, index)) !== -1) {
      matches.push({
        position: index,
        context: content.substring(Math.max(0, index - 20), index + keyword.length + 20)
      });
      index += 1;
    }
    
    return matches;
  }

  extractContext(keyword, content) {
    const index = content.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + keyword.length + 50);
    
    return content.substring(start, end);
  }
}

export default new AdvancedFeatures(); 