"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAnalytics = exports.logChatOperation = exports.logAuctionOperation = exports.logStreamOperation = exports.logRedisOperation = exports.logDatabaseQuery = exports.logPerformance = exports.logDebug = exports.logInfo = exports.logWarning = exports.logError = exports.httpLoggerStream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        logMessage += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
        logMessage += `\n${stack}`;
    }
    return logMessage;
}));
const errorFilter = winston_1.default.format((info) => {
    return info.level === 'error' ? info : false;
});
const infoFilter = winston_1.default.format((info) => {
    return info.level !== 'error' ? info : false;
});
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Console transport
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormat),
            handleExceptions: true,
            handleRejections: true
        }),
        // Error log file
        new winston_1.default.transports.File({
            filename: path_1.default.join('logs', 'error.log'),
            level: 'error',
            format: winston_1.default.format.combine(errorFilter(), logFormat),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            handleExceptions: true,
            handleRejections: true
        }),
        // Combined log file
        new winston_1.default.transports.File({
            filename: path_1.default.join('logs', 'combined.log'),
            format: winston_1.default.format.combine(infoFilter(), logFormat),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Debug log file (for development)
        new winston_1.default.transports.File({
            filename: path_1.default.join('logs', 'debug.log'),
            level: 'debug',
            format: logFormat,
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            silent: process.env.NODE_ENV === 'production'
        })
    ],
    exitOnError: false
});
// Create a stream object for Morgan HTTP logging
exports.httpLoggerStream = {
    write: (message) => {
        exports.logger.info(message.trim());
    }
};
// Logger utility functions
const logError = (error, context) => {
    exports.logger.error(error.message, {
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
    });
};
exports.logError = logError;
const logWarning = (message, context) => {
    exports.logger.warn(message, {
        context,
        timestamp: new Date().toISOString()
    });
};
exports.logWarning = logWarning;
const logInfo = (message, context) => {
    exports.logger.info(message, {
        context,
        timestamp: new Date().toISOString()
    });
};
exports.logInfo = logInfo;
const logDebug = (message, context) => {
    exports.logger.debug(message, {
        context,
        timestamp: new Date().toISOString()
    });
};
exports.logDebug = logDebug;
// Performance logging
const logPerformance = (operation, duration, context) => {
    exports.logger.info(`Performance: ${operation}`, {
        duration,
        context,
        timestamp: new Date().toISOString()
    });
};
exports.logPerformance = logPerformance;
// Database query logging
const logDatabaseQuery = (query, duration, params) => {
    exports.logger.debug('Database Query', {
        query,
        duration,
        params,
        timestamp: new Date().toISOString()
    });
};
exports.logDatabaseQuery = logDatabaseQuery;
// Redis operation logging
const logRedisOperation = (operation, key, duration) => {
    exports.logger.debug('Redis Operation', {
        operation,
        key,
        duration,
        timestamp: new Date().toISOString()
    });
};
exports.logRedisOperation = logRedisOperation;
// Streaming operation logging
const logStreamOperation = (operation, streamId, context) => {
    exports.logger.info(`Stream: ${operation}`, {
        streamId,
        context,
        timestamp: new Date().toISOString()
    });
};
exports.logStreamOperation = logStreamOperation;
// Auction operation logging
const logAuctionOperation = (operation, auctionId, context) => {
    exports.logger.info(`Auction: ${operation}`, {
        auctionId,
        context,
        timestamp: new Date().toISOString()
    });
};
exports.logAuctionOperation = logAuctionOperation;
// Chat operation logging
const logChatOperation = (operation, streamId, userId, context) => {
    exports.logger.info(`Chat: ${operation}`, {
        streamId,
        userId,
        context,
        timestamp: new Date().toISOString()
    });
};
exports.logChatOperation = logChatOperation;
// Analytics logging
const logAnalytics = (event, data) => {
    exports.logger.info(`Analytics: ${event}`, {
        data,
        timestamp: new Date().toISOString()
    });
};
exports.logAnalytics = logAnalytics;
//# sourceMappingURL=logger.js.map