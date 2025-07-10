import logger from '../utils/logger.js';
import embeddingService from './embeddingService.js';

class SummaryService {
  constructor() {
    this.maxSummaryLength = 300; // 최대 요약 길이
    this.minSentenceLength = 10; // 최소 문장 길이
    this.maxSentences = 5; // 최대 문장 수
  }

  /**
   * 텍스트 요약 생성
   * @param {string} text - 요약할 텍스트
   * @param {Object} options - 요약 옵션
   */
  async generateSummary(text, options = {}) {
    try {
      const {
        maxLength = this.maxSummaryLength,
        maxSentences = this.maxSentences,
        method = 'extractive' // extractive, keyword, hybrid
      } = options;

      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: '텍스트가 비어있습니다.',
          summary: '',
          originalLength: 0,
          summaryLength: 0,
          compressionRatio: 0
        };
      }

      logger.info(`텍스트 요약 시작: ${text.length}자`);

      let summary = '';
      let methodUsed = method;

      // 텍스트가 짧으면 그대로 반환
      if (text.length <= maxLength) {
        summary = text;
        methodUsed = 'original';
      } else {
        switch (method) {
          case 'extractive':
            summary = await this.extractiveSummarization(text, maxSentences);
            break;
          case 'keyword':
            summary = await this.keywordBasedSummarization(text, maxLength);
            break;
          case 'hybrid':
            summary = await this.hybridSummarization(text, maxSentences, maxLength);
            break;
          default:
            summary = await this.extractiveSummarization(text, maxSentences);
        }
      }

      const compressionRatio = ((text.length - summary.length) / text.length * 100).toFixed(1);

      logger.info(`요약 완료: ${summary.length}자 (압축률: ${compressionRatio}%)`);

      return {
        success: true,
        summary: summary.trim(),
        originalLength: text.length,
        summaryLength: summary.length,
        compressionRatio: parseFloat(compressionRatio),
        method: methodUsed,
        metadata: {
          maxLength,
          maxSentences,
          method: methodUsed
        }
      };

    } catch (error) {
      logger.error('요약 생성 실패:', error);
      return {
        success: false,
        error: error.message,
        summary: '',
        originalLength: text.length,
        summaryLength: 0,
        compressionRatio: 0
      };
    }
  }

  /**
   * 추출적 요약 (중요 문장 선택)
   */
  async extractiveSummarization(text, maxSentences) {
    // 문장 분리
    const sentences = this.splitIntoSentences(text);
    
    if (sentences.length <= maxSentences) {
      return sentences.join(' ');
    }

    // 문장 중요도 계산
    const sentenceScores = await this.calculateSentenceScores(sentences);
    
    // 상위 문장 선택
    const topSentences = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => a.index - b.index); // 원래 순서로 정렬

    return topSentences.map(item => item.sentence).join(' ');
  }

  /**
   * 키워드 기반 요약
   */
  async keywordBasedSummarization(text, maxLength) {
    // 키워드 추출
    const keywords = this.extractKeywords(text);
    
    // 키워드가 포함된 문장들 찾기
    const sentences = this.splitIntoSentences(text);
    const keywordSentences = sentences.filter(sentence => 
      keywords.some(keyword => 
        sentence.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    // 키워드 문장들을 길이 제한 내에서 조합
    let summary = '';
    for (const sentence of keywordSentences) {
      if ((summary + sentence).length <= maxLength) {
        summary += (summary ? ' ' : '') + sentence;
      } else {
        break;
      }
    }

    return summary || sentences.slice(0, 2).join(' ');
  }

  /**
   * 하이브리드 요약 (추출적 + 키워드)
   */
  async hybridSummarization(text, maxSentences, maxLength) {
    const extractiveSummary = await this.extractiveSummarization(text, maxSentences);
    const keywordSummary = await this.keywordBasedSummarization(text, maxLength);
    
    // 두 요약을 결합하고 중복 제거
    const combined = this.combineSummaries(extractiveSummary, keywordSummary, maxLength);
    
    return combined;
  }

  /**
   * 문장 분리 (한국어 특화)
   */
  splitIntoSentences(text) {
    // 한국어 문장 끝 패턴
    const sentenceEndPattern = /[.!?。！？]\s+/g;
    
    let sentences = text.split(sentenceEndPattern);
    
    // 빈 문장 제거 및 정리
    sentences = sentences
      .map(sentence => sentence.trim())
      .filter(sentence => 
        sentence.length >= this.minSentenceLength && 
        sentence.length > 0
      );

    return sentences;
  }

  /**
   * 문장 중요도 계산
   */
  async calculateSentenceScores(sentences) {
    const scores = [];

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      let score = 0;

      // 1. 길이 점수 (적당한 길이의 문장이 중요)
      const lengthScore = this.calculateLengthScore(sentence);
      score += lengthScore * 0.2;

      // 2. 키워드 밀도 점수
      const keywordDensity = this.calculateKeywordDensity(sentence);
      score += keywordDensity * 0.4;

      // 3. 위치 점수 (첫 문장과 마지막 문장이 중요)
      const positionScore = this.calculatePositionScore(i, sentences.length);
      score += positionScore * 0.2;

      // 4. 특수 단어 점수 (숫자, 날짜, 인용 등)
      const specialWordScore = this.calculateSpecialWordScore(sentence);
      score += specialWordScore * 0.2;

      scores.push({
        index: i,
        sentence,
        score: score
      });
    }

    return scores;
  }

  /**
   * 길이 점수 계산
   */
  calculateLengthScore(sentence) {
    const length = sentence.length;
    
    // 20-100자 사이가 최적
    if (length >= 20 && length <= 100) {
      return 1.0;
    } else if (length < 20) {
      return length / 20;
    } else {
      return Math.max(0, 1 - (length - 100) / 100);
    }
  }

  /**
   * 키워드 밀도 계산
   */
  calculateKeywordDensity(sentence) {
    const keywords = this.extractKeywords(sentence);
    const words = sentence.split(/\s+/).length;
    
    return words > 0 ? keywords.length / words : 0;
  }

  /**
   * 위치 점수 계산
   */
  calculatePositionScore(index, totalSentences) {
    if (totalSentences === 1) return 1.0;
    
    // 첫 문장과 마지막 문장에 높은 점수
    if (index === 0 || index === totalSentences - 1) {
      return 1.0;
    }
    
    // 중간 문장들은 위치에 따라 점수 감소
    const normalizedPosition = index / (totalSentences - 1);
    return 1 - Math.abs(normalizedPosition - 0.5) * 0.5;
  }

  /**
   * 특수 단어 점수 계산
   */
  calculateSpecialWordScore(sentence) {
    let score = 0;
    
    // 숫자 포함
    if (/\d+/.test(sentence)) score += 0.3;
    
    // 날짜 패턴
    if (/\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(sentence)) score += 0.3;
    
    // 인용 부호
    if (/["'""]/.test(sentence)) score += 0.2;
    
    // 강조 표현 (중요, 핵심, 주요 등)
    const emphasisWords = ['중요', '핵심', '주요', '필수', '결론', '요약', '정리'];
    if (emphasisWords.some(word => sentence.includes(word))) {
      score += 0.4;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * 키워드 추출
   */
  extractKeywords(text) {
    // 한국어 불용어
    const stopWords = [
      '이', '가', '을', '를', '의', '에', '에서', '로', '으로', '와', '과', '도', '는', '은', '이', '가', '을', '를',
      '그', '이', '저', '우리', '너희', '그들', '이들', '저들', '것', '것들', '수', '것', '것들', '수', '것', '것들',
      '있다', '없다', '하다', '되다', '있다', '없다', '하다', '되다', '있다', '없다', '하다', '되다'
    ];

    // 단어 분리 및 빈도 계산
    const words = text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length >= 2 && 
        !stopWords.includes(word) &&
        !/^\d+$/.test(word) // 숫자만 있는 단어 제외
      );

    // 빈도 계산
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // 상위 키워드 반환
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * 요약 결합
   */
  combineSummaries(summary1, summary2, maxLength) {
    const sentences1 = this.splitIntoSentences(summary1);
    const sentences2 = this.splitIntoSentences(summary2);
    
    // 중복 문장 제거
    const uniqueSentences = [...new Set([...sentences1, ...sentences2])];
    
    // 길이 제한 내에서 조합
    let combined = '';
    for (const sentence of uniqueSentences) {
      if ((combined + sentence).length <= maxLength) {
        combined += (combined ? ' ' : '') + sentence;
      } else {
        break;
      }
    }
    
    return combined;
  }

  /**
   * 여러 노트 요약 생성
   */
  async generateMultiNoteSummary(notes, options = {}) {
    try {
      const {
        maxLength = 500,
        method = 'hybrid'
      } = options;

      if (!notes || notes.length === 0) {
        return {
          success: false,
          error: '노트가 없습니다.',
          summary: '',
          noteCount: 0
        };
      }

      logger.info(`${notes.length}개 노트 요약 시작`);

      // 각 노트 요약
      const noteSummaries = [];
      for (const note of notes) {
        const content = note.content || note.text || '';
        if (content.trim()) {
          const summary = await this.generateSummary(content, { maxLength: 100, method });
          if (summary.success) {
            noteSummaries.push({
              title: note.title || note.fileName || 'Unknown',
              summary: summary.summary,
              originalLength: summary.originalLength
            });
          }
        }
      }

      // 모든 요약을 결합하여 최종 요약 생성
      const combinedText = noteSummaries
        .map(note => `${note.title}: ${note.summary}`)
        .join('\n\n');

      const finalSummary = await this.generateSummary(combinedText, { maxLength, method });

      return {
        success: true,
        summary: finalSummary.summary,
        noteCount: notes.length,
        processedNotes: noteSummaries.length,
        metadata: {
          method,
          maxLength,
          totalOriginalLength: noteSummaries.reduce((sum, note) => sum + note.originalLength, 0)
        }
      };

    } catch (error) {
      logger.error('다중 노트 요약 실패:', error);
      return {
        success: false,
        error: error.message,
        summary: '',
        noteCount: 0
      };
    }
  }
}

export default new SummaryService(); 