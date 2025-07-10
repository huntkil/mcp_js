import performanceOptimizer from './src/services/performanceOptimizer.js';
import advancedFeatures from './src/services/advancedFeatures.js';

async function testFixes() {
  console.log('Testing Performance Optimizer fixes...');
  
  // Test cache hit rate
  performanceOptimizer.updateCacheHitRate(true);
  performanceOptimizer.updateCacheHitRate(false);
  performanceOptimizer.updateCacheHitRate(true);
  
  console.log('Cache hit rate:', performanceOptimizer.metrics.cacheHitRate);
  console.log('Expected: 0.6666666666666666');
  console.log('Pass:', Math.abs(performanceOptimizer.metrics.cacheHitRate - 2/3) < 0.001);
  
  // Test format bytes
  console.log('Format bytes 1024:', performanceOptimizer.formatBytes(1024));
  console.log('Expected: 1.0 KB');
  console.log('Pass:', performanceOptimizer.formatBytes(1024) === '1.0 KB');
  
  // Test format uptime
  const oneHour = 3600000;
  console.log('Format uptime 1 hour:', performanceOptimizer.formatUptime(oneHour));
  console.log('Expected: 1h 0m');
  console.log('Pass:', performanceOptimizer.formatUptime(oneHour).includes('1h'));
  
  // Test performance test
  const testFunc = async () => ({ result: 'success' });
  const results = await performanceOptimizer.runPerformanceTest(testFunc, 3);
  console.log('Performance test results:', results.results.length);
  console.log('Expected: 3');
  console.log('Pass:', results.results.length === 3);
  
  console.log('\nTesting Advanced Features fixes...');
  
  // Test summary length
  const longContent = 'This is a very long content that should be summarized to a specific length. '.repeat(10);
  const summary = await advancedFeatures.generateSummary(longContent, { maxLength: 50 });
  console.log('Summary length:', summary.summary.length);
  console.log('Expected: <= 50');
  console.log('Pass:', summary.summary.length <= 50);
  
  // Test smart tags with stop words
  const stopWordContent = 'the and or but if then else';
  const tags = await advancedFeatures.generateSmartTags(stopWordContent, { maxTags: 5, confidence: 0.5 });
  console.log('Tags for stop words:', tags.tags.length);
  console.log('Expected: 0');
  console.log('Pass:', tags.tags.length === 0);
  
  // Test knowledge graph statistics
  const testNotes = [
    { id: 'note1', title: 'Test 1', content: 'Content 1', tags: ['test'] },
    { id: 'note2', title: 'Test 2', content: 'Content 2', tags: ['test'] }
  ];
  const graph = await advancedFeatures.generateKnowledgeGraph(testNotes);
  console.log('Knowledge graph has statistics:', !!graph.statistics);
  console.log('Expected: true');
  console.log('Pass:', !!graph.statistics);
  
  // Test smart template
  const template = await advancedFeatures.generateSmartTemplate('meeting', { project: 'Test' });
  console.log('Template type:', template.templateType);
  console.log('Expected: meeting');
  console.log('Pass:', template.templateType === 'meeting');
  
  console.log('\nAll tests completed!');
}

testFixes().catch(console.error); 