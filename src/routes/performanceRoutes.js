import express from 'express';
import performanceOptimizer from '../services/performanceOptimizer.js';
import vectorDatabase from '../services/vectorDatabase.js';
import noteIndexingService from '../services/noteIndexingService.js';
import logger from '../utils/logger.js';
import { performanceTestRunner } from '../services/performanceTestRunner.js';

const router = express.Router();

/**
 * @swagger
 * /api/performance/metrics:
 *   post:
 *     summary: 성능 메트릭 기록
 *     description: 특정 작업의 성능 메트릭을 기록합니다.
 *     tags: [Performance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *               - startTime
 *             properties:
 *               operation:
 *                 type: string
 *                 description: 작업 이름
 *                 example: "search"
 *               startTime:
 *                 type: number
 *                 description: 작업 시작 시간 (timestamp)
 *                 example: 1642243200000
 *               success:
 *                 type: boolean
 *                 description: 작업 성공 여부
 *                 default: true
 *                 example: true
 *     responses:
 *       200:
 *         description: 메트릭 기록 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/metrics', async (req, res) => {
  try {
    const { operation, startTime, success = true } = req.body;
    
    if (!operation || !startTime) {
      return res.status(400).json({
        success: false,
        error: '작업 이름과 시작 시간이 필요합니다.'
      });
    }
    
    logger.info(`성능 메트릭 기록: ${operation}`);
    
    performanceOptimizer.recordMetric(operation, startTime, success);
    
    res.json({
      success: true,
      message: '성능 메트릭이 기록되었습니다.',
      operation,
      duration: Date.now() - startTime
    });
  } catch (error) {
    logger.error(`성능 메트릭 기록 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/performance/cache-hit-rate:
 *   post:
 *     summary: 캐시 히트율 업데이트
 *     description: 캐시 히트 여부를 기록하여 히트율을 업데이트합니다.
 *     tags: [Performance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hit
 *             properties:
 *               hit:
 *                 type: boolean
 *                 description: 캐시 히트 여부
 *                 example: true
 *     responses:
 *       200:
 *         description: 캐시 히트율 업데이트 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/cache-hit-rate', async (req, res) => {
  try {
    const { hit } = req.body;
    
    if (typeof hit !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: '캐시 히트 여부가 필요합니다.'
      });
    }
    
    logger.info(`캐시 히트율 업데이트: ${hit}`);
    
    performanceOptimizer.updateCacheHitRate(hit);
    
    res.json({
      success: true,
      message: '캐시 히트율이 업데이트되었습니다.',
      hit
    });
  } catch (error) {
    logger.error(`캐시 히트율 업데이트 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 성능 통계 조회
 */
router.get('/stats', async (req, res) => {
  try {
    const uptime = performanceOptimizer.getUptime();
    const searchMetrics = performanceOptimizer.getSearchMetrics();
    const cacheStats = performanceOptimizer.getCacheStats();
    const memoryUsage = performanceOptimizer.getMemoryUsage();
    const requestMetrics = performanceOptimizer.getRequestMetrics();
    const optimizations = performanceOptimizer.getOptimizationSettings();
    
    // 노트 및 벡터 수 조회
    const totalNotes = noteIndexingService ? noteIndexingService.getTotalNotes() : 0;
    const vectorCount = vectorDatabase ? vectorDatabase.getVectorCount() : 0;
    
    res.json({
      success: true,
      uptime,
      search: searchMetrics,
      cache: cacheStats,
      memory: memoryUsage,
      requests: requestMetrics,
      optimizations,
      totalNotes,
      vectorCount,
      status: 'healthy'
    });
  } catch (error) {
    logger.error('성능 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 성능 최적화 권장사항 조회
 */
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = [
      ...performanceOptimizer.generateOptimizationRecommendations(),
      ...performanceOptimizer.generateMemoryOptimizations()
    ];
    
    res.json({
      success: true,
      recommendations,
      totalRecommendations: recommendations.length
    });
  } catch (error) {
    logger.error('성능 권장사항 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 캐시 통계 조회
 */
router.get('/cache', async (req, res) => {
  try {
    const cacheStats = performanceOptimizer.getCacheStats();
    
    res.json({
      success: true,
      cache: cacheStats
    });
  } catch (error) {
    logger.error('캐시 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 메모리 사용량 조회
 */
router.get('/memory', async (req, res) => {
  try {
    const memoryUsage = performanceOptimizer.getMemoryUsage();
    
    res.json({
      success: true,
      memory: memoryUsage
    });
  } catch (error) {
    logger.error('메모리 사용량 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 캐시 정리
 */
router.post('/cache/clear', async (req, res) => {
  try {
    performanceOptimizer.clearCache();
    
    res.json({
      success: true,
      message: '캐시가 성공적으로 정리되었습니다.'
    });
  } catch (error) {
    logger.error('캐시 정리 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 성능 최적화 설정 업데이트
 */
router.post('/optimizations', async (req, res) => {
  try {
    const { enableCaching, enableCompression, enableBatchProcessing, enableParallelProcessing, cacheSize, maxConcurrentRequests } = req.body;
    
    performanceOptimizer.updateOptimizationSettings({
      enableCaching,
      enableCompression,
      enableBatchProcessing,
      enableParallelProcessing,
      cacheSize,
      maxConcurrentRequests
    });
    
    res.json({
      success: true,
      message: '성능 최적화 설정이 업데이트되었습니다.',
      settings: performanceOptimizer.getOptimizationSettings()
    });
  } catch (error) {
    logger.error('성능 최적화 설정 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/performance/test:
 *   post:
 *     summary: 성능 테스트 실행
 *     description: 지정된 함수의 성능을 테스트합니다.
 *     tags: [Performance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testFunction
 *             properties:
 *               testFunction:
 *                 type: string
 *                 description: 테스트할 함수 이름
 *                 example: "search"
 *                 enum: [search, indexing, processing]
 *               iterations:
 *                 type: number
 *                 description: 테스트 반복 횟수
 *                 default: 100
 *                 example: 50
 *               parameters:
 *                 type: object
 *                 description: 테스트 함수에 전달할 매개변수
 *                 example:
 *                   query: "test query"
 *                   topK: 10
 *     responses:
 *       200:
 *         description: 성능 테스트 실행 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/test', async (req, res) => {
  try {
    const { testFunction, iterations = 100 } = req.body; // Removed unused parameters
    
    if (!testFunction) {
      return res.status(400).json({
        success: false,
        error: '테스트할 함수 이름이 필요합니다.'
      });
    }
    
    logger.info(`성능 테스트 실행: ${testFunction}`);
    
    // 테스트 함수 정의
    const testFunctions = {
      search: async () => {
        // 모킹 검색 테스트
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        return { results: [], count: Math.floor(Math.random() * 10) };
      },
      indexing: async () => {
        // 모킹 인덱싱 테스트
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
        return { indexed: Math.floor(Math.random() * 100) };
      },
      processing: async () => {
        // 모킹 처리 테스트
        await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 75));
        return { processed: true };
      }
    };
    
    const testFn = testFunctions[testFunction];
    if (!testFn) {
      return res.status(400).json({
        success: false,
        error: '지원하지 않는 테스트 함수입니다.'
      });
    }
    
    const results = await performanceOptimizer.runPerformanceTest(testFn, iterations);
    
    res.json({
      success: true,
      testFunction,
      iterations,
      ...results
    });
  } catch (error) {
    logger.error(`성능 테스트 실행 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 전체 성능 테스트 스위트 실행
 */
router.post('/test-suite', async (req, res) => {
  try {
    logger.info('전체 성능 테스트 스위트 실행 요청');
    const results = await performanceTestRunner.runFullTestSuite();
    
    res.json({
      success: true,
      message: '전체 성능 테스트 스위트가 완료되었습니다.',
      results
    });
  } catch (error) {
    logger.error('전체 성능 테스트 스위트 실행 오류:', error);
    res.status(500).json({
      success: false,
      message: '성능 테스트 스위트 실행 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 개별 성능 테스트 실행
 */
router.post('/test/:testType', async (req, res) => {
  try {
    const { testType } = req.params;
    const { config } = req.body;
    
    logger.info(`${testType} 성능 테스트 실행 요청`);
    
    let results;
    switch (testType) {
      case 'search':
        results = await performanceTestRunner.runSearchPerformanceTests();
        break;
      case 'indexing':
        results = await performanceTestRunner.runIndexingPerformanceTests();
        break;
      case 'memory':
        results = await performanceTestRunner.runMemoryUsageTests();
        break;
      case 'stress':
        results = await performanceTestRunner.runStressTests();
        break;
      case 'cache':
        results = await performanceTestRunner.runCachePerformanceTests();
        break;
      case 'vectorDB':
        results = await performanceTestRunner.runVectorDBPerformanceTests();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '지원하지 않는 테스트 타입입니다.',
          supportedTypes: ['search', 'indexing', 'memory', 'stress', 'cache', 'vectorDB']
        });
    }
    
    res.json({
      success: true,
      message: `${testType} 성능 테스트가 완료되었습니다.`,
      results
    });
  } catch (error) {
    logger.error(`${req.params.testType} 성능 테스트 실행 오류:`, error);
    res.status(500).json({
      success: false,
      message: '성능 테스트 실행 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 테스트 결과 조회
 */
router.get('/test-results', async (req, res) => {
  try {
    const results = performanceTestRunner.getTestResults();
    
    res.json({
      success: true,
      message: '테스트 결과를 조회했습니다.',
      results,
      count: results.length
    });
  } catch (error) {
    logger.error('테스트 결과 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '테스트 결과 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 최근 테스트 결과 조회
 */
router.get('/test-results/latest', async (req, res) => {
  try {
    const latestResult = performanceTestRunner.getLatestTestResult();
    
    if (!latestResult) {
      return res.status(404).json({
        success: false,
        message: '실행된 테스트 결과가 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '최근 테스트 결과를 조회했습니다.',
      result: latestResult
    });
  } catch (error) {
    logger.error('최근 테스트 결과 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '최근 테스트 결과 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 테스트 결과 정리
 */
router.delete('/test-results', async (req, res) => {
  try {
    performanceTestRunner.clearTestResults();
    
    res.json({
      success: true,
      message: '모든 테스트 결과가 정리되었습니다.'
    });
  } catch (error) {
    logger.error('테스트 결과 정리 오류:', error);
    res.status(500).json({
      success: false,
      message: '테스트 결과 정리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 성능 테스트 설정 조회
 */
router.get('/test-config', async (req, res) => {
  try {
    const config = performanceTestRunner.testConfig;
    
    res.json({
      success: true,
      message: '성능 테스트 설정을 조회했습니다.',
      config
    });
  } catch (error) {
    logger.error('성능 테스트 설정 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '성능 테스트 설정 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/performance/memory/optimize:
 *   post:
 *     summary: 메모리 최적화
 *     description: 메모리 사용량을 최적화합니다.
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: 메모리 최적화 성공
 *       500:
 *         description: 서버 오류
 */
router.post('/memory/optimize', async (req, res) => {
  try {
    logger.info('메모리 최적화 실행');
    
    const beforeMemory = process.memoryUsage();
    const optimizationResult = performanceOptimizer.optimizeMemory();
    const afterMemory = process.memoryUsage();
    
    res.json({
      success: true,
      message: '메모리 최적화가 완료되었습니다.',
      beforeMemory: {
        rss: performanceOptimizer.formatBytes(beforeMemory.rss),
        heapUsed: performanceOptimizer.formatBytes(beforeMemory.heapUsed),
        heapTotal: performanceOptimizer.formatBytes(beforeMemory.heapTotal)
      },
      afterMemory: {
        rss: performanceOptimizer.formatBytes(afterMemory.rss),
        heapUsed: performanceOptimizer.formatBytes(afterMemory.heapUsed),
        heapTotal: performanceOptimizer.formatBytes(afterMemory.heapTotal)
      },
      optimizationResult
    });
  } catch (error) {
    logger.error(`메모리 최적화 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/performance/report:
 *   get:
 *     summary: 성능 리포트 생성
 *     description: 현재 성능 상태에 대한 상세한 리포트를 생성합니다.
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: 성능 리포트 생성 성공
 *       500:
 *         description: 서버 오류
 */
router.get('/report', async (req, res) => {
  try {
    logger.info('성능 리포트 생성');
    
    const report = performanceOptimizer.generatePerformanceReport();
    
    res.json({
      success: true,
      ...report
    });
  } catch (error) {
    logger.error(`성능 리포트 생성 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/performance/config:
 *   get:
 *     summary: 성능 설정 조회
 *     description: 현재 성능 최적화 설정을 조회합니다.
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: 설정 조회 성공
 *       500:
 *         description: 서버 오류
 */
router.get('/config', async (req, res) => {
  try {
    logger.info('성능 설정 조회');
    
    res.json({
      success: true,
      optimizations: performanceOptimizer.optimizations
    });
  } catch (error) {
    logger.error(`성능 설정 조회 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/performance/config:
 *   post:
 *     summary: 성능 설정 변경
 *     description: 성능 최적화 설정을 변경합니다.
 *     tags: [Performance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enableCaching:
 *                 type: boolean
 *                 description: 캐싱 활성화 여부
 *                 example: true
 *               enableCompression:
 *                 type: boolean
 *                 description: 압축 활성화 여부
 *                 example: true
 *               enableBatchProcessing:
 *                 type: boolean
 *                 description: 배치 처리 활성화 여부
 *                 example: true
 *               enableParallelProcessing:
 *                 type: boolean
 *                 description: 병렬 처리 활성화 여부
 *                 example: true
 *               cacheSize:
 *                 type: number
 *                 description: 캐시 크기
 *                 example: 1000
 *               maxConcurrentRequests:
 *                 type: number
 *                 description: 최대 동시 요청 수
 *                 example: 10
 *     responses:
 *       200:
 *         description: 설정 변경 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/config', async (req, res) => {
  try {
    const config = req.body;
    
    logger.info('성능 설정 변경');
    
    // 설정 유효성 검사
    if (config.cacheSize && config.cacheSize < 0) {
      return res.status(400).json({
        success: false,
        error: '캐시 크기는 0 이상이어야 합니다.'
      });
    }
    
    if (config.maxConcurrentRequests && config.maxConcurrentRequests < 1) {
      return res.status(400).json({
        success: false,
        error: '최대 동시 요청 수는 1 이상이어야 합니다.'
      });
    }
    
    // 설정 적용
    Object.assign(performanceOptimizer.optimizations, config);
    
    res.json({
      success: true,
      message: '성능 설정이 변경되었습니다.',
      optimizations: performanceOptimizer.optimizations
    });
  } catch (error) {
    logger.error(`성능 설정 변경 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/performance/vector-stats:
 *   get:
 *     summary: 벡터 데이터베이스 통계
 *     description: 벡터 데이터베이스와 인덱싱 상태를 조회합니다.
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: 벡터 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 vectorDatabase:
 *                   type: object
 *                   properties:
 *                     totalVectors:
 *                       type: number
 *                     indexSize:
 *                       type: string
 *                     lastUpdated:
 *                       type: string
 *                 indexing:
 *                   type: object
 *                   properties:
 *                     totalNotes:
 *                       type: number
 *                     totalChunks:
 *                       type: number
 *                     lastIndexed:
 *                       type: string
 *       500:
 *         description: 서버 오류
 */
router.get('/vector-stats', async (req, res) => {
  try {
    logger.info('벡터 데이터베이스 통계 조회');
    
    // 벡터 데이터베이스 통계
    const vectorStats = await vectorDatabase.getStats();
    
    // 인덱싱 통계
    const indexStats = noteIndexingService.getIndexStats();
    
    res.json({
      success: true,
      vectorDatabase: vectorStats,
      indexing: indexStats
    });
  } catch (error) {
    logger.error(`벡터 통계 조회 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 