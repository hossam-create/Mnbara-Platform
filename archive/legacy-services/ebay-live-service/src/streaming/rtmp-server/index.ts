import NodeMediaServer from 'node-media-server';
import { logger } from '@/utils/logger';
import { CustomError } from '@/utils/error-handler';
import { EventEmitter } from 'events';

export interface RTMPConfig {
  rtmp: {
    port: number;
    chunk_size: number;
    gop_cache: boolean;
    ping: number;
    ping_timeout: number;
  };
  http: {
    port: number;
    mediaroot: string;
    allow_origin: string;
  };
  https?: {
    port: number;
    key: string;
    cert: string;
  };
  auth: {
    api_user: string;
    api_pass: string;
    secret: string;
  };
}

export class RTMPServer extends EventEmitter {
  private nms: NodeMediaServer;
  private config: RTMPConfig;
  private activeStreams: Map<string, any> = new Map();
  private running: boolean = false;

  constructor(config?: Partial<RTMPConfig>) {
    super();
    
    this.config = {
      rtmp: {
        port: config?.rtmp?.port || 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
      },
      http: {
        port: config?.http?.port || 8080,
        mediaroot: config?.http?.mediaroot || './media',
        allow_origin: config?.http?.allow_origin || '*'
      },
      auth: {
        api_user: config?.auth?.api_user || 'admin',
        api_pass: config?.auth?.api_pass || process.env.RTMP_SECRET || 'default_secret',
        secret: config?.auth?.secret || process.env.RTMP_SECRET || 'default_secret'
      }
    };

    this.nms = new NodeMediaServer(this.config);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.nms.on('preConnect', (id: string, args: any) => {
      logger.info('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
      // Authentication logic can be added here
    });

    this.nms.on('postConnect', (id: string, args: any) => {
      logger.info('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
    });

    this.nms.on('doneConnect', (id: string, args: any) => {
      logger.info('[NodeEvent on doneConnect]', `id=${id} args=${JSON.stringify(args)}`);
    });

    this.nms.on('prePublish', (id: string, streamPath: string, args: any) => {
      logger.info('[NodeEvent on prePublish]', `id=${id} streamPath=${streamPath} args=${JSON.stringify(args)}`);
      
      // Extract stream key from streamPath
      const streamKey = streamPath.split('/').pop();
      if (!streamKey) {
        logger.error('Invalid stream path:', streamPath);
        return;
      }

      // Validate stream key and authenticate publisher
      this.validateStreamKey(streamKey, id, args);
    });

    this.nms.on('postPublish', (id: string, streamPath: string, args: any) => {
      logger.info('[NodeEvent on postPublish]', `id=${id} streamPath=${streamPath} args=${JSON.stringify(args)}`);
      
      const streamKey = streamPath.split('/').pop();
      if (streamKey) {
        this.activeStreams.set(streamKey, {
          id,
          streamPath,
          startTime: new Date(),
          viewers: 0
        });
        
        this.emit('streamStarted', {
          streamKey,
          streamPath,
          startTime: new Date()
        });
      }
    });

    this.nms.on('donePublish', (id: string, streamPath: string, args: any) => {
      logger.info('[NodeEvent on donePublish]', `id=${id} streamPath=${streamPath} args=${JSON.stringify(args)}`);
      
      const streamKey = streamPath.split('/').pop();
      if (streamKey) {
        const streamInfo = this.activeStreams.get(streamKey);
        if (streamInfo) {
          this.activeStreams.delete(streamKey);
          
          this.emit('streamEnded', {
            streamKey,
            streamPath,
            duration: Date.now() - streamInfo.startTime.getTime()
          });
        }
      }
    });

    this.nms.on('prePlay', (id: string, streamPath: string, args: any) => {
      logger.info('[NodeEvent on prePlay]', `id=${id} streamPath=${streamPath} args=${JSON.stringify(args)}`);
    });

    this.nms.on('postPlay', (id: string, streamPath: string, args: any) => {
      logger.info('[NodeEvent on postPlay]', `id=${id} streamPath=${streamPath} args=${JSON.stringify(args)}`);
      
      const streamKey = streamPath.split('/').pop();
      if (streamKey) {
        const streamInfo = this.activeStreams.get(streamKey);
        if (streamInfo) {
          streamInfo.viewers++;
          this.emit('viewerJoined', {
            streamKey,
            viewerId: id,
            totalViewers: streamInfo.viewers
          });
        }
      }
    });

    this.nms.on('donePlay', (id: string, streamPath: string, args: any) => {
      logger.info('[NodeEvent on donePlay]', `id=${id} streamPath=${streamPath} args=${JSON.stringify(args)}`);
      
      const streamKey = streamPath.split('/').pop();
      if (streamKey) {
        const streamInfo = this.activeStreams.get(streamKey);
        if (streamInfo) {
          streamInfo.viewers = Math.max(0, streamInfo.viewers - 1);
          this.emit('viewerLeft', {
            streamKey,
            viewerId: id,
            totalViewers: streamInfo.viewers
          });
        }
      }
    });
  }

  private validateStreamKey(streamKey: string, sessionId: string, args: any): boolean {
    // TODO: Implement proper stream key validation
    // This should check against database for valid stream keys
    
    if (!streamKey || streamKey.length < 8) {
      logger.error('Invalid stream key:', streamKey);
      return false;
    }

    // For now, accept all stream keys that meet basic requirements
    return true;
  }

  public async start(): Promise<void> {
    try {
      logger.info('Starting RTMP server...');
      
      await this.nms.run();
      this.running = true;
      
      logger.info(`🎥 RTMP Server started on port ${this.config.rtmp.port}`);
      logger.info(`📺 HTTP Server started on port ${this.config.http.port}`);
      logger.info(`📡 RTMP URL: rtmp://localhost:${this.config.rtmp.port}/live`);
      logger.info(`🌐 HTTP URL: http://localhost:${this.config.http.port}`);
      
    } catch (error) {
      logger.error('Failed to start RTMP server:', error);
      throw new CustomError('Failed to start RTMP server', 500);
    }
  }

  public async stop(): Promise<void> {
    try {
      logger.info('Stopping RTMP server...');
      
      await this.nms.stop();
      this.running = false;
      
      logger.info('RTMP server stopped');
    } catch (error) {
      logger.error('Error stopping RTMP server:', error);
      throw new CustomError('Failed to stop RTMP server', 500);
    }
  }

  public getActiveStreams(): Map<string, any> {
    return new Map(this.activeStreams);
  }

  public getStreamInfo(streamKey: string): any {
    return this.activeStreams.get(streamKey);
  }

  public isStreamActive(streamKey: string): boolean {
    return this.activeStreams.has(streamKey);
  }

  public getViewerCount(streamKey: string): number {
    const streamInfo = this.activeStreams.get(streamKey);
    return streamInfo ? streamInfo.viewers : 0;
  }

  public getTotalActiveStreams(): number {
    return this.activeStreams.size;
  }

  public getTotalViewers(): number {
    let totalViewers = 0;
    for (const streamInfo of this.activeStreams.values()) {
      totalViewers += streamInfo.viewers;
    }
    return totalViewers;
  }

  public isRunning(): boolean {
    return this.running;
  }
}