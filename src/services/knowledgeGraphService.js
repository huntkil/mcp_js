import embeddingService from './embeddingService.js';
import logger from '../utils/logger.js';

class KnowledgeGraphService {
  /**
   * 노트 배열에서 지식 그래프(노드/엣지) 생성
   * @param {Array} notes - 노트 배열 [{title, content, tags, ...}]
   * @param {Object} options - {similarityThreshold, maxNeighbors, linkTypes}
   * @returns {Object} {nodes, edges}
   */
  async buildGraph(notes, options = {}) {
    const {
      similarityThreshold = 0.7,
      maxNeighbors = 5,
      linkTypes = ['link', 'tag', 'similarity']
    } = options;

    // 1. 노드 생성
    const nodes = notes.map((note, idx) => ({
      id: idx,
      title: note.title || note.fileName || `Note${idx}`,
      tags: note.tags || [],
      fileName: note.fileName,
      group: 1
    }));

    // 2. 링크 기반 엣지
    let edges = [];
    if (linkTypes.includes('link')) {
      edges = edges.concat(this.extractLinkEdges(notes));
    }

    // 3. 태그 기반 엣지
    if (linkTypes.includes('tag')) {
      edges = edges.concat(this.extractTagEdges(notes));
    }

    // 4. 유사도 기반 엣지
    if (linkTypes.includes('similarity')) {
      const simEdges = await this.extractSimilarityEdges(notes, similarityThreshold, maxNeighbors);
      edges = edges.concat(simEdges);
    }

    // 5. 중복 제거
    const edgeSet = new Set();
    const uniqueEdges = [];
    for (const edge of edges) {
      const key = `${edge.source}-${edge.target}-${edge.type}`;
      if (!edgeSet.has(key) && edge.source !== edge.target) {
        edgeSet.add(key);
        uniqueEdges.push(edge);
      }
    }

    return { nodes, edges: uniqueEdges };
  }

  /**
   * [[링크]] 기반 엣지 추출
   */
  extractLinkEdges(notes) {
    const titleToIdx = {};
    notes.forEach((note, idx) => {
      titleToIdx[note.title || note.fileName] = idx;
    });
    const edges = [];
    notes.forEach((note, idx) => {
      const linkPattern = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = linkPattern.exec(note.content || '')) !== null) {
        const targetTitle = match[1].trim();
        if (titleToIdx[targetTitle] !== undefined) {
          edges.push({ source: idx, target: titleToIdx[targetTitle], type: 'link' });
        }
      }
    });
    return edges;
  }

  /**
   * 태그 기반 엣지 추출
   */
  extractTagEdges(notes) {
    const tagToIdxs = {};
    notes.forEach((note, idx) => {
      (note.tags || []).forEach(tag => {
        if (!tagToIdxs[tag]) tagToIdxs[tag] = [];
        tagToIdxs[tag].push(idx);
      });
    });
    const edges = [];
    Object.values(tagToIdxs).forEach(idxs => {
      if (idxs.length > 1) {
        for (let i = 0; i < idxs.length; i++) {
          for (let j = i + 1; j < idxs.length; j++) {
            edges.push({ source: idxs[i], target: idxs[j], type: 'tag' });
          }
        }
      }
    });
    return edges;
  }

  /**
   * 임베딩 유사도 기반 엣지 추출
   */
  async extractSimilarityEdges(notes, threshold, maxNeighbors) {
    // 1. 임베딩 계산
    const contents = notes.map(n => n.content || '');
    const embeddings = await embeddingService.embedBatch(contents);
    // 2. pairwise similarity
    const edges = [];
    for (let i = 0; i < embeddings.length; i++) {
      const sims = [];
      for (let j = 0; j < embeddings.length; j++) {
        if (i === j) continue;
        const sim = this.cosineSimilarity(embeddings[i], embeddings[j]);
        if (sim >= threshold) {
          sims.push({ idx: j, sim });
        }
      }
      // 상위 maxNeighbors만
      sims.sort((a, b) => b.sim - a.sim);
      sims.slice(0, maxNeighbors).forEach(({ idx, sim }) => {
        edges.push({ source: i, target: idx, type: 'similarity', weight: sim });
      });
    }
    return edges;
  }

  cosineSimilarity(vecA, vecB) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  }
}

export default new KnowledgeGraphService(); 