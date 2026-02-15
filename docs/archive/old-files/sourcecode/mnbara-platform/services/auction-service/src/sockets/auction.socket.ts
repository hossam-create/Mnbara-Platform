import { Server, Socket } from 'socket.io';

export const setupSocketHandlers = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`User connected: ${socket.id}`);

        // Join auction room
        socket.on('join_auction', (auctionId: string) => {
            socket.join(`auction:${auctionId}`);
            console.log(`User ${socket.id} joined auction ${auctionId}`);
        });

        // Leave auction room
        socket.on('leave_auction', (auctionId: string) => {
            socket.leave(`auction:${auctionId}`);
            console.log(`User ${socket.id} left auction ${auctionId}`);
        });

        // Handle new bid (real-time)
        socket.on('place_bid', (data: { auctionId: string; amount: number; userId: string }) => {
            // TODO: Validate bid logic here or via API
            // For now, broadcast to room
            io.to(`auction:${data.auctionId}`).emit('new_bid', {
                amount: data.amount,
                userId: data.userId,
                timestamp: new Date(),
            });
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
