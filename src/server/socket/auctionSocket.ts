import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthService } from '../services/authService.ts';
import { db } from '../db/database.ts';

// Track viewer counts in active auction rooms
const roomViewerCounts: Map<string, number> = new Map();

export function setupAuctionSockets(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    // Check if token was provided in auth handshake
    const token = socket.handshake.auth?.token;
    let userId: string | null = null;
    let userName: string = 'Anonymous Bidder';

    if (token) {
      const payload = AuthService.verifyToken(token);
      if (payload) {
        userId = payload.userId;
        const user = db.getUserById(userId);
        if (user) {
          userName = user.name;
        }
        // Join private user notifications channel
        socket.join(`user:${userId}`);
      }
    }

    // Join specific auction room
    socket.on('auction:join', (auctionId: string) => {
      const room = `auction:${auctionId}`;
      socket.join(room);

      const count = (roomViewerCounts.get(room) || 0) + 1;
      roomViewerCounts.set(room, count);

      // Broadcast viewer count update to room
      io.to(room).emit('auction:viewers', { auctionId, count });

      // Send initial auction state sync
      const auction = db.getAuctionById(auctionId);
      if (auction) {
        socket.emit('auction:sync', {
          auctionId,
          currentHighestBid: auction.currentHighestBid,
          status: auction.status,
          endTime: auction.endTime,
          extensionCount: auction.extensionCount,
          winnerId: auction.winnerId,
          winnerName: auction.winnerName,
          bidCount: auction.bidCount,
        });
      }
    });

    // Leave auction room
    socket.on('auction:leave', (auctionId: string) => {
      const room = `auction:${auctionId}`;
      socket.leave(room);

      const count = Math.max(0, (roomViewerCounts.get(room) || 1) - 1);
      roomViewerCounts.set(room, count);
      io.to(room).emit('auction:viewers', { auctionId, count });
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('auction:')) {
          const count = Math.max(0, (roomViewerCounts.get(room) || 1) - 1);
          roomViewerCounts.set(room, count);
          io.to(room).emit('auction:viewers', {
            auctionId: room.replace('auction:', ''),
            count,
          });
        }
      }
    });
  });
}
