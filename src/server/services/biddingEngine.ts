import { db, Bid, Auction, Notification } from '../db/database.ts';
import type { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

export interface PlaceBidInput {
  auctionId: string;
  bidderId: string;
  amount: number;
  idempotencyKey?: string;
}

export interface BidResult {
  success: boolean;
  bid: Bid;
  auction: Auction;
  timeExtended: boolean;
  newEndTime?: string;
  previousBidderId?: string;
  message: string;
}

export class BiddingEngine {
  /**
   * Concurrency-safe, transactional bid submission.
   * Guarantees atomic serial execution per auction via mutex lock.
   */
  public static async placeBid(input: PlaceBidInput): Promise<BidResult> {
    const { auctionId, bidderId, amount, idempotencyKey } = input;

    // Idempotency check: Return prior successful bid if key matches
    if (idempotencyKey && db.idempotencyKeys.has(idempotencyKey)) {
      const cached = db.idempotencyKeys.get(idempotencyKey)!;
      return {
        success: true,
        bid: cached.bid,
        auction: cached.auction,
        timeExtended: false,
        message: 'Bid confirmed (idempotent)',
      };
    }

    // Execute within serialized auction lock to eliminate race conditions
    return await db.withAuctionLock(auctionId, async () => {
      // 1. Double check idempotency under lock
      if (idempotencyKey && db.idempotencyKeys.has(idempotencyKey)) {
        const cached = db.idempotencyKeys.get(idempotencyKey)!;
        return {
          success: true,
          bid: cached.bid,
          auction: cached.auction,
          timeExtended: false,
          message: 'Bid confirmed (idempotent)',
        };
      }

      // 2. Fetch fresh auction state
      const auction = db.getAuctionById(auctionId);
      if (!auction) {
        throw new Error('Auction not found');
      }

      // 3. Verify auction status
      const now = Date.now();
      const endTimeMs = new Date(auction.endTime).getTime();
      const startTimeMs = new Date(auction.startTime).getTime();

      if (auction.status === 'SCHEDULED' && now < startTimeMs) {
        throw new Error('Auction has not started yet');
      }

      if (auction.status === 'ENDED' || auction.status === 'COMPLETED' || auction.status === 'CANCELLED') {
        throw new Error('This auction has concluded and is no longer accepting bids');
      }

      if (now >= endTimeMs) {
        // Mark as ended if time passed
        auction.status = 'ENDED';
        auction.updatedAt = new Date().toISOString();
        db.auctions.set(auction.id, auction);
        throw new Error('Auction time has expired');
      }

      // 4. Verify bidder eligibility
      const bidder = db.getUserById(bidderId);
      if (!bidder) {
        throw new Error('Bidder account not found');
      }

      if (bidder.isSuspended) {
        throw new Error('Your account is currently suspended from placing bids');
      }

      if (auction.sellerId === bidderId) {
        throw new Error('Sellers are not permitted to bid on their own auctions');
      }

      if (auction.winnerId === bidderId && auction.bidCount > 0) {
        throw new Error('You are already the highest bidder for this auction');
      }

      // 5. Verify bid amount and minimum increment
      const minRequired =
        auction.bidCount === 0
          ? auction.startingPrice
          : auction.currentHighestBid + auction.minIncrement;

      if (amount < minRequired) {
        throw new Error(
          `Bid amount $${amount.toLocaleString()} is below the minimum required bid of $${minRequired.toLocaleString()}`
        );
      }

      // 6. Anti-Sniping Rule: If bid arrives in final 30s, extend by 30s
      let timeExtended = false;
      const remainingSeconds = Math.floor((endTimeMs - now) / 1000);

      if (auction.antiSnipingEnabled && remainingSeconds <= 30) {
        if (auction.extensionCount < auction.maxExtensions) {
          const extensionMs = 30 * 1000;
          const extendedTime = new Date(endTimeMs + extensionMs).toISOString();
          auction.endTime = extendedTime;
          auction.extensionCount += 1;
          timeExtended = true;
        }
      }

      const previousWinnerId = auction.winnerId;

      // 7. Atomic state updates
      auction.currentHighestBid = amount;
      auction.winnerId = bidder.id;
      auction.winnerName = bidder.name;
      auction.bidCount += 1;
      auction.updatedAt = new Date().toISOString();
      db.auctions.set(auction.id, auction);

      // 8. Create Bid record
      const bidId = `bid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newBid: Bid = {
        id: bidId,
        auctionId: auction.id,
        bidderId: bidder.id,
        bidderName: bidder.name,
        bidderAvatar: bidder.avatarUrl,
        amount,
        idempotencyKey,
        createdAt: new Date().toISOString(),
      };
      db.bids.set(bidId, newBid);

      // Cache idempotency
      if (idempotencyKey) {
        db.idempotencyKeys.set(idempotencyKey, { bid: newBid, auction });
      }

      // 9. Notify previous highest bidder if outbid
      if (previousWinnerId && previousWinnerId !== bidder.id) {
        const outbidNotif: Notification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: previousWinnerId,
          title: 'You Have Been Outbid!',
          message: `A new bid of $${amount.toLocaleString()} was placed on "${auction.title}". Jump back in to reclaim the lead!`,
          type: 'OUTBID',
          auctionId: auction.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        db.notifications.set(outbidNotif.id, outbidNotif);

        // Notify over socket if connected
        if (ioInstance) {
          ioInstance.to(`user:${previousWinnerId}`).emit('notification', outbidNotif);
        }
      }

      // Notify seller of new bid
      const sellerNotif: Notification = {
        id: `notif-${Date.now()}-seller`,
        userId: auction.sellerId,
        title: 'New Bid Received!',
        message: `${bidder.name} placed a bid of $${amount.toLocaleString()} on "${auction.title}".`,
        type: 'SELLER_BID_RECEIVED',
        auctionId: auction.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      db.notifications.set(sellerNotif.id, sellerNotif);
      if (ioInstance) {
        ioInstance.to(`user:${auction.sellerId}`).emit('notification', sellerNotif);
      }

      // 10. Audit log
      db.auditLogs.push({
        id: `log-${Date.now()}`,
        action: 'BID_PLACED',
        entity: 'AUCTION',
        entityId: auction.id,
        actorId: bidder.id,
        actorEmail: bidder.email,
        metadata: {
          amount,
          timeExtended,
          newEndTime: auction.endTime,
          extensionCount: auction.extensionCount,
        },
        createdAt: new Date().toISOString(),
      });

      // 11. Broadcast to real-time room
      if (ioInstance) {
        const payload = {
          auctionId: auction.id,
          bid: newBid,
          currentHighestBid: auction.currentHighestBid,
          bidCount: auction.bidCount,
          winnerId: auction.winnerId,
          winnerName: auction.winnerName,
          timeExtended,
          endTime: auction.endTime,
          extensionCount: auction.extensionCount,
        };

        ioInstance.to(`auction:${auction.id}`).emit('bid:placed', payload);

        if (timeExtended) {
          ioInstance.to(`auction:${auction.id}`).emit('auction:extended', {
            auctionId: auction.id,
            newEndTime: auction.endTime,
            extensionCount: auction.extensionCount,
            reason: 'Anti-sniping extension (+30s added)',
          });
        }
      }

      return {
        success: true,
        bid: newBid,
        auction,
        timeExtended,
        newEndTime: timeExtended ? auction.endTime : undefined,
        previousBidderId: previousWinnerId,
        message: timeExtended
          ? `Bid of $${amount.toLocaleString()} placed! Anti-sniping triggered: auction extended by 30 seconds!`
          : `Bid of $${amount.toLocaleString()} placed successfully!`,
      };
    });
  }
}
