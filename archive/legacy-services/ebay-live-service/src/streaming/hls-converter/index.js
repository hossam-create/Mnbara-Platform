// HLS Converter Service
// Monitors RTMP streams and converts them to HLS format

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class HLSConverter extends EventEmitter {
  constructor() {
    super();
    this.ffmpegPath = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';
    this.mediaPath = process.env.MEDIA_PATH || '/media';
    this.activeConversions = new Map();
    
    ffmpeg.setFfmpegPath(this.ffmpegPath);
    
    this.setupDirectories();
    this.startMonitoring();
  }

  /**
   * Setup required directories
   */
  setupDirectories() {
    const dirs = [
      path.join(this.mediaPath, 'hls'),
      path.join(this.mediaPath, 'dash'),
      path.join(this.mediaPath, 'recordings')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });
  }

  /**
   * Start monitoring for new streams
   */
  startMonitoring() {
    console.log('HLS Converter started');
    
    // Monitor RTMP streams directory
    const rtmpDir = path.join(this.mediaPath, 'live');
    if (fs.existsSync(rtmpDir)) {
      fs.watch(rtmpDir, { recursive: true }, (eventType, filename) => {
        if (eventType === 'rename' && filename) {
          this.handleStreamFile(filename);
        }
      });
    }

    // Also monitor via HTTP API for stream events
    this.startHTTPServer();
  }

  /**
   * Handle new stream file
   */
  handleStreamFile(filename) {
    const streamId = this.extractStreamId(filename);
    if (!streamId) return;

    if (filename.endsWith('.flv') && !this.activeConversions.has(streamId)) {
      console.log(`New stream detected: ${streamId}`);
      this.convertToHLS(streamId);
    }
  }

  /**
   * Extract stream ID from filename
   */
  extractStreamId(filename) {
    const match = filename.match(/^(\w+)\.(flv|m3u8|ts)$/);
    return match ? match[1] : null;
  }

  /**
   * Convert RTMP stream to HLS
   */
  convertToHLS(streamId) {
    const inputPath = path.join(this.mediaPath, 'live', `${streamId}.flv`);
    const outputPath = path.join(this.mediaPath, 'hls', streamId);
    
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    console.log(`Converting stream ${streamId} to HLS...`);

    const command = ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-f hls',
        '-hls_time 2',
        '-hls_list_size 3',
        '-hls_flags delete_segments',
        '-hls_segment_filename', path.join(outputPath, 'segment_%03d.ts')
      ])
      .output(path.join(outputPath, 'index.m3u8'))
      .on('start', (commandLine) => {
        console.log(`FFmpeg started: ${commandLine}`);
      })
      .on('progress', (progress) => {
        console.log(`Conversion progress: ${progress.percent}%`);
      })
      .on('end', () => {
        console.log(`HLS conversion completed for ${streamId}`);
        this.emit('hlsReady', streamId, path.join(outputPath, 'index.m3u8'));
      })
      .on('error', (err) => {
        console.error(`HLS conversion error for ${streamId}:`, err);
        this.emit('conversionError', streamId, err);
      });

    this.activeConversions.set(streamId, command);
    command.run();
  }

  /**
   * Create multiple quality variants
   */
  createQualityVariants(streamId, inputPath) {
    const qualities = [
      { name: 'low', bitrate: '500k', resolution: '640x360' },
      { name: 'mid', bitrate: '1000k', resolution: '1280x720' },
      { name: 'high', bitrate: '2000k', resolution: '1920x1080' }
    ];

    const outputPath = path.join(this.mediaPath, 'hls', streamId);
    
    qualities.forEach(quality => {
      const qualityPath = path.join(outputPath, quality.name);
      if (!fs.existsSync(qualityPath)) {
        fs.mkdirSync(qualityPath, { recursive: true });
      }

      const command = ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(quality.resolution)
        .videoBitrate(quality.bitrate)
        .outputOptions([
          '-f hls',
          '-hls_time 2',
          '-hls_list_size 3',
          '-hls_flags delete_segments',
          `-hls_segment_filename`, path.join(qualityPath, 'segment_%03d.ts')
        ])
        .output(path.join(qualityPath, 'index.m3u8'))
        .on('end', () => {
          console.log(`${quality.name} quality ready for ${streamId}`);
        })
        .on('error', (err) => {
          console.error(`${quality.name} quality error for ${streamId}:`, err);
        });

      command.run();
    });
  }

  /**
   * Start HTTP server for API endpoints
   */
  startHTTPServer() {
    const express = require('express');
    const app = express();
    const port = 3001;

    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        activeConversions: this.activeConversions.size,
        ffmpegPath: this.ffmpegPath 
      });
    });

    // Get conversion status
    app.get('/status/:streamId', (req, res) => {
      const { streamId } = req.params;
      const isConverting = this.activeConversions.has(streamId);
      
      res.json({ 
        streamId, 
        isConverting,
        hlsUrl: isConverting ? `/hls/${streamId}/index.m3u8` : null 
      });
    });

    // Start conversion manually
    app.post('/convert/:streamId', (req, res) => {
      const { streamId } = req.params;
      
      if (this.activeConversions.has(streamId)) {
        return res.status(400).json({ error: 'Already converting' });
      }

      this.convertToHLS(streamId);
      res.json({ message: 'Conversion started', streamId });
    });

    // Stop conversion
    app.delete('/convert/:streamId', (req, res) => {
      const { streamId } = req.params;
      const command = this.activeConversions.get(streamId);
      
      if (!command) {
        return res.status(404).json({ error: 'No active conversion' });
      }

      command.kill();
      this.activeConversions.delete(streamId);
      
      res.json({ message: 'Conversion stopped', streamId });
    });

    app.listen(port, () => {
      console.log(`HLS Converter API running on port ${port}`);
    });
  }
}

// Start the converter
const converter = new HLSConverter();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down HLS converter...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down HLS converter...');
  process.exit(0);
});