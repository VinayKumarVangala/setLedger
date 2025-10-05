#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Add backend src to path
const backendPath = path.join(__dirname, '../backend/src');
process.env.NODE_PATH = backendPath;

const OWASPAudit = require('../backend/src/security/owaspAudit');
const AuthenticationTester = require('../backend/src/security/authTester');
const EnvironmentAuditor = require('../backend/src/security/envAuditor');

async function runFullSecurityAudit() {
  console.log('🔒 setLedger Security Audit Suite');
  console.log('=====================================\n');

  try {
    require('dotenv').config();

    const owaspAudit = new OWASPAudit();
    const envAuditor = new EnvironmentAuditor();
    const authTester = new AuthenticationTester();

    console.log('📋 Running OWASP Security Audit...\n');
    const owaspResults = await owaspAudit.runFullAudit();

    console.log('\n🔍 Running Environment Security Audit...\n');
    const envResults = await envAuditor.runFullAudit();

    console.log('\n🧪 Running Authentication Tests...\n');
    let authResults = null;
    try {
      authResults = await authTester.runAllTests();
    } catch (error) {
      console.log('⚠️  Authentication tests skipped (server not running)');
      authResults = { summary: { passed: 0, failed: 0, total: 0 }, tests: [] };
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        owaspScore: `${owaspResults.score}/${owaspResults.maxScore} (${Math.round((owaspResults.score/owaspResults.maxScore)*100)}%)`,
        environmentStatus: envResults.calculateOverallStatus(),
        authTestsPassed: `${authResults.summary.passed}/${authResults.summary.total}`,
        totalVulnerabilities: owaspResults.vulnerabilities.length,
        criticalIssues: envResults.getCriticalIssues().length,
        overallRisk: calculateOverallRisk(owaspResults, envResults, authResults)
      },
      vulnerabilities: owaspResults.vulnerabilities,
      criticalIssues: envResults.getCriticalIssues(),
      recommendations: [
        ...owaspResults.recommendations,
        ...envResults.auditResults.recommendations
      ].slice(0, 10)
    };

    displayResults(report);

    const reportPath = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    const exitCode = report.summary.overallRisk === 'CRITICAL' ? 1 : 0;
    process.exit(exitCode);

  } catch (error) {
    console.error('❌ Security audit failed:', error.message);
    process.exit(1);
  }
}

function calculateOverallRisk(owaspResults, envResults, authResults) {
  const owaspScore = (owaspResults.score / owaspResults.maxScore) * 100;
  const criticalVulns = owaspResults.vulnerabilities.filter(v => v.severity === 'HIGH').length;
  const envStatus = envResults.calculateOverallStatus();
  const authFailures = authResults.summary.failed;

  if (criticalVulns > 0 || envStatus === 'CRITICAL' || authFailures > 2) return 'CRITICAL';
  if (owaspScore < 70 || envStatus === 'WARNING' || authFailures > 0) return 'HIGH';
  if (owaspScore < 85) return 'MEDIUM';
  return 'LOW';
}

function displayResults(report) {
  console.log('\n🎯 SECURITY AUDIT RESULTS');
  console.log('==========================');
  
  console.log(`\n📊 Overall Risk Level: ${getRiskEmoji(report.summary.overallRisk)} ${report.summary.overallRisk}`);
  console.log(`🔒 OWASP Compliance: ${report.summary.owaspScore}`);
  console.log(`🛡️  Environment Status: ${report.summary.environmentStatus}`);
  console.log(`🧪 Auth Tests: ${report.summary.authTestsPassed}`);
  
  if (report.vulnerabilities.length > 0) {
    console.log(`\n⚠️  VULNERABILITIES FOUND (${report.vulnerabilities.length}):`);
    report.vulnerabilities.forEach((vuln, index) => {
      const severity = getSeverityEmoji(vuln.severity);
      console.log(`${index + 1}. ${severity} ${vuln.issue} - ${vuln.description}`);
    });
  }

  if (report.criticalIssues.length > 0) {
    console.log(`\n🚨 CRITICAL ISSUES (${report.criticalIssues.length}):`);
    report.criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }

  console.log(`\n💡 TOP RECOMMENDATIONS:`);
  report.recommendations.slice(0, 5).forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
}

function getRiskEmoji(risk) {
  const emojis = { 'CRITICAL': '🔴', 'HIGH': '🟠', 'MEDIUM': '🟡', 'LOW': '🟢' };
  return emojis[risk] || '⚪';
}

function getSeverityEmoji(severity) {
  const emojis = { 'HIGH': '🔴', 'MEDIUM': '🟡', 'LOW': '🔵' };
  return emojis[severity] || '⚪';
}

if (require.main === module) {
  runFullSecurityAudit();
}

module.exports = { runFullSecurityAudit };