import winston from 'winston';
export declare const logger: winston.Logger;
export declare const httpLoggerStream: {
    write: (message: string) => void;
};
export declare const logError: (error: Error, context?: any) => void;
export declare const logWarning: (message: string, context?: any) => void;
export declare const logInfo: (message: string, context?: any) => void;
export declare const logDebug: (message: string, context?: any) => void;
export declare const logPerformance: (operation: string, duration: number, context?: any) => void;
export declare const logDatabaseQuery: (query: string, duration: number, params?: any[]) => void;
export declare const logRedisOperation: (operation: string, key: string, duration: number) => void;
export declare const logStreamOperation: (operation: string, streamId: string, context?: any) => void;
export declare const logAuctionOperation: (operation: string, auctionId: string, context?: any) => void;
export declare const logChatOperation: (operation: string, streamId: string, userId: string, context?: any) => void;
export declare const logAnalytics: (event: string, data: any) => void;
//# sourceMappingURL=logger.d.ts.map