import { PrismaClient } from '@prisma/client';
import { RTMPServer } from './RTMPServer';
import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';
export interface CreateStreamData {
    sellerId: string;
    title: string;
    description?: string;
    category?: string;
    scheduledStart: Date;
}
export declare class LiveStreamManager extends EventEmitter {
    private prisma;
    private rtmpServer;
    private logger;
    constructor(prisma: PrismaClient, rtmpServer: RTMPServer, logger: Logger);
    /**
     * Create a new live stream
     */
    createStream(data: CreateStreamData): Promise<{
        id: string;
        streamKey: string;
        rtmpUrl: string;
        hlsUrl: string;
    }>;
    /**
     * Start a stream (when broadcaster connects)
     */
    startStream(streamId: string): Promise<void>;
    /**
     * End a stream
     */
    endStream(streamId: string): Promise<void>;
    /**
     * Get stream by ID
     */
    getStream(streamId: string): Promise<any>;
    /**
     * Get active streams
     */
    getActiveStreams(): Promise<any>;
    /**
     * Handle stream start from RTMP server
     */
    private handleStreamStart;
    /**
     * Handle stream end from RTMP server
     */
    private handleStreamEnd;
    /**
     * Handle viewer count change
     */
    private handleViewerCountChange;
}
//# sourceMappingURL=LiveStreamManager.d.ts.map