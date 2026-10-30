import test from 'node:test';
import assert from 'node:assert/strict';
import { BiddingEngine } from '../server/services/biddingEngine.ts';
import { db, Auction } from '../server/db/database.ts';

function createMockAuction(overrides: Partial<Auction> = {}): Auction {
  const id = `test-auc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = Date.now();
  const auction: Auction = {
    id,
    title: 'Test Collector Chronograph',
    description: 'Pristine test item',
    startingPrice: 1000,
    minIncrement: 50,
    currentHighestBid: 1000,
    status: 'LIVE',
    startTime: new Date(now - 10000).toISOString(),
    endTime: new Date(now + 600000).toISOString(), // 10 minutes in future
    originalEndTime: new Date(now + 600000).toISOString(),
    antiSnipingEnabled: true,
    extensionCount: 0,
    maxExtensions: 5,
    viewCount: 1,
    bidCount: 0,
    sellerId: 'usr-seller-sarah',
    categoryId: 'cat-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    images: [],
    ...overrides,
  };
  db.auctions.set(id, auction);
  return auction;
}

test('BiddingEngine: should accept valid bid meeting minimum increment', async () => {
  const auction = createMockAuction({ currentHighestBid: 1000, minIncrement: 50, bidCount: 1 });
  const bidder = db.getUserById('usr-buyer-alex')!;

  const result = await BiddingEngine.placeBid({
    auctionId: auction.id,
    bidderId: bidder.id,
    amount: 1050,
  });

  assert.equal(result.success, true);
  assert.equal(result.bid.amount, 1050);
  assert.equal(result.auction.currentHighestBid, 1050);
  assert.equal(result.auction.winnerId, bidder.id);
  assert.equal(result.auction.bidCount, 2);
});

test('BiddingEngine: should reject bid below minimum increment', async () => {
  const auction = createMockAuction({ currentHighestBid: 2000, minIncrement: 100, bidCount: 1 });
  const bidder = db.getUserById('usr-collector-elena')!;

  await assert.rejects(
    async () => {
      await BiddingEngine.placeBid({
        auctionId: auction.id,
        bidderId: bidder.id,
        amount: 2050, // needs at least 2100
      });
    },
    { message: /below the minimum required bid/ }
  );
});

test('BiddingEngine: should reject seller bidding on their own auction', async () => {
  const auction = createMockAuction({ sellerId: 'usr-seller-sarah' });

  await assert.rejects(
    async () => {
      await BiddingEngine.placeBid({
        auctionId: auction.id,
        bidderId: 'usr-seller-sarah',
        amount: 1200,
      });
    },
    { message: /Sellers are not permitted to bid on their own auctions/ }
  );
});

test('BiddingEngine: anti-sniping should extend auction when bid arrives in final 30 seconds', async () => {
  const now = Date.now();
  // 15 seconds remaining
  const auction = createMockAuction({
    endTime: new Date(now + 15000).toISOString(),
    originalEndTime: new Date(now + 15000).toISOString(),
    antiSnipingEnabled: true,
    extensionCount: 0,
    currentHighestBid: 1000,
    minIncrement: 50,
  });

  const result = await BiddingEngine.placeBid({
    auctionId: auction.id,
    bidderId: 'usr-buyer-alex',
    amount: 1100,
  });

  assert.equal(result.timeExtended, true);
  assert.equal(result.auction.extensionCount, 1);
  const newEnd = new Date(result.auction.endTime).getTime();
  const oldEnd = new Date(auction.originalEndTime).getTime();
  assert.ok(newEnd - oldEnd >= 30000, 'End time should be extended by 30 seconds');
});

test('BiddingEngine: idempotency key prevents duplicate bids', async () => {
  const auction = createMockAuction({ startingPrice: 500, currentHighestBid: 500, minIncrement: 50 });
  const key = `idem-key-${Date.now()}`;

  const res1 = await BiddingEngine.placeBid({
    auctionId: auction.id,
    bidderId: 'usr-buyer-alex',
    amount: 600,
    idempotencyKey: key,
  });

  const res2 = await BiddingEngine.placeBid({
    auctionId: auction.id,
    bidderId: 'usr-buyer-alex',
    amount: 600,
    idempotencyKey: key,
  });

  assert.equal(res1.bid.id, res2.bid.id);
  assert.equal(res2.message, 'Bid confirmed (idempotent)');
  assert.equal(db.getAuctionById(auction.id)?.bidCount, 1);
});

test('BiddingEngine: handles simultaneous concurrent bids safely without race conditions', async () => {
  const auction = createMockAuction({ currentHighestBid: 1000, minIncrement: 50, bidCount: 1 });
  const bidder1 = 'usr-buyer-alex';
  const bidder2 = 'usr-collector-elena';

  // Two simultaneous bids for different amounts submitted in parallel
  const promise1 = BiddingEngine.placeBid({ auctionId: auction.id, bidderId: bidder1, amount: 1100 });
  const promise2 = BiddingEngine.placeBid({ auctionId: auction.id, bidderId: bidder2, amount: 1200 });

  const results = await Promise.allSettled([promise1, promise2]);
  const succeeded = results.filter((r) => r.status === 'fulfilled');

  assert.ok(succeeded.length >= 1, 'At least one bid succeeded');
  const finalAuction = db.getAuctionById(auction.id)!;
  assert.ok(finalAuction.currentHighestBid >= 1100);
});
