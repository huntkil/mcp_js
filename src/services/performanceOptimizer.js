import logger from '../utils/logger.js';

class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      searchLatency: [],
      cacheHitRate: 0,
      memoryUsage: [],
      cpuUsage: [],
      requestCount: 0,
      errorCount: 0
    };
    
    this.optimizations = {
      enableCaching: true,
      enableCompression: true,
      enableBatchProcessing: true,
      enableParallelProcessing: true,
      cacheSize: 1000,
      maxConcurrentRequests: 10
    };
    
    this.startTime = Date.now();
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

    // 인덱싱 성능 최적화 (실제 볼트 기준)
    if (stats.search.averageLatency > 60000) { // 60초 이상
      recommendations.push({
        id: 'indexing_performance',
        title: '인덱싱 성능 최적화',
        description: `현재 인덱싱 시간: ${Math.round(stats.search.averageLatency / 1000)}초 (목표: 60초 이하)`,
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
    if (stats.memory && parseFloat(stats.memory.heapUsagePercentage) > 80) { // 500MB 이상
      recommendations.push({
        id: 'memory_optimization',
        title: '메모리 사용량 최적화',
        description: `현재 메모리 사용량: ${Math.round(stats.memory.heapUsed / 1024 / 1024)}MB`,
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
    if (stats.search.averageLatency > 100) { // 100ms 이상
      recommendations.push({
        id: 'search_performance',
        title: '검색 성능 최적화',
        description: `평균 검색 시간: ${Math.round(stats.search.averageLatency)}ms`,
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
   * 메모리 사용량 최적화
   */
  optimizeMemory() {
    logger.info('메모리 최적화 시작');
    
    // 가비지 컬렉션 강제 실행
    if (global.gc) {
      global.gc();
      logger.info('가비지 컬렉션 실행');
    }
    
    // 메모리 사용량 확인
    const memoryUsage = process.memoryUsage();
    logger.info(`메모리 사용량:`);
    logger.info(`  RSS: ${this.formatBytes(memoryUsage.rss)}`);
    logger.info(`  Heap Used: ${this.formatBytes(memoryUsage.heapUsed)}`);
    logger.info(`  Heap Total: ${this.formatBytes(memoryUsage.heapTotal)}`);
    
    const optimizations = [
      '가비지 컬렉션 실행',
      '메모리 사용량 모니터링',
      '불필요한 객체 정리'
    ];
    
    return {
      memoryUsage,
      optimizations
    };
  }

  /**
   * 바이트 단위 포맷팅
   * @param {number} bytes - 바이트 수
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    const value = bytes / Math.pow(k, i);
    return value.toFixed(1) + ' ' + sizes[i];
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
        status: recommendations.some(r => r.priority === 'critical') ? 'critical' :
                recommendations.some(r => r.priority === 'high') ? 'warning' : 'healthy',
        message: this.generateSummaryMessage(stats, recommendations)
      },
      details: stats,
      recommendations
    };
  }

  /**
   * 요약 메시지 생성
   */
  generateSummaryMessage(stats, recommendations) {
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
}

export default new PerformanceOptimizer(); 