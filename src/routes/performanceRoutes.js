import express from 'express';
import performanceOptimizer from '../services/performanceOptimizer.js';
import vectorDatabase from '../services/vectorDatabase.js';
import noteIndexingService from '../services/noteIndexingService.js';
import logger from '../utils/logger.js';

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
 * @swagger
 * /api/performance/stats:
 *   get:
 *     summary: 성능 통계 조회
 *     description: 현재 성능 통계를 조회합니다.
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: 성능 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 uptime:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     formatted:
 *                       type: string
 *                 search:
 *                   type: object
 *                   properties:
 *                     averageLatency:
 *                       type: number
 *                     minLatency:
 *                       type: number
 *                     maxLatency:
 *                       type: number
 *                     totalRequests:
 *                       type: number
 *                 cache:
 *                   type: object
 *                   properties:
 *                     hitRate:
 *                       type: number
 *                     hitRatePercentage:
 *                       type: string
 *                 requests:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     errors:
 *                       type: number
 *                     successRate:
 *                       type: string
 *                 memory:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: string
 *                     heapUsed:
 *                       type: string
 *                     heapTotal:
 *                       type: string
 *                     heapUsagePercentage:
 *                       type: string
 *                 optimizations:
 *                   type: object
 *       500:
 *         description: 서버 오류
 */
router.get('/stats', async (req, res) => {
  try {
    logger.info('성능 통계 조회');
    
    const stats = performanceOptimizer.getPerformanceStats();
    
    // 추가 정보 가져오기
    const totalNotes = await noteIndexingService.getTotalNotes();
    const vectorCount = await vectorDatabase.getVectorCount();
    
    res.json({
      success: true,
      ...stats,
      totalNotes,
      vectorCount,
      status: 'healthy' // 기본 상태
    });
  } catch (error) {
    logger.error(`성능 통계 조회 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/performance/recommendations:
 *   get:
 *     summary: 성능 최적화 권장사항 조회
 *     description: 현재 성능 상태를 분석하여 최적화 권장사항을 제공합니다.
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: 권장사항 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [info, warning, error]
 *                       category:
 *                         type: string
 *                       message:
 *                         type: string
 *                       priority:
 *                         type: string
 *                         enum: [low, medium, high, critical]
 *       500:
 *         description: 서버 오류
 */
router.get('/recommendations', async (req, res) => {
  try {
    logger.info('성능 최적화 권장사항 조회');
    
    const recommendations = performanceOptimizer.generateOptimizationRecommendations();
    
    res.json({
      success: true,
      recommendations,
      totalRecommendations: recommendations.length
    });
  } catch (error) {
    logger.error(`성능 최적화 권장사항 조회 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/performance/auto-optimize:
 *   post:
 *     summary: 자동 성능 최적화 적용
 *     description: 성능 분석 결과에 따라 자동으로 최적화 설정을 적용합니다.
 *     tags: [Performance]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force:
 *                 type: boolean
 *                 description: 강제 최적화 적용 여부
 *                 default: false
 *                 example: false
 *     responses:
 *       200:
 *         description: 자동 최적화 적용 성공
 *       500:
 *         description: 서버 오류
 */
router.post('/auto-optimize', async (req, res) => {
  try {
    // const { force = false } = req.body; // Unused variable removed
    
    logger.info('자동 성능 최적화 적용');
    
    const changes = performanceOptimizer.applyAutoOptimizations();
    
    res.json({
      success: true,
      message: '자동 최적화가 적용되었습니다.',
      changes,
      totalChanges: changes.length,
      optimizations: performanceOptimizer.optimizations
    });
  } catch (error) {
    logger.error(`자동 성능 최적화 적용 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/performance/monitoring/start:
 *   post:
 *     summary: 성능 모니터링 시작
 *     description: 실시간 성능 모니터링을 시작합니다.
 *     tags: [Performance]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interval:
 *                 type: number
 *                 description: 모니터링 간격 (밀리초)
 *                 default: 5000
 *                 example: 10000
 *     responses:
 *       200:
 *         description: 모니터링 시작 성공
 *       500:
 *         description: 서버 오류
 */
router.post('/monitoring/start', async (req, res) => {
  try {
    const { interval = 5000 } = req.body;
    
    logger.info('성능 모니터링 시작');
    
    performanceOptimizer.startMonitoring(interval);
    
    res.json({
      success: true,
      message: '성능 모니터링이 시작되었습니다.',
      interval
    });
  } catch (error) {
    logger.error(`성능 모니터링 시작 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/performance/monitoring/stop:
 *   post:
 *     summary: 성능 모니터링 중지
 *     description: 실시간 성능 모니터링을 중지합니다.
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: 모니터링 중지 성공
 *       500:
 *         description: 서버 오류
 */
router.post('/monitoring/stop', async (req, res) => {
  try {
    logger.info('성능 모니터링 중지');
    
    performanceOptimizer.stopMonitoring();
    
    res.json({
      success: true,
      message: '성능 모니터링이 중지되었습니다.'
    });
  } catch (error) {
    logger.error(`성능 모니터링 중지 오류: ${error.message}`);
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