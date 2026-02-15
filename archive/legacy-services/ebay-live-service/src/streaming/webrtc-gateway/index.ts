import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { CustomError } from '@/utils/error-handler';

export interface WebRTCConfig {
  stunServers: string[];
  turnServers?: RTCIceServer[];
  iceCandidatePoolSize: number;
  maxBitrate: number;
  maxFramerate: number;
  resolution: string;
}

export interface PeerConnection {
  id: string;
  socketId: string;
  streamKey: string;
  pc: any; // RTCPeerConnection
  role: 'publisher' | 'subscriber';
  createdAt: Date;
  lastActivity: Date;
}

export interface StreamSession {
  streamKey: string;
  publisher?: PeerConnection;
  subscribers: Map<string, PeerConnection>;
  createdAt: Date;
  viewerCount: number;
}

export class WebRTCGateway extends EventEmitter {
  private config: WebRTCConfig;
  private sessions: Map<string, StreamSession> = new Map();
  private peerConnections: Map<string, PeerConnection> = new Map();
  private running: boolean = false;

  constructor(config?: Partial<WebRTCConfig>) {
    super();
    
    this.config = {
      stunServers: config?.stunServers || [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302'
      ],
      turnServers: config?.turnServers || [],
      iceCandidatePoolSize: config?.iceCandidatePoolSize || 10,
      maxBitrate: config?.maxBitrate || 2500000, // 2.5 Mbps
      maxFramerate: config?.maxFramerate || 30,
      resolution: config?.resolution || '1280x720'
    };
  }

  public async createPublisherOffer(
    streamKey: string,
    socketId: string,
    offer: any
  ): Promise<any> {
    try {
      const session = this.getOrCreateSession(streamKey);
      
      if (session.publisher) {
        throw new CustomError('Stream already has a publisher', 409);
      }

      // Create peer connection for publisher
      const pc = this.createPeerConnection('publisher');
      const publisher: PeerConnection = {
        id: this.generatePeerId(),
        socketId,
        streamKey,
        pc,
        role: 'publisher',
        createdAt: new Date(),
        lastActivity: new Date()
      };

      session.publisher = publisher;
      this.peerConnections.set(publisher.id, publisher);

      // Set up event handlers
      this.setupPeerConnectionHandlers(publisher);

      // Set remote description
      await pc.setRemoteDescription(offer);

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      logger.info(`Publisher offer created for stream: ${streamKey}`);
      
      return {
        answer,
        peerId: publisher.id,
        iceServers: this.getIceServers()
      };
    } catch (error) {
      logger.error('Failed to create publisher offer:', error);
      throw error;
    }
  }

  public async createSubscriberOffer(
    streamKey: string,
    socketId: string,
    offer: any
  ): Promise<any> {
    try {
      const session = this.sessions.get(streamKey);
      if (!session || !session.publisher) {
        throw new CustomError('Stream not found or no publisher', 404);
      }

      // Create peer connection for subscriber
      const pc = this.createPeerConnection('subscriber');
      const subscriber: PeerConnection = {
        id: this.generatePeerId(),
        socketId,
        streamKey,
        pc,
        role: 'subscriber',
        createdAt: new Date(),
        lastActivity: new Date()
      };

      session.subscribers.set(subscriber.id, subscriber);
      this.peerConnections.set(subscriber.id, subscriber);
      session.viewerCount++;

      // Set up event handlers
      this.setupPeerConnectionHandlers(subscriber);

      // Set remote description
      await pc.setRemoteDescription(offer);

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      logger.info(`Subscriber offer created for stream: ${streamKey}`);
      
      return {
        answer,
        peerId: subscriber.id,
        iceServers: this.getIceServers()
      };
    } catch (error) {
      logger.error('Failed to create subscriber offer:', error);
      throw error;
    }
  }

  public async handleIceCandidate(
    peerId: string,
    candidate: any
  ): Promise<void> {
    try {
      const peer = this.peerConnections.get(peerId);
      if (!peer) {
        throw new CustomError('Peer not found', 404);
      }

      await peer.pc.addIceCandidate(candidate);
      peer.lastActivity = new Date();
      
      logger.debug(`ICE candidate handled for peer: ${peerId}`);
    } catch (error) {
      logger.error('Failed to handle ICE candidate:', error);
      throw error;
    }
  }

  public async disconnectPeer(peerId: string): Promise<void> {
    try {
      const peer = this.peerConnections.get(peerId);
      if (!peer) {
        return;
      }

      // Close peer connection
      peer.pc.close();
      
      // Remove from session
      const session = this.sessions.get(peer.streamKey);
      if (session) {
        if (peer.role === 'publisher') {
          session.publisher = undefined;
          
          // Disconnect all subscribers
          for (const subscriber of session.subscribers.values()) {
            this.disconnectPeer(subscriber.id);
          }
          
          // Remove session
          this.sessions.delete(peer.streamKey);
          
          this.emit('publisherDisconnected', {
            streamKey: peer.streamKey,
            peerId: peer.id
          });
        } else {
          session.subscribers.delete(peerId);
          session.viewerCount = Math.max(0, session.viewerCount - 1);
          
          this.emit('subscriberDisconnected', {
            streamKey: peer.streamKey,
            peerId: peer.id,
            viewerCount: session.viewerCount
          });
        }
      }

      // Remove from peer connections
      this.peerConnections.delete(peerId);
      
      logger.info(`Peer disconnected: ${peerId}`);
    } catch (error) {
      logger.error('Failed to disconnect peer:', error);
      throw error;
    }
  }

  public async disconnectSocket(socketId: string): Promise<void> {
    const peers = Array.from(this.peerConnections.values()).filter(p => p.socketId === socketId);
    
    for (const peer of peers) {
      await this.disconnectPeer(peer.id);
    }
  }

  private createPeerConnection(role: 'publisher' | 'subscriber'): any {
    // Note: In a real implementation, this would use the WebRTC API
    // For now, we'll create a mock peer connection object
    const pc = {
      id: this.generatePeerId(),
      role,
      localDescription: null,
      remoteDescription: null,
      iceConnectionState: 'new',
      signalingState: 'stable',
      
      async createAnswer() {
        return {
          type: 'answer',
          sdp: 'v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n'
        };
      },
      
      async setLocalDescription(desc: any) {
        this.localDescription = desc;
      },
      
      async setRemoteDescription(desc: any) {
        this.remoteDescription = desc;
      },
      
      async addIceCandidate(candidate: any) {
        // Handle ICE candidate
      },
      
      close() {
        this.iceConnectionState = 'closed';
      }
    };

    return pc;
  }

  private setupPeerConnectionHandlers(peer: PeerConnection): void {
    const pc = peer.pc;
    
    // Mock event handlers
    pc.oniceconnectionstatechange = () => {
      logger.debug(`ICE connection state changed for peer ${peer.id}: ${pc.iceConnectionState}`);
      
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        this.disconnectPeer(peer.id).catch(error => {
          logger.error('Failed to disconnect peer:', error);
        });
      }
    };

    pc.onconnectionstatechange = () => {
      logger.debug(`Connection state changed for peer ${peer.id}: ${pc.connectionState}`);
      
      if (pc.connectionState === 'connected') {
        peer.lastActivity = new Date();
        
        if (peer.role === 'publisher') {
          this.emit('publisherConnected', {
            streamKey: peer.streamKey,
            peerId: peer.id
          });
        } else {
          const session = this.sessions.get(peer.streamKey);
          this.emit('subscriberConnected', {
            streamKey: peer.streamKey,
            peerId: peer.id,
            viewerCount: session?.viewerCount || 0
          });
        }
      }
    };
  }

  private getOrCreateSession(streamKey: string): StreamSession {
    let session = this.sessions.get(streamKey);
    
    if (!session) {
      session = {
        streamKey,
        subscribers: new Map(),
        createdAt: new Date(),
        viewerCount: 0
      };
      this.sessions.set(streamKey, session);
    }
    
    return session;
  }

  private getIceServers(): RTCIceServer[] {
    const servers: RTCIceServer[] = [];
    
    // Add STUN servers
    for (const stunServer of this.config.stunServers) {
      servers.push({ urls: stunServer });
    }
    
    // Add TURN servers
    if (this.config.turnServers) {
      servers.push(...this.config.turnServers);
    }
    
    return servers;
  }

  private generatePeerId(): string {
    return `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getSessionInfo(streamKey: string): StreamSession | undefined {
    return this.sessions.get(streamKey);
  }

  public getPeerInfo(peerId: string): PeerConnection | undefined {
    return this.peerConnections.get(peerId);
  }

  public getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  public getTotalViewers(streamKey: string): number {
    const session = this.sessions.get(streamKey);
    return session?.viewerCount || 0;
  }

  public getAllViewers(): number {
    let totalViewers = 0;
    for (const session of this.sessions.values()) {
      totalViewers += session.viewerCount;
    }
    return totalViewers;
  }

  public async start(): Promise<void> {
    logger.info('Starting WebRTC gateway...');
    this.running = true;
    // Additional initialization if needed
  }

  public async stop(): Promise<void> {
    logger.info('Stopping WebRTC gateway...');
    this.running = false;
    
    // Disconnect all peers
    const peerIds = Array.from(this.peerConnections.keys());
    for (const peerId of peerIds) {
      await this.disconnectPeer(peerId);
    }
    
    this.sessions.clear();
  }

  public isRunning(): boolean {
    return this.running;
  }