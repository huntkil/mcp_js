import embeddingService from './embeddingService.js';
import logger from '../utils/logger.js';

class RecommendationService {
  /**
   * 특정 노트에 대한 유사노트 추천
   * @param {Object} targetNote - 대상 노트
   * @param {Array} candidateNotes - 후보 노트들
   * @param {Object} options - 추천 옵션
   */
  async recommendSimilarNotes(targetNote, candidateNotes, options = {}) {
    try {
      const {
        maxRecommendations = 5,
        similarityThreshold = 0.3, // 낮춘 임계값
        excludeSelf = true,
        weightFactors = {
          content: 0.6,
          tags: 0.3,
          title: 0.1
        }
      } = options;

      if (!targetNote || !candidateNotes || candidateNotes.length === 0) {
        return {
          success: false,
          error: '대상 노트와 후보 노트들이 필요합니다.',
          recommendations: []
        };
      }

      logger.info(`[RECOMMENDATION_START] ${targetNote.title || targetNote.fileName}`);

      // 1. 모든 노트 임베딩 (배치 처리)
      const allContents = [targetNote.content || '', ...candidateNotes.map(n => n.content || '')];
      const allEmbeddings = await embeddingService.embedBatch(allContents);
      
      const targetEmbedding = allEmbeddings[0];
      const candidateEmbeddings = allEmbeddings.slice(1);

      // 2. 후보 노트들과 유사도 계산
      const recommendations = [];
      
      for (let i = 0; i < candidateNotes.length; i++) {
        const candidate = candidateNotes[i];
        
        // 자기 자신 제외
        if (excludeSelf && candidate.fileName === targetNote.fileName) {
          continue;
        }

        const candidateEmbedding = candidateEmbeddings[i];

        // 콘텐츠 유사도
        const contentSimilarity = this.cosineSimilarity(targetEmbedding, candidateEmbedding);
        
        // 태그 유사도
        const tagSimilarity = this.calculateTagSimilarity(
          targetNote.tags || [],
          candidate.tags || []
        );
        
        // 제목 유사도
        const titleSimilarity = this.calculateTitleSimilarity(
          targetNote.title || targetNote.fileName || '',
          candidate.title || candidate.fileName || ''
        );

        // 가중 평균 유사도
        const weightedSimilarity = 
          contentSimilarity * weightFactors.content +
          tagSimilarity * weightFactors.tags +
          titleSimilarity * weightFactors.title;

        logger.info(`[SIMILARITY_CALC] ${candidate.title || candidate.fileName} - content: ${contentSimilarity.toFixed(3)}, tags: ${tagSimilarity.toFixed(3)}, title: ${titleSimilarity.toFixed(3)}, weighted: ${weightedSimilarity.toFixed(3)}`);

        if (weightedSimilarity >= similarityThreshold) {
          recommendations.push({
            note: candidate,
            similarity: weightedSimilarity,
            breakdown: {
              content: contentSimilarity,
              tags: tagSimilarity,
              title: titleSimilarity
            }
          });
        }
      }

      // 3. 유사도 순으로 정렬
      recommendations.sort((a, b) => b.similarity - a.similarity);
      
      // 4. 상위 추천만 반환
      const topRecommendations = recommendations.slice(0, maxRecommendations);

      logger.info(`[RECOMMENDATION_COMPLETE] ${topRecommendations.length} recommendations found`);

      return {
        success: true,
        targetNote: {
          title: targetNote.title || targetNote.fileName,
          fileName: targetNote.fileName
        },
        recommendations: topRecommendations,
        metadata: {
          totalCandidates: candidateNotes.length,
          similarityThreshold,
          weightFactors
        }
      };

    } catch (error) {
      logger.error('유사노트 추천 실패:', error);
      return {
        success: false,
        error: error.message,
        recommendations: []
      };
    }
  }

  /**
   * 자동 백링크 생성 제안
   * @param {Object} targetNote - 대상 노트
   * @param {Array} allNotes - 전체 노트들
   * @param {Object} options - 백링크 옵션
   */
  async suggestBacklinks(targetNote, allNotes, options = {}) {
    try {
      const {
        maxSuggestions = 10,
        similarityThreshold = 0.3, // 낮춘 임계값
        includeExisting = false
      } = options;

      logger.info(`[BACKLINK_START] ${targetNote.title || targetNote.fileName}`);

      // 1. 기존 백링크 확인
      const existingBacklinks = this.extractExistingBacklinks(targetNote);
      
      // 2. 유사노트 추천
      const similarNotes = await this.recommendSimilarNotes(
        targetNote, 
        allNotes, 
        { 
          maxRecommendations: maxSuggestions * 2,
          similarityThreshold,
          excludeSelf: true
        }
      );

      if (!similarNotes.success) {
        return similarNotes;
      }

      // 3. 백링크 제안 생성
      const backlinkSuggestions = [];
      
      for (const rec of similarNotes.recommendations) {
        const candidateNote = rec.note;
        
        // 이미 백링크가 있는지 확인
        const hasBacklink = existingBacklinks.some(link => 
          link.targetFile === candidateNote.fileName
        );

        if (!hasBacklink || includeExisting) {
          backlinkSuggestions.push({
            sourceNote: {
              title: targetNote.title || targetNote.fileName,
              fileName: targetNote.fileName
            },
            targetNote: {
              title: candidateNote.title || candidateNote.fileName,
              fileName: candidateNote.fileName
            },
            similarity: rec.similarity,
            reason: this.generateBacklinkReason(rec),
            suggestedLink: `[[${candidateNote.title || candidateNote.fileName}]]`
          });
        }
      }

      // 4. 유사도 순으로 정렬
      backlinkSuggestions.sort((a, b) => b.similarity - a.similarity);
      
      const topSuggestions = backlinkSuggestions.slice(0, maxSuggestions);

      logger.info(`[BACKLINK_COMPLETE] ${topSuggestions.length} suggestions found`);

      return {
        success: true,
        targetNote: {
          title: targetNote.title || targetNote.fileName,
          fileName: targetNote.fileName
        },
        existingBacklinks: existingBacklinks,
        suggestions: topSuggestions,
        metadata: {
          totalNotes: allNotes.length,
          similarityThreshold
        }
      };

    } catch (error) {
      logger.error('백링크 제안 실패:', error);
      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  }

  /**
   * 노트 연결 강화 (백링크 자동 생성)
   * @param {Object} targetNote - 대상 노트
   * @param {Array} allNotes - 전체 노트들
   * @param {Object} options - 연결 강화 옵션
   */
  async strengthenConnections(targetNote, allNotes, options = {}) {
    try {
      const {
        maxConnections = 5,
        similarityThreshold = 0.3, // 낮춘 임계값
        autoCreateBacklinks = false
      } = options;

      logger.info(`[CONNECTION_STRENGTHEN_START] ${targetNote.title || targetNote.fileName}`);

      // 1. 백링크 제안
      const backlinkResult = await this.suggestBacklinks(
        targetNote,
        allNotes,
        {
          maxSuggestions: maxConnections,
          similarityThreshold,
          includeExisting: false
        }
      );

      if (!backlinkResult.success) {
        return backlinkResult;
      }

      // 2. 연결 강화 제안 생성
      const strengtheningSuggestions = backlinkResult.suggestions.map(suggestion => ({
        ...suggestion,
        action: 'add_backlink',
        impact: this.calculateConnectionImpact(suggestion.similarity),
        priority: this.calculatePriority(suggestion.similarity, suggestion.reason)
      }));

      // 3. 우선순위 순으로 정렬
      strengtheningSuggestions.sort((a, b) => b.priority - a.priority);

      logger.info(`[CONNECTION_STRENGTHEN_COMPLETE] ${strengtheningSuggestions.length} suggestions found`);

      return {
        success: true,
        targetNote: {
          title: targetNote.title || targetNote.fileName,
          fileName: targetNote.fileName
        },
        suggestions: strengtheningSuggestions,
        summary: {
          totalSuggestions: strengtheningSuggestions.length,
          highImpact: strengtheningSuggestions.filter(s => s.impact === 'high').length,
          mediumImpact: strengtheningSuggestions.filter(s => s.impact === 'medium').length,
          lowImpact: strengtheningSuggestions.filter(s => s.impact === 'low').length
        }
      };

    } catch (error) {
      logger.error('노트 연결 강화 실패:', error);
      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  }

  /**
   * 코사인 유사도 계산
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * 태그 유사도 계산
   */
  calculateTagSimilarity(tagsA, tagsB) {
    if (tagsA.length === 0 && tagsB.length === 0) return 1.0;
    if (tagsA.length === 0 || tagsB.length === 0) return 0.0;

    const setA = new Set(tagsA);
    const setB = new Set(tagsB);
    
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    return intersection.size / union.size;
  }

  /**
   * 제목 유사도 계산
   */
  calculateTitleSimilarity(titleA, titleB) {
    if (!titleA || !titleB) return 0.0;
    
    const wordsA = titleA.toLowerCase().split(/\s+/);
    const wordsB = titleB.toLowerCase().split(/\s+/);
    
    const setA = new Set(wordsA);
    const setB = new Set(wordsB);
    
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    return union.size > 0 ? intersection.size / union.size : 0.0;
  }

  /**
   * 기존 백링크 추출
   */
  extractExistingBacklinks(note) {
    const backlinks = [];
    const content = note.content || '';
    
    // [[링크]] 패턴 찾기
    const linkPattern = /\[\[([^\]]+)\]\]/g;
    let match;
    
    while ((match = linkPattern.exec(content)) !== null) {
      backlinks.push({
        targetFile: match[1].trim(),
        position: match.index,
        fullMatch: match[0]
      });
    }
    
    return backlinks;
  }

  /**
   * 백링크 이유 생성
   */
  generateBacklinkReason(recommendation) {
    const { breakdown } = recommendation;
    
    if (breakdown.content > 0.8) {
      return '매우 유사한 콘텐츠';
    } else if (breakdown.content > 0.6) {
      return '유사한 콘텐츠';
    } else if (breakdown.tags > 0.5) {
      return '공통 태그';
    } else if (breakdown.title > 0.3) {
      return '유사한 제목';
    } else {
      return '일반적인 유사성';
    }
  }

  /**
   * 연결 영향도 계산
   */
  calculateConnectionImpact(similarity) {
    if (similarity > 0.8) return 'high';
    if (similarity > 0.6) return 'medium';
    return 'low';
  }

  /**
   * 우선순위 계산
   */
  calculatePriority(similarity, reason) {
    let basePriority = similarity;
    
    // 이유에 따른 가중치
    if (reason.includes('매우 유사한')) basePriority += 0.2;
    if (reason.includes('공통 태그')) basePriority += 0.1;
    
    return Math.min(basePriority, 1.0);
  }
}

export default new RecommendationService(); 