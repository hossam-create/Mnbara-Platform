import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { CustomError } from '@/utils/error-handler';

export interface HLSConfig {
  segmentDuration: number;
  playlistLength: number;
  outputDir: string;
  tempDir: string;
  qualityPresets: QualityPreset[];
}

export interface QualityPreset {
  name: string;
  resolution: string;
  bitrate: string;
  framerate: number;
}

export class HLSConverter extends EventEmitter {
  private config: HLSConfig;
  private activeConversions: Map<string, ffmpeg.FfmpegCommand> = new Map();
  private outputDirs: Map<string, string> = new Map();
  private running: boolean = false;

  constructor(config?: Partial<HLSConfig>) {
    super();
    
    this.config = {
      segmentDuration: config?.segmentDuration || 6,
      playlistLength: config?.playlistLength || 30,
      outputDir: config?.outputDir || './media/hls',
      tempDir: config?.tempDir || './temp',
      qualityPresets: config?.qualityPresets || this.getDefaultQualityPresets()
    };

    this.ensureDirectories();
  }

  private getDefaultQualityPresets(): QualityPreset[] {
    return [
      {
        name: 'low',
        resolution: '854x480',
        bitrate: '800k',
        framerate: 30
      },
      {
        name: 'medium',
        resolution: '1280x720',
        bitrate: '2500k',
        framerate: 30
      },
      {
        name: 'high',
        resolution: '1920x1080',
        bitrate: '5000k',
        framerate: 30
      },
      {
        name: 'ultra',
        resolution: '3840x2160',
        bitrate: '15000k',
        framerate: 30
      }
    ];
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
      await fs.mkdir(this.config.tempDir, { recursive: true });
      
      // Create subdirectories for each quality preset
      for (const preset of this.config.qualityPresets) {
        await fs.mkdir(path.join(this.config.outputDir, preset.name), { recursive: true });
      }
    } catch (error) {
      logger.error('Failed to create directories:', error);
      throw new CustomError('Failed to create HLS directories', 500);
    }
  }

  public async convertToHLS(
    inputPath: string,
    streamKey: string,
    options?: {
      quality?: string;
      enableMultiQuality?: boolean;
      watermark?: {
        path: string;
        position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
        opacity: number;
      };
    }
  ): Promise<string> {
    try {
      const outputDir = path.join(this.config.outputDir, streamKey);
      await fs.mkdir(outputDir, { recursive: true });

      if (options?.enableMultiQuality) {
        return await this.createMultiQualityHLS(inputPath, streamKey, outputDir, options);
      } else {
        const preset = this.config.qualityPresets.find(p => p.name === (options?.quality || 'medium'));
        if (!preset) {
          throw new CustomError(`Quality preset '${options?.quality}' not found`, 400);
        }
        return await this.createSingleQualityHLS(inputPath, streamKey, outputDir, preset, options);
      }
    } catch (error) {
      logger.error('HLS conversion failed:', error);
      throw error;
    }
  }

  private async createSingleQualityHLS(
    inputPath: string,
    streamKey: string,
    outputDir: string,
    preset: QualityPreset,
    options?: {
      watermark?: {
        path: string;
        position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
        opacity: number;
      };
    }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const playlistPath = path.join(outputDir, 'index.m3u8');
      
      let command = ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-preset veryfast',
          '-tune zerolatency',
          `-b:v ${preset.bitrate}`,
          `-s ${preset.resolution}`,
          `-r ${preset.framerate}`,
          '-g 60',
          '-keyint_min 60',
          '-sc_threshold 0',
          `-hls_time ${this.config.segmentDuration}`,
          `-hls_list_size ${this.config.playlistLength}`,
          '-hls_flags delete_segments',
          '-hls_segment_filename',
          path.join(outputDir, 'segment_%03d.ts'),
          '-f hls'
        ])
        .output(playlistPath)
        .on('start', (commandLine) => {
          logger.info(`FFmpeg started: ${commandLine}`);
        })
        .on('progress', (progress) => {
          logger.debug(`FFmpeg progress: ${progress.percent}% done`);
          this.emit('progress', {
            streamKey,
            preset: preset.name,
            progress: progress.percent
          });
        })
        .on('end', () => {
          logger.info(`HLS conversion completed for ${streamKey}`);
          this.activeConversions.delete(streamKey);
          resolve(playlistPath);
        })
        .on('error', (err) => {
          logger.error('FFmpeg error:', err);
          this.activeConversions.delete(streamKey);
          reject(new CustomError(`HLS conversion failed: ${err.message}`, 500));
        });

      // Add watermark if specified
      if (options?.watermark) {
        const position = this.getWatermarkPosition(options.watermark.position);
        command = command
          .input(options.watermark.path)
          .inputOptions(['-ignore_loop 0'])
          .complexFilter([
            `[0:v][1:v]overlay=${position.x}:${position.y}:format=auto,format=yuv420p`
          ]);
      }

      this.activeConversions.set(streamKey, command);
      command.run();
    });
  }

  private async createMultiQualityHLS(
    inputPath: string,
    streamKey: string,
    outputDir: string,
    options?: {
      watermark?: {
        path: string;
        position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
        opacity: number;
      };
    }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
      const variantPlaylists: string[] = [];
      
      // Create variant playlists for each quality preset
      const promises = this.config.qualityPresets.map(async (preset) => {
        const presetDir = path.join(outputDir, preset.name);
        await fs.mkdir(presetDir, { recursive: true });
        
        const playlistPath = path.join(presetDir, 'index.m3u8');
        variantPlaylists.push(playlistPath);
        
        return this.createVariantPlaylist(inputPath, streamKey, preset, presetDir, options);
      });

      Promise.all(promises)
        .then(() => {
          // Create master playlist
          return this.createMasterPlaylist(masterPlaylistPath, variantPlaylists);
        })
        .then(() => {
          logger.info(`Multi-quality HLS conversion completed for ${streamKey}`);
          resolve(masterPlaylistPath);
        })
        .catch(reject);
    });
  }

  private async createVariantPlaylist(
    inputPath: string,
    streamKey: string,
    preset: QualityPreset,
    outputDir: string,
    options?: {
      watermark?: {
        path: string;
        position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
        opacity: number;
      };
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const playlistPath = path.join(outputDir, 'index.m3u8');
      
      let command = ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-preset veryfast',
          '-tune zerolatency',
          `-b:v ${preset.bitrate}`,
          `-s ${preset.resolution}`,
          `-r ${preset.framerate}`,
          '-g 60',
          '-keyint_min 60',
          '-sc_threshold 0',
          `-hls_time ${this.config.segmentDuration}`,
          `-hls_list_size ${this.config.playlistLength}`,
          '-hls_flags delete_segments',
          '-hls_segment_filename',
          path.join(outputDir, 'segment_%03d.ts'),
          '-f hls'
        ])
        .output(playlistPath)
        .on('end', () => {
          logger.info(`Variant playlist created: ${preset.name}`);
          resolve();
        })
        .on('error', (err) => {
          logger.error(`Variant playlist error (${preset.name}):`, err);
          reject(new CustomError(`Variant playlist creation failed: ${err.message}`, 500));
        });

      // Add watermark if specified
      if (options?.watermark) {
        const position = this.getWatermarkPosition(options.watermark.position);
        command = command
          .input(options.watermark.path)
          .inputOptions(['-ignore_loop 0'])
          .complexFilter([
            `[0:v][1:v]overlay=${position.x}:${position.y}:format=auto,format=yuv420p`
          ]);
      }

      command.run();
    });
  }

  private async createMasterPlaylist(masterPath: string, variantPaths: string[]): Promise<void> {
    const masterContent = `#EXTM3U
#EXT-X-VERSION:3

${this.config.qualityPresets.map((preset, index) => {
  const bandwidth = this.getBandwidthForPreset(preset);
  return `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${preset.resolution}\n${preset.name}/index.m3u8`;
}).join('\n')}
`;

    await fs.writeFile(masterPath, masterContent);
  }

  private getBandwidthForPreset(preset: QualityPreset): number {
    // Convert bitrate string to number (e.g., '2500k' -> 2500000)
    const bitrate = parseInt(preset.bitrate.replace('k', ''));
    return bitrate * 1000;
  }

  private getWatermarkPosition(position: string): { x: number; y: number } {
    const positions = {
      'top-left': { x: 10, y: 10 },
      'top-right': { x: 'W-w-10', y: 10 },
      'bottom-left': { x: 10, y: 'H-h-10' },
      'bottom-right': { x: 'W-w-10', y: 'H-h-10' }
    };
    return positions[position as keyof typeof positions] || { x: 10, y: 10 };
  }

  public async stopConversion(streamKey: string): Promise<void> {
    const command = this.activeConversions.get(streamKey);
    if (command) {
      command.kill('SIGKILL');
      this.activeConversions.delete(streamKey);
      logger.info(`HLS conversion stopped for ${streamKey}`);
    }
  }

  public async cleanupStream(streamKey: string): Promise<void> {
    try {
      const outputDir = path.join(this.config.outputDir, streamKey);
      await fs.rm(outputDir, { recursive: true, force: true });
      logger.info(`Cleaned up HLS files for ${streamKey}`);
    } catch (error) {
      logger.error(`Failed to cleanup HLS files for ${streamKey}:`, error);
    }
  }

  public async start(): Promise<void> {
    logger.info('Starting HLS converter...');
    this.running = true;
    // Additional initialization if needed
  }

  public async stop(): Promise<void> {
    logger.info('Stopping HLS converter...');
    this.running = false;
    
    // Stop all active conversions
    for (const [streamKey, command] of this.activeConversions) {
      command.kill('SIGKILL');
    }
    this.activeConversions.clear();
  }

  public getActiveConversions(): string[] {
    return Array.from(this.activeConversions.keys());
  }

  public isRunning(): boolean {
    return this.running;
  }

  public isConverting(streamKey: string): boolean {
    return this.activeConversions.has(streamKey);
  }
}