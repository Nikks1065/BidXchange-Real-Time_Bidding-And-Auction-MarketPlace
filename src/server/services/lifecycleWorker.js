import { db } from '../db/database.js';

export class LifecycleWorker {
  static timer = null;
  static io = null;

  static start(io) {
    if (io) this.io = io;
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      this.checkAndTransitionAuctions();
    }, 2000);

    console.log('[LifecycleWorker] Auction state transition worker running in pure JS (2s interval)');
  }

  static stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  static checkAndTransitionAuctions() {
    const now = Date.now();

    for (const auction of db.auctions.values()) {
      const startTime = new Date(auction.startTime).getTime();
      const endTime = new Date(auction.endTime).getTime();

      // 1. Transition SCHEDULED -> LIVE
      if (auction.status === 'SCHEDULED' && now >= startTime) {
        auction.status = 'LIVE';
        auction.updatedAt = new Date().toISOString();
        db.auctions.set(auction.id, auction);

        if (this.io) {
          this.io.emit('auction:status_changed', {
            auctionId: auction.id,
            status: 'LIVE',
            title: auction.title,
          });
        }
      }

      // 2. Transition LIVE -> ENDED / PAYMENT_PENDING
      if (auction.status === 'LIVE' && now >= endTime) {
        if (auction.winnerId && auction.currentHighestBid > 0) {
          auction.status = 'PAYMENT_PENDING';
          auction.updatedAt = new Date().toISOString();
          db.auctions.set(auction.id, auction);

          const existingOrder = Array.from(db.orders.values()).find((o) => o.auctionId === auction.id);
          if (!existingOrder) {
            const orderId = `ord-${Date.now()}-${auction.id.substring(4, 10)}`;
            const newOrder = {
              id: orderId,
              auctionId: auction.id,
              buyerId: auction.winnerId,
              totalAmount: auction.currentHighestBid,
              status: 'PENDING',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            db.orders.set(orderId, newOrder);

            const winNotif = {
              id: `notif-win-${Date.now()}`,
              userId: auction.winnerId,
              title: 'Victory! You Won the Auction! 🎉',
              message: `You won "${auction.title}" with a winning bid of $${auction.currentHighestBid.toLocaleString()}. Complete your payment to finalize shipping.`,
              type: 'WON',
              auctionId: auction.id,
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            db.notifications.set(winNotif.id, winNotif);

            if (this.io) {
              this.io.to(`user:${auction.winnerId}`).emit('notification', winNotif);
            }
          }
        } else {
          auction.status = 'ENDED';
          auction.updatedAt = new Date().toISOString();
          db.auctions.set(auction.id, auction);
        }

        if (this.io) {
          this.io.emit('auction:status_changed', {
            auctionId: auction.id,
            status: auction.status,
            winnerId: auction.winnerId,
            winnerName: auction.winnerName,
            finalBid: auction.currentHighestBid,
          });

          this.io.to(`auction:${auction.id}`).emit('auction:ended', {
            auctionId: auction.id,
            winnerId: auction.winnerId,
            winnerName: auction.winnerName,
            finalBid: auction.currentHighestBid,
            status: auction.status,
          });
        }
      }
    }
  }
}
