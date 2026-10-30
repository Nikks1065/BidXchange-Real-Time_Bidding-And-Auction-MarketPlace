import test from 'node:test';
import assert from 'node:assert/strict';
import { LifecycleWorker } from '../server/services/lifecycleWorker.ts';
import { db, Auction } from '../server/db/database.ts';

test('LifecycleWorker: should transition SCHEDULED auction to LIVE when start time arrives', () => {
  const id = `auc-sched-${Date.now()}`;
  const now = Date.now();
  const auction: Auction = {
    id,
    title: 'Scheduled Test Piece',
    description: 'Testing lifecycle',
    startingPrice: 500,
    minIncrement: 25,
    currentHighestBid: 500,
    status: 'SCHEDULED',
    startTime: new Date(now - 1000).toISOString(), // start time passed!
    endTime: new Date(now + 60000).toISOString(),
    originalEndTime: new Date(now + 60000).toISOString(),
    antiSnipingEnabled: true,
    extensionCount: 0,
    maxExtensions: 5,
    viewCount: 0,
    bidCount: 0,
    sellerId: 'usr-seller-sarah',
    categoryId: 'cat-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    images: [],
  };
  db.auctions.set(id, auction);

  LifecycleWorker.checkAndTransitionAuctions();

  const updated = db.getAuctionById(id)!;
  assert.equal(updated.status, 'LIVE');
});

test('LifecycleWorker: should transition expired auction to PAYMENT_PENDING if winner exists', () => {
  const id = `auc-ended-${Date.now()}`;
  const now = Date.now();
  const auction: Auction = {
    id,
    title: 'Ending Test Piece',
    description: 'Testing winner assignment',
    startingPrice: 500,
    minIncrement: 25,
    currentHighestBid: 1200,
    status: 'LIVE',
    startTime: new Date(now - 100000).toISOString(),
    endTime: new Date(now - 1000).toISOString(), // time has expired!
    originalEndTime: new Date(now - 1000).toISOString(),
    antiSnipingEnabled: true,
    extensionCount: 0,
    maxExtensions: 5,
    viewCount: 10,
    bidCount: 4,
    winnerId: 'usr-buyer-alex',
    winnerName: 'Alex Mercer',
    sellerId: 'usr-seller-sarah',
    categoryId: 'cat-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    images: [],
  };
  db.auctions.set(id, auction);

  LifecycleWorker.checkAndTransitionAuctions();

  const updated = db.getAuctionById(id)!;
  assert.equal(updated.status, 'PAYMENT_PENDING');

  // Verify Order was created
  const order = Array.from(db.orders.values()).find((o) => o.auctionId === id);
  assert.ok(order);
  assert.equal(order?.buyerId, 'usr-buyer-alex');
  assert.equal(order?.totalAmount, 1200);
});
