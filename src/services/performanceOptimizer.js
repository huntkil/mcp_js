import logger from '../utils/logger.js';

class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
      cacheHitRate: 0,
      cacheHits: 0,
      cacheMisses: 0,
      startTime: Date.now(),
      searchLatency: [], // 추가
      memoryUsage: []    // 추가
    };
    
    // 고급 캐시 시스템
    this.cache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize: 1000,
      lastCleanup: Date.now()
    };
    
    // LRU 캐시 구현
    this.lruCache = new Map();
    this.maxCacheSize = 1000;
    
    // 성능 최적화 설정
    this.optimizations = {
      enableCaching: true,
      enableCompression: true,
      enableBatchProcessing: true,
      enableParallelProcessing: true,
      cacheSize: 1000,
      maxConcurrentRequests: 10
    };
    
    // 주기적 캐시 정리
    setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000); // 5분마다
  }

  /**
   * 고급 캐시 시스템
   */
  getCached(key) {
    if (!this.optimizations.enableCaching) return null;
    
    const cached = this.lruCache.get(key);
    if (cached) {
      // 캐시 히트 시 LRU 순서 업데이트
      this.lruCache.delete(key);
      this.lruCache.set(key, cached);
      this.cacheStats.hits++;
      return cached.data;
    }
    
    this.cacheStats.misses++;
    return null;
  }

  setCached(key, data, ttl = 300000) { // 기본 5분 TTL
    if (!this.optimizations.enableCaching) return;
    
    // 캐시 크기 제한 확인
    if (this.lruCache.size >= this.maxCacheSize) {
      // LRU: 가장 오래된 항목 제거
      const firstKey = this.lruCache.keys().next().value;
      this.lruCache.delete(firstKey);
    }
    
    this.lruCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    this.cacheStats.size = this.lruCache.size;
  }

  /**
   * 캐시 정리 (만료된 항목 제거)
   */
  cleanupCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.lruCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.lruCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.info(`캐시 정리 완료: ${cleaned}개 항목 제거`);
    }
    
    this.cacheStats.size = this.lruCache.size;
    this.cacheStats.lastCleanup = now;
  }

  /**
   * 캐시 통계 조회
   */
  getCacheStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100 
      : 0;
    
    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      hitRate: hitRate.toFixed(2),
      hitRatePercentage: `${hitRate.toFixed(2)}%`,
      size: this.cacheStats.size,
      maxSize: this.maxCacheSize,
      lastCleanup: new Date(this.cacheStats.lastCleanup).toISOString()
    };
  }

  /**
   * 성능 메트릭 수집
   * @param {string} operation - 작업 이름
   * @param {number} startTime - 시작 시간
   * @param {boolean} success - 성공 여부
   */
  recordMetric(operation, startTime, success = true) {
    const duration = Date.now() - startTime;
    
    if (operation === 'search') {
      this.metrics.searchLatency.push(duration);
      
      // 최근 100개만 유지
      if (this.metrics.searchLatency.length > 100) {
        this.metrics.searchLatency.shift();
      }
    }
    
    this.metrics.requestCount++;
    if (!success) {
      this.metrics.errorCount++;
    }
    
    // 메모리 사용량 기록
    const memoryUsage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      rss: memoryUsage.rss,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal
    });
    
    // 최근 50개만 유지
    if (this.metrics.memoryUsage.length > 50) {
      this.metrics.memoryUsage.shift();
    }
  }

  /**
   * 캐시 히트율 업데이트
   * @param {boolean} hit - 캐시 히트 여부
   */
  updateCacheHitRate(hit) {
    // 캐시 요청 카운터 추가
    if (!this.metrics.cacheRequests) {
      this.metrics.cacheRequests = 0;
      this.metrics.cacheHits = 0;
    }
    
    this.metrics.cacheRequests++;
    if (hit) {
      this.metrics.cacheHits++;
    }
    
    this.metrics.cacheHitRate = this.metrics.cacheRequests > 0 
      ? this.metrics.cacheHits / this.metrics.cacheRequests 
      : 0;
  }

  /**
   * 성능 통계 조회
   */
  getPerformanceStats() {
    // searchLatency 배열이 없으면 초기화
    if (!this.metrics.searchLatency) {
      this.metrics.searchLatency = [];
    }
    
    const avgSearchLatency = this.metrics.searchLatency.length > 0 
      ? this.metrics.searchLatency.reduce((a, b) => a + b, 0) / this.metrics.searchLatency.length 
      : 0;
    
    const minSearchLatency = this.metrics.searchLatency.length > 0 
      ? Math.min(...this.metrics.searchLatency) 
      : 0;
    
    const maxSearchLatency = this.metrics.searchLatency.length > 0 
      ? Math.max(...this.metrics.searchLatency) 
      : 0;
    
    const currentMemory = this.metrics.memoryUsage.length > 0 
      ? this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] 
      : null;
    
    const uptime = Date.now() - this.startTime;
    
    return {
      uptime: {
        total: uptime,
        formatted: this.formatUptime(uptime)
      },
      search: {
        averageLatency: avgSearchLatency,
        minLatency: minSearchLatency,
        maxLatency: maxSearchLatency,
        totalRequests: this.metrics.searchLatency.length
      },
      cache: {
        hitRate: this.metrics.cacheHitRate,
        hitRatePercentage: (this.metrics.cacheHitRate * 100).toFixed(2) + '%'
      },
      requests: {
        total: this.metrics.requestCount,
        errors: this.metrics.errorCount,
        successRate: this.metrics.requestCount > 0 
          ? ((this.metrics.requestCount - this.metrics.errorCount) / this.metrics.requestCount * 100).toFixed(2) + '%'
          : '0%'
      },
      memory: currentMemory ? {
        rss: this.formatBytes(currentMemory.rss),
        heapUsed: this.formatBytes(currentMemory.heapUsed),
        heapTotal: this.formatBytes(currentMemory.heapTotal),
        heapUsagePercentage: ((currentMemory.heapUsed / currentMemory.heapTotal) * 100).toFixed(2) + '%'
      } : null,
      optimizations: this.optimizations
    };
  }

  /**
   * 성능 최적화 권장사항 생성
   */
  generateOptimizationRecommendations() {
    const recommendations = [];
    const stats = this.getPerformanceStats();
    const searchMetrics = this.getSearchMetrics();
    const memoryUsage = this.getMemoryUsage();

    // 인덱싱 성능 최적화 (실제 볼트 기준)
    if (searchMetrics.averageLatency > 60000) { // 60초 이상
      recommendations.push({
        id: 'indexing_performance',
        title: '인덱싱 성능 최적화',
        description: `현재 인덱싱 시간: ${Math.round(searchMetrics.averageLatency / 1000)}초 (목표: 60초 이하)`,
        priority: 'high',
        category: 'performance',
        suggestions: [
          '배치 크기 증가 (현재 50 → 100)',
          '병렬 처리 도입',
          '불필요한 파일 필터링 최적화',
          '벡터 저장 최적화'
        ]
      });
    }

    // 메모리 사용량 최적화
    if (memoryUsage && memoryUsage.percentage > 80) { // 80% 이상
      recommendations.push({
        id: 'memory_optimization',
        title: '메모리 사용량 최적화',
        description: `현재 메모리 사용량: ${memoryUsage.heapUsed}`,
        priority: 'medium',
        category: 'memory',
        suggestions: [
          '벡터 청킹 최적화',
          '메모리 캐시 정리',
          '가비지 컬렉션 최적화'
        ]
      });
    }

    // 검색 성능 최적화
    if (searchMetrics.averageLatency > 100) { // 100ms 이상
      recommendations.push({
        id: 'search_performance',
        title: '검색 성능 최적화',
        description: `평균 검색 시간: ${Math.round(searchMetrics.averageLatency)}ms`,
        priority: 'medium',
        category: 'performance',
        suggestions: [
          '벡터 인덱싱 최적화',
          '캐시 전략 개선',
          '검색 알고리즘 최적화'
        ]
      });
    }

    // 키워드 검색 개선
    recommendations.push({
      id: 'keyword_search_improvement',
      title: '키워드 검색 개선',
      description: '현재 메타데이터만 검색하여 결과가 제한적',
      priority: 'high',
      category: 'functionality',
      suggestions: [
        '본문 내용 검색 추가',
        '풀텍스트 인덱싱 구현',
        '검색 결과 하이라이팅 개선'
      ]
    });

    return recommendations;
  }

  /**
   * 자동 성능 최적화 적용
   */
  applyAutoOptimizations() {
    const stats = this.getPerformanceStats();
    const changes = [];
    
    // 검색 지연시간이 높으면 캐시 크기 증가
    if (stats.search.averageLatency > 1000 && this.optimizations.cacheSize < 2000) {
      this.optimizations.cacheSize = Math.min(2000, this.optimizations.cacheSize * 1.5);
      changes.push('캐시 크기 증가');
    }
    
    // 메모리 사용량이 높으면 최적화 설정 조정
    if (stats.memory && parseFloat(stats.memory.heapUsagePercentage) > 80) {
      this.optimizations.maxConcurrentRequests = Math.max(5, this.optimizations.maxConcurrentRequests - 2);
      changes.push('동시 요청 수 감소');
    }
    
    // 캐시 히트율이 낮으면 캐싱 강화
    if (stats.cache.hitRate < 0.3) {
      this.optimizations.enableCaching = true;
      changes.push('캐싱 강화');
    }
    
    if (changes.length > 0) {
      logger.info(`자동 최적화 적용: ${changes.join(', ')}`);
    }
    
    return changes;
  }

  /**
   * 성능 모니터링 시작
   */
  startMonitoring() {
    logger.info('성능 모니터링 시작');
    
    // 주기적으로 성능 통계 출력
    this.monitoringInterval = setInterval(() => {
      const stats = this.getPerformanceStats();
      const recommendations = this.generateOptimizationRecommendations();
      
      logger.info('=== 성능 모니터링 리포트 ===');
      logger.info(`업타임: ${stats.uptime.formatted}`);
      logger.info(`평균 검색 지연시간: ${stats.search.averageLatency.toFixed(2)}ms`);
      logger.info(`캐시 히트율: ${stats.cache.hitRatePercentage}`);
      logger.info(`요청 성공률: ${stats.requests.successRate}`);
      
      if (recommendations.length > 0) {
        logger.info('=== 최적화 권장사항 ===');
        recommendations.forEach(rec => {
          logger.info(`[${rec.priority.toUpperCase()}] ${rec.message}`);
        });
      }
      
      // 자동 최적화 적용
      this.applyAutoOptimizations();
      
    }, 60000); // 1분마다
  }

  /**
   * 성능 모니터링 중지
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('성능 모니터링 중지');
    }
  }

  /**
   * 성능 테스트 실행
   */
  async runPerformanceTest(testFunction, iterations = 100) {
    logger.info(`성능 테스트 시작: ${iterations}회 반복`);
    
    if (typeof testFunction !== 'function') {
      throw new Error('testFunction must be a function');
    }
    
    const results = {
      totalTime: 0,
      averageTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: 0,
      iterations: iterations,
      results: [],
      successRate: 0
    };
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        const result = await testFunction();
        const duration = Date.now() - startTime;
        
        results.totalTime += duration;
        results.minTime = Math.min(results.minTime, duration);
        results.maxTime = Math.max(results.maxTime, duration);
        results.results.push({ duration, success: true, result });
        
        this.recordMetric('test', startTime, true);
      } catch (error) {
        results.errors++;
        results.results.push({ duration: 0, success: false, error: error.message });
        this.recordMetric('test', startTime, false);
        logger.warn(`성능 테스트 오류 (${i + 1}/${iterations}): ${error.message}`);
      }
      
      // 진행률 표시
      if ((i + 1) % 10 === 0) {
        logger.info(`성능 테스트 진행률: ${i + 1}/${iterations}`);
      }
    }
    
    results.averageTime = results.totalTime / iterations;
    results.successRate = iterations > 0 ? (iterations - results.errors) / iterations : 0;
    
    logger.info('=== 성능 테스트 결과 ===');
    logger.info(`총 실행 시간: ${results.totalTime}ms`);
    logger.info(`평균 실행 시간: ${results.averageTime.toFixed(2)}ms`);
    logger.info(`최소 실행 시간: ${results.minTime}ms`);
    logger.info(`최대 실행 시간: ${results.maxTime}ms`);
    logger.info(`오류 수: ${results.errors}`);
    logger.info(`성공률: ${((iterations - results.errors) / iterations * 100).toFixed(2)}%`);
    
    return results;
  }

  /**
   * 메모리 사용량 조회
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: this.formatBytes(usage.rss), // Resident Set Size
      heapTotal: this.formatBytes(usage.heapTotal), // V8 힙 총 크기
      heapUsed: this.formatBytes(usage.heapUsed), // V8 힙 사용량
      external: this.formatBytes(usage.external), // 외부 메모리
      arrayBuffers: this.formatBytes(usage.arrayBuffers || 0), // ArrayBuffer 메모리
      percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    };
  }

  /**
   * 바이트를 읽기 쉬운 형태로 변환
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 메모리 최적화 권장사항 생성
   */
  generateMemoryOptimizations() {
    const usage = process.memoryUsage();
    const heapUsagePercentage = (usage.heapUsed / usage.heapTotal) * 100;
    
    const recommendations = [];
    
    if (heapUsagePercentage > 80) {
      recommendations.push({
        id: 'high_memory_usage',
        title: '높은 메모리 사용량',
        description: `힙 사용량이 ${heapUsagePercentage.toFixed(1)}%로 높습니다`,
        priority: 'high',
        category: 'memory',
        suggestions: [
          '가비지 컬렉션 강제 실행',
          '캐시 크기 줄이기',
          '불필요한 객체 해제'
        ]
      });
    }
    
    if (usage.external > 100 * 1024 * 1024) { // 100MB 이상
      recommendations.push({
        id: 'high_external_memory',
        title: '높은 외부 메모리 사용량',
        description: '외부 메모리 사용량이 높습니다',
        priority: 'medium',
        category: 'memory',
        suggestions: [
          '스트림 처리 최적화',
          '버퍼 크기 조정',
          '메모리 누수 확인'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * 업타임 포맷팅
   * @param {number} milliseconds - 밀리초
   */
  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * 성능 리포트 생성
   */
  generatePerformanceReport() {
    const stats = this.getPerformanceStats();
    const recommendations = this.generateOptimizationRecommendations();
    
    return {
      timestamp: new Date().toISOString(),
      summary: {
        status: recommendations && recommendations.length > 0 && recommendations.some(r => r.priority === 'critical') ? 'critical' :
                recommendations && recommendations.length > 0 && recommendations.some(r => r.priority === 'high') ? 'warning' : 'healthy',
        message: this.generateSummaryMessage(stats, recommendations || [])
      },
      details: stats,
      recommendations: recommendations || []
    };
  }

  /**
   * 요약 메시지 생성
   */
  generateSummaryMessage(stats, recommendations) {
    if (!recommendations || !Array.isArray(recommendations)) {
      return '시스템 성능이 양호합니다.';
    }
    
    const criticalIssues = recommendations.filter(r => r.priority === 'critical').length;
    const highIssues = recommendations.filter(r => r.priority === 'high').length;
    
    if (criticalIssues > 0) {
      return `심각한 성능 문제가 ${criticalIssues}개 발견되었습니다. 즉시 조치가 필요합니다.`;
    } else if (highIssues > 0) {
      return `성능 개선이 필요한 항목이 ${highIssues}개 있습니다.`;
    } else {
      return '시스템 성능이 양호합니다.';
    }
  }

  /**
   * 검색 메트릭 조회
   */
  getSearchMetrics() {
    return {
      averageLatency: this.metrics.averageLatency,
      minLatency: this.metrics.minLatency === Infinity ? 0 : this.metrics.minLatency,
      maxLatency: this.metrics.maxLatency,
      totalRequests: this.metrics.requestCount
    };
  }

  /**
   * 요청 메트릭 조회
   */
  getRequestMetrics() {
    const successRate = this.metrics.requestCount > 0 
      ? ((this.metrics.requestCount - this.metrics.errorCount) / this.metrics.requestCount) * 100 
      : 0;
    
    return {
      total: this.metrics.requestCount,
      errors: this.metrics.errorCount,
      successRate: `${successRate.toFixed(1)}%`
    };
  }

  /**
   * 업타임 조회
   */
  getUptime() {
    const total = Date.now() - this.metrics.startTime;
    const hours = Math.floor(total / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);
    
    return {
      total,
      formatted: `${hours}h ${minutes}m ${seconds}s`
    };
  }

  /**
   * 최적화 설정 조회
   */
  getOptimizationSettings() {
    return { ...this.optimizations };
  }

  /**
   * 최적화 설정 업데이트
   */
  updateOptimizationSettings(settings) {
    this.optimizations = { ...this.optimizations, ...settings };
    logger.info('성능 최적화 설정 업데이트:', this.optimizations);
  }

  /**
   * 캐시 정리
   */
  clearCache() {
    this.lruCache.clear();
    this.cacheStats.hits = 0;
    this.cacheStats.misses = 0;
    this.cacheStats.size = 0;
    this.cacheStats.lastCleanup = Date.now();
    logger.info('캐시가 완전히 정리되었습니다.');
  }

  /**
   * 메트릭 기록
   */
  recordMetric(type, startTime, success = true) {
    const latency = Date.now() - startTime;
    
    this.metrics.requestCount++;
    if (!success) {
      this.metrics.errorCount++;
    }
    
    // 검색 지연시간 통계 업데이트
    if (type === 'search') {
      this.metrics.averageLatency = 
        (this.metrics.averageLatency * (this.metrics.requestCount - 1) + latency) / this.metrics.requestCount;
      this.metrics.minLatency = Math.min(this.metrics.minLatency, latency);
      this.metrics.maxLatency = Math.max(this.metrics.maxLatency, latency);
    }
  }

  /**
   * 메모리 최적화 실행
   */
  optimizeMemory() {
    const beforeUsage = process.memoryUsage();
    
    // 가비지 컬렉션 강제 실행
    if (global.gc) {
      global.gc();
    }
    
    // 캐시 크기 줄이기
    if (this.lruCache.size > this.maxCacheSize * 0.8) {
      const itemsToRemove = Math.floor(this.lruCache.size * 0.2);
      const keys = Array.from(this.lruCache.keys()).slice(0, itemsToRemove);
      keys.forEach(key => this.lruCache.delete(key));
    }
    
    const afterUsage = process.memoryUsage();
    
    return {
      success: true,
      before: {
        rss: this.formatBytes(beforeUsage.rss),
        heapUsed: this.formatBytes(beforeUsage.heapUsed),
        heapTotal: this.formatBytes(beforeUsage.heapTotal)
      },
      after: {
        rss: this.formatBytes(afterUsage.rss),
        heapUsed: this.formatBytes(afterUsage.heapUsed),
        heapTotal: this.formatBytes(afterUsage.heapTotal)
      },
      improvement: {
        rss: this.formatBytes(beforeUsage.rss - afterUsage.rss),
        heapUsed: this.formatBytes(beforeUsage.heapUsed - afterUsage.heapUsed)
      }
    };
  }

  /**
   * 성능 리포트 생성 (API용)
   */
  generateReport() {
    const stats = this.getPerformanceStats();
    const cacheStats = this.getCacheStats();
    const memoryUsage = this.getMemoryUsage();
    const recommendations = this.generateOptimizationRecommendations();
    
    return {
      timestamp: new Date().toISOString(),
      summary: {
        status: recommendations.some(r => r.priority === 'critical') ? 'critical' :
                recommendations.some(r => r.priority === 'high') ? 'warning' : 'healthy',
        message: this.generateSummaryMessage(stats, recommendations)
      },
      performance: stats,
      cache: cacheStats,
      memory: memoryUsage,
      recommendations: recommendations.slice(0, 5) // 상위 5개만
    };
  }
}

const performanceOptimizer = new PerformanceOptimizer();
export default performanceOptimizer;
export { performanceOptimizer }; 