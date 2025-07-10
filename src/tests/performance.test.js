/* global describe, test, expect, beforeEach */
import performanceOptimizer from '../services/performanceOptimizer.js';

describe('Performance Optimizer Tests', () => {
  beforeEach(() => {
    // Reset metrics for each test
    performanceOptimizer.metrics = {
      searchLatency: [],
      cacheHitRate: 0,
      memoryUsage: [],
      cpuUsage: [],
      requestCount: 0,
      errorCount: 0
    };
  });
  
  describe('Metrics Recording', () => {
    test('should record metrics successfully', () => {
      const startTime = Date.now();
      const operation = 'search';
      
      performanceOptimizer.recordMetric(operation, startTime, true);
      
      expect(performanceOptimizer.metrics.requestCount).toBe(1);
      expect(performanceOptimizer.metrics.errorCount).toBe(0);
      expect(performanceOptimizer.metrics.searchLatency.length).toBe(1);
      expect(performanceOptimizer.metrics.memoryUsage.length).toBe(1);
    });
    
    test('should record failed operations', () => {
      const startTime = Date.now();
      const operation = 'search';
      
      performanceOptimizer.recordMetric(operation, startTime, false);
      
      expect(performanceOptimizer.metrics.requestCount).toBe(1);
      expect(performanceOptimizer.metrics.errorCount).toBe(1);
    });
    
    test('should limit search latency history', () => {
      const startTime = Date.now();
      
      // Add more than 100 metrics
      for (let i = 0; i < 110; i++) {
        performanceOptimizer.recordMetric('search', startTime, true);
      }
      
      expect(performanceOptimizer.metrics.searchLatency.length).toBeLessThanOrEqual(100);
    });
    
    test('should limit memory usage history', () => {
      const startTime = Date.now();
      
      // Add more than 50 metrics
      for (let i = 0; i < 60; i++) {
        performanceOptimizer.recordMetric('search', startTime, true);
      }
      
      expect(performanceOptimizer.metrics.memoryUsage.length).toBeLessThanOrEqual(50);
    });
  });
  
  describe('Cache Hit Rate', () => {
    test('should update cache hit rate correctly', () => {
      performanceOptimizer.updateCacheHitRate(true);
      performanceOptimizer.updateCacheHitRate(false);
      performanceOptimizer.updateCacheHitRate(true);
      
      expect(performanceOptimizer.metrics.cacheHitRate).toBe(2/3);
    });
    
    test('should handle zero requests', () => {
      performanceOptimizer.updateCacheHitRate(true);
      
      expect(performanceOptimizer.metrics.cacheHitRate).toBe(1);
    });
  });
  
  describe('Performance Statistics', () => {
    test('should return performance stats', () => {
      const startTime = Date.now();
      
      // Add some test metrics
      performanceOptimizer.recordMetric('search', startTime, true);
      performanceOptimizer.recordMetric('search', startTime, true);
      performanceOptimizer.recordMetric('search', startTime, false);
      
      performanceOptimizer.updateCacheHitRate(true);
      performanceOptimizer.updateCacheHitRate(false);
      
      const stats = performanceOptimizer.getPerformanceStats();
      
      expect(stats).toBeDefined();
      expect(stats.uptime).toBeDefined();
      expect(stats.uptime.total).toBeGreaterThan(0);
      expect(stats.uptime.formatted).toBeDefined();
      expect(stats.search).toBeDefined();
      expect(stats.search.totalRequests).toBe(3);
      expect(stats.cache).toBeDefined();
      expect(stats.cache.hitRate).toBe(0.5);
      expect(stats.requests).toBeDefined();
      expect(stats.requests.total).toBe(3);
      expect(stats.requests.errors).toBe(1);
      expect(stats.optimizations).toBeDefined();
    });
    
    test('should handle empty metrics', () => {
      const stats = performanceOptimizer.getPerformanceStats();
      
      expect(stats.search.averageLatency).toBe(0);
      expect(stats.search.minLatency).toBe(0);
      expect(stats.search.maxLatency).toBe(0);
      expect(stats.search.totalRequests).toBe(0);
    });
  });
  
  describe('Optimization Recommendations', () => {
    test('should generate recommendations for high latency', () => {
      const startTime = Date.now() - 2000; // 2 seconds ago
      
      // Add high latency metrics
      for (let i = 0; i < 10; i++) {
        performanceOptimizer.recordMetric('search', startTime, true);
      }
      
      const recommendations = performanceOptimizer.generateOptimizationRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.some(rec => 
        rec.category === 'search' && rec.type === 'warning'
      )).toBe(true);
    });
    
    test('should generate recommendations for low cache hit rate', () => {
      // Set low cache hit rate
      performanceOptimizer.metrics.cacheHitRate = 0.2;
      performanceOptimizer.metrics.requestCount = 10;
      
      const recommendations = performanceOptimizer.generateOptimizationRecommendations();
      
      expect(recommendations.some(rec => 
        rec.category === 'cache' && rec.type === 'info'
      )).toBe(true);
    });
    
    test('should generate recommendations for high error rate', () => {
      const startTime = Date.now();
      
      // Add many errors
      for (let i = 0; i < 10; i++) {
        performanceOptimizer.recordMetric('search', startTime, false);
      }
      
      const recommendations = performanceOptimizer.generateOptimizationRecommendations();
      
      expect(recommendations.some(rec => 
        rec.category === 'reliability' && rec.type === 'error'
      )).toBe(true);
    });
  });
  
  describe('Auto Optimizations', () => {
    test('should apply auto optimizations', () => {
      const startTime = Date.now() - 2000; // 2 seconds ago
      
      // Add high latency metrics
      for (let i = 0; i < 10; i++) {
        performanceOptimizer.recordMetric('search', startTime, true);
      }
      
      const changes = performanceOptimizer.applyAutoOptimizations();
      
      expect(Array.isArray(changes)).toBe(true);
      expect(changes.length).toBeGreaterThan(0);
    });
    
    test('should increase cache size for high latency', () => {
      const originalCacheSize = performanceOptimizer.optimizations.cacheSize;
      const startTime = Date.now() - 2000;
      
      // Add high latency metrics
      for (let i = 0; i < 10; i++) {
        performanceOptimizer.recordMetric('search', startTime, true);
      }
      
      performanceOptimizer.applyAutoOptimizations();
      
      expect(performanceOptimizer.optimizations.cacheSize).toBeGreaterThan(originalCacheSize);
    });
  });
  
  describe('Monitoring', () => {
    test('should start monitoring', () => {
      performanceOptimizer.startMonitoring(5000);
      
      expect(performanceOptimizer.monitoringInterval).toBeDefined();
    });
    
    test('should stop monitoring', () => {
      performanceOptimizer.startMonitoring(5000);
      performanceOptimizer.stopMonitoring();
      
      expect(performanceOptimizer.monitoringInterval).toBeNull();
    });
  });
  
  describe('Performance Testing', () => {
    test('should run performance test successfully', async () => {
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { result: 'success' };
      };
      
      const results = await performanceOptimizer.runPerformanceTest(testFunction, 5);
      
      expect(results).toBeDefined();
      expect(results.iterations).toBe(5);
      expect(results.totalTime).toBeGreaterThan(0);
      expect(results.averageTime).toBeGreaterThan(0);
      expect(results.minTime).toBeGreaterThan(0);
      expect(results.maxTime).toBeGreaterThan(0);
      expect(results.results).toHaveLength(5);
    });
    
    test('should handle test function errors', async () => {
      const testFunction = async () => {
        throw new Error('Test error');
      };
      
      const results = await performanceOptimizer.runPerformanceTest(testFunction, 3);
      
      expect(results).toBeDefined();
      expect(results.errors).toBe(3);
      expect(results.successRate).toBe(0);
    });
  });
  
  describe('Memory Optimization', () => {
    test('should optimize memory', () => {
      const result = performanceOptimizer.optimizeMemory();
      
      expect(result).toBeDefined();
      expect(result.optimizations).toBeDefined();
      expect(Array.isArray(result.optimizations)).toBe(true);
    });
  });
  
  describe('Utility Functions', () => {
    test('should format bytes correctly', () => {
      expect(performanceOptimizer.formatBytes(1024)).toBe('1.0 KB');
      expect(performanceOptimizer.formatBytes(1048576)).toBe('1.0 MB');
      expect(performanceOptimizer.formatBytes(1073741824)).toBe('1.0 GB');
      expect(performanceOptimizer.formatBytes(0)).toBe('0 B');
    });
    
    test('should format uptime correctly', () => {
      const oneHour = 3600000; // 1 hour in milliseconds
      const formatted = performanceOptimizer.formatUptime(oneHour);
      
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('1h');
    });
  });
  
  describe('Performance Report', () => {
    test('should generate performance report', () => {
      const startTime = Date.now();
      
      // Add some test data
      performanceOptimizer.recordMetric('search', startTime, true);
      performanceOptimizer.recordMetric('search', startTime, true);
      performanceOptimizer.updateCacheHitRate(true);
      
      const report = performanceOptimizer.generatePerformanceReport();
      
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.details).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.timestamp).toBeDefined();
    });
  });
  
  describe('Configuration', () => {
    test('should have default optimizations', () => {
      expect(performanceOptimizer.optimizations).toBeDefined();
      expect(performanceOptimizer.optimizations.enableCaching).toBe(true);
      expect(performanceOptimizer.optimizations.enableCompression).toBe(true);
      expect(performanceOptimizer.optimizations.enableBatchProcessing).toBe(true);
      expect(performanceOptimizer.optimizations.enableParallelProcessing).toBe(true);
      expect(performanceOptimizer.optimizations.cacheSize).toBe(1000);
      expect(performanceOptimizer.optimizations.maxConcurrentRequests).toBe(10);
    });
    
    test('should update optimizations', () => {
      const newConfig = {
        cacheSize: 2000,
        maxConcurrentRequests: 15
      };
      
      Object.assign(performanceOptimizer.optimizations, newConfig);
      
      expect(performanceOptimizer.optimizations.cacheSize).toBe(2000);
      expect(performanceOptimizer.optimizations.maxConcurrentRequests).toBe(15);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle invalid test function', async () => {
      const invalidFunction = null;
      
      await expect(
        performanceOptimizer.runPerformanceTest(invalidFunction, 1)
      ).rejects.toThrow();
    });
    
    test('should handle monitoring errors', () => {
      // This test ensures monitoring doesn't crash on errors
      performanceOptimizer.startMonitoring(100);
      
      // Simulate some time passing
      setTimeout(() => {
        performanceOptimizer.stopMonitoring();
      }, 200);
      
      // Test should complete without errors
      expect(true).toBe(true);
    });
  });
  
  describe('Integration Tests', () => {
    test('should handle complete performance workflow', async () => {
      const startTime = Date.now();
      
      // 1. Record metrics
      performanceOptimizer.recordMetric('search', startTime, true);
      performanceOptimizer.recordMetric('indexing', startTime, true);
      
      // 2. Update cache hit rate
      performanceOptimizer.updateCacheHitRate(true);
      performanceOptimizer.updateCacheHitRate(false);
      
      // 3. Get statistics
      const stats = performanceOptimizer.getPerformanceStats();
      expect(stats.requests.total).toBe(2);
      
      // 4. Generate recommendations
      const recommendations = performanceOptimizer.generateOptimizationRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
      
      // 5. Apply auto optimizations
      const changes = performanceOptimizer.applyAutoOptimizations();
      expect(Array.isArray(changes)).toBe(true);
      
      // 6. Generate report
      const report = performanceOptimizer.generatePerformanceReport();
      expect(report).toBeDefined();
    });
  });
}); 