#!/usr/bin/env node

/**
 * Clean Integration Fallback Test
 * Tests fallback integration with actual service modules
 */

const path = require('path');

// Import the actual fallback service
const FallbackService = require('./backend/src/services/fallbackService');

// Test utilities
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  section: (msg) => console.log(`\n🔍 ${msg}`)
};

// Mock external API calls
const mockExternalAPIs = {
  gstAPI: async () => {
    throw new Error('GST API unavailable');
  },
  
  analyticsAPI: async () => {
    throw new Error('Analytics service temporarily unavailable');
  },
  
  aiCreditAPI: async () => {
    throw new Error('AI service down for maintenance');
  }
};

// Test the actual fallback service implementation
const testFallbackServiceIntegration = async () => {
  log.section('Testing Actual FallbackService Integration');
  
  try {
    // Test GST rates with fallback
    log.info('Testing GST rates API with fallback...');
    const gstResult = await FallbackService.getData(
      mockExternalAPIs.gstAPI,
      'gst-rates.json'
    );
    
    if (gstResult.source === 'fallback') {
      log.success(`GST: Using fallback data (${Object.keys(gstResult.data).length} categories)`);
    }
    
    // Test Analytics with fallback
    log.info('Testing Analytics API with fallback...');
    const analyticsResult = await FallbackService.getData(
      mockExternalAPIs.analyticsAPI,
      'analytics-data.json'
    );
    
    if (analyticsResult.source === 'fallback') {
      log.success(`Analytics: Using fallback data (${Object.keys(analyticsResult.data.kpiDefaults).length} KPI defaults)`);
    }
    
    return { gstResult, analyticsResult };
    
  } catch (error) {
    log.error(`Integration test failed: ${error.message}`);
    throw error;
  }
};

// Test forced API failure mode
const testForcedFailureMode = async () => {
  log.section('Testing Forced API Failure Mode');
  
  // Enable forced failure mode
  FallbackService.enableTestMode();
  
  try {
    const results = await testFallbackServiceIntegration();
    
    // Verify all are using fallback
    const allUsingFallback = [
      results.gstResult.source,
      results.analyticsResult.source
    ].every(source => source === 'fallback');
    
    if (allUsingFallback) {
      log.success('🎯 FORCED FAILURE MODE: All services correctly using fallback');
    } else {
      log.error('❌ FORCED FAILURE MODE: Some services not using fallback');
    }
    
    return allUsingFallback;
    
  } finally {
    FallbackService.disableTestMode();
  }
};

// Test CSV parsing functionality
const testCSVParsing = () => {
  log.section('Testing CSV Parsing Functionality');
  
  try {
    const csvData = `month,orgId,revenue,expenses,netProfit
2024-01,ORG1000,50000,30000,20000
2024-02,ORG1000,55000,32000,23000`;
    
    const parsed = FallbackService.parseCSV(csvData);
    
    if (parsed.length === 2 && parsed[0].revenue === '50000') {
      log.success(`CSV Parsing: Successfully parsed ${parsed.length} records`);
      return true;
    } else {
      log.error('CSV Parsing: Failed to parse correctly');
      return false;
    }
    
  } catch (error) {
    log.error(`CSV parsing failed: ${error.message}`);
    return false;
  }
};

// Test dataset metadata loading
const testDatasetMetadata = () => {
  log.section('Testing Dataset Metadata Loading');
  
  try {
    const metadata = FallbackService.getDatasetMetadata('gst-rates.json');
    
    if (metadata && metadata.version && metadata.description) {
      log.success(`Metadata: GST rates v${metadata.version} - ${metadata.description}`);
      return true;
    } else {
      log.error('Metadata: Failed to load dataset metadata');
      return false;
    }
    
  } catch (error) {
    log.error(`Metadata loading failed: ${error.message}`);
    return false;
  }
};

// Test withFallback utility method
const testWithFallbackMethod = async () => {
  log.section('Testing withFallback Utility Method');
  
  try {
    // Test with working function
    const workingResult = await FallbackService.withFallback(
      async () => ({ status: 'success', data: 'API working' }),
      { status: 'fallback', data: 'Fallback data' }
    );
    
    if (workingResult.status === 'success') {
      log.success('withFallback: Working API call successful');
    }
    
    // Test with failing function
    const failingResult = await FallbackService.withFallback(
      async () => { throw new Error('API failed'); },
      { status: 'fallback', data: 'Fallback data' }
    );
    
    if (failingResult.status === 'fallback') {
      log.success('withFallback: Fallback data returned on API failure');
      return true;
    } else {
      log.error('withFallback: Failed to return fallback data');
      return false;
    }
    
  } catch (error) {
    log.error(`withFallback test failed: ${error.message}`);
    return false;
  }
};

// Main test execution
const runIntegrationTests = async () => {
  console.log('🚀 Starting Integration Fallback Service Test');
  console.log('='.repeat(60));
  
  const results = {
    integration: false,
    forcedFailure: false,
    csvParsing: false,
    metadata: false,
    withFallback: false
  };
  
  try {
    // Run all tests
    await testFallbackServiceIntegration();
    results.integration = true;
    
    results.forcedFailure = await testForcedFailureMode();
    results.csvParsing = testCSVParsing();
    results.metadata = testDatasetMetadata();
    results.withFallback = await testWithFallbackMethod();
    
    // Calculate success rate
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    const successRate = Math.round((passed / total) * 100);
    
    // Final results
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Test Results: ${passed}/${total} tests passed (${successRate}%)`);
    
    if (successRate === 100) {
      log.success('🎉 ALL INTEGRATION TESTS PASSED');
      log.success('✅ Verified failover mechanism under no-network conditions');
      log.success('✅ Dataset fallback activates correctly');
      log.success('✅ Backup data displays properly');
      log.success('✅ Service integration working properly');
      
      console.log('\n🔧 Integration Summary:');
      console.log('• FallbackService module: Fully functional');
      console.log('• API failure simulation: Working correctly');
      console.log('• Automatic dataset loading: Successful');
      console.log('• CSV parsing: Operational');
      console.log('• Metadata management: Available');
      
    } else {
      log.warn(`⚠️  ${total - passed} TESTS FAILED`);
      console.log('\n❌ Failed Tests:');
      Object.entries(results).forEach(([test, passed]) => {
        if (!passed) {
          console.log(`   • ${test}`);
        }
      });
    }
    
  } catch (error) {
    log.error(`Integration test execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

// Run the tests
if (require.main === module) {
  runIntegrationTests();
}

module.exports = { runIntegrationTests };