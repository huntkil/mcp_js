const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:8080';
const VAULT_PATH = '/Users/gukho/Library/Mobile Documents/iCloud~md~obsidian/Documents/My Card';

// 성능 측정 유틸리티
class PerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      requests: 0,
      totalTime: 0,
      errors: 0,
      memoryUsage: [],
      responseTimes: []
    };
  }

  startTimer() {
    return Date.now();
  }

  endTimer(startTime) {
    const duration = Date.now() - startTime;
    this.metrics.totalTime += duration;
    this.metrics.responseTimes.push(duration);
    return duration;
  }

  recordRequest() {
    this.metrics.requests++;
  }

  recordError() {
    this.metrics.errors++;
  }

  recordMemoryUsage() {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal
    });
  }

  getStats() {
    const avgResponseTime = this.metrics.responseTimes.length > 0 
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length 
      : 0;
    
    const successRate = this.metrics.requests > 0 
      ? ((this.metrics.requests - this.metrics.errors) / this.metrics.requests * 100).toFixed(2)
      : 0;

    return {
      totalRequests: this.metrics.requests,
      totalTime: this.metrics.totalTime,
      avgResponseTime: avgResponseTime.toFixed(2),
      successRate: `${successRate}%`,
      errors: this.metrics.errors,
      memoryUsage: this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1]
    };
  }
}

// API 호출 래퍼
async function apiCall(endpoint, data = null, method = 'POST') {
  const startTime = performanceMonitor.startTimer();
  performanceMonitor.recordRequest();
  
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    const duration = performanceMonitor.endTimer(startTime);
    
    console.log(`✅ ${endpoint} - ${duration}ms`);
    return response.data;
  } catch (error) {
    performanceMonitor.recordError();
    const duration = performanceMonitor.endTimer(startTime);
    console.log(`❌ ${endpoint} - ${duration}ms - ${error.message}`);
    return null;
  }
}

// 실제 볼트 정보 수집
async function analyzeVault() {
  console.log('\n🔍 실제 볼트 분석 시작...');
  
  try {
    const files = fs.readdirSync(VAULT_PATH, { recursive: true });
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    console.log(`📁 발견된 Markdown 파일: ${markdownFiles.length}개`);
    
    // 파일 크기 분석
    let totalSize = 0;
    const fileSizes = [];
    
    for (const file of markdownFiles.slice(0, 10)) { // 처음 10개만 분석
      const filePath = path.join(VAULT_PATH, file);
      const stats = fs.statSync(filePath);
      const size = stats.size;
      totalSize += size;
      fileSizes.push({ file, size });
    }
    
    console.log(`📊 샘플 파일 크기 분석:`);
    fileSizes.forEach(({ file, size }) => {
      console.log(`   ${file}: ${(size / 1024).toFixed(2)}KB`);
    });
    
    return {
      totalFiles: markdownFiles.length,
      sampleFiles: markdownFiles.slice(0, 10),
      avgFileSize: totalSize / fileSizes.length
    };
  } catch (error) {
    console.log(`❌ 볼트 분석 실패: ${error.message}`);
    return null;
  }
}

// 1. 볼트 인덱싱 테스트
async function testVaultIndexing() {
  console.log('\n📚 1단계: 볼트 인덱싱 테스트');
  
  const result = await apiCall('/api/advanced/index-vault', {
    vaultPath: VAULT_PATH,
    forceReindex: true
  });
  
  if (result && result.success) {
    console.log(`✅ 인덱싱 완료: ${result.indexed}개 노트, ${result.duration}ms`);
    return result;
  } else {
    console.log('❌ 인덱싱 실패');
    return null;
  }
}

// 2. 검색 기능 테스트
async function testSearchFeatures() {
  console.log('\n🔍 2단계: 검색 기능 테스트');
  
  const testQueries = [
    '마음근력',
    '명상',
    '습관',
    '자기조절력',
    '통계',
    '운동',
    '학습',
    '목표'
  ];
  
  const results = {};
  
  for (const query of testQueries) {
    console.log(`\n🔎 "${query}" 검색 중...`);
    
    // 의미론적 검색
    const semanticResult = await apiCall('/api/search/semantic', {
      query,
      options: { maxResults: 5, similarityThreshold: 0.3 }
    });
    
    // 키워드 검색
    const keywordResult = await apiCall('/api/search/keyword', {
      query,
      options: { topK: 5 }
    });
    
    // 하이브리드 검색
    const hybridResult = await apiCall('/api/search/hybrid', {
      query,
      options: { maxResults: 5, similarityThreshold: 0.3 }
    });
    
    results[query] = {
      semantic: semanticResult?.results?.length || 0,
      keyword: keywordResult?.results?.length || 0,
      hybrid: hybridResult?.results?.length || 0
    };
    
    console.log(`   의미론적: ${results[query].semantic}개`);
    console.log(`   키워드: ${results[query].keyword}개`);
    console.log(`   하이브리드: ${results[query].hybrid}개`);
  }
  
  return results;
}

// 3. 추천 시스템 테스트
async function testRecommendationSystem() {
  console.log('\n🎯 3단계: 추천 시스템 테스트');
  
  // 테스트용 노트 데이터
  const testNotes = [
    {
      fileName: '마음근력.md',
      title: '마음근력',
      content: '마음근력은 긍정적인 마음가짐과 인내심을 기르는 것이다. 어려운 상황에서도 포기하지 않고 꾸준히 노력하는 힘이다.'
    },
    {
      fileName: '명상.md',
      title: '명상',
      content: '명상은 마음을 집중시키고 평온을 찾는 방법이다. 호흡에 집중하여 스트레스를 줄이고 마음의 평화를 찾는다.'
    }
  ];
  
  const results = {};
  
  for (const note of testNotes) {
    console.log(`\n🎯 "${note.title}" 추천 테스트...`);
    
    // 유사노트 추천
    const similarResult = await apiCall('/api/advanced/recommendations/similar-notes', {
      targetNote: note,
      options: { similarityThreshold: 0.3, maxRecommendations: 5 }
    });
    
    // 백링크 제안
    const backlinkResult = await apiCall('/api/advanced/recommendations/backlinks', {
      targetNote: note,
      options: { similarityThreshold: 0.3, maxSuggestions: 5 }
    });
    
    results[note.title] = {
      similar: similarResult?.data?.recommendations?.length || 0,
      backlinks: backlinkResult?.data?.suggestions?.length || 0
    };
    
    console.log(`   유사노트: ${results[note.title].similar}개`);
    console.log(`   백링크: ${results[note.title].backlinks}개`);
  }
  
  return results;
}

// 4. 고급 기능 테스트
async function testAdvancedFeatures() {
  console.log('\n🚀 4단계: 고급 기능 테스트');
  
  const testText = `
    마음근력은 우리의 삶에서 매우 중요한 요소입니다. 
    어려운 상황에서도 포기하지 않고 꾸준히 노력하는 힘을 말합니다.
    명상, 자기조절력 훈련, 긍정적 사고 등이 마음근력을 기르는 방법입니다.
    이러한 습관들이 모여 우리의 삶을 더욱 풍요롭게 만들어줍니다.
  `;
  
  const results = {};
  
  // 텍스트 요약
  console.log('📝 텍스트 요약 테스트...');
  const summaryResult = await apiCall('/api/advanced/summarize', {
    text: testText,
    options: { maxLength: 100 }
  });
  
  if (summaryResult?.success) {
    results.summary = {
      success: true,
      originalLength: summaryResult.data.originalLength,
      summaryLength: summaryResult.data.summaryLength,
      compressionRatio: summaryResult.data.compressionRatio
    };
    console.log(`   요약 완료: ${summaryResult.data.summaryLength}자 (압축률: ${summaryResult.data.compressionRatio}%)`);
  } else {
    results.summary = { success: false };
    console.log('   요약 실패');
  }
  
  // 태그 추출
  console.log('🏷️ 태그 추출 테스트...');
  const tagResult = await apiCall('/api/advanced/tag', {
    text: testText
  });
  
  if (tagResult?.success) {
    results.tags = {
      success: true,
      tags: tagResult.data.tags,
      confidence: tagResult.data.confidence
    };
    console.log(`   태그 추출 완료: ${tagResult.data.tags.join(', ')}`);
  } else {
    results.tags = { success: false };
    console.log('   태그 추출 실패');
  }
  
  // 지식 그래프
  console.log('🕸️ 지식 그래프 테스트...');
  const graphResult = await apiCall('/api/advanced/knowledge-graph', {
    vaultPath: VAULT_PATH,
    options: { maxNodes: 20, minConnections: 1 }
  });
  
  if (graphResult?.success) {
    results.knowledgeGraph = {
      success: true,
      nodes: graphResult.data.nodes?.length || 0,
      edges: graphResult.data.edges?.length || 0,
      clusters: graphResult.data.clusters?.length || 0
    };
    console.log(`   지식 그래프 완료: ${results.knowledgeGraph.nodes}개 노트, ${results.knowledgeGraph.edges}개 연결`);
  } else {
    results.knowledgeGraph = { success: false };
    console.log('   지식 그래프 실패');
  }
  
  return results;
}

// 5. 성능 모니터링 테스트
async function testPerformanceMonitoring() {
  console.log('\n📊 5단계: 성능 모니터링 테스트');
  
  const results = {};
  
  // 시스템 상태
  const statusResult = await apiCall('/api/advanced/features/status', null, 'GET');
  if (statusResult?.success) {
    results.status = statusResult.data;
    console.log('✅ 시스템 상태 조회 성공');
  } else {
    results.status = null;
    console.log('❌ 시스템 상태 조회 실패');
  }
  
  // 성능 통계
  const statsResult = await apiCall('/api/performance/stats', null, 'GET');
  if (statsResult?.success) {
    results.stats = statsResult.data;
    console.log('✅ 성능 통계 조회 성공');
  } else {
    results.stats = null;
    console.log('❌ 성능 통계 조회 실패');
  }
  
  return results;
}

// 6. 부하 테스트
async function testLoadPerformance() {
  console.log('\n⚡ 6단계: 부하 테스트');
  
  const concurrentRequests = 10;
  const testQueries = ['마음근력', '명상', '습관', '자기조절력', '통계'];
  
  console.log(`${concurrentRequests}개 동시 요청 테스트...`);
  
  const promises = [];
  for (let i = 0; i < concurrentRequests; i++) {
    const query = testQueries[i % testQueries.length];
    promises.push(
      apiCall('/api/search/semantic', {
        query,
        options: { maxResults: 3, similarityThreshold: 0.3 }
      })
    );
  }
  
  const startTime = Date.now();
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  const successCount = results.filter(r => r !== null).length;
  const avgTime = totalTime / concurrentRequests;
  
  console.log(`✅ 동시 요청 완료: ${successCount}/${concurrentRequests} 성공, 평균 ${avgTime.toFixed(2)}ms`);
  
  return {
    totalTime,
    avgTime,
    successCount,
    successRate: (successCount / concurrentRequests * 100).toFixed(2)
  };
}

// 메인 테스트 실행
async function runComprehensiveTest() {
  console.log('🚀 실제 볼트 종합 테스트 시작');
  console.log('=' .repeat(50));
  
  const performanceMonitor = new PerformanceMonitor();
  global.performanceMonitor = performanceMonitor;
  
  try {
    // 0. 볼트 분석
    const vaultInfo = await analyzeVault();
    
    // 1. 인덱싱 테스트
    const indexingResult = await testVaultIndexing();
    
    // 2. 검색 기능 테스트
    const searchResults = await testSearchFeatures();
    
    // 3. 추천 시스템 테스트
    const recommendationResults = await testRecommendationSystem();
    
    // 4. 고급 기능 테스트
    const advancedResults = await testAdvancedFeatures();
    
    // 5. 성능 모니터링 테스트
    const performanceResults = await testPerformanceMonitoring();
    
    // 6. 부하 테스트
    const loadResults = await testLoadPerformance();
    
    // 최종 결과 출력
    console.log('\n' + '='.repeat(50));
    console.log('📋 종합 테스트 결과');
    console.log('='.repeat(50));
    
    const stats = performanceMonitor.getStats();
    performanceMonitor.recordMemoryUsage();
    
    console.log(`\n📊 성능 통계:`);
    console.log(`   총 요청: ${stats.totalRequests}개`);
    console.log(`   평균 응답시간: ${stats.avgResponseTime}ms`);
    console.log(`   성공률: ${stats.successRate}`);
    console.log(`   오류: ${stats.errors}개`);
    
    if (stats.memoryUsage) {
      console.log(`\n💾 메모리 사용량:`);
      console.log(`   RSS: ${(stats.memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Heap Used: ${(stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Heap Total: ${(stats.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
    }
    
    console.log(`\n🔍 검색 결과 요약:`);
    Object.entries(searchResults).forEach(([query, result]) => {
      console.log(`   "${query}": 의미론적 ${result.semantic}개, 키워드 ${result.keyword}개, 하이브리드 ${result.hybrid}개`);
    });
    
    console.log(`\n🎯 추천 시스템 결과:`);
    Object.entries(recommendationResults).forEach(([note, result]) => {
      console.log(`   "${note}": 유사노트 ${result.similar}개, 백링크 ${result.backlinks}개`);
    });
    
    console.log(`\n⚡ 부하 테스트 결과:`);
    console.log(`   총 시간: ${loadResults.totalTime}ms`);
    console.log(`   평균 시간: ${loadResults.avgTime.toFixed(2)}ms`);
    console.log(`   성공률: ${loadResults.successRate}%`);
    
    // 결과를 파일로 저장
    const testResults = {
      timestamp: new Date().toISOString(),
      vaultInfo,
      indexingResult,
      searchResults,
      recommendationResults,
      advancedResults,
      performanceResults,
      loadResults,
      performanceStats: stats
    };
    
    fs.writeFileSync('real-vault-test-results.json', JSON.stringify(testResults, null, 2));
    console.log('\n💾 테스트 결과가 real-vault-test-results.json에 저장되었습니다.');
    
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류 발생:', error.message);
  }
}

// 테스트 실행
runComprehensiveTest(); 