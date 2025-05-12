/**
 * LoggingService.js
 * Centralized logging utility for the Band Sheets application
 * Allows toggling log levels and disabling logs in production
 */

// Log levels
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  NONE: 'none'
};

// Default configuration
const config = {
  // Current log level - can be changed at runtime
  currentLogLevel: process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG,
  
  // Whether to include timestamps in logs
  includeTimestamp: true,
  
  // Whether to include the calling component/service name
  includeSource: true
};

// Log level hierarchy (lower index = more verbose)
const levelHierarchy = [
  LOG_LEVELS.DEBUG,
  LOG_LEVELS.INFO,
  LOG_LEVELS.WARN,
  LOG_LEVELS.ERROR,
  LOG_LEVELS.NONE
];

/**
 * Check if a log at the given level should be displayed
 * @param {string} level - The log level to check
 * @returns {boolean} - Whether the log should be displayed
 */
const shouldLog = (level) => {
  const currentLevelIndex = levelHierarchy.indexOf(config.currentLogLevel);
  const targetLevelIndex = levelHierarchy.indexOf(level);
  
  // If current level is NONE, don't log anything
  if (config.currentLogLevel === LOG_LEVELS.NONE) {
    return false;
  }
  
  // Log if the target level is at or above the current level
  return targetLevelIndex >= currentLevelIndex;
};

/**
 * Format the log message with optional source and timestamp
 * @param {string} source - The source of the log (component/service name)
 * @param {string} message - The log message
 * @returns {string} - The formatted log message
 */
const formatLogMessage = (source, message) => {
  let formattedMessage = '';
  
  // Add timestamp if configured
  if (config.includeTimestamp) {
    const timestamp = new Date().toISOString();
    formattedMessage += `[${timestamp}] `;
  }
  
  // Add source if provided and configured
  if (source && config.includeSource) {
    formattedMessage += `[${source}] `;
  }
  
  // Add the message
  formattedMessage += message;
  
  return formattedMessage;
};

/**
 * Log a message at the debug level
 * @param {string} source - The source of the log (component/service name)
 * @param {string} message - The log message
 * @param {...any} args - Additional arguments to log
 */
export const debug = (source, message, ...args) => {
  if (shouldLog(LOG_LEVELS.DEBUG)) {
    console.debug(formatLogMessage(source, message), ...args);
  }
};

/**
 * Log a message at the info level
 * @param {string} source - The source of the log (component/service name)
 * @param {string} message - The log message
 * @param {...any} args - Additional arguments to log
 */
export const info = (source, message, ...args) => {
  if (shouldLog(LOG_LEVELS.INFO)) {
    console.info(formatLogMessage(source, message), ...args);
  }
};

/**
 * Log a message at the warn level
 * @param {string} source - The source of the log (component/service name)
 * @param {string} message - The log message
 * @param {...any} args - Additional arguments to log
 */
export const warn = (source, message, ...args) => {
  if (shouldLog(LOG_LEVELS.WARN)) {
    console.warn(formatLogMessage(source, message), ...args);
  }
};

/**
 * Log a message at the error level
 * @param {string} source - The source of the log (component/service name)
 * @param {string} message - The log message
 * @param {...any} args - Additional arguments to log
 */
export const error = (source, message, ...args) => {
  if (shouldLog(LOG_LEVELS.ERROR)) {
    console.error(formatLogMessage(source, message), ...args);
  }
};

/**
 * Set the current log level
 * @param {string} level - The log level to set
 */
export const setLogLevel = (level) => {
  if (Object.values(LOG_LEVELS).includes(level)) {
    config.currentLogLevel = level;
  } else {
    error('LoggingService', `Invalid log level: ${level}`);
  }
};

/**
 * Enable or disable including timestamps in logs
 * @param {boolean} include - Whether to include timestamps
 */
export const setIncludeTimestamp = (include) => {
  config.includeTimestamp = !!include;
};

/**
 * Enable or disable including source in logs
 * @param {boolean} include - Whether to include source
 */
export const setIncludeSource = (include) => {
  config.includeSource = !!include;
};

// Default export for all logging functions
export default {
  debug,
  info,
  warn,
  error,
  setLogLevel,
  setIncludeTimestamp,
  setIncludeSource,
  LOG_LEVELS
};
