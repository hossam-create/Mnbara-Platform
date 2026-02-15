import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';
export interface StreamInfo {
    streamId: string;
    streamPath: string;
    startTime: Date;
    viewers: number;
    status: 'live' | 'ended';
}
export declare class RTMPServer extends EventEmitter {
    private nms;
    private logger;
    private activeStreams;
    constructor(logger: Logger);
    /**
     * Start RTMP server
     */
    start(): void;
    /**
     * Stop RTMP server
     */
    stop(): void;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Extract stream ID from stream path
     */
    private extractStreamId;
    /**
     * Increment viewer count
     */
    private incrementViewerCount;
    /**
     * Decrement viewer count
     */
    private decrementViewerCount;
    /**
     * Get stream info
     */
    getStreamInfo(streamId: string): StreamInfo | undefined;
    /**
     * Get all active streams
     */
    getActiveStreams(): StreamInfo[];
    /**
     * Generate stream key
     */
    generateStreamKey(): string;
    /**
     * Get RTMP URL
     */
    getRTMPUrl(streamKey: string): string;
    /**
     * Get HLS URL
     */
    getHLSUrl(streamKey: string): string;
}
//# sourceMappingURL=RTMPServer.d.ts.map