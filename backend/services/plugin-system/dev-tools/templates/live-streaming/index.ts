/**
 * {{PluginName}} - Live Streaming Plugin
 * 
 * A plugin for handling live streaming functionality in eBay Live
 */

import { Plugin, PluginContext, PluginConfig } from '@mnbara/plugin-core';
import { LiveStreamManager, StreamEvent, ChatManager } from '@mnbara/live-streaming';

export interface {{PluginName}}Config extends PluginConfig {
  streamUrl?: string;
  chatEnabled?: boolean;
  maxViewers?: number;
  streamQuality?: string;
}

export class {{PluginName}} implements Plugin {
  private streamManager: LiveStreamManager;
  private chatManager: ChatManager;
  private config: {{PluginName}}Config;
  private activeStreams: Map<string, StreamEvent> = new Map();

  constructor(private context: PluginContext) {
    this.config = context.config as {{PluginName}}Config;
    this.streamManager = new LiveStreamManager(context);
    this.chatManager = new ChatManager(context);
  }

  /**
   * Initialize the plugin
   */
  async initialize(): Promise<void> {
    console.log('🎥 Initializing {{PluginName}} live streaming plugin');
    
    // Set up stream event listeners
    this.setupStreamListeners();
    
    // Initialize chat if enabled
    if (this.config.chatEnabled) {
      await this.chatManager.initialize();
    }
    
    console.log('✅ {{PluginName}} plugin initialized successfully');
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    console.log('🧹 Cleaning up {{PluginName}} plugin');
    
    // Stop all active streams
    for (const streamId of this.activeStreams.keys()) {
      await this.stopStream(streamId);
    }
    
    // Clean up managers
    await this.streamManager.destroy();
    if (this.config.chatEnabled) {
      await this.chatManager.destroy();
    }
    
    console.log('✅ {{PluginName}} plugin cleaned up');
  }

  /**
   * Handle stream start hook
   */
  async onStreamStart(data: StreamEvent): Promise<void> {
    console.log(`🎬 Stream started: ${data.streamId}`);
    
    try {
      // Store stream reference
      this.activeStreams.set(data.streamId, data);
      
      // Set stream quality if specified
      if (this.config.streamQuality) {
        await this.streamManager.setQuality(data.streamId, this.config.streamQuality);
      }
      
      // Notify viewers
      await this.notifyViewers(data.streamId, 'Stream has started!');
      
      console.log(`✅ Stream ${data.streamId} started successfully`);
    } catch (error) {
      console.error(`❌ Failed to start stream ${data.streamId}:`, error);
      throw error;
    }
  }

  /**
   * Handle stream stop hook
   */
  async onStreamStop(data: StreamEvent): Promise<void> {
    console.log(`🛑 Stream stopped: ${data.streamId}`);
    
    try {
      // Remove stream reference
      this.activeStreams.delete(data.streamId);
      
      // Notify viewers
      await this.notifyViewers(data.streamId, 'Stream has ended');
      
      console.log(`✅ Stream ${data.streamId} stopped successfully`);
    } catch (error) {
      console.error(`❌ Failed to stop stream ${data.streamId}:`, error);
      throw error;
    }
  }

  /**
   * Handle viewer joined hook
   */
  async onViewerJoined(data: { streamId: string; viewerId: string; viewerName: string }): Promise<void> {
    console.log(`👤 Viewer joined: ${data.viewerName} (${data.viewerId})`);
    
    try {
      // Check viewer limit
      const stream = this.activeStreams.get(data.streamId);
      if (stream && this.config.maxViewers && stream.viewerCount >= this.config.maxViewers) {
        throw new Error('Maximum viewer limit reached');
      }
      
      // Welcome message
      if (this.config.chatEnabled) {
        await this.chatManager.sendMessage(data.streamId, {
          type: 'system',
          content: `Welcome ${data.viewerName} to the stream!`,
          timestamp: new Date()
        });
      }
      
      // Update viewer count
      if (stream) {
        stream.viewerCount = (stream.viewerCount || 0) + 1;
      }
      
      console.log(`✅ Viewer ${data.viewerName} welcomed successfully`);
    } catch (error) {
      console.error(`❌ Failed to handle viewer joined:`, error);
      throw error;
    }
  }

  /**
   * Handle viewer left hook
   */
  async onViewerLeft(data: { streamId: string; viewerId: string; viewerName: string }): Promise<void> {
    console.log(`👋 Viewer left: ${data.viewerName} (${data.viewerId})`);
    
    try {
      // Update viewer count
      const stream = this.activeStreams.get(data.streamId);
      if (stream && stream.viewerCount > 0) {
        stream.viewerCount = stream.viewerCount - 1;
      }
      
      console.log(`✅ Viewer ${data.viewerName} departure handled`);
    } catch (error) {
      console.error(`❌ Failed to handle viewer left:`, error);
      throw error;
    }
  }

  /**
   * Handle chat message hook
   */
  async onChatMessage(data: { streamId: string; message: any }): Promise<void> {
    console.log(`💬 Chat message in stream ${data.streamId}: ${data.message.content}`);
    
    try {
      // Validate message
      if (!data.message.content || data.message.content.trim().length === 0) {
        throw new Error('Empty message content');
      }
      
      // Process message (filter, moderate, etc.)
      const processedMessage = await this.processChatMessage(data.message);
      
      // Broadcast to other viewers
      if (this.config.chatEnabled) {
        await this.chatManager.broadcastMessage(data.streamId, processedMessage);
      }
      
      console.log(`✅ Chat message processed successfully`);
    } catch (error) {
      console.error(`❌ Failed to handle chat message:`, error);
      throw error;
    }
  }

  /**
   * Handle quality changed hook
   */
  async onQualityChanged(data: { streamId: string; quality: string }): Promise<void> {
    console.log(`📊 Stream quality changed: ${data.quality}`);
    
    try {
      // Update stream quality
      await this.streamManager.setQuality(data.streamId, data.quality);
      
      // Notify viewers of quality change
      await this.notifyViewers(data.streamId, `Stream quality changed to ${data.quality}`);
      
      console.log(`✅ Stream quality updated to ${data.quality}`);
    } catch (error) {
      console.error(`❌ Failed to change stream quality:`, error);
      throw error;
    }
  }

  /**
   * Set up stream event listeners
   */
  private setupStreamListeners(): void {
    this.streamManager.on('stream:start', this.onStreamStart.bind(this));
    this.streamManager.on('stream:stop', this.onStreamStop.bind(this));
    this.streamManager.on('stream:viewer-joined', this.onViewerJoined.bind(this));
    this.streamManager.on('stream:viewer-left', this.onViewerLeft.bind(this));
    this.streamManager.on('stream:quality-changed', this.onQualityChanged.bind(this));
    
    if (this.config.chatEnabled) {
      this.chatManager.on('message', this.onChatMessage.bind(this));
    }
  }

  /**
   * Process chat message (filtering, moderation, etc.)
   */
  private async processChatMessage(message: any): Promise<any> {
    // Basic content filtering
    let content = message.content;
    
    // Remove excessive whitespace
    content = content.replace(/\s+/g, ' ').trim();
    
    // Limit message length
    if (content.length > 500) {
      content = content.substring(0, 500) + '...';
    }
    
    // Add timestamp if not present
    if (!message.timestamp) {
      message.timestamp = new Date();
    }
    
    return {
      ...message,
      content,
      processed: true
    };
  }

  /**
   * Notify viewers in a stream
   */
  private async notifyViewers(streamId: string, message: string): Promise<void> {
    if (!this.config.chatEnabled) {
      return;
    }
    
    try {
      await this.chatManager.sendSystemMessage(streamId, {
        type: 'notification',
        content: message,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`❌ Failed to notify viewers:`, error);
    }
  }

  /**
   * Stop a specific stream
   */
  private async stopStream(streamId: string): Promise<void> {
    try {
      await this.streamManager.stopStream(streamId);
      this.activeStreams.delete(streamId);
      console.log(`✅ Stream ${streamId} stopped`);
    } catch (error) {
      console.error(`❌ Failed to stop stream ${streamId}:`, error);
    }
  }

  /**
   * Get active streams
   */
  getActiveStreams(): StreamEvent[] {
    return Array.from(this.activeStreams.values());
  }

  /**
   * Get stream by ID
   */
  getStream(streamId: string): StreamEvent | undefined {
    return this.activeStreams.get(streamId);
  }

  /**
   * Check if stream is active
   */
  isStreamActive(streamId: string): boolean {
    return this.activeStreams.has(streamId);
  }

  /**
   * Get plugin info
   */
  getInfo(): any {
    return {
      name: '{{pluginName}}',
      version: '1.0.0',
      activeStreams: this.activeStreams.size,
      chatEnabled: this.config.chatEnabled,
      maxViewers: this.config.maxViewers
    };
  }
}