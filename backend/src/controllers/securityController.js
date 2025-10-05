const OWASPAudit = require('../security/owaspAudit');
const AuthenticationTester = require('../security/authTester');
const EnvironmentAuditor = require('../security/envAuditor');
const logger = require('../utils/logger');

const runSecurityAudit = async (req, res) => {
  try {
    logger.info('Security audit initiated', { userId: req.user?.userId });

    const owaspAudit = new OWASPAudit();
    const envAuditor = new EnvironmentAuditor();

    const [owaspResults, envResults] = await Promise.all([
      owaspAudit.runFullAudit(),
      envAuditor.runFullAudit()
    ]);

    const combinedResults = {
      timestamp: new Date().toISOString(),
      owasp: owaspResults,
      environment: envResults.generateReport(),
      summary: {
        owaspScore: `${owaspResults.score}/${owaspResults.maxScore}`,
        environmentStatus: envResults.calculateOverallStatus(),
        totalVulnerabilities: owaspResults.vulnerabilities.length,
        criticalIssues: envResults.getCriticalIssues(),
        recommendations: [
          ...owaspResults.recommendations,
          ...envResults.auditResults.recommendations
        ].slice(0, 10)
      }
    };

    logger.info('Security audit completed', {
      userId: req.user?.userId,
      score: owaspResults.score,
      vulnerabilities: owaspResults.vulnerabilities.length
    });

    res.json({
      success: true,
      data: combinedResults
    });
  } catch (error) {
    logger.error('Security audit failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'AUDIT_FAILED', message: error.message }
    });
  }
};

const runAuthenticationTest = async (req, res) => {
  try {
    logger.info('Authentication test initiated', { userId: req.user?.userId });

    const authTester = new AuthenticationTester(req.body.baseURL);
    const testResults = await authTester.runAllTests();

    logger.info('Authentication test completed', {
      userId: req.user?.userId,
      passed: testResults.summary.passed,
      failed: testResults.summary.failed
    });

    res.json({
      success: true,
      data: testResults
    });
  } catch (error) {
    logger.error('Authentication test failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_TEST_FAILED', message: error.message }
    });
  }
};

const getSecurityStatus = async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      security: {
        jwtConfigured: !!process.env.JWT_SECRET,
        encryptionConfigured: !!process.env.ENCRYPTION_KEY,
        corsConfigured: !!process.env.CORS_ORIGIN,
        rateLimitingActive: true,
        securityHeadersActive: true
      },
      monitoring: {
        loggingEnabled: !!process.env.LOG_LEVEL,
        errorTrackingEnabled: !!process.env.SENTRY_DSN,
        metricsEnabled: false
      },
      compliance: {
        dataEncryption: !!process.env.ENCRYPTION_KEY,
        auditLogging: !!process.env.LOG_LEVEL,
        backupStrategy: !!process.env.FIREBASE_CONFIG,
        accessControl: true
      }
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get security status', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'STATUS_FAILED', message: error.message }
    });
  }
};

const generateSecurityReport = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    logger.info('Security report generation initiated', { 
      userId: req.user?.userId,
      format 
    });

    const owaspAudit = new OWASPAudit();
    const envAuditor = new EnvironmentAuditor();

    const [owaspResults, envResults] = await Promise.all([
      owaspAudit.runFullAudit(),
      envAuditor.runFullAudit()
    ]);

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: req.user?.userId,
        reportType: 'Security Audit Report',
        version: '1.0'
      },
      executive_summary: {
        overallRisk: envResults.calculateOverallStatus(),
        owaspCompliance: `${Math.round((owaspResults.score / owaspResults.maxScore) * 100)}%`,
        criticalFindings: owaspResults.vulnerabilities.filter(v => v.severity === 'HIGH').length,
        recommendationsCount: owaspResults.recommendations.length + envResults.auditResults.recommendations.length
      },
      detailed_findings: {
        owasp_audit: owaspResults,
        environment_audit: envResults.generateReport(),
        authentication_security: {
          jwt_implementation: !!process.env.JWT_SECRET,
          password_policy: 'Implemented',
          session_management: 'JWT-based',
          multi_factor_auth: 'TOTP Available'
        }
      },
      recommendations: {
        immediate_actions: owaspResults.vulnerabilities
          .filter(v => v.severity === 'HIGH')
          .map(v => v.description),
        short_term: owaspResults.recommendations.slice(0, 5),
        long_term: envResults.auditResults.recommendations.slice(0, 5)
      }
    };

    if (format === 'pdf') {
      // In a real implementation, you'd generate a PDF here
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=security-report.pdf');
      res.json({ message: 'PDF generation not implemented in this demo' });
    } else {
      res.json({
        success: true,
        data: report
      });
    }

    logger.info('Security report generated successfully', {
      userId: req.user?.userId,
      format,
      findings: report.detailed_findings.owasp_audit.vulnerabilities.length
    });

  } catch (error) {
    logger.error('Security report generation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_FAILED', message: error.message }
    });
  }
};

module.exports = {
  runSecurityAudit,
  runAuthenticationTest,
  getSecurityStatus,
  generateSecurityReport
};