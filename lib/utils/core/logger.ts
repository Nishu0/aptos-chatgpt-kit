import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

// Create pino logger instance
const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    (isTest ? "silent" : isDevelopment ? "debug" : isProduction ? "silent" : "info"),
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  base: {
    env: process.env.NODE_ENV,
    ...(process.env.VERCEL_ENV && { vercelEnv: process.env.VERCEL_ENV }),
  },
  // Redact sensitive information
  redact: {
    paths: ["*.password", "*.apiKey", "*.api_key", "*.token", "*.secret"],
    remove: true,
  },
});

// Create child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// Specialized loggers for different parts of the application
export const dbLogger = createLogger("database");
export const utilLogger = createLogger("util");
export const errorLogger = createLogger("error");
export const perfLogger = createLogger("performance");
export const securityLogger = createLogger("security");
export const performanceLogger = createLogger("performance");

// API logger with convenience methods
const baseApiLogger = createLogger("api");
export const apiLogger = {
  info: (message: string, data?: Record<string, unknown>) => {
    if (data) {
      baseApiLogger.info(data, message);
    } else {
      baseApiLogger.info(message);
    }
  },
  error: (message: string, data?: Record<string, unknown>) => {
    if (data) {
      baseApiLogger.error(data, message);
    } else {
      baseApiLogger.error(message);
    }
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    if (data) {
      baseApiLogger.warn(data, message);
    } else {
      baseApiLogger.warn(message);
    }
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    if (data) {
      baseApiLogger.debug(data, message);
    } else {
      baseApiLogger.debug(message);
    }
  },
};

// Backward compatibility exports
export const log = (...args: unknown[]) => {
  logger.info(args.length === 1 ? args[0] : args.join(" "));
};

export const warn = (...args: unknown[]) => {
  logger.warn(args.length === 1 ? args[0] : args.join(" "));
};

export const error = (...args: unknown[]) => {
  if (args[0] instanceof Error) {
    logger.error(args[0]);
  } else {
    logger.error(args.length === 1 ? args[0] : args.join(" "));
  }
};

// Default export
export default logger;
export { logger };

