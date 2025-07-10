import logger from '../utils/logger.js';
import embeddingService from './embeddingService.js';
import vectorDatabase from './vectorDatabase.js';

class RecommendationService {
  constructor() {
    this.config = {
      similarityThreshold: 0.1, // 임계값을 낮춤
      maxRecommendations: 5,
      contentWeight: 0.7,
      titleWeight: 0.2,
      tagWeight: 0.1
    };
  }

  /**
   * 유사 노트 추천
   * @param {Object} targetNote - 대상 노트
   * @param {Array} candidateNotes - 후보 노트들
   * @param {Object} options - 옵션
   */
  async findSimilarNotes(targetNote, candidateNotes = [], options = {}) {
    try {
      logger.info('유사노트 추천 시작:', targetNote.title || targetNote.fileName);
      
      const config = { ...this.config, ...options };
      
      // 대상 노트 임베딩 생성
      const targetContent = `${targetNote.title || ''} ${targetNote.content || ''}`;
      const targetEmbedding = await embeddingService.embedText(targetContent);
      
      // 후보 노트들 처리
      let notesToCompare = candidateNotes;
      
      if (notesToCompare.length === 0) {
        // 인덱싱된 노트들 사용
        const allVectors = await vectorDatabase.getAllVectors();
        logger.info(`벡터 DB에서 ${allVectors.length}개 벡터 로드`);
        
        notesToCompare = allVectors.map(vector => ({
          fileName: vector.metadata.fileName,
          title: vector.metadata.title,
          content: vector.metadata.content,
          embedding: vector.embedding
        }));
      } else {
        // 후보 노트들 임베딩 생성
        const embeddings = await embeddingService.embedBatch(
          notesToCompare.map(note => `${note.title || ''} ${note.content || ''}`)
        );
        
        notesToCompare = notesToCompare.map((note, index) => ({
          ...note,
          embedding: embeddings[index]
        }));
      }
      
      // 유사도 계산
      const similarities = [];
      logger.info(`유사도 계산 시작: ${notesToCompare.length}개 노트 비교`);
      
      for (const note of notesToCompare) {
        if (note.fileName === targetNote.fileName) continue;
        
        const similarity = this.calculateCosineSimilarity(targetEmbedding, note.embedding);
        logger.debug(`유사도 계산: ${note.fileName} = ${similarity}`);
        
        if (similarity >= config.similarityThreshold) {
          const breakdown = this.calculateSimilarityBreakdown(targetNote, note);
          
          similarities.push({
            note: {
              fileName: note.fileName,
              title: note.title,
              content: note.content
            },
            similarity,
            breakdown
          });
        }
      }
      
      logger.info(`임계값 ${config.similarityThreshold} 이상 유사도: ${similarities.length}개`);
      
      // 유사도 순으로 정렬
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      // 상위 결과만 반환
      const recommendations = similarities.slice(0, config.maxRecommendations);
      
      logger.info('유사노트 추천 완료:', recommendations.length, '개 추천');
      
      return {
        success: true,
        data: {
          recommendations,
          totalCandidates: notesToCompare.length,
          threshold: config.similarityThreshold
        }
      };
    } catch (error) {
      logger.error('유사노트 추천 실패:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 백링크 제안
   * @param {Object} targetNote - 대상 노트
   * @param {Array} allNotes - 모든 노트들
   * @param {Object} options - 옵션
   */
  async suggestBacklinks(targetNote, allNotes = [], options = {}) {
    try {
      logger.info('백링크 제안 시작:', targetNote.title || targetNote.fileName);
      
      const config = { ...this.config, ...options };
      
      // 먼저 유사 노트 찾기
      const similarNotesResult = await this.findSimilarNotes(targetNote, allNotes, config);
      
      if (!similarNotesResult.success) {
        return similarNotesResult;
      }
      
      const suggestions = [];
      
      for (const recommendation of similarNotesResult.data.recommendations) {
        const reason = this.generateBacklinkReason(targetNote, recommendation.note, recommendation.similarity);
        
        suggestions.push({
          sourceNote: {
            title: targetNote.title || targetNote.fileName,
            fileName: targetNote.fileName
          },
          targetNote: {
            title: recommendation.note.title,
            fileName: recommendation.note.fileName
          },
          similarity: recommendation.similarity,
          reason,
          suggestedLink: `[[${recommendation.note.title}]]`
        });
      }
      
      logger.info('백링크 제안 완료:', suggestions.length, '개 제안');
      
      return {
        success: true,
        data: {
          suggestions,
          totalCandidates: similarNotesResult.data.totalCandidates
        }
      };
    } catch (error) {
      logger.error('백링크 제안 실패:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 연결 강화 제안
   * @param {Object} targetNote - 대상 노트
   * @param {Array} allNotes - 모든 노트들
   * @param {Object} options - 옵션
   */
  async strengthenConnections(targetNote, allNotes = [], options = {}) {
    try {
      logger.info('연결 강화 제안 시작:', targetNote.title || targetNote.fileName);
      
      const config = { ...this.config, ...options };
      
      // 유사 노트 찾기
      const similarNotesResult = await this.findSimilarNotes(targetNote, allNotes, config);
      
      if (!similarNotesResult.success) {
        return similarNotesResult;
      }
      
      const suggestions = [];
      
      for (const recommendation of similarNotesResult.data.recommendations) {
        const impact = this.calculateConnectionImpact(targetNote, recommendation.note, recommendation.similarity);
        const priority = this.calculatePriority(recommendation.similarity, impact);
        const reason = this.generateConnectionReason(targetNote, recommendation.note, recommendation.similarity);
        
        suggestions.push({
          targetNote: {
            title: recommendation.note.title,
            fileName: recommendation.note.fileName
          },
          similarity: recommendation.similarity,
          reason,
          impact,
          priority,
          suggestedActions: this.generateSuggestedActions(targetNote, recommendation.note)
        });
      }
      
      // 우선순위 순으로 정렬
      suggestions.sort((a, b) => b.priority - a.priority);
      
      logger.info('연결 강화 제안 완료:', suggestions.length, '개 제안');
      
      return {
        success: true,
        data: {
          suggestions,
          totalCandidates: similarNotesResult.data.totalCandidates
        }
      };
    } catch (error) {
      logger.error('연결 강화 제안 실패:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 코사인 유사도 계산
   */
  calculateCosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2) {
      logger.warn('벡터가 null 또는 undefined입니다');
      return 0;
    }
    
    if (vec1.length !== vec2.length) {
      logger.warn(`벡터 차원 불일치: ${vec1.length} vs ${vec2.length}`);
      
      // 차원이 다르면 더 작은 차원에 맞춰서 계산
      const minLength = Math.min(vec1.length, vec2.length);
      vec1 = vec1.slice(0, minLength);
      vec2 = vec2.slice(0, minLength);
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      const val1 = vec1[i] || 0;
      const val2 = vec2[i] || 0;
      
      // NaN이나 Infinity 값 처리
      if (isNaN(val1) || isNaN(val2) || !isFinite(val1) || !isFinite(val2)) {
        continue;
      }
      
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }
    
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }
    
    const similarity = dotProduct / (norm1 * norm2);
    
    // NaN이나 Infinity 값 처리
    if (isNaN(similarity) || !isFinite(similarity)) {
      return 0;
    }
    
    return Math.max(0, Math.min(1, similarity)); // 0-1 범위로 제한
  }

  /**
   * 유사도 세부 분석
   */
  calculateSimilarityBreakdown(targetNote, candidateNote) {
    // 간단한 텍스트 기반 유사도 계산
    const targetText = `${targetNote.title || ''} ${targetNote.content || ''}`.toLowerCase();
    const candidateText = `${candidateNote.title || ''} ${candidateNote.content || ''}`.toLowerCase();
    
    const targetWords = targetText.split(/\s+/);
    const candidateWords = candidateText.split(/\s+/);
    
    const commonWords = targetWords.filter(word => candidateWords.includes(word));
    const contentSimilarity = commonWords.length / Math.max(targetWords.length, candidateWords.length);
    
    // 제목 유사도 (간단한 문자 기반 계산)
    const titleSimilarity = targetNote.title && candidateNote.title 
      ? this.calculateSimpleTextSimilarity(
          targetNote.title.toLowerCase(),
          candidateNote.title.toLowerCase()
        )
      : 0;
    
    // 태그 유사도 (간단한 키워드 기반)
    const targetKeywords = this.extractKeywords(targetText);
    const candidateKeywords = this.extractKeywords(candidateText);
    const commonKeywords = targetKeywords.filter(kw => candidateKeywords.includes(kw));
    const tagSimilarity = commonKeywords.length / Math.max(targetKeywords.length, candidateKeywords.length);
    
    return {
      content: contentSimilarity,
      title: titleSimilarity,
      tags: tagSimilarity
    };
  }

  /**
   * 간단한 텍스트 유사도 계산
   */
  calculateSimpleTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const chars1 = text1.split('');
    const chars2 = text2.split('');
    
    const commonChars = chars1.filter(char => chars2.includes(char));
    return commonChars.length / Math.max(chars1.length, chars2.length);
  }

  /**
   * 키워드 추출
   */
  extractKeywords(text) {
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = {};
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * 백링크 이유 생성
   */
  generateBacklinkReason(targetNote, candidateNote, similarity) {
    const similarityPercent = Math.round(similarity * 100);
    
    if (similarity > 0.8) {
      return `높은 유사도(${similarityPercent}%)로 인해 강력한 연결이 예상됩니다.`;
    } else if (similarity > 0.6) {
      return `중간 유사도(${similarityPercent}%)로 인해 유용한 참조가 될 수 있습니다.`;
    } else {
      return `유사도(${similarityPercent}%)로 인해 관련 정보를 제공할 수 있습니다.`;
    }
  }

  /**
   * 연결 이유 생성
   */
  generateConnectionReason(targetNote, candidateNote, similarity) {
    const similarityPercent = Math.round(similarity * 100);
    
    if (similarity > 0.8) {
      return `매우 높은 유사도(${similarityPercent}%)로 인해 강력한 지식 연결을 형성할 수 있습니다.`;
    } else if (similarity > 0.6) {
      return `높은 유사도(${similarityPercent}%)로 인해 지식 네트워크를 강화할 수 있습니다.`;
    } else {
      return `유사도(${similarityPercent}%)로 인해 새로운 관점을 제공할 수 있습니다.`;
    }
  }

  /**
   * 연결 영향도 계산
   */
  calculateConnectionImpact(targetNote, candidateNote, similarity) {
    const baseImpact = similarity * 100;
    
    // 제목 길이에 따른 보정
    const titleLengthBonus = Math.min((candidateNote.title?.length || 0) / 50, 0.2);
    
    // 내용 길이에 따른 보정
    const contentLengthBonus = Math.min((candidateNote.content?.length || 0) / 1000, 0.3);
    
    return Math.min(baseImpact + titleLengthBonus + contentLengthBonus, 100);
  }

  /**
   * 우선순위 계산
   */
  calculatePriority(similarity, impact) {
    return (similarity * 0.7) + (impact / 100 * 0.3);
  }

  /**
   * 제안 액션 생성
   */
  generateSuggestedActions(targetNote, candidateNote) {
    return [
      `[[${candidateNote.title}]] 링크 추가`,
      '관련 섹션에 참조 추가',
      '공통 태그 설정',
      '요약 정보 교환'
    ];
  }
}

export default new RecommendationService(); 