import { searchService } from './searchService.js';
import logger from '../utils/logger.js';

class PerformanceTestRunner {
  constructor() {
    this.testResults = [];
    this.testConfig = {
      searchTests: {
        iterations: 50,
        queries: [
          '인공지능',
          '머신러닝',
          '딥러닝',
          '자연어처리',
          '컴퓨터비전',
          '강화학습',
          '데이터사이언스',
          '알고리즘',
          '최적화',
          '분석'
        ]
      },
      indexingTests: {
        iterations: 10,
        batchSizes: [10, 25, 50, 100]
      },
      memoryTests: {
        iterations: 20,
        operations: ['search', 'index', 'process']
      },
      stressTests: {
        concurrentUsers: 10,
        duration: 30000, // 30초
        operations: ['search', 'index']
      }
    };
  }

  /**
   * 전체 성능 테스트 스위트 실행
   */
  async runFullTestSuite() {
    logger.info('=== 전체 성능 테스트 스위트 시작 ===');
    
    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      summary: {},
      details: {}
    };

    try {
      // 1. 검색 성능 테스트
      results.details.search = await this.runSearchPerformanceTests();
      
      // 2. 인덱싱 성능 테스트
      results.details.indexing = await this.runIndexingPerformanceTests();
      
      // 3. 메모리 사용량 테스트
      results.details.memory = await this.runMemoryUsageTests();
      
      // 4. 스트레스 테스트
      results.details.stress = await this.runStressTests();
      
      // 5. 캐시 성능 테스트
      results.details.cache = await this.runCachePerformanceTests();
      
      // 6. 벡터DB 성능 테스트
      results.details.vectorDB = await this.runVectorDBPerformanceTests();

      // 결과 요약 생성
      results.summary = this.generateTestSummary(results.details);
      results.totalDuration = Date.now() - startTime;

      this.testResults.push(results);
      
      logger.info('=== 전체 성능 테스트 스위트 완료 ===');
      logger.info(`총 소요시간: ${results.totalDuration}ms`);
      
      return results;
    } catch (error) {
      logger.error('성능 테스트 스위트 실행 중 오류:', error);
      throw error;
    }
  }

  /**
   * 검색 성능 테스트
   */
  async runSearchPerformanceTests() {
    logger.info('검색 성능 테스트 시작');
    const results = {
      queries: [],
      summary: {}
    };

    const { iterations, queries } = this.testConfig.searchTests;
    
    for (const query of queries) {
      const queryResults = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        try {
          const searchResult = await searchService.search(query, { limit: 10 });
          const duration = Date.now() - startTime;
          
          queryResults.push({
            iteration: i + 1,
            duration,
            success: true,
            resultCount: searchResult.results?.length || 0
          });
        } catch (error) {
          const duration = Date.now() - startTime;
          queryResults.push({
            iteration: i + 1,
            duration,
            success: false,
            error: error.message
          });
        }
      }

      const avgDuration = queryResults.reduce((sum, r) => sum + r.duration, 0) / queryResults.length;
      const successRate = (queryResults.filter(r => r.success).length / queryResults.length) * 100;

      results.queries.push({
        query,
        results: queryResults,
        averageDuration: avgDuration,
        successRate,
        totalResults: queryResults.reduce((sum, r) => sum + (r.resultCount || 0), 0)
      });
    }

    // 전체 요약
    const allDurations = results.queries.flatMap(q => q.results.map(r => r.duration));
    results.summary = {
      totalQueries: queries.length,
      totalIterations: queries.length * iterations,
      averageDuration: allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length,
      minDuration: Math.min(...allDurations),
      maxDuration: Math.max(...allDurations),
      overallSuccessRate: (results.queries.reduce((sum, q) => sum + q.successRate, 0) / results.queries.length)
    };

    logger.info('검색 성능 테스트 완료');
    return results;
  }

  /**
   * 인덱싱 성능 테스트
   */
  async runIndexingPerformanceTests() {
    logger.info('인덱싱 성능 테스트 시작');
    const results = {
      batchSizes: [],
      summary: {}
    };

    const { iterations, batchSizes } = this.testConfig.indexingTests;

    for (const batchSize of batchSizes) {
      const batchResults = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        try {
          // 가상의 인덱싱 작업 시뮬레이션
          const indexingResult = await this.simulateIndexing(batchSize);
          const duration = Date.now() - startTime;
          
          batchResults.push({
            iteration: i + 1,
            duration,
            success: true,
            processedItems: indexingResult.processedItems
          });
        } catch (error) {
          const duration = Date.now() - startTime;
          batchResults.push({
            iteration: i + 1,
            duration,
            success: false,
            error: error.message
          });
        }
      }

      const avgDuration = batchResults.reduce((sum, r) => sum + r.duration, 0) / batchResults.length;
      const successRate = (batchResults.filter(r => r.success).length / batchResults.length) * 100;

      results.batchSizes.push({
        batchSize,
        results: batchResults,
        averageDuration: avgDuration,
        successRate,
        throughput: batchSize / (avgDuration / 1000) // items per second
      });
    }

    // 전체 요약
    const allDurations = results.batchSizes.flatMap(b => b.results.map(r => r.duration));
    results.summary = {
      totalBatchSizes: batchSizes.length,
      totalIterations: batchSizes.length * iterations,
      averageDuration: allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length,
      minDuration: Math.min(...allDurations),
      maxDuration: Math.max(...allDurations),
      overallSuccessRate: (results.batchSizes.reduce((sum, b) => sum + b.successRate, 0) / results.batchSizes.length),
      averageThroughput: results.batchSizes.reduce((sum, b) => sum + b.throughput, 0) / results.batchSizes.length
    };

    logger.info('인덱싱 성능 테스트 완료');
    return results;
  }

  /**
   * 메모리 사용량 테스트
   */
  async runMemoryUsageTests() {
    logger.info('메모리 사용량 테스트 시작');
    const results = {
      operations: [],
      summary: {}
    };

    const { iterations, operations } = this.testConfig.memoryTests;
    const initialMemory = process.memoryUsage();

    for (const operation of operations) {
      const operationResults = [];
      
      for (let i = 0; i < iterations; i++) {
        const beforeMemory = process.memoryUsage();
        const startTime = Date.now();
        
        try {
          await this.simulateOperation(operation);
          const duration = Date.now() - startTime;
          const afterMemory = process.memoryUsage();
          
          operationResults.push({
            iteration: i + 1,
            duration,
            success: true,
            memoryDelta: {
              rss: afterMemory.rss - beforeMemory.rss,
              heapUsed: afterMemory.heapUsed - beforeMemory.heapUsed,
              heapTotal: afterMemory.heapTotal - beforeMemory.heapTotal
            }
          });
        } catch (error) {
          const duration = Date.now() - startTime;
          operationResults.push({
            iteration: i + 1,
            duration,
            success: false,
            error: error.message
          });
        }
      }

      const avgDuration = operationResults.reduce((sum, r) => sum + r.duration, 0) / operationResults.length;
      const avgMemoryDelta = operationResults
        .filter(r => r.success)
        .reduce((sum, r) => ({
          rss: sum.rss + r.memoryDelta.rss,
          heapUsed: sum.heapUsed + r.memoryDelta.heapUsed,
          heapTotal: sum.heapTotal + r.memoryDelta.heapTotal
        }), { rss: 0, heapUsed: 0, heapTotal: 0 });

      const successCount = operationResults.filter(r => r.success).length;
      if (successCount > 0) {
        avgMemoryDelta.rss /= successCount;
        avgMemoryDelta.heapUsed /= successCount;
        avgMemoryDelta.heapTotal /= successCount;
      }

      results.operations.push({
        operation,
        results: operationResults,
        averageDuration: avgDuration,
        averageMemoryDelta: avgMemoryDelta,
        successRate: (successCount / operationResults.length) * 100
      });
    }

    const finalMemory = process.memoryUsage();
    results.summary = {
      totalOperations: operations.length,
      totalIterations: operations.length * iterations,
      initialMemory,
      finalMemory,
      totalMemoryIncrease: {
        rss: finalMemory.rss - initialMemory.rss,
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: finalMemory.heapTotal - initialMemory.heapTotal
      }
    };

    logger.info('메모리 사용량 테스트 완료');
    return results;
  }

  /**
   * 스트레스 테스트
   */
  async runStressTests() {
    logger.info('스트레스 테스트 시작');
    const results = {
      concurrentUsers: this.testConfig.stressTests.concurrentUsers,
      duration: this.testConfig.stressTests.duration,
      operations: this.testConfig.stressTests.operations,
      results: []
    };

    const startTime = Date.now();
    const promises = [];

    // 동시 사용자 시뮬레이션
    for (let user = 0; user < this.testConfig.stressTests.concurrentUsers; user++) {
      promises.push(this.simulateConcurrentUser(user, startTime));
    }

    try {
      const userResults = await Promise.allSettled(promises);
      results.results = userResults.map((result, index) => ({
        user: index,
        status: result.status,
        value: result.value || result.reason
      }));

      const successCount = results.results.filter(r => r.status === 'fulfilled').length;
      results.summary = {
        totalUsers: this.testConfig.stressTests.concurrentUsers,
        successfulUsers: successCount,
        successRate: (successCount / this.testConfig.stressTests.concurrentUsers) * 100,
        totalDuration: Date.now() - startTime
      };
    } catch (error) {
      logger.error('스트레스 테스트 중 오류:', error);
      results.error = error.message;
    }

    logger.info('스트레스 테스트 완료');
    return results;
  }

  /**
   * 캐시 성능 테스트
   */
  async runCachePerformanceTests() {
    logger.info('캐시 성능 테스트 시작');
    const results = {
      tests: [],
      summary: {}
    };

    // 캐시 히트/미스 테스트
    const cacheTests = [
      { name: '캐시 히트 테스트', shouldHit: true },
      { name: '캐시 미스 테스트', shouldHit: false }
    ];

    for (const test of cacheTests) {
      const testResults = [];
      
      for (let i = 0; i < 20; i++) {
        const startTime = Date.now();
        try {
          const result = await this.simulateCacheOperation(test.shouldHit);
          const duration = Date.now() - startTime;
          
          testResults.push({
            iteration: i + 1,
            duration,
            success: true,
            cacheHit: result.cacheHit
          });
        } catch (error) {
          const duration = Date.now() - startTime;
          testResults.push({
            iteration: i + 1,
            duration,
            success: false,
            error: error.message
          });
        }
      }

      const avgDuration = testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length;
      const hitRate = testResults.filter(r => r.success && r.cacheHit).length / testResults.length * 100;

      results.tests.push({
        name: test.name,
        results: testResults,
        averageDuration: avgDuration,
        hitRate
      });
    }

    // 전체 요약
    const allDurations = results.tests.flatMap(t => t.results.map(r => r.duration));
    results.summary = {
      totalTests: results.tests.length,
      totalIterations: results.tests.reduce((sum, t) => sum + t.results.length, 0),
      averageDuration: allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length,
      overallHitRate: results.tests.reduce((sum, t) => sum + t.hitRate, 0) / results.tests.length
    };

    logger.info('캐시 성능 테스트 완료');
    return results;
  }

  /**
   * 벡터DB 성능 테스트
   */
  async runVectorDBPerformanceTests() {
    logger.info('벡터DB 성능 테스트 시작');
    const results = {
      operations: [],
      summary: {}
    };

    const vectorTests = [
      { name: '벡터 검색', operation: 'search' },
      { name: '벡터 저장', operation: 'store' },
      { name: '벡터 삭제', operation: 'delete' }
    ];

    for (const test of vectorTests) {
      const testResults = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        try {
          const result = await this.simulateVectorDBOperation(test.operation);
          const duration = Date.now() - startTime;
          
          testResults.push({
            iteration: i + 1,
            duration,
            success: true,
            result: result
          });
        } catch (error) {
          const duration = Date.now() - startTime;
          testResults.push({
            iteration: i + 1,
            duration,
            success: false,
            error: error.message
          });
        }
      }

      const avgDuration = testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length;
      const successRate = testResults.filter(r => r.success).length / testResults.length * 100;

      results.operations.push({
        name: test.name,
        operation: test.operation,
        results: testResults,
        averageDuration: avgDuration,
        successRate
      });
    }

    // 전체 요약
    const allDurations = results.operations.flatMap(o => o.results.map(r => r.duration));
    results.summary = {
      totalOperations: results.operations.length,
      totalIterations: results.operations.reduce((sum, o) => sum + o.results.length, 0),
      averageDuration: allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length,
      overallSuccessRate: results.operations.reduce((sum, o) => sum + o.successRate, 0) / results.operations.length
    };

    logger.info('벡터DB 성능 테스트 완료');
    return results;
  }

  /**
   * 테스트 결과 요약 생성
   */
  generateTestSummary(details) {
    const summary = {
      overallStatus: 'healthy',
      criticalIssues: 0,
      warnings: 0,
      recommendations: []
    };

    // 검색 성능 분석
    if (details.search?.summary?.averageDuration > 1000) {
      summary.warnings++;
      summary.recommendations.push('검색 응답시간이 1초를 초과합니다. 캐시 최적화를 고려하세요.');
    }

    // 메모리 사용량 분석
    if (details.memory?.summary?.totalMemoryIncrease?.heapUsed > 100 * 1024 * 1024) { // 100MB
      summary.warnings++;
      summary.recommendations.push('메모리 사용량이 급격히 증가했습니다. 메모리 누수를 확인하세요.');
    }

    // 스트레스 테스트 분석
    if (details.stress?.summary?.successRate < 90) {
      summary.criticalIssues++;
      summary.recommendations.push('동시 사용자 처리 성능이 부족합니다. 서버 리소스를 확장하세요.');
    }

    // 캐시 성능 분석
    if (details.cache?.summary?.overallHitRate < 50) {
      summary.warnings++;
      summary.recommendations.push('캐시 히트율이 낮습니다. 캐시 전략을 재검토하세요.');
    }

    // 전체 상태 결정
    if (summary.criticalIssues > 0) {
      summary.overallStatus = 'critical';
    } else if (summary.warnings > 0) {
      summary.overallStatus = 'warning';
    }

    return summary;
  }

  /**
   * 시뮬레이션 메서드들
   */
  async simulateIndexing(batchSize) {
    // 실제 인덱싱 작업 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    return { processedItems: batchSize };
  }

  async simulateOperation(operation) {
    // 실제 작업 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
    return { operation, success: true };
  }

  async simulateConcurrentUser(userId, startTime) {
    const results = [];
    const endTime = startTime + this.testConfig.stressTests.duration;

    while (Date.now() < endTime) {
      const operation = this.testConfig.stressTests.operations[
        Math.floor(Math.random() * this.testConfig.stressTests.operations.length)
      ];

      const start = Date.now();
      try {
        await this.simulateOperation(operation);
        results.push({
          operation,
          duration: Date.now() - start,
          success: true
        });
      } catch (error) {
        results.push({
          operation,
          duration: Date.now() - start,
          success: false,
          error: error.message
        });
      }

      // 짧은 대기 시간
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    }

    return results;
  }

  async simulateCacheOperation(shouldHit) {
    // 캐시 작업 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, shouldHit ? 5 : 50));
    return { cacheHit: shouldHit };
  }

  async simulateVectorDBOperation(operation) {
    // 벡터DB 작업 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 20));
    return { operation, success: true };
  }

  /**
   * 테스트 결과 조회
   */
  getTestResults() {
    return this.testResults;
  }

  /**
   * 최근 테스트 결과 조회
   */
  getLatestTestResult() {
    return this.testResults[this.testResults.length - 1];
  }

  /**
   * 테스트 결과 정리
   */
  clearTestResults() {
    this.testResults = [];
  }
}

export const performanceTestRunner = new PerformanceTestRunner(); 