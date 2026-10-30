import { AuthService } from '../services/authService.js';
import { db } from '../db/database.js';

const roomViewerCounts = new Map();

export function setupAuctionSockets(io) {
  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    let userId = null;

    if (token) {
      const payload = AuthService.verifyToken(token);
      if (payload) {
        userId = payload.userId;
        socket.join(`user:${userId}`);
      }
    }

    socket.on('auction:join', (auctionId) => {
      const room = `auction:${auctionId}`;
      socket.join(room);

      const count = (roomViewerCounts.get(room) || 0) + 1;
      roomViewerCounts.set(room, count);

      io.to(room).emit('auction:viewers', { auctionId, count });

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

    socket.on('auction:leave', (auctionId) => {
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
