import logger from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

class PersonalizedInsightsService {
  constructor() {
    this.logger = logger;
  }

  /**
   * 개인화 인사이트 생성
   */
  async generatePersonalizedInsights(vaultPath, userProfile = {}, options = {}) {
    try {
      this.logger.info('개인화 인사이트 생성 시작');
      
      const insights = {
        learningAdvice: await this.generateLearningAdvice(vaultPath, userProfile),
        knowledgeGaps: await this.analyzeKnowledgeGaps(vaultPath, userProfile),
        learningRoadmap: await this.createLearningRoadmap(vaultPath, userProfile),
        personalizedRecommendations: await this.generatePersonalizedRecommendations(vaultPath, userProfile),
        goalTracking: await this.analyzeGoalProgress(vaultPath, userProfile)
      };

      this.logger.info('개인화 인사이트 생성 완료');
      return {
        success: true,
        data: insights
      };
    } catch (error) {
      this.logger.error('개인화 인사이트 생성 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * AI 기반 학습 조언 생성
   */
  async generateLearningAdvice(vaultPath, userProfile) {
    try {
      const files = await this.getMarkdownFiles(vaultPath);
      const analysis = await this.analyzeLearningPatterns(files);
      
      const advice = {
        writingHabits: this.analyzeWritingHabits(analysis),
        studyTechniques: this.recommendStudyTechniques(analysis),
        improvementAreas: this.identifyImprovementAreas(analysis),
        motivationTips: this.generateMotivationTips(analysis)
      };

      return advice;
    } catch (error) {
      this.logger.error('학습 조언 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 지식 갭 분석
   */
  async analyzeKnowledgeGaps(vaultPath, userProfile) {
    try {
      const files = await this.getMarkdownFiles(vaultPath);
      const topics = await this.extractAllTopics(files);
      const connections = await this.analyzeTopicConnections(files);
      
      const gaps = {
        missingTopics: this.findMissingTopics(topics, userProfile.interests || []),
        weakConnections: this.identifyWeakConnections(connections),
        depthGaps: this.analyzeDepthGaps(files),
        interdisciplinaryGaps: this.findInterdisciplinaryGaps(topics, connections)
      };

      return gaps;
    } catch (error) {
      this.logger.error('지식 갭 분석 오류:', error);
      throw error;
    }
  }

  /**
   * 학습 로드맵 생성
   */
  async createLearningRoadmap(vaultPath, userProfile) {
    try {
      const files = await this.getMarkdownFiles(vaultPath);
      const currentKnowledge = await this.assessCurrentKnowledge(files);
      const gaps = await this.analyzeKnowledgeGaps(vaultPath, userProfile);
      
      const roadmap = {
        currentLevel: this.assessCurrentLevel(currentKnowledge),
        shortTermGoals: this.createShortTermGoals(gaps, userProfile),
        mediumTermGoals: this.createMediumTermGoals(gaps, userProfile),
        longTermGoals: this.createLongTermGoals(gaps, userProfile),
        recommendedResources: this.recommendResources(gaps, userProfile),
        timeline: this.createTimeline(gaps, userProfile)
      };

      return roadmap;
    } catch (error) {
      this.logger.error('학습 로드맵 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 개인 맞춤형 추천 생성
   */
  async generatePersonalizedRecommendations(vaultPath, userProfile) {
    try {
      const files = await this.getMarkdownFiles(vaultPath);
      const patterns = await this.analyzeUserPatterns(files, userProfile);
      
      const recommendations = {
        nextNotes: this.recommendNextNotes(files, patterns),
        relatedTopics: this.recommendRelatedTopics(files, patterns),
        studyMethods: this.recommendStudyMethods(patterns),
        resources: this.recommendExternalResources(patterns, userProfile),
        connections: this.recommendNewConnections(files, patterns)
      };

      return recommendations;
    } catch (error) {
      this.logger.error('개인화 추천 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 목표 진행도 분석
   */
  async analyzeGoalProgress(vaultPath, userProfile) {
    try {
      const files = await this.getMarkdownFiles(vaultPath);
      const goals = userProfile.goals || [];
      
      const progress = {
        completedGoals: this.identifyCompletedGoals(goals, files),
        inProgressGoals: this.identifyInProgressGoals(goals, files),
        upcomingGoals: this.identifyUpcomingGoals(goals, files),
        progressMetrics: this.calculateProgressMetrics(goals, files),
        recommendations: this.generateGoalRecommendations(goals, files)
      };

      return progress;
    } catch (error) {
      this.logger.error('목표 진행도 분석 오류:', error);
      throw error;
    }
  }

  // 헬퍼 메서드들
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

  async analyzeLearningPatterns(files) {
    const patterns = {
      totalNotes: files.length,
      averageLength: 0,
      topicDistribution: {},
      writingFrequency: {},
      complexityLevels: []
    };

    let totalLength = 0;
    const topics = {};

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const stats = await fs.stat(file);
      
      totalLength += content.length;
      
      // 주제 분석
      const fileTopics = this.extractTopics(content);
      for (const topic of fileTopics) {
        topics[topic] = (topics[topic] || 0) + 1;
      }

      // 복잡도 분석
      const complexity = this.calculateComplexity(content);
      patterns.complexityLevels.push({
        file: path.basename(file),
        complexity,
        date: stats.mtime
      });
    }

    patterns.averageLength = Math.round(totalLength / files.length);
    patterns.topicDistribution = topics;

    return patterns;
  }

  analyzeWritingHabits(analysis) {
    const habits = [];
    
    if (analysis.totalNotes < 10) {
      habits.push({
        type: 'frequency',
        advice: '노트 작성 빈도를 높여보세요. 일일 학습 내용을 정리하는 습관을 만들어보세요.',
        priority: 'high'
      });
    }

    if (analysis.averageLength < 1000) {
      habits.push({
        type: 'depth',
        advice: '노트의 깊이를 늘려보세요. 개념에 대한 더 자세한 설명과 예시를 추가해보세요.',
        priority: 'medium'
      });
    }

    const complexityTrend = analysis.complexityLevels
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-5);
    
    const isImproving = complexityTrend.every((item, index) => 
      index === 0 || item.complexity >= complexityTrend[index - 1].complexity
    );

    if (!isImproving) {
      habits.push({
        type: 'quality',
        advice: '노트의 품질을 점진적으로 향상시켜보세요. 더 체계적인 구조와 연결을 만들어보세요.',
        priority: 'medium'
      });
    }

    return habits;
  }

  recommendStudyTechniques(analysis) {
    const techniques = [];
    
    const topicCount = Object.keys(analysis.topicDistribution).length;
    
    if (topicCount < 5) {
      techniques.push({
        technique: '주제 확장',
        description: '현재 학습 중인 주제와 관련된 새로운 분야를 탐색해보세요.',
        benefit: '지식의 폭을 넓히고 새로운 관점을 얻을 수 있습니다.'
      });
    }

    if (analysis.averageLength < 1500) {
      techniques.push({
        technique: '심화 학습',
        description: '각 주제에 대해 더 깊이 있는 분석과 연구를 진행해보세요.',
        benefit: '이해도를 높이고 장기 기억에 도움이 됩니다.'
      });
    }

    techniques.push({
      technique: '연결 학습',
      description: '서로 다른 주제 간의 연결점을 찾아 통합적인 이해를 만들어보세요.',
      benefit: '지식의 네트워크를 구축하고 창의적 사고를 촉진합니다.'
    });

    return techniques;
  }

  identifyImprovementAreas(analysis) {
    const areas = [];
    
    const topicDistribution = analysis.topicDistribution;
    const topics = Object.entries(topicDistribution);
    
    if (topics.length > 0) {
      const mostStudied = topics.reduce((max, [topic, count]) => 
        count > max.count ? { topic, count } : max
      );
      
      const leastStudied = topics.reduce((min, [topic, count]) => 
        count < min.count ? { topic, count } : min
      );

      areas.push({
        area: '균형 잡힌 학습',
        current: `${mostStudied.topic}에 집중`,
        recommendation: `${leastStudied.topic} 분야도 함께 학습해보세요.`,
        priority: 'medium'
      });
    }

    if (analysis.averageLength < 1000) {
      areas.push({
        area: '노트 품질',
        current: '짧은 노트 위주',
        recommendation: '더 상세하고 체계적인 노트 작성을 시도해보세요.',
        priority: 'high'
      });
    }

    return areas;
  }

  generateMotivationTips(analysis) {
    const tips = [
      {
        tip: '작은 목표부터 시작',
        description: '매일 하나의 작은 학습 목표를 설정하고 달성해보세요.',
        impact: '지속적인 성취감을 느낄 수 있습니다.'
      },
      {
        tip: '학습 기록 활용',
        description: '정기적으로 학습 진도를 점검하고 성과를 기록해보세요.',
        impact: '진행 상황을 시각적으로 확인할 수 있습니다.'
      },
      {
        tip: '관심 분야 연결',
        description: '새로운 지식을 기존 관심사와 연결시켜 학습해보세요.',
        impact: '더 쉽고 재미있게 학습할 수 있습니다.'
      }
    ];

    return tips;
  }

  async extractAllTopics(files) {
    const allTopics = {};
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const topics = this.extractTopics(content);
      
      for (const topic of topics) {
        if (!allTopics[topic]) {
          allTopics[topic] = { count: 0, files: [] };
        }
        allTopics[topic].count++;
        allTopics[topic].files.push(path.basename(file));
      }
    }
    
    return allTopics;
  }

  async analyzeTopicConnections(files) {
    const connections = {};
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const topics = this.extractTopics(content);
      
      for (let i = 0; i < topics.length; i++) {
        for (let j = i + 1; j < topics.length; j++) {
          const connection = `${topics[i]} ↔ ${topics[j]}`;
          if (!connections[connection]) {
            connections[connection] = { count: 0, files: [] };
          }
          connections[connection].count++;
          connections[connection].files.push(path.basename(file));
        }
      }
    }
    
    return connections;
  }

  findMissingTopics(topics, interests) {
    const missing = [];
    const coveredTopics = Object.keys(topics);
    
    for (const interest of interests) {
      if (!coveredTopics.some(topic => 
        topic.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(topic.toLowerCase())
      )) {
        missing.push({
          interest,
          reason: '관심 분야에 대한 노트가 부족합니다.',
          priority: 'high'
        });
      }
    }
    
    return missing;
  }

  identifyWeakConnections(connections) {
    const weak = [];
    const connectionEntries = Object.entries(connections);
    
    // 연결이 적은 주제들 찾기
    const topicConnections = {};
    for (const [connection, data] of connectionEntries) {
      const [topic1, topic2] = connection.split(' ↔ ');
      
      if (!topicConnections[topic1]) topicConnections[topic1] = 0;
      if (!topicConnections[topic2]) topicConnections[topic2] = 0;
      
      topicConnections[topic1] += data.count;
      topicConnections[topic2] += data.count;
    }
    
    const avgConnections = Object.values(topicConnections).reduce((sum, count) => sum + count, 0) / Object.keys(topicConnections).length;
    
    for (const [topic, count] of Object.entries(topicConnections)) {
      if (count < avgConnections * 0.5) {
        weak.push({
          topic,
          currentConnections: count,
          recommendation: `${topic}과 다른 주제들 간의 연결을 만들어보세요.`
        });
      }
    }
    
    return weak;
  }

  analyzeDepthGaps(files) {
    const depthGaps = [];
    
    // 파일별 복잡도 분석
    const complexities = files.map(file => ({
      file: path.basename(file),
      complexity: this.calculateComplexity(file)
    }));
    
    const avgComplexity = complexities.reduce((sum, item) => sum + item.complexity, 0) / complexities.length;
    
    for (const item of complexities) {
      if (item.complexity < avgComplexity * 0.7) {
        depthGaps.push({
          file: item.file,
          currentDepth: 'shallow',
          recommendation: '더 깊이 있는 분석과 설명을 추가해보세요.'
        });
      }
    }
    
    return depthGaps;
  }

  findInterdisciplinaryGaps(topics, connections) {
    const gaps = [];
    const topicCategories = this.categorizeTopics(topics);
    
    // 학제간 연결이 부족한 분야 찾기
    const categoryConnections = {};
    
    for (const [connection, data] of Object.entries(connections)) {
      const [topic1, topic2] = connection.split(' ↔ ');
      const category1 = this.getTopicCategory(topic1);
      const category2 = this.getTopicCategory(topic2);
      
      if (category1 !== category2) {
        const crossCategory = `${category1} ↔ ${category2}`;
        if (!categoryConnections[crossCategory]) {
          categoryConnections[crossCategory] = 0;
        }
        categoryConnections[crossCategory] += data.count;
      }
    }
    
    // 연결이 적은 학제간 조합 찾기
    const avgCrossConnections = Object.values(categoryConnections).reduce((sum, count) => sum + count, 0) / Object.keys(categoryConnections).length;
    
    for (const [crossCategory, count] of Object.entries(categoryConnections)) {
      if (count < avgCrossConnections * 0.5) {
        gaps.push({
          categories: crossCategory,
          currentConnections: count,
          recommendation: `${crossCategory} 간의 연결을 강화해보세요.`
        });
      }
    }
    
    return gaps;
  }

  async assessCurrentKnowledge(files) {
    const knowledge = {
      totalTopics: 0,
      averageDepth: 0,
      coverageAreas: [],
      strengthAreas: [],
      weakAreas: []
    };
    
    const topics = await this.extractAllTopics(files);
    const complexities = [];
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      complexities.push(this.calculateComplexity(content));
    }
    
    knowledge.totalTopics = Object.keys(topics).length;
    knowledge.averageDepth = Math.round(complexities.reduce((sum, c) => sum + c, 0) / complexities.length);
    
    // 강점 영역 찾기
    const strongTopics = Object.entries(topics)
      .filter(([topic, data]) => data.count >= 3)
      .map(([topic, data]) => ({ topic, strength: data.count }));
    
    knowledge.strengthAreas = strongTopics.slice(0, 5);
    
    // 약점 영역 찾기
    const weakTopics = Object.entries(topics)
      .filter(([topic, data]) => data.count === 1)
      .map(([topic, data]) => ({ topic, weakness: '단일 노트' }));
    
    knowledge.weakAreas = weakTopics.slice(0, 5);
    
    return knowledge;
  }

  assessCurrentLevel(knowledge) {
    const level = {
      beginner: knowledge.totalTopics < 10 || knowledge.averageDepth < 500,
      intermediate: (knowledge.totalTopics >= 10 && knowledge.totalTopics < 30) || (knowledge.averageDepth >= 500 && knowledge.averageDepth < 1000),
      advanced: knowledge.totalTopics >= 30 || knowledge.averageDepth >= 1000
    };
    
    if (level.advanced) return '고급';
    if (level.intermediate) return '중급';
    return '초급';
  }

  createShortTermGoals(gaps, userProfile) {
    const goals = [];
    
    // 지식 갭 기반 목표
    if (gaps.missingTopics.length > 0) {
      goals.push({
        goal: '관심 분야 노트 작성',
        description: `${gaps.missingTopics[0].interest}에 대한 첫 번째 노트를 작성하세요.`,
        timeline: '1주',
        priority: 'high'
      });
    }
    
    if (gaps.weakConnections.length > 0) {
      goals.push({
        goal: '연결 강화',
        description: `${gaps.weakConnections[0].topic}과 다른 주제 간의 연결을 만들어보세요.`,
        timeline: '2주',
        priority: 'medium'
      });
    }
    
    return goals;
  }

  createMediumTermGoals(gaps, userProfile) {
    const goals = [];
    
    goals.push({
      goal: '지식 체계화',
      description: '현재 학습한 내용을 체계적으로 정리하고 연결을 강화하세요.',
      timeline: '1개월',
      priority: 'high'
    });
    
    if (gaps.depthGaps.length > 0) {
      goals.push({
        goal: '심화 학습',
        description: '주요 주제들에 대해 더 깊이 있는 분석을 진행하세요.',
        timeline: '2개월',
        priority: 'medium'
      });
    }
    
    return goals;
  }

  createLongTermGoals(gaps, userProfile) {
    const goals = [];
    
    goals.push({
      goal: '전문성 확립',
      description: '선택한 분야에서 전문가 수준의 지식을 구축하세요.',
      timeline: '6개월',
      priority: 'high'
    });
    
    goals.push({
      goal: '학제간 통합',
      description: '다양한 분야의 지식을 통합하여 새로운 관점을 만들어보세요.',
      timeline: '1년',
      priority: 'medium'
    });
    
    return goals;
  }

  recommendResources(gaps, userProfile) {
    const resources = [];
    
    // 지식 갭 기반 추천
    for (const missingTopic of gaps.missingTopics.slice(0, 3)) {
      resources.push({
        type: 'book',
        title: `${missingTopic.interest} 입문서`,
        description: `${missingTopic.interest} 분야의 기초를 다질 수 있는 책을 추천합니다.`,
        priority: missingTopic.priority
      });
    }
    
    // 온라인 리소스
    resources.push({
      type: 'online',
      title: '온라인 강의 플랫폼',
      description: 'Coursera, edX, Udemy 등에서 관련 강의를 찾아보세요.',
      priority: 'medium'
    });
    
    return resources;
  }

  createTimeline(gaps, userProfile) {
    const timeline = [
      {
        phase: '1단계: 기초 확립',
        duration: '1-2개월',
        focus: '핵심 개념 학습 및 기본 노트 작성',
        milestones: ['주요 주제별 첫 노트 작성', '기본 연결 구조 구축']
      },
      {
        phase: '2단계: 심화 학습',
        duration: '3-4개월',
        focus: '깊이 있는 분석 및 연결 강화',
        milestones: ['심화 노트 작성', '학제간 연결 확립']
      },
      {
        phase: '3단계: 통합 및 적용',
        duration: '5-6개월',
        focus: '지식 통합 및 실제 적용',
        milestones: ['통합적 관점 구축', '실무 적용 사례 작성']
      }
    ];
    
    return timeline;
  }

  async analyzeUserPatterns(files, userProfile) {
    const patterns = {
      preferredTopics: [],
      writingStyle: '',
      studyFrequency: '',
      complexityPreference: ''
    };
    
    const topics = await this.extractAllTopics(files);
    const complexities = [];
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      complexities.push(this.calculateComplexity(content));
    }
    
    // 선호 주제 분석
    patterns.preferredTopics = Object.entries(topics)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([topic, data]) => ({ topic, count: data.count }));
    
    // 작성 스타일 분석
    const avgComplexity = complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
    patterns.complexityPreference = avgComplexity > 1000 ? '심화형' : avgComplexity > 500 ? '균형형' : '간단형';
    
    return patterns;
  }

  recommendNextNotes(files, patterns) {
    const recommendations = [];
    
    // 선호 주제 기반 추천
    for (const preferredTopic of patterns.preferredTopics.slice(0, 3)) {
      recommendations.push({
        type: 'topic_expansion',
        title: `${preferredTopic.topic} 심화 학습`,
        description: `${preferredTopic.topic}에 대한 더 깊이 있는 내용을 다루는 노트를 작성해보세요.`,
        priority: 'high'
      });
    }
    
    // 연결 기반 추천
    recommendations.push({
      type: 'connection',
      title: '주제 간 연결 노트',
      description: '선호하는 주제들 간의 연결점을 찾아 통합적인 노트를 작성해보세요.',
      priority: 'medium'
    });
    
    return recommendations;
  }

  recommendRelatedTopics(files, patterns) {
    const related = [];
    
    // 선호 주제와 관련된 분야 추천
    const topicRelations = {
      'AI': ['머신러닝', '데이터 과학', '알고리즘'],
      '마음근력': ['심리학', '자기계발', '명상'],
      '기술': ['혁신', '트렌드', '미래학']
    };
    
    for (const preferredTopic of patterns.preferredTopics) {
      const relatedTopics = topicRelations[preferredTopic.topic] || [];
      for (const relatedTopic of relatedTopics) {
        related.push({
          topic: relatedTopic,
          connection: `${preferredTopic.topic}과 연관된 분야`,
          benefit: '지식의 폭을 넓히고 새로운 관점을 얻을 수 있습니다.'
        });
      }
    }
    
    return related.slice(0, 5);
  }

  recommendStudyMethods(patterns) {
    const methods = [];
    
    if (patterns.complexityPreference === '심화형') {
      methods.push({
        method: '심화 분석',
        description: '각 주제에 대해 더 깊이 있는 분석과 연구를 진행하세요.',
        suitability: 'high'
      });
    } else if (patterns.complexityPreference === '간단형') {
      methods.push({
        method: '단계적 심화',
        description: '기본 개념부터 시작하여 점진적으로 복잡도를 높여가세요.',
        suitability: 'high'
      });
    }
    
    methods.push({
      method: '연결 학습',
      description: '서로 다른 주제 간의 연결점을 찾아 통합적인 이해를 만들어보세요.',
      suitability: 'medium'
    });
    
    return methods;
  }

  recommendExternalResources(patterns, userProfile) {
    const resources = [];
    
    // 선호 주제 기반 외부 리소스 추천
    for (const preferredTopic of patterns.preferredTopics.slice(0, 3)) {
      resources.push({
        type: 'online_course',
        title: `${preferredTopic.topic} 온라인 강의`,
        description: `${preferredTopic.topic}에 대한 체계적인 학습을 위한 온라인 강의를 추천합니다.`,
        platforms: ['Coursera', 'edX', 'Udemy']
      });
    }
    
    resources.push({
      type: 'community',
      title: '학습 커뮤니티',
      description: '같은 관심사를 가진 사람들과 지식을 공유하고 토론해보세요.',
      platforms: ['Reddit', 'Discord', 'Slack']
    });
    
    return resources;
  }

  recommendNewConnections(files, patterns) {
    const connections = [];
    
    // 선호 주제들 간의 새로운 연결 제안
    const preferredTopics = patterns.preferredTopics.map(pt => pt.topic);
    
    for (let i = 0; i < preferredTopics.length; i++) {
      for (let j = i + 1; j < preferredTopics.length; j++) {
        connections.push({
          from: preferredTopics[i],
          to: preferredTopics[j],
          type: 'cross_topic',
          description: `${preferredTopics[i]}와 ${preferredTopics[j]} 간의 연결점을 찾아보세요.`,
          benefit: '새로운 통찰과 창의적 사고를 촉진할 수 있습니다.'
        });
      }
    }
    
    return connections.slice(0, 3);
  }

  identifyCompletedGoals(goals, files) {
    const completed = [];
    
    for (const goal of goals) {
      // 목표 달성 여부 판단 (간단한 키워드 매칭)
      const goalKeywords = goal.title.toLowerCase().split(' ');
      let matchCount = 0;
      
      for (const file of files) {
        const fileName = path.basename(file, '.md').toLowerCase();
        for (const keyword of goalKeywords) {
          if (fileName.includes(keyword)) {
            matchCount++;
            break;
          }
        }
      }
      
      if (matchCount >= goalKeywords.length * 0.7) {
        completed.push({
          goal: goal.title,
          completionDate: new Date().toISOString(),
          evidence: `${matchCount}개의 관련 노트 발견`
        });
      }
    }
    
    return completed;
  }

  identifyInProgressGoals(goals, files) {
    const inProgress = [];
    
    for (const goal of goals) {
      const goalKeywords = goal.title.toLowerCase().split(' ');
      let matchCount = 0;
      
      for (const file of files) {
        const fileName = path.basename(file, '.md').toLowerCase();
        for (const keyword of goalKeywords) {
          if (fileName.includes(keyword)) {
            matchCount++;
            break;
          }
        }
      }
      
      const progress = (matchCount / goalKeywords.length) * 100;
      if (progress > 20 && progress < 70) {
        inProgress.push({
          goal: goal.title,
          progress: Math.round(progress),
          nextSteps: '관련 노트를 더 작성하여 목표를 완성하세요.'
        });
      }
    }
    
    return inProgress;
  }

  identifyUpcomingGoals(goals, files) {
    const upcoming = [];
    
    for (const goal of goals) {
      const goalKeywords = goal.title.toLowerCase().split(' ');
      let matchCount = 0;
      
      for (const file of files) {
        const fileName = path.basename(file, '.md').toLowerCase();
        for (const keyword of goalKeywords) {
          if (fileName.includes(keyword)) {
            matchCount++;
            break;
          }
        }
      }
      
      const progress = (matchCount / goalKeywords.length) * 100;
      if (progress < 20) {
        upcoming.push({
          goal: goal.title,
          readiness: '준비 중',
          suggestedStart: '관련 기초 지식을 먼저 학습하세요.'
        });
      }
    }
    
    return upcoming;
  }

  calculateProgressMetrics(goals, files) {
    const totalGoals = goals.length;
    const completedGoals = this.identifyCompletedGoals(goals, files).length;
    const inProgressGoals = this.identifyInProgressGoals(goals, files).length;
    
    return {
      totalGoals,
      completedGoals,
      inProgressGoals,
      completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      activeRate: totalGoals > 0 ? Math.round(((completedGoals + inProgressGoals) / totalGoals) * 100) : 0
    };
  }

  generateGoalRecommendations(goals, files) {
    const recommendations = [];
    
    const completed = this.identifyCompletedGoals(goals, files);
    const inProgress = this.identifyInProgressGoals(goals, files);
    
    if (completed.length === 0) {
      recommendations.push({
        type: 'motivation',
        title: '첫 목표 달성',
        description: '작은 목표부터 시작하여 성취감을 경험해보세요.',
        action: '가장 쉬운 목표를 선택하여 집중적으로 학습하세요.'
      });
    }
    
    if (inProgress.length > 0) {
      recommendations.push({
        type: 'focus',
        title: '진행 중인 목표 완성',
        description: '진행 중인 목표들을 완성하여 성취감을 높이세요.',
        action: '진행 중인 목표에 더 많은 시간을 투자하세요.'
      });
    }
    
    return recommendations;
  }

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

  calculateComplexity(content) {
    const wordCount = content.split(/\s+/).length;
    const linkCount = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
    const tagCount = (content.match(/#([a-zA-Z0-9가-힣_]+)/g) || []).length;
    const headingCount = (content.match(/^#+\s/gm) || []).length;
    
    return wordCount + linkCount * 10 + tagCount * 5 + headingCount * 20;
  }

  categorizeTopics(topics) {
    const categories = {
      '기술': ['AI', '머신러닝', '프로그래밍', '데이터'],
      '인문학': ['철학', '심리학', '역사', '문학'],
      '자기계발': ['마음근력', '습관', '목표', '동기부여'],
      '과학': ['물리학', '화학', '생물학', '수학']
    };
    
    return categories;
  }

  getTopicCategory(topic) {
    const categories = this.categorizeTopics();
    
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (topic.toLowerCase().includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }
    
    return '기타';
  }
}

export default new PersonalizedInsightsService(); 