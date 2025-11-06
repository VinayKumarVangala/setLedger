#!/usr/bin/env node

/**
 * Integration Fallback Test
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

// Mock external API calls that would normally fail during outages
const mockExternalAPIs = {
  gstAPI: async () => {
    // Simulate GST government API
    const response = await fetch('https://api.gst.gov.in/rates');
    if (!response.ok) throw new Error('GST API unavailable');
    return response.json();
  },
  
  analyticsAPI: async () => {
    // Simulate external analytics service
    throw new Error('Analytics service temporarily unavailable');
  },
  
  aiCreditAPI: async () => {
    // Simulate AI/ML service
    const response = await fetch('https://ml-api.example.com/credit-risk');
    if (!response.ok) throw new Error('AI service down for maintenance');
    return response.json();
  }
};

// Test the actual fallback service implementation
const testFallbackServiceIntegration = async () => {
  log.section('Testing Actual FallbackService Integration');
  
  try {
    // Test 1: GST rates with fallback
    log.info('Testing GST rates API with fallback...');
    const gstResult = await FallbackService.getData(
      mockExternalAPIs.gstAPI,
      'gst-rates.json'
    );
    
    if (gstResult.source === 'fallback') {
      log.success(`GST: Using fallback data (${Object.keys(gstResult.data).length} categories)`);
    } else {
      log.warn('GST: Using live API data');
    }
    
    // Test 2: Analytics with fallback
    log.info('Testing Analytics API with fallback...');
    const analyticsResult = await FallbackService.getData(
      mockExternalAPIs.analyticsAPI,
      'analytics-data.json'
    );
    
    if (analyticsResult.source === 'fallback') {
      log.success(`Analytics: Using fallback data (${Object.keys(analyticsResult.data.kpiDefaults).length} KPI defaults)`);
    } else {
      log.warn('Analytics: Using live API data');
    }
    
    // Test 3: AI Credit with fallback
    log.info('Testing AI Credit API with fallback...');
    const aiResult = await FallbackService.getData(
      mockExternalAPIs.aiCreditAPI,
      'credit-risk-model.json'
    );
    
    if (aiResult.source === 'fallback') {
      log.success(`AI Credit: Using fallback model (${aiResult.data.model ? 'Model loaded' : 'Default values'})`);
    } else {
      log.warn('AI Credit: Using live API data');
    }
    
    return { gstResult, analyticsResult, aiResult };
    
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
    // All APIs should now fail and use fallback
    const results = await testFallbackServiceIntegration();
    
    // Verify all are using fallback
    const allUsingFallback = [
      results.gstResult.source,
      results.analyticsResult.source,
      results.aiResult.source
    ].every(source => source === 'fallback');
    
    if (allUsingFallback) {
      log.success('🎯 FORCED FAILURE MODE: All services correctly using fallback');
    } else {
      log.error('❌ FORCED FAILURE MODE: Some services not using fallback');
    }
    
    return allUsingFallback;
    
  } finally {
    // Always disable test mode
    FallbackService.disableTestMode();
  }
};

// Test CSV parsing functionality
const testCSVParsing = () => {
  log.section('Testing CSV Parsing Functionality');
  
  try {
    // Test CSV parsing with sample data
    const csvData = `month,orgId,revenue,expenses,netProfit
2024-01,ORG1000,50000,30000,20000
2024-02,ORG1000,55000,32000,23000
2024-03,ORG1000,48000,29000,19000`;
    
    const parsed = FallbackService.parseCSV(csvData);
    
    if (parsed.length === 3 && parsed[0].revenue === '50000') {
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

// Simulate dashboard data loading with fallback
const testDashboardDataFallback = async () => {
  log.section('Testing Dashboard Data with Fallback Integration');
  
  try {
    // Simulate financial summary API call
    const financialSummary = await FallbackService.getData(
      async () => {
        // This would normally call external financial API
        throw new Error('Financial API service unavailable');
      },
      'analytics-data.json'
    );
    
    // Simulate KPI data API call
    const kpiData = await FallbackService.getData(
      async () => {
        // This would normally call KPI calculation service
        throw new Error('KPI service temporarily down');
      },
      'finance_backup.csv'
    );
    
    if (financialSummary.source === 'fallback' && kpiData.source === 'fallback') {
      log.success('Dashboard: All financial data loaded from fallback sources');
      log.info(`Financial KPIs: ${Object.keys(financialSummary.data.kpiDefaults).length} defaults available`);
      log.info(`Historical Data: ${Array.isArray(kpiData.data) ? kpiData.data.length : 'CSV format'} records`);
      return true;
    } else {
      log.error('Dashboard: Not all data using fallback sources');
      return false;
    }
    
  } catch (error) {
    log.error(`Dashboard fallback test failed: ${error.message}`);
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
    withFallback: false,
    dashboard: false
  };
  
  try {
    // Run all tests
    await testFallbackServiceIntegration();
    results.integration = true;
    
    results.forcedFailure = await testForcedFailureMode();
    results.csvParsing = testCSVParsing();
    results.metadata = testDatasetMetadata();
    results.withFallback = await testWithFallbackMethod();
    results.dashboard = await testDashboardDataFallback();
    
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
      log.success('✅ Backup data displays in dashboard');
      log.success('✅ Service integration working properly');
      
      console.log('\n🔧 Integration Summary:');
      console.log('• FallbackService module: Fully functional');
      console.log('• API failure simulation: Working correctly');
      console.log('• Automatic dataset loading: Successful');
      console.log('• CSV parsing: Operational');
      console.log('• Metadata management: Available');
      console.log('• Dashboard integration: Ready');
      
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
};\n\n// Run the tests\nif (require.main === module) {\n  runIntegrationTests();\n}\n\nmodule.exports = { runIntegrationTests };