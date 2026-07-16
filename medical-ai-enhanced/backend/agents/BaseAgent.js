/**
 * Base AI Agent Class
 * Provides common functionality for all medical AI agents
 */
class BaseAgent {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.isActive = true;
    this.logs = [];
  }

  /**
   * Log agent activity
   */
  log(level, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      agent: this.name
    };
    this.logs.push(logEntry);
    console.log(`[${this.name}] ${level.toUpperCase()}: ${message}`, data || '');
  }

  /**
   * Process a request (to be implemented by subclasses)
   */
  async process(request) {
    throw new Error(`Process method must be implemented by ${this.name}`);
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      name: this.name,
      description: this.description,
      isActive: this.isActive,
      logsCount: this.logs.length,
      lastActivity: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null
    };
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }
}

module.exports = BaseAgent;
