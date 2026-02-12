"use strict";
// ============================================================
// RTMP Server - Handles RTMP streaming
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RTMPServer = void 0;
const node_media_server_1 = __importDefault(require("node-media-server"));
const events_1 = require("events");
class RTMPServer extends events_1.EventEmitter {
    constructor(logger) {
        super();
        this.activeStreams = new Map();
        this.logger = logger;
        const config = {
            rtmp: {
                port: 1935,
                chunk_size: 60000,
                gop_cache: true,
                ping: 30,
                ping_timeout: 60
            },
            http: {
                port: 8000,
                allow_origin: '*',
                mediaroot: './media'
            },
            trans: {
                ffmpeg: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
                tasks: [{
                        app: 'live',
                        hls: true,
                        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
                        dash: true,
                        dashFlags: '[f=dash:window_size=3:extra_window_size=5]'
                    }]
            }
        };
        this.nms = new node_media_server_1.default(config);
        this.setupEventHandlers();
    }
    /**
     * Start RTMP server
     */
    start() {
        this.nms.run();
        this.logger.info('RTMP server started on port 1935');
    }
    /**
     * Stop RTMP server
     */
    stop() {
        this.nms.stop();
        this.logger.info('RTMP server stopped');
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        this.nms.on('prePublish', (id, streamPath, args) => {
            const streamId = this.extractStreamId(streamPath);
            this.activeStreams.set(streamId, {
                streamId,
                streamPath,
                startTime: new Date(),
                viewers: 0,
                status: 'live'
            });
            this.logger.info(`Stream started: ${streamId}`, { streamPath });
            this.emit('streamStart', streamId, streamPath);
        });
        this.nms.on('donePublish', (id, streamPath, args) => {
            const streamId = this.extractStreamId(streamPath);
            const streamInfo = this.activeStreams.get(streamId);
            if (streamInfo) {
                streamInfo.status = 'ended';
                this.activeStreams.delete(streamId);
            }
            this.logger.info(`Stream ended: ${streamId}`);
            this.emit('streamEnd', streamId);
        });
        this.nms.on('postPlay', (id, streamPath, args) => {
            const streamId = this.extractStreamId(streamPath);
            this.incrementViewerCount(streamId);
        });
        this.nms.on('donePlay', (id, streamPath, args) => {
            const streamId = this.extractStreamId(streamPath);
            this.decrementViewerCount(streamId);
        });
    }
    /**
     * Extract stream ID from stream path
     */
    extractStreamId(streamPath) {
        // Stream path format: /live/{streamId}
        const parts = streamPath.split('/');
        return parts[parts.length - 1] || 'unknown';
    }
    /**
     * Increment viewer count
     */
    incrementViewerCount(streamId) {
        const streamInfo = this.activeStreams.get(streamId);
        if (streamInfo) {
            streamInfo.viewers++;
            this.emit('viewerCountChange', streamId, streamInfo.viewers);
        }
    }
    /**
     * Decrement viewer count
     */
    decrementViewerCount(streamId) {
        const streamInfo = this.activeStreams.get(streamId);
        if (streamInfo) {
            streamInfo.viewers = Math.max(0, streamInfo.viewers - 1);
            this.emit('viewerCountChange', streamId, streamInfo.viewers);
        }
    }
    /**
     * Get stream info
     */
    getStreamInfo(streamId) {
        return this.activeStreams.get(streamId);
    }
    /**
     * Get all active streams
     */
    getActiveStreams() {
        return Array.from(this.activeStreams.values());
    }
    /**
     * Generate stream key
     */
    generateStreamKey() {
        return `live_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
    /**
     * Get RTMP URL
     */
    getRTMPUrl(streamKey) {
        return `rtmp://localhost:1935/live/${streamKey}`;
    }
    /**
     * Get HLS URL
     */
    getHLSUrl(streamKey) {
        return `http://localhost:8000/live/${streamKey}/index.m3u8`;
    }
}
exports.RTMPServer = RTMPServer;
//# sourceMappingURL=RTMPServer.js.map