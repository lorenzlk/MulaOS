const chalk = require('chalk');

const createLogger = (context) => {
  const correlationId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  const formatMessage = (level, message, data = {}, error = null) => {
    const logEntry = {
      level,
      correlationId,
      context,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        stack: error.stack,
        code: error.code
      };
    }

    // For development, return a formatted string
    if (process.env.NODE_ENV === 'development') {
      const levelColors = {
        info: chalk.blue,
        error: chalk.red,
        warn: chalk.yellow,
        debug: chalk.green
      };

      const color = levelColors[level] || chalk.white;
      const timestamp = chalk.gray(new Date().toISOString());
      const contextStr = chalk.cyan(`[${context}]`);
      const correlationStr = chalk.magenta(`[${correlationId}]`);
      
      let output = `${color(`[${level.toUpperCase()}]`)} ${timestamp} ${contextStr} ${correlationStr} ${message}`;
      
      if (Object.keys(data).length > 0) {
        output += `\n${chalk.gray('Data:')} ${JSON.stringify(data, null, 2)}`;
      }
      
      if (error) {
        output += `\n${chalk.red('Error:')} ${error.message}`;
        if (error.stack) {
          output += `\n${chalk.gray('Stack:')}\n${error.stack}`;
        }
      }
      
      return output;
    }

    // For production, return JSON string
    return JSON.stringify(logEntry);
  };

  return {
    info: (message, data = {}) => {
      console.log(formatMessage('info', message, data));
    },
    error: (message, error, data = {}) => {
      console.error(formatMessage('error', message, data, error));
    },
    warn: (message, data = {}) => {
      console.warn(formatMessage('warn', message, data));
    },
    debug: (message, data = {}) => {
      if (process.env.DEBUG) {
        console.debug(formatMessage('debug', message, data));
      }
    },
    getCorrelationId: () => correlationId
  };
};

module.exports = {
  createLogger
}; 