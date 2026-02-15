// WebRTC Gateway Service
// Provides low-latency streaming using WebRTC

const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class WebRTCGateway extends EventEmitter {
  constructor() {
    super();
    this.port = process.env.PORT || 8443;
    this.signalingPort = process.env.SIGNALING_PORT || 3001;
    this.stunServer = process.env.STUN_SERVER || 'stun:stun.l.google.com:19302';
    
    this.connections = new Map();
    this.rooms = new Map();
    
    this.setupHTTPServer();
    this.setupSignalingServer();
  }

  /**
   * Setup HTTP server for WebRTC connections
   */
  setupHTTPServer() {
    const app = express();
    
    // CORS middleware
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        connections: this.connections.size,
        rooms: this.rooms.size,
        stunServer: this.stunServer
      });
    });

    // Get room info
    app.get('/room/:roomId', (req, res) => {
      const { roomId } = req.params;
      const room = this.rooms.get(roomId);
      
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json({
        roomId,
        participants: room.participants.size,
        broadcaster: room.broadcaster,
        created: room.created
      });
    });

    // Create room
    app.post('/room', (req, res) => {
      const { roomId, streamerId } = req.body;
      
      if (!roomId) {
        return res.status(400).json({ error: 'Room ID required' });
      }

      this.createRoom(roomId, streamerId);
      res.json({ message: 'Room created', roomId });
    });

    // Delete room
    app.delete('/room/:roomId', (req, res) => {
      const { roomId } = req.params;
      this.deleteRoom(roomId);
      res.json({ message: 'Room deleted', roomId });
    });

    // Get ICE configuration
    app.get('/ice-config', (req, res) => {
      res.json({
        iceServers: [
          { urls: this.stunServer },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      });
    });

    // Start server
    const server = app.listen(this.port, () => {
      console.log(`WebRTC HTTP server running on port ${this.port}`);
    });

    // Handle graceful shutdown
    server.on('close', () => {
      console.log('WebRTC HTTP server closed');
    });
  }

  /**
   * Setup WebSocket signaling server
   */
  setupSignalingServer() {
    const io = require('socket.io')(this.signalingPort, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      socket.on('join-room', (data) => {
        const { roomId, userId, role } = data;
        this.handleJoinRoom(socket, roomId, userId, role);
      });

      socket.on('offer', (data) => {
        const { roomId, offer, targetUserId } = data;
        this.handleOffer(socket, roomId, offer, targetUserId);
      });

      socket.on('answer', (data) => {
        const { roomId, answer, targetUserId } = data;
        this.handleAnswer(socket, roomId, answer, targetUserId);
      });

      socket.on('ice-candidate', (data) => {
        const { roomId, candidate, targetUserId } = data;
        this.handleIceCandidate(socket, roomId, candidate, targetUserId);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.handleDisconnect(socket);
      });
    });

    console.log(`WebRTC signaling server running on port ${this.signalingPort}`);
  }

  /**
   * Handle room joining
   */
  handleJoinRoom(socket, roomId, userId, role) {
    const room = this.getOrCreateRoom(roomId);
    
    socket.join(roomId);
    socket.userId = userId;
    socket.roomId = roomId;
    socket.role = role;
    
    this.connections.set(socket.id, {
      socket,
      userId,
      roomId,
      role
    });

    if (role === 'broadcaster') {
      room.broadcaster = userId;
      socket.broadcast.to(roomId).emit('broadcaster-joined', { userId });
    } else {
      room.participants.add(userId);
      
      // Notify broadcaster about new viewer
      if (room.broadcaster) {
        socket.to(roomId).emit('viewer-joined', { userId });
      }
    }

    console.log(`User ${userId} joined room ${roomId} as ${role}`);
  }

  /**
   * Handle WebRTC offer
   */
  handleOffer(socket, roomId, offer, targetUserId) {
    console.log(`Offer from ${socket.userId} to ${targetUserId} in room ${roomId}`);
    
    socket.to(roomId).emit('offer', {
      offer,
      fromUserId: socket.userId,
      targetUserId
    });
  }

  /**
   * Handle WebRTC answer
   */
  handleAnswer(socket, roomId, answer, targetUserId) {
    console.log(`Answer from ${socket.userId} to ${targetUserId} in room ${roomId}`);
    
    socket.to(roomId).emit('answer', {
      answer,
      fromUserId: socket.userId,
      targetUserId
    });
  }

  /**
   * Handle ICE candidate
   */
  handleIceCandidate(socket, roomId, candidate, targetUserId) {
    socket.to(roomId).emit('ice-candidate', {
      candidate,
      fromUserId: socket.userId,
      targetUserId
    });
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(socket) {
    const connection = this.connections.get(socket.id);
    if (!connection) return;

    const { userId, roomId, role } = connection;
    const room = this.rooms.get(roomId);

    if (room) {
      if (role === 'broadcaster') {
        room.broadcaster = null;
        socket.to(roomId).emit('broadcaster-left', { userId });
        
        // End the stream if broadcaster leaves
        this.deleteRoom(roomId);
      } else {
        room.participants.delete(userId);
        socket.to(roomId).emit('viewer-left', { userId });
      }
    }

    this.connections.delete(socket.id);
    console.log(`User ${userId} disconnected from room ${roomId}`);
  }

  /**
   * Get or create room
   */
  getOrCreateRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        participants: new Set(),
        broadcaster: null,
        created: new Date()
      });
    }
    return this.rooms.get(roomId);
  }

  /**
   * Create room
   */
  createRoom(roomId, streamerId) {
    this.rooms.set(roomId, {
      participants: new Set(),
      broadcaster: streamerId,
      created: new Date()
    });
    console.log(`Room created: ${roomId} for streamer: ${streamerId}`);
  }

  /**
   * Delete room
   */
  deleteRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      // Disconnect all participants
      this.connections.forEach((connection, socketId) => {
        if (connection.roomId === roomId) {
          connection.socket.disconnect();
        }
      });
      
      this.rooms.delete(roomId);
      console.log(`Room deleted: ${roomId}`);
    }
  }

  /**
   * Get room statistics
   */
  getRoomStats() {
    const stats = {};
    this.rooms.forEach((room, roomId) => {
      stats[roomId] = {
        participants: room.participants.size,
        broadcaster: room.broadcaster,
        created: room.created
      };
    });
    return stats;
  }
}

// Start the gateway
const gateway = new WebRTCGateway();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down WebRTC gateway...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down WebRTC gateway...');
  process.exit(0);
});