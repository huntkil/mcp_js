/* global describe, test, expect */
import advancedFeatures from '../services/advancedFeatures.js';

describe('Advanced Features Tests', () => {
  describe('Auto Summarization', () => {
    test('should generate summary successfully', async () => {
      const content = `
        AI 기술은 현대 사회에서 매우 중요한 역할을 하고 있습니다. 
        머신러닝과 딥러닝은 AI의 핵심 기술로, 다양한 분야에서 활용되고 있습니다.
        자연어 처리, 컴퓨터 비전, 음성 인식 등은 AI의 주요 응용 분야입니다.
        이러한 기술들은 의료, 금융, 교육, 교통 등 다양한 산업에서 혁신을 가져오고 있습니다.
        AI의 발전은 인공지능의 윤리적 문제와 함께 사회적 논의의 중심에 서 있습니다.
      `;
      
      const result = await advancedFeatures.generateSummary(content, {
        maxLength: 150,
        style: 'concise'
      });
      
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe('string');
      expect(result.summary.length).toBeLessThanOrEqual(150);
      expect(result.keywords).toBeDefined();
      expect(Array.isArray(result.keywords)).toBe(true);
      expect(result.originalLength).toBe(content.length);
      expect(result.summaryLength).toBe(result.summary.length);
      expect(result.compressionRatio).toBeDefined();
      expect(result.style).toBe('concise');
    });
    
    test('should handle empty content', async () => {
      const result = await advancedFeatures.generateSummary('', {
        maxLength: 100
      });
      
      expect(result).toBeDefined();
      expect(result.summary).toBe('');
      expect(result.keywords).toEqual([]);
      expect(result.originalLength).toBe(0);
      expect(result.summaryLength).toBe(0);
    });
    
    test('should respect maxLength parameter', async () => {
      const content = 'This is a very long content that should be summarized to a specific length. '.repeat(10);
      const maxLength = 50;
      
      const result = await advancedFeatures.generateSummary(content, {
        maxLength
      });
      
      expect(result.summary.length).toBeLessThanOrEqual(maxLength);
    });
  });
  
  describe('Smart Tagging', () => {
    test('should generate smart tags successfully', async () => {
      const content = `
        AI 기술과 머신러닝에 대한 연구 내용입니다.
        자연어 처리와 컴퓨터 비전 기술을 활용한 프로젝트를 진행하고 있습니다.
        딥러닝 모델을 사용하여 이미지 분류 작업을 수행합니다.
      `;
      
      const result = await advancedFeatures.generateSmartTags(content, {
        maxTags: 8,
        confidence: 0.7
      });
      
      expect(result).toBeDefined();
      expect(result.tags).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);
      expect(result.tags.length).toBeLessThanOrEqual(8);
      expect(result.detailedTags).toBeDefined();
      expect(Array.isArray(result.detailedTags)).toBe(true);
      expect(result.categorizedTags).toBeDefined();
      expect(result.totalTags).toBe(result.tags.length);
      expect(result.averageConfidence).toBeDefined();
    });
    
    test('should filter tags by confidence threshold', async () => {
      const content = 'AI technology machine learning deep learning';
      
      const result = await advancedFeatures.generateSmartTags(content, {
        maxTags: 10,
        confidence: 0.9
      });
      
      expect(result.detailedTags.every(tag => tag.confidence >= 0.9)).toBe(true);
    });
    
    test('should handle content with no meaningful words', async () => {
      const content = 'the and or but if then else';
      
      const result = await advancedFeatures.generateSmartTags(content, {
        maxTags: 5,
        confidence: 0.5
      });
      
      expect(result.tags.length).toBe(0);
      expect(result.detailedTags.length).toBe(0);
    });
  });
  
  describe('Note Similarity', () => {
    const testNotes = [
      {
        id: 'note1',
        title: 'AI Research',
        content: 'AI technology and machine learning research',
        tags: ['ai', 'research', 'technology']
      },
      {
        id: 'note2',
        title: 'Machine Learning Basics',
        content: 'Introduction to machine learning algorithms',
        tags: ['ml', 'algorithms', 'basics']
      },
      {
        id: 'note3',
        title: 'Web Development',
        content: 'JavaScript and React development',
        tags: ['web', 'javascript', 'react']
      }
    ];
    
    test('should find similar notes by content', async () => {
      const result = await advancedFeatures.findSimilarNotes('note1', testNotes, {
        threshold: 0.3,
        maxResults: 2,
        method: 'content'
      });
      
      expect(result).toBeDefined();
      expect(result.similarNotes).toBeDefined();
      expect(Array.isArray(result.similarNotes)).toBe(true);
      expect(result.similarNotes.length).toBeLessThanOrEqual(2);
      expect(result.method).toBe('content');
      expect(result.threshold).toBe(0.3);
    });
    
    test('should find similar notes by tags', async () => {
      const result = await advancedFeatures.findSimilarNotes('note1', testNotes, {
        threshold: 0.1,
        maxResults: 3,
        method: 'tags'
      });
      
      expect(result).toBeDefined();
      expect(result.similarNotes).toBeDefined();
      expect(Array.isArray(result.similarNotes)).toBe(true);
      expect(result.method).toBe('tags');
    });
    
    test('should find similar notes using hybrid method', async () => {
      const result = await advancedFeatures.findSimilarNotes('note1', testNotes, {
        threshold: 0.2,
        maxResults: 2,
        method: 'hybrid'
      });
      
      expect(result).toBeDefined();
      expect(result.similarNotes).toBeDefined();
      expect(result.method).toBe('hybrid');
    });
    
    test('should handle non-existent note ID', async () => {
      await expect(
        advancedFeatures.findSimilarNotes('nonexistent', testNotes, {
          threshold: 0.5
        })
      ).rejects.toThrow('기준 노트를 찾을 수 없습니다.');
    });
  });
  
  describe('Knowledge Graph', () => {
    const testNotes = [
      {
        id: 'note1',
        title: 'AI Research',
        content: 'AI technology research',
        tags: ['ai', 'research'],
        links: ['note2']
      },
      {
        id: 'note2',
        title: 'Machine Learning',
        content: 'Machine learning algorithms',
        tags: ['ml', 'algorithms'],
        links: ['note1', 'note3']
      },
      {
        id: 'note3',
        title: 'Deep Learning',
        content: 'Deep learning models',
        tags: ['dl', 'models'],
        links: ['note2']
      }
    ];
    
    test('should generate knowledge graph successfully', async () => {
      const result = await advancedFeatures.generateKnowledgeGraph(testNotes, {
        includeTags: true,
        includeLinks: true,
        maxConnections: 5
      });
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(result.edges).toBeDefined();
      expect(Array.isArray(result.edges)).toBe(true);
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalNodes).toBe(testNotes.length);
    });
    
    test('should generate graph with only tag connections', async () => {
      const result = await advancedFeatures.generateKnowledgeGraph(testNotes, {
        includeTags: true,
        includeLinks: false,
        maxConnections: 3
      });
      
      expect(result).toBeDefined();
      expect(result.nodes.length).toBe(testNotes.length);
      expect(result.edges.length).toBeGreaterThan(0);
    });
    
    test('should generate graph with only link connections', async () => {
      const result = await advancedFeatures.generateKnowledgeGraph(testNotes, {
        includeTags: false,
        includeLinks: true,
        maxConnections: 3
      });
      
      expect(result).toBeDefined();
      expect(result.nodes.length).toBe(testNotes.length);
    });
  });
  
  describe('Auto Backlinks', () => {
    const testNotes = [
      {
        id: 'note1',
        title: 'AI Research',
        content: 'AI technology and machine learning research',
        tags: ['ai', 'research']
      },
      {
        id: 'note2',
        title: 'Machine Learning',
        content: 'Machine learning algorithms and AI applications',
        tags: ['ml', 'ai', 'algorithms']
      },
      {
        id: 'note3',
        title: 'Web Development',
        content: 'JavaScript and React development',
        tags: ['web', 'javascript']
      }
    ];
    
    test('should generate auto backlinks successfully', async () => {
      const result = await advancedFeatures.generateAutoBacklinks('note1', testNotes, {
        includeContent: true,
        includeTags: true
      });
      
      expect(result).toBeDefined();
      expect(result.targetNote).toBe('note1');
      expect(result.backlinks).toBeDefined();
      expect(Array.isArray(result.backlinks)).toBe(true);
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalBacklinks).toBe(result.backlinks.length);
    });
    
    test('should generate content-based backlinks only', async () => {
      const result = await advancedFeatures.generateAutoBacklinks('note1', testNotes, {
        includeContent: true,
        includeTags: false
      });
      
      expect(result).toBeDefined();
      expect(result.backlinks.every(link => link.type === 'content')).toBe(true);
    });
    
    test('should generate tag-based backlinks only', async () => {
      const result = await advancedFeatures.generateAutoBacklinks('note1', testNotes, {
        includeContent: false,
        includeTags: true
      });
      
      expect(result).toBeDefined();
      expect(result.backlinks.every(link => link.type === 'tags')).toBe(true);
    });
  });
  
  describe('Smart Templates', () => {
    test('should generate meeting template', async () => {
      const context = {
        project: 'AI Research Project',
        participants: ['John', 'Jane'],
        date: '2024-01-15'
      };
      
      const result = await advancedFeatures.generateSmartTemplate('meeting', context, {
        customFields: {
          agenda: ['Project Update', 'Next Steps'],
          actionItems: true
        }
      });
      
      expect(result).toBeDefined();
      expect(result.templateType).toBe('meeting');
      expect(result.template).toBeDefined();
      expect(typeof result.template).toBe('string');
      expect(result.context).toEqual(context);
      expect(result.customFields).toBeDefined();
    });
    
    test('should generate project template', async () => {
      const context = {
        projectName: 'Web Application',
        team: ['Developer', 'Designer'],
        timeline: '3 months'
      };
      
      const result = await advancedFeatures.generateSmartTemplate('project', context);
      
      expect(result).toBeDefined();
      expect(result.templateType).toBe('project');
      expect(result.template).toBeDefined();
      expect(result.template).toContain('Web Application');
    });
    
    test('should generate daily note template', async () => {
      const context = {
        date: '2024-01-15',
        weather: 'Sunny'
      };
      
      const result = await advancedFeatures.generateSmartTemplate('daily', context);
      
      expect(result).toBeDefined();
      expect(result.templateType).toBe('daily');
      expect(result.template).toBeDefined();
      expect(result.template).toContain('2024-01-15');
    });
    
    test('should handle unknown template type', async () => {
      await expect(
        advancedFeatures.generateSmartTemplate('unknown', {})
      ).rejects.toThrow('지원하지 않는 템플릿 타입: unknown');
    });
  });
  
  describe('Feature Configuration', () => {
    test('should have default feature states', () => {
      expect(advancedFeatures.features).toBeDefined();
      expect(advancedFeatures.features.autoSummarization).toBe(false);
      expect(advancedFeatures.features.smartTagging).toBe(false);
      expect(advancedFeatures.features.noteSimilarity).toBe(false);
      expect(advancedFeatures.features.knowledgeGraph).toBe(false);
      expect(advancedFeatures.features.autoBacklinks).toBe(false);
      expect(advancedFeatures.features.smartTemplates).toBe(false);
    });
    
    test('should have default configuration', () => {
      expect(advancedFeatures.config).toBeDefined();
      expect(advancedFeatures.config.summaryLength).toBe(200);
      expect(advancedFeatures.config.similarityThreshold).toBe(0.7);
      expect(advancedFeatures.config.maxSimilarNotes).toBe(5);
      expect(advancedFeatures.config.autoTagConfidence).toBe(0.8);
    });
  });
  
  describe('Utility Functions', () => {
    test('should identify stop words correctly', () => {
      expect(advancedFeatures.isStopWord('the')).toBe(true);
      expect(advancedFeatures.isStopWord('and')).toBe(true);
      expect(advancedFeatures.isStopWord('technology')).toBe(false);
      expect(advancedFeatures.isStopWord('ai')).toBe(false);
    });
    
    test('should categorize tags correctly', () => {
      const tags = [
        { tag: 'ai', confidence: 0.9 },
        { tag: 'technology', confidence: 0.8 },
        { tag: 'research', confidence: 0.7 }
      ];
      
      const categorized = advancedFeatures.categorizeTags(tags);
      
      expect(categorized).toBeDefined();
      expect(typeof categorized).toBe('object');
    });
    
    test('should calculate content similarity', () => {
      const content1 = 'AI technology research';
      const content2 = 'AI and machine learning research';
      
      const similarity = advancedFeatures.calculateContentSimilarity(content1, content2);
      
      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
    
    test('should calculate tag similarity', () => {
      const tags1 = ['ai', 'research', 'technology'];
      const tags2 = ['ai', 'ml', 'algorithms'];
      
      const similarity = advancedFeatures.calculateTagSimilarity(tags1, tags2);
      
      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });
}); 