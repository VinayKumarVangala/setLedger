const winston = require('winston');
const path = require('path');
const fs = require('fs');

class LogService {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDir();
    this.initLogger();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  initLogger() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'setledger' },
      transports: [
        new winston.transports.File({
          filename: path.join(this.logDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new winston.transports.File({
          filename: path.join(this.logDir, 'combined.log'),
          maxsize: 5242880,
          maxFiles: 5
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  log(level, message, meta = {}) {
    this.logger.log(level, message, {
      ...meta,
      timestamp: new Date().toISOString(),
      pid: process.pid
    });
  }

  error(message, error = null, meta = {}) {
    this.log('error', message, {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    });
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  async getLogs(options = {}) {
    const {
      level = 'all',
      startDate,
      endDate,
      limit = 100,
      offset = 0,
      search
    } = options;

    try {
      const logFile = level === 'error' 
        ? path.join(this.logDir, 'error.log')
        : path.join(this.logDir, 'combined.log');

      if (!fs.existsSync(logFile)) {
        return { logs: [], total: 0 };
      }

      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line);
      
      let logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Filter by level
      if (level !== 'all') {
        logs = logs.filter(log => log.level === level);
      }

      // Filter by date range
      if (startDate || endDate) {
        logs = logs.filter(log => {
          const logDate = new Date(log.timestamp);
          if (startDate && logDate < new Date(startDate)) return false;
          if (endDate && logDate > new Date(endDate)) return false;
          return true;
        });
      }

      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        logs = logs.filter(log => 
          log.message?.toLowerCase().includes(searchLower) ||
          log.error?.message?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const total = logs.length;
      const paginatedLogs = logs.slice(offset, offset + limit);

      return { logs: paginatedLogs, total };
    } catch (error) {
      this.error('Failed to read logs', error);
      return { logs: [], total: 0 };
    }
  }

  async getLogStats() {
    try {
      const { logs } = await this.getLogs({ limit: 1000 });
      
      const stats = {
        total: logs.length,
        byLevel: {},
        byHour: {},
        recentErrors: []
      };

      logs.forEach(log => {
        // Count by level
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
        
        // Count by hour
        const hour = new Date(log.timestamp).getHours();
        stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
        
        // Collect recent errors
        if (log.level === 'error' && stats.recentErrors.length < 10) {
          stats.recentErrors.push(log);
        }
      });

      return stats;
    } catch (error) {
      this.error('Failed to get log stats', error);
      return { total: 0, byLevel: {}, byHour: {}, recentErrors: [] };
    }
  }

  async clearLogs(level = 'all') {
    try {
      if (level === 'all') {
        fs.writeFileSync(path.join(this.logDir, 'combined.log'), '');
        fs.writeFileSync(path.join(this.logDir, 'error.log'), '');
      } else if (level === 'error') {
        fs.writeFileSync(path.join(this.logDir, 'error.log'), '');
      }
      
      this.info(`Logs cleared: ${level}`);
      return true;
    } catch (error) {
      this.error('Failed to clear logs', error);
      return false;
    }
  }
}

module.exports = new LogService();