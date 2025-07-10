import logger from '../utils/logger.js';

class TaggingService {
  constructor() {
    this.predefinedTags = {
      '마음근력': ['정신건강', '스트레스관리', '감정조절', '인내심', '긍정사고'],
      '명상': ['정신건강', '집중력', '평화', '스트레스감소', '마음챙김'],
      '운동': ['건강', '체력', '스트레스해소', '에너지', '자기관리'],
      '습관': ['자기개발', '생산성', '일상', '목표달성', '자기관리'],
      '학습': ['지식', '성장', '개발', '기술', '교육'],
      '경제': ['재정', '투자', '절약', '수입', '지출'],
      '관계': ['인간관계', '소통', '친구', '가족', '사랑'],
      '창의성': ['아이디어', '혁신', '예술', '문제해결', '상상력']
    };
    
    this.tagWeights = {
      title: 3.0,
      heading: 2.0,
      emphasis: 1.5,
      frequency: 1.0,
      position: 0.8
    };
  }

  /**
   * 텍스트에서 자동으로 태그 추출
   */
  async extractTags(text, options = {}) {
    try {
      const {
        maxTags = 10,
        minScore = 0.1,
        includePredefined = true
      } = options;

      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: '텍스트가 비어있습니다.',
          tags: []
        };
      }

      logger.info(`태그 추출 시작: ${text.length}자`);

      // 1. 키워드 추출
      const keywords = this.extractKeywords(text);
      
      // 2. 태그 점수 계산
      const tagScores = await this.calculateTagScores(text, keywords);
      
      // 3. 사전 정의된 태그 매칭
      let predefinedMatches = [];
      if (includePredefined) {
        predefinedMatches = this.matchPredefinedTags(text, keywords);
      }
      
      // 4. 태그 결합 및 정렬
      const allTags = [...tagScores, ...predefinedMatches];
      const uniqueTags = this.deduplicateTags(allTags);
      
      // 5. 점수 기준으로 필터링 및 정렬
      const finalTags = uniqueTags
        .filter(tag => tag.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxTags);

      logger.info(`태그 추출 완료: ${finalTags.length}개 태그`);

      return {
        success: true,
        tags: finalTags,
        metadata: {
          totalKeywords: keywords.length,
          totalCandidates: allTags.length,
          maxTags,
          minScore
        }
      };

    } catch (error) {
      logger.error('태그 추출 실패:', error);
      return {
        success: false,
        error: error.message,
        tags: []
      };
    }
  }

  /**
   * 키워드 추출
   */
  extractKeywords(text) {
    // 한국어 불용어 및 조사
    const stopWords = [
      '이', '가', '을', '를', '의', '에', '에서', '로', '으로', '와', '과', '도', '는', '은',
      '그', '이', '저', '우리', '너희', '그들', '이들', '저들', '것', '것들', '수', '것', '것들',
      '있다', '없다', '하다', '되다', '있다', '없다', '하다', '되다', '있다', '없다', '하다', '되다',
      '있다', '없다', '하다', '되다', '있다', '없다', '하다', '되다', '있다', '없다', '하다', '되다',
      '그리고', '또는', '하지만', '그러나', '따라서', '그래서', '그런데', '그런', '이런', '저런',
      '입니다', '입니다', '입니다', '입니다', '입니다', '입니다', '입니다', '입니다', '입니다', '입니다'
    ];

    // 단어 분리 및 빈도 계산
    const words = text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length >= 2 && 
        !stopWords.includes(word) &&
        !/^\d+$/.test(word) && // 숫자만 있는 단어 제외
        !/.*[은는이가을를의에에서로으로와과도].*/.test(word) && // 조사로 끝나는 단어 제외
        !/.*[은는이가을를의에에서로으로와과도]$/.test(word) // 조사로 끝나는 단어 제외
      )
      .map(word => word.replace(/[은는이가을를의에에서로으로와과도]$/, '')) // 조사 제거
      .filter(word => word.length >= 2); // 조사 제거 후 길이 재확인

    // 빈도 계산
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // 상위 키워드 반환
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * 태그 점수 계산
   */
  async calculateTagScores(text, keywords) {
    const tagScores = [];

    for (const keyword of keywords) {
      let score = 0;
      
      // 1. 빈도 점수
      const frequency = (text.match(new RegExp(keyword, 'gi')) || []).length;
      score += frequency * this.tagWeights.frequency;
      
      // 2. 제목에서 발견
      const titleMatches = text.match(/^#+\s*(.+)$/gm);
      if (titleMatches) {
        const titleFrequency = titleMatches.filter(title => 
          title.toLowerCase().includes(keyword.toLowerCase())
        ).length;
        score += titleFrequency * this.tagWeights.title;
      }
      
      // 3. 강조 표현에서 발견
      const emphasisMatches = text.match(/\*\*(.+?)\*\*|\*\*(.+?)\*\*/g);
      if (emphasisMatches) {
        const emphasisFrequency = emphasisMatches.filter(emphasis => 
          emphasis.toLowerCase().includes(keyword.toLowerCase())
        ).length;
        score += emphasisFrequency * this.tagWeights.emphasis;
      }
      
      // 4. 위치 점수 (첫 부분에 있으면 높은 점수)
      const firstOccurrence = text.toLowerCase().indexOf(keyword.toLowerCase());
      if (firstOccurrence !== -1) {
        const positionScore = 1 - (firstOccurrence / text.length);
        score += positionScore * this.tagWeights.position;
      }
      
      // 5. 길이 점수 (적당한 길이의 태그가 좋음)
      const lengthScore = this.calculateTagLengthScore(keyword);
      score += lengthScore;
      
      tagScores.push({
        tag: keyword,
        score: score,
        type: 'extracted',
        frequency: frequency
      });
    }

    return tagScores;
  }

  /**
   * 태그 길이 점수 계산
   */
  calculateTagLengthScore(tag) {
    const length = tag.length;
    
    // 2-8자 사이가 최적
    if (length >= 2 && length <= 8) {
      return 1.0;
    } else if (length < 2) {
      return length / 2;
    } else {
      return Math.max(0, 1 - (length - 8) / 4);
    }
  }

  /**
   * 사전 정의된 태그 매칭
   */
  matchPredefinedTags(text, keywords) {
    const matches = [];
    
    for (const [category, tags] of Object.entries(this.predefinedTags)) {
      // 카테고리 자체가 텍스트에 포함되는지 확인
      if (text.toLowerCase().includes(category.toLowerCase()) || 
          keywords.some(keyword => keyword.includes(category))) {
        
        // 관련 태그들도 추가
        for (const tag of tags) {
          if (text.toLowerCase().includes(tag.toLowerCase()) || 
              keywords.some(keyword => keyword.includes(tag))) {
            matches.push({
              tag: tag,
              score: 2.0, // 사전 정의된 태그는 높은 점수
              type: 'predefined',
              category: category
            });
          }
        }
      }
    }
    
    return matches;
  }

  /**
   * 태그 중복 제거
   */
  deduplicateTags(tags) {
    const uniqueTags = new Map();
    
    for (const tag of tags) {
      const key = tag.tag.toLowerCase();
      if (!uniqueTags.has(key) || uniqueTags.get(key).score < tag.score) {
        uniqueTags.set(key, tag);
      }
    }
    
    return Array.from(uniqueTags.values());
  }

  /**
   * 노트에 태그 추가/업데이트
   */
  async suggestTagsForNote(note, options = {}) {
    try {
      const content = note.content || note.text || '';
      const existingTags = note.tags || [];
      
      const result = await this.extractTags(content, options);
      
      if (!result.success) {
        return result;
      }
      
      // 기존 태그와 새로운 태그 결합
      const allTags = [...existingTags, ...result.tags.map(t => t.tag)];
      const uniqueTags = [...new Set(allTags)];
      
      return {
        success: true,
        existingTags: existingTags,
        suggestedTags: result.tags,
        allTags: uniqueTags,
        metadata: result.metadata
      };
      
    } catch (error) {
      logger.error('노트 태그 제안 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 태그 기반 노트 그룹화
   */
  async groupNotesByTags(notes, options = {}) {
    try {
      const {
        minGroupSize = 2,
        includeUntagged = true
      } = options;

      const tagGroups = new Map();
      const untaggedNotes = [];

      for (const note of notes) {
        const tags = note.tags || [];
        
        if (tags.length === 0) {
          if (includeUntagged) {
            untaggedNotes.push(note);
          }
          continue;
        }

        for (const tag of tags) {
          if (!tagGroups.has(tag)) {
            tagGroups.set(tag, []);
          }
          tagGroups.get(tag).push(note);
        }
      }

      // 최소 그룹 크기 필터링
      const filteredGroups = Array.from(tagGroups.entries())
        .filter(([tag, notes]) => notes.length >= minGroupSize)
        .map(([tag, notes]) => ({
          tag: tag,
          notes: notes,
          count: notes.length
        }))
        .sort((a, b) => b.count - a.count);

      return {
        success: true,
        tagGroups: filteredGroups,
        untaggedNotes: untaggedNotes,
        totalGroups: filteredGroups.length,
        totalTaggedNotes: notes.length - untaggedNotes.length,
        totalUntaggedNotes: untaggedNotes.length
      };

    } catch (error) {
      logger.error('태그 기반 노트 그룹화 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new TaggingService(); 