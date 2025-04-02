// Logger utility for CSN Staff Tracker
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {
  constructor() {
    this.logLevel = LOG_LEVELS.INFO;
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs
  }

  setLogLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.logLevel = LOG_LEVELS[level];
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    // Add to logs array
    this.logs.push(logEntry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Format for console output
    let consoleMessage = `[${timestamp}] ${level}: ${message}`;
    if (data) {
      consoleMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
    }

    return consoleMessage;
  }

  debug(message, data = null) {
    if (this.logLevel <= LOG_LEVELS.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }

  info(message, data = null) {
    if (this.logLevel <= LOG_LEVELS.INFO) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  warn(message, data = null) {
    if (this.logLevel <= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  error(message, data = null) {
    if (this.logLevel <= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage('ERROR', message, data));
    }
  }

  getLogs(level = null) {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  // API-specific logging methods
  logApiCall(endpoint, method, status, duration, data = null) {
    this.info(`API Call: ${method} ${endpoint}`, {
      status,
      duration: `${duration}ms`,
      data
    });
  }

  logStaffUpdate(staffId, changes) {
    this.info(`Staff Update: ${staffId}`, { changes });
  }

  logSearch(query, resultCount) {
    this.debug(`Search: "${query}"`, { resultCount });
  }

  logPromotionEligibility(staffId, currentRank, targetRank) {
    this.info(`Promotion Eligibility: ${staffId}`, {
      currentRank,
      targetRank
    });
  }
}

// Create and export a singleton instance
const logger = new Logger();
export default logger; 