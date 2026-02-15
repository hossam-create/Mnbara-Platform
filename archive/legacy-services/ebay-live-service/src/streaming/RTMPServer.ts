// ============================================================
// RTMP Server - Handles RTMP streaming
// ============================================================

import NodeMediaServer from 'node-media-server';
import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';

export interface StreamInfo {
  streamId: string;
  streamPath: string;
  startTime: Date;
  viewers: number;
  status: 'live' | 'ended';
}

export class RTMPServer extends EventEmitter {
  private nms: NodeMediaServer;
  private logger: Logger;
  private activeStreams: Map<string, StreamInfo> = new Map();

  constructor(logger: Logger) {
    super();
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

    this.nms = new NodeMediaServer(config);
    this.setupEventHandlers();
  }

  /**
   * Start RTMP server
   */
  start(): void {
    this.nms.run();
    this.logger.info('RTMP server started on port 1935');
  }

  /**
   * Stop RTMP server
   */
  stop(): void {
    this.nms.stop();
    this.logger.info('RTMP server stopped');
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.nms.on('prePublish', (id: string, streamPath: string, args: any) => {
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

    this.nms.on('donePublish', (id: string, streamPath: string, args: any) => {
      const streamId = this.extractStreamId(streamPath);
      
      const streamInfo = this.activeStreams.get(streamId);
      if (streamInfo) {
        streamInfo.status = 'ended';
        this.activeStreams.delete(streamId);
      }

      this.logger.info(`Stream ended: ${streamId}`);
      this.emit('streamEnd', streamId);
    });

    this.nms.on('postPlay', (id: string, streamPath: string, args: any) => {
      const streamId = this.extractStreamId(streamPath);
      this.incrementViewerCount(streamId);
    });

    this.nms.on('donePlay', (id: string, streamPath: string, args: any) => {
      const streamId = this.extractStreamId(streamPath);
      this.decrementViewerCount(streamId);
    });
  }

  /**
   * Extract stream ID from stream path
   */
  private extractStreamId(streamPath: string): string {
    // Stream path format: /live/{streamId}
    const parts = streamPath.split('/');
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * Increment viewer count
   */
  private incrementViewerCount(streamId: string): void {
    const streamInfo = this.activeStreams.get(streamId);
    if (streamInfo) {
      streamInfo.viewers++;
      this.emit('viewerCountChange', streamId, streamInfo.viewers);
    }
  }

  /**
   * Decrement viewer count
   */
  private decrementViewerCount(streamId: string): void {
    const streamInfo = this.activeStreams.get(streamId);
    if (streamInfo) {
      streamInfo.viewers = Math.max(0, streamInfo.viewers - 1);
      this.emit('viewerCountChange', streamId, streamInfo.viewers);
    }
  }

  /**
   * Get stream info
   */
  getStreamInfo(streamId: string): StreamInfo | undefined {
    return this.activeStreams.get(streamId);
  }

  /**
   * Get all active streams
   */
  getActiveStreams(): StreamInfo[] {
    return Array.from(this.activeStreams.values());
  }

  /**
   * Generate stream key
   */
  generateStreamKey(): string {
    return `live_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get RTMP URL
   */
  getRTMPUrl(streamKey: string): string {
    return `rtmp://localhost:1935/live/${streamKey}`;
  }

  /**
   * Get HLS URL
   */
  getHLSUrl(streamKey: string): string {
    return `http://localhost:8000/live/${streamKey}/index.m3u8`;
  }
}

