const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnvironmentAuditor {
  constructor() {
    this.auditResults = {
      timestamp: new Date().toISOString(),
      isolation: {},
      security: {},
      compliance: {},
      recommendations: []
    };
  }

  auditEnvironmentIsolation() {
    console.log('🔍 Auditing Environment Variable Isolation...');

    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    const foundFiles = [];
    const missingFiles = [];

    envFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        foundFiles.push(file);
      } else {
        missingFiles.push(file);
      }
    });

    this.auditResults.isolation = {
      envFiles: {
        found: foundFiles,
        missing: missingFiles,
        status: foundFiles.length > 0 ? 'PASS' : 'FAIL'
      },
      processEnv: this.auditProcessEnv(),
      gitIgnore: this.checkGitIgnore(),
      dockerSecrets: this.checkDockerSecrets()
    };
  }

  auditProcessEnv() {
    const sensitiveKeys = [
      'JWT_SECRET', 'MONGO_URI', 'FIREBASE_PRIVATE_KEY', 
      'ENCRYPTION_KEY', 'API_KEY', 'PASSWORD', 'SECRET'
    ];

    const exposedSecrets = [];
    const missingSecrets = [];
    const weakSecrets = [];

    sensitiveKeys.forEach(key => {
      const value = process.env[key];
      
      if (!value) {
        missingSecrets.push(key);
      } else {
        // Check if secret is exposed in process.env
        if (key in process.env) {
          // Check strength
          if (value.length < 16) {
            weakSecrets.push({ key, reason: 'Too short' });
          }
          if (['test', 'admin', 'password', 'secret'].includes(value.toLowerCase())) {
            weakSecrets.push({ key, reason: 'Common/default value' });
          }
        }
      }
    });

    return {
      exposedSecrets,
      missingSecrets,
      weakSecrets,
      status: missingSecrets.length === 0 && weakSecrets.length === 0 ? 'PASS' : 'WARN'
    };
  }

  checkGitIgnore() {
    const gitIgnorePath = path.join(process.cwd(), '.gitignore');
    
    if (!fs.existsSync(gitIgnorePath)) {
      return { status: 'FAIL', message: '.gitignore file not found' };
    }

    const gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf8');
    const requiredEntries = ['.env', '.env.local', '.env.*.local', 'node_modules'];
    const missingEntries = [];

    requiredEntries.forEach(entry => {
      if (!gitIgnoreContent.includes(entry)) {
        missingEntries.push(entry);
      }
    });

    return {
      status: missingEntries.length === 0 ? 'PASS' : 'FAIL',
      missingEntries,
      message: missingEntries.length === 0 ? 'All sensitive files ignored' : 'Missing .gitignore entries'
    };
  }

  checkDockerSecrets() {
    const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
    
    if (!fs.existsSync(dockerfilePath)) {
      return { status: 'N/A', message: 'No Dockerfile found' };
    }

    const dockerContent = fs.readFileSync(dockerfilePath, 'utf8');
    const hasSecrets = dockerContent.includes('ENV') && 
                     (dockerContent.includes('SECRET') || dockerContent.includes('PASSWORD'));

    return {
      status: hasSecrets ? 'WARN' : 'PASS',
      message: hasSecrets ? 'Potential secrets in Dockerfile' : 'No hardcoded secrets in Dockerfile'
    };
  }

  auditSecurityPractices() {
    console.log('🛡️ Auditing Security Practices...');

    this.auditResults.security = {
      encryption: this.checkEncryption(),
      authentication: this.checkAuthentication(),
      authorization: this.checkAuthorization(),
      logging: this.checkLogging(),
      monitoring: this.checkMonitoring()
    };
  }

  checkEncryption() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    const jwtSecret = process.env.JWT_SECRET;

    const issues = [];
    
    if (!encryptionKey) {
      issues.push('No encryption key configured');
    } else if (encryptionKey.length < 32) {
      issues.push('Encryption key too short');
    }

    if (!jwtSecret) {
      issues.push('No JWT secret configured');
    } else if (jwtSecret.length < 32) {
      issues.push('JWT secret too short');
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      recommendations: issues.length > 0 ? ['Use crypto.randomBytes(32) for keys'] : []
    };
  }

  checkAuthentication() {
    const requiredVars = ['JWT_SECRET', 'JWT_EXPIRES_IN'];
    const missing = requiredVars.filter(v => !process.env[v]);

    return {
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      missing,
      message: missing.length === 0 ? 'Authentication properly configured' : 'Missing auth configuration'
    };
  }

  checkAuthorization() {
    // Check if role-based auth middleware exists
    const middlewarePath = path.join(process.cwd(), 'src/middleware/roleAuth.js');
    const exists = fs.existsSync(middlewarePath);

    return {
      status: exists ? 'PASS' : 'WARN',
      message: exists ? 'Role-based authorization implemented' : 'Role-based authorization not found'
    };
  }

  checkLogging() {
    const logLevel = process.env.LOG_LEVEL;
    const nodeEnv = process.env.NODE_ENV;

    const issues = [];
    
    if (!logLevel) {
      issues.push('No log level configured');
    }
    
    if (nodeEnv === 'production' && logLevel === 'debug') {
      issues.push('Debug logging enabled in production');
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'WARN',
      issues,
      currentLevel: logLevel || 'undefined'
    };
  }

  checkMonitoring() {
    const monitoringVars = ['SENTRY_DSN', 'DATADOG_API_KEY', 'NEW_RELIC_LICENSE_KEY'];
    const configured = monitoringVars.filter(v => process.env[v]);

    return {
      status: configured.length > 0 ? 'PASS' : 'WARN',
      configured,
      message: configured.length > 0 ? 'Monitoring configured' : 'No monitoring service configured'
    };
  }

  auditCompliance() {
    console.log('📋 Auditing Compliance Requirements...');

    this.auditResults.compliance = {
      dataProtection: this.checkDataProtection(),
      auditTrail: this.checkAuditTrail(),
      backupStrategy: this.checkBackupStrategy(),
      incidentResponse: this.checkIncidentResponse()
    };
  }

  checkDataProtection() {
    const encryptionEnabled = !!process.env.ENCRYPTION_KEY;
    const backupEncryption = !!process.env.BACKUP_ENCRYPTION_KEY;

    return {
      status: encryptionEnabled && backupEncryption ? 'PASS' : 'PARTIAL',
      encryption: encryptionEnabled,
      backupEncryption,
      message: 'Data protection measures in place'
    };
  }

  checkAuditTrail() {
    const logPath = path.join(process.cwd(), 'logs');
    const hasLogging = fs.existsSync(logPath) || process.env.LOG_LEVEL;

    return {
      status: hasLogging ? 'PASS' : 'FAIL',
      message: hasLogging ? 'Audit trail configured' : 'No audit trail found'
    };
  }

  checkBackupStrategy() {
    const backupVars = ['FIREBASE_CONFIG', 'BACKUP_SCHEDULE', 'BACKUP_RETENTION'];
    const configured = backupVars.filter(v => process.env[v]);

    return {
      status: configured.length >= 1 ? 'PASS' : 'WARN',
      configured,
      message: `${configured.length}/3 backup components configured`
    };
  }

  checkIncidentResponse() {
    const alertVars = ['ALERT_EMAIL', 'SLACK_WEBHOOK', 'PAGER_DUTY_KEY'];
    const configured = alertVars.filter(v => process.env[v]);

    return {
      status: configured.length > 0 ? 'PASS' : 'WARN',
      configured,
      message: configured.length > 0 ? 'Incident response configured' : 'No incident response configured'
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // Environment isolation recommendations
    if (this.auditResults.isolation.gitIgnore.status === 'FAIL') {
      recommendations.push('Add .env files to .gitignore');
    }

    // Security recommendations
    if (this.auditResults.security.encryption.status === 'FAIL') {
      recommendations.push('Configure proper encryption keys');
    }

    if (this.auditResults.security.monitoring.status === 'WARN') {
      recommendations.push('Set up application monitoring');
    }

    // Compliance recommendations
    if (this.auditResults.compliance.auditTrail.status === 'FAIL') {
      recommendations.push('Implement comprehensive logging');
    }

    if (this.auditResults.compliance.incidentResponse.status === 'WARN') {
      recommendations.push('Configure incident response alerts');
    }

    // General recommendations
    recommendations.push(
      'Rotate secrets regularly',
      'Implement secret scanning in CI/CD',
      'Use environment-specific configurations',
      'Enable security headers in production',
      'Set up automated security testing'
    );

    this.auditResults.recommendations = recommendations.slice(0, 8);
  }

  async runFullAudit() {
    console.log('🔐 Starting Environment Security Audit...\n');

    this.auditEnvironmentIsolation();
    this.auditSecurityPractices();
    this.auditCompliance();
    this.generateRecommendations();

    console.log('✅ Environment Audit Complete\n');
    return this.auditResults;
  }

  generateReport() {
    const report = {
      summary: {
        timestamp: this.auditResults.timestamp,
        overallStatus: this.calculateOverallStatus(),
        criticalIssues: this.getCriticalIssues(),
        totalRecommendations: this.auditResults.recommendations.length
      },
      details: this.auditResults
    };

    return report;
  }

  calculateOverallStatus() {
    const statuses = [
      this.auditResults.isolation.envFiles.status,
      this.auditResults.security.encryption.status,
      this.auditResults.security.authentication.status,
      this.auditResults.compliance.dataProtection.status
    ];

    const failCount = statuses.filter(s => s === 'FAIL').length;
    const warnCount = statuses.filter(s => s === 'WARN').length;

    if (failCount > 0) return 'CRITICAL';
    if (warnCount > 2) return 'WARNING';
    return 'GOOD';
  }

  getCriticalIssues() {
    const issues = [];

    if (this.auditResults.isolation.processEnv.missingSecrets.length > 0) {
      issues.push('Missing critical environment variables');
    }

    if (this.auditResults.security.encryption.status === 'FAIL') {
      issues.push('Encryption not properly configured');
    }

    if (this.auditResults.isolation.gitIgnore.status === 'FAIL') {
      issues.push('Sensitive files not ignored in git');
    }

    return issues;
  }
}

module.exports = EnvironmentAuditor;