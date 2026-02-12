"use strict";
// ============================================================
// Live Stream Manager - Manages stream lifecycle
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStreamManager = void 0;
const events_1 = require("events");
class LiveStreamManager extends events_1.EventEmitter {
    constructor(prisma, rtmpServer, logger) {
        super();
        this.prisma = prisma;
        this.rtmpServer = rtmpServer;
        this.logger = logger;
        // Listen to RTMP server events
        this.rtmpServer.on('streamStart', this.handleStreamStart.bind(this));
        this.rtmpServer.on('streamEnd', this.handleStreamEnd.bind(this));
        this.rtmpServer.on('viewerCountChange', this.handleViewerCountChange.bind(this));
    }
    /**
     * Create a new live stream
     */
    async createStream(data) {
        try {
            const streamKey = this.rtmpServer.generateStreamKey();
            const stream = await this.prisma.liveStream.create({
                data: {
                    sellerId: data.sellerId,
                    title: data.title,
                    description: data.description,
                    category: data.category,
                    scheduledStart: data.scheduledStart,
                    streamKey,
                    rtmpUrl: this.rtmpServer.getRTMPUrl(streamKey),
                    hlsUrl: this.rtmpServer.getHLSUrl(streamKey),
                    status: 'SCHEDULED'
                }
            });
            this.logger.info(`Stream created: ${stream.id}`, { streamKey });
            return {
                id: stream.id,
                streamKey,
                rtmpUrl: stream.rtmpUrl,
                hlsUrl: stream.hlsUrl
            };
        }
        catch (error) {
            this.logger.error('Failed to create stream', error);
            throw error;
        }
    }
    /**
     * Start a stream (when broadcaster connects)
     */
    async startStream(streamId) {
        try {
            await this.prisma.liveStream.update({
                where: { id: streamId },
                data: {
                    status: 'LIVE',
                    actualStart: new Date()
                }
            });
            this.logger.info(`Stream started: ${streamId}`);
            this.emit('streamStarted', streamId);
        }
        catch (error) {
            this.logger.error(`Failed to start stream: ${streamId}`, error);
            throw error;
        }
    }
    /**
     * End a stream
     */
    async endStream(streamId) {
        try {
            const stream = await this.prisma.liveStream.findUnique({
                where: { id: streamId },
                include: {
                    analytics: {
                        orderBy: { recordedAt: 'desc' },
                        take: 1
                    }
                }
            });
            if (!stream) {
                throw new Error(`Stream not found: ${streamId}`);
            }
            // Get final viewer count
            const streamInfo = this.rtmpServer.getStreamInfo(streamId);
            const finalViewers = streamInfo?.viewers || 0;
            await this.prisma.liveStream.update({
                where: { id: streamId },
                data: {
                    status: 'ENDED',
                    endTime: new Date(),
                    totalViewers: finalViewers,
                    peakViewers: Math.max(stream.peakViewers, finalViewers)
                }
            });
            this.logger.info(`Stream ended: ${streamId}`, { finalViewers });
            this.emit('streamEnded', streamId);
        }
        catch (error) {
            this.logger.error(`Failed to end stream: ${streamId}`, error);
            throw error;
        }
    }
    /**
     * Get stream by ID
     */
    async getStream(streamId) {
        return await this.prisma.liveStream.findUnique({
            where: { id: streamId },
            include: {
                auctions: {
                    where: { status: 'ACTIVE' },
                    orderBy: { startTime: 'desc' }
                },
                pinnedProducts: {
                    where: { isActive: true },
                    orderBy: { pinnedAt: 'desc' },
                    take: 1
                }
            }
        });
    }
    /**
     * Get active streams
     */
    async getActiveStreams() {
        return await this.prisma.liveStream.findMany({
            where: { status: 'LIVE' },
            orderBy: { actualStart: 'desc' }
        });
    }
    /**
     * Handle stream start from RTMP server
     */
    async handleStreamStart(streamId, streamPath) {
        try {
            // Find stream by streamKey
            const stream = await this.prisma.liveStream.findFirst({
                where: {
                    streamKey: streamId,
                    status: { in: ['SCHEDULED', 'LIVE'] }
                }
            });
            if (stream) {
                await this.startStream(stream.id);
            }
        }
        catch (error) {
            this.logger.error(`Error handling stream start: ${streamId}`, error);
        }
    }
    /**
     * Handle stream end from RTMP server
     */
    async handleStreamEnd(streamId) {
        try {
            const stream = await this.prisma.liveStream.findFirst({
                where: {
                    streamKey: streamId,
                    status: 'LIVE'
                }
            });
            if (stream) {
                await this.endStream(stream.id);
            }
        }
        catch (error) {
            this.logger.error(`Error handling stream end: ${streamId}`, error);
        }
    }
    /**
     * Handle viewer count change
     */
    async handleViewerCountChange(streamId, viewerCount) {
        try {
            const stream = await this.prisma.liveStream.findFirst({
                where: { streamKey: streamId }
            });
            if (stream) {
                // Update viewer count
                await this.prisma.liveStream.update({
                    where: { id: stream.id },
                    data: {
                        totalViewers: viewerCount,
                        peakViewers: Math.max(stream.peakViewers, viewerCount)
                    }
                });
                // Record analytics
                await this.prisma.streamAnalytic.create({
                    data: {
                        streamId: stream.id,
                        metricType: 'viewers',
                        metricValue: { count: viewerCount, timestamp: new Date() }
                    }
                });
            }
        }
        catch (error) {
            this.logger.error(`Error handling viewer count change: ${streamId}`, error);
        }
    }
}
exports.LiveStreamManager = LiveStreamManager;
//# sourceMappingURL=LiveStreamManager.js.map