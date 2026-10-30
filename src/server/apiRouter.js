import { Router } from 'express';
import { db } from './db/database.js';
import { AuthService } from './services/authService.js';
import { BiddingEngine } from './services/biddingEngine.js';

export const apiRouter = Router();

// Authentication middleware
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = AuthService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }

  const user = db.getUserById(payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ error: 'Account suspended. Access revoked.' });
  }

  req.user = payload;
  next();
}

// Admin authorization middleware
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
  }
  next();
}

// Optional Auth
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = AuthService.verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

// 1. AUTHENTICATION ROUTES
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const result = await AuthService.register({ email, password, name, role });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login({ email, password });
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message || 'Authentication failed' });
  }
});

apiRouter.get('/auth/me', requireAuth, (req, res) => {
  const user = db.getUserById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

apiRouter.post('/auth/toggle-role', requireAuth, (req, res) => {
  try {
    const updatedUser = AuthService.toggleSellerRole(req.user.userId);
    res.json({ user: updatedUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. CATEGORIES ROUTE
apiRouter.get('/categories', (_req, res) => {
  const categories = Array.from(db.categories.values());
  res.json({ categories });
});

// 3. AUCTIONS ROUTES
apiRouter.get('/auctions', optionalAuth, (req, res) => {
  const {
    category,
    status,
    search,
    sort = 'endingSoon',
    minPrice,
    maxPrice,
  } = req.query;

  let list = Array.from(db.auctions.values());

  if (category && category !== 'all') {
    list = list.filter((a) => a.categoryId === category || a.categoryName?.toLowerCase() === category.toLowerCase());
  }

  if (status && status !== 'all') {
    list = list.filter((a) => a.status === status.toUpperCase());
  }

  if (search && search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(
      (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }

  if (minPrice && !isNaN(Number(minPrice))) {
    list = list.filter((a) => a.currentHighestBid >= Number(minPrice));
  }
  if (maxPrice && !isNaN(Number(maxPrice))) {
    list = list.filter((a) => a.currentHighestBid <= Number(maxPrice));
  }

  if (sort === 'endingSoon') {
    list.sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());
  } else if (sort === 'newest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sort === 'highestBid') {
    list.sort((a, b) => b.currentHighestBid - a.currentHighestBid);
  } else if (sort === 'popular') {
    list.sort((a, b) => b.bidCount - a.bidCount);
  }

  const currentUserId = req.user?.userId;
  const enriched = list.map((a) => ({
    ...a,
    isWatchlisted: currentUserId ? db.isWatchlisted(currentUserId, a.id) : false,
    userIsWinning: currentUserId ? a.winnerId === currentUserId : false,
  }));

  res.json({ auctions: enriched, total: enriched.length });
});

apiRouter.get('/auctions/:id', optionalAuth, (req, res) => {
  const auction = db.getAuctionById(req.params.id);
  if (!auction) {
    return res.status(404).json({ error: 'Auction not found' });
  }

  auction.viewCount += 1;
  db.auctions.set(auction.id, auction);

  const bids = db.getAuctionBids(auction.id);
  const seller = db.getUserById(auction.sellerId);
  const currentUserId = req.user?.userId;

  const enriched = {
    ...auction,
    bids,
    seller: seller
      ? {
          id: seller.id,
          name: seller.name,
          avatarUrl: seller.avatarUrl,
          bio: seller.bio,
        }
      : null,
    isWatchlisted: currentUserId ? db.isWatchlisted(currentUserId, auction.id) : false,
    userIsWinning: currentUserId ? auction.winnerId === currentUserId : false,
    minNextBid:
      auction.bidCount === 0
        ? auction.startingPrice
        : auction.currentHighestBid + auction.minIncrement,
  };

  res.json({ auction: enriched });
});

apiRouter.post('/auctions', requireAuth, (req, res) => {
  const user = db.getUserById(req.user.userId);
  if (!user) return res.status(401).json({ error: 'User not found' });

  const {
    title,
    description,
    categoryId,
    startingPrice,
    reservePrice,
    minIncrement,
    durationHours = 24,
    images = [],
    antiSnipingEnabled = true,
  } = req.body;

  if (!title || !description || !categoryId || !startingPrice) {
    return res.status(400).json({ error: 'Title, description, category, and starting price are required.' });
  }

  const cat = db.categories.get(categoryId);
  if (!cat) {
    return res.status(400).json({ error: 'Invalid category selected.' });
  }

  const now = new Date();
  const startTime = now.toISOString();
  const endTime = new Date(now.getTime() + Number(durationHours) * 3600000).toISOString();

  const auctionId = `auc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const parsedImages = images.length > 0
    ? images.map((img, i) => ({
        id: `img-${auctionId}-${i}`,
        auctionId,
        url: typeof img === 'string' ? img : img.url,
        isPrimary: i === 0,
        caption: typeof img === 'string' ? title : img.caption || title,
      }))
    : [
        {
          id: `img-${auctionId}-0`,
          auctionId,
          url: cat.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=80',
          isPrimary: true,
          caption: title,
        },
      ];

  const newAuction = {
    id: auctionId,
    title: title.trim(),
    description: description.trim(),
    startingPrice: Number(startingPrice),
    reservePrice: reservePrice ? Number(reservePrice) : undefined,
    minIncrement: minIncrement ? Number(minIncrement) : Math.max(5, Math.round(Number(startingPrice) * 0.02)),
    currentHighestBid: Number(startingPrice),
    status: 'LIVE',
    startTime,
    endTime,
    originalEndTime: endTime,
    antiSnipingEnabled: Boolean(antiSnipingEnabled),
    extensionCount: 0,
    maxExtensions: 10,
    viewCount: 1,
    bidCount: 0,
    sellerId: user.id,
    sellerName: user.name,
    sellerAvatar: user.avatarUrl,
    categoryId: cat.id,
    categoryName: cat.name,
    createdAt: startTime,
    updatedAt: startTime,
    images: parsedImages,
  };

  db.auctions.set(auctionId, newAuction);

  db.auditLogs.push({
    id: `log-${Date.now()}`,
    action: 'AUCTION_CREATED',
    entity: 'AUCTION',
    entityId: auctionId,
    actorId: user.id,
    actorEmail: user.email,
    metadata: { title, startingPrice, durationHours },
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ auction: newAuction });
});

apiRouter.post('/auctions/:id/cancel', requireAuth, (req, res) => {
  const auction = db.getAuctionById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });

  if (auction.sellerId !== req.user.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'You are not authorized to cancel this auction' });
  }

  if (auction.bidCount > 0 && req.user.role !== 'ADMIN') {
    return res.status(400).json({
      error: 'Cannot cancel auction after bids have already been submitted by buyers.',
    });
  }

  auction.status = 'CANCELLED';
  auction.updatedAt = new Date().toISOString();
  db.auctions.set(auction.id, auction);

  res.json({ success: true, auction });
});

// 4. BIDDING ROUTE
apiRouter.post('/auctions/:id/bids', requireAuth, async (req, res) => {
  try {
    const auctionId = req.params.id;
    const bidderId = req.user.userId;
    const { amount, idempotencyKey } = req.body;

    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Valid numerical bid amount is required' });
    }

    const result = await BiddingEngine.placeBid({
      auctionId,
      bidderId,
      amount: Number(amount),
      idempotencyKey,
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to place bid' });
  }
});

// 5. WATCHLIST & NOTIFICATIONS
apiRouter.get('/watchlist', requireAuth, (req, res) => {
  const auctions = db.getWatchlistForUser(req.user.userId);
  res.json({ watchlist: auctions });
});

apiRouter.post('/watchlist/toggle', requireAuth, (req, res) => {
  const { auctionId } = req.body;
  if (!auctionId) return res.status(400).json({ error: 'auctionId is required' });

  const isWatchlisted = db.toggleWatchlist(req.user.userId, auctionId);
  res.json({ isWatchlisted });
});

apiRouter.get('/notifications', requireAuth, (req, res) => {
  const list = Array.from(db.notifications.values())
    .filter((n) => n.userId === req.user.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ notifications: list });
});

apiRouter.post('/notifications/mark-read', requireAuth, (req, res) => {
  const { id } = req.body;
  if (id) {
    const notif = db.notifications.get(id);
    if (notif && notif.userId === req.user.userId) {
      notif.isRead = true;
      db.notifications.set(id, notif);
    }
  } else {
    for (const notif of db.notifications.values()) {
      if (notif.userId === req.user.userId) {
        notif.isRead = true;
      }
    }
  }
  res.json({ success: true });
});

// 6. BUYER DASHBOARD & MOCK CHECKOUT
apiRouter.get('/buyer/dashboard', requireAuth, (req, res) => {
  const userId = req.user.userId;
  const userBids = Array.from(db.bids.values()).filter((b) => b.bidderId === userId);

  const bidAuctionIds = new Set(userBids.map((b) => b.auctionId));
  const activeBids = [];
  const wonAuctions = [];
  const lostAuctions = [];

  for (const id of bidAuctionIds) {
    const auc = db.getAuctionById(id);
    if (!auc) continue;

    const myBids = userBids.filter((b) => b.auctionId === id).sort((a, b) => b.amount - a.amount);
    const myHighestBid = myBids[0]?.amount || 0;
    const isWinning = auc.winnerId === userId;

    const item = {
      ...auc,
      myHighestBid,
      isWinning,
      totalMyBids: myBids.length,
    };

    if (auc.status === 'LIVE' || auc.status === 'SCHEDULED') {
      activeBids.push(item);
    } else if (auc.status === 'ENDED' || auc.status === 'PAYMENT_PENDING' || auc.status === 'COMPLETED') {
      if (auc.winnerId === userId) {
        const order = Array.from(db.orders.values()).find((o) => o.auctionId === auc.id);
        wonAuctions.push({ ...item, order });
      } else {
        lostAuctions.push(item);
      }
    }
  }

  const watchlist = db.getWatchlistForUser(userId);

  res.json({
    activeBids,
    wonAuctions,
    lostAuctions,
    watchlist,
  });
});

apiRouter.post('/buyer/checkout', requireAuth, (req, res) => {
  const { auctionId, shippingAddress, paymentMethod = 'ESCROW_SIMULATED' } = req.body;
  const userId = req.user.userId;

  const auction = db.getAuctionById(auctionId);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });

  if (auction.winnerId !== userId) {
    return res.status(403).json({ error: 'Only the winning bidder can complete payment for this auction' });
  }

  let order = Array.from(db.orders.values()).find((o) => o.auctionId === auction.id);
  if (!order) {
    order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      auctionId: auction.id,
      buyerId: userId,
      totalAmount: auction.currentHighestBid,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.orders.set(order.id, order);
  }

  const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const transactionRef = `TXN-BX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const payment = {
    id: paymentId,
    orderId: order.id,
    amount: order.totalAmount,
    currency: 'USD',
    status: 'SUCCESS',
    paymentMethod,
    transactionRef,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.payments.set(paymentId, payment);

  order.status = 'PAID';
  order.shippingAddress = shippingAddress || '100 Market St, San Francisco, CA 94105';
  order.payment = payment;
  order.updatedAt = new Date().toISOString();
  db.orders.set(order.id, order);

  auction.status = 'COMPLETED';
  auction.updatedAt = new Date().toISOString();
  db.auctions.set(auction.id, auction);

  res.json({
    success: true,
    order,
    payment,
    message: 'Mock payment verified successfully! Funds held safely in BidXchange Escrow.',
  });
});

// 7. SELLER DASHBOARD
apiRouter.get('/seller/dashboard', requireAuth, (req, res) => {
  const userId = req.user.userId;
  const sellerAuctions = Array.from(db.auctions.values()).filter((a) => a.sellerId === userId);

  const active = sellerAuctions.filter((a) => a.status === 'LIVE' || a.status === 'SCHEDULED');
  const completed = sellerAuctions.filter((a) => a.status === 'COMPLETED');
  const pendingPayment = sellerAuctions.filter((a) => a.status === 'PAYMENT_PENDING');
  const cancelled = sellerAuctions.filter((a) => a.status === 'CANCELLED');

  const totalGrossRevenue = completed.reduce((acc, a) => acc + a.currentHighestBid, 0);
  const totalBidsReceived = sellerAuctions.reduce((acc, a) => acc + a.bidCount, 0);
  const totalViews = sellerAuctions.reduce((acc, a) => acc + a.viewCount, 0);

  res.json({
    stats: {
      totalAuctions: sellerAuctions.length,
      activeCount: active.length,
      completedCount: completed.length,
      pendingPaymentCount: pendingPayment.length,
      cancelledCount: cancelled.length,
      totalGrossRevenue,
      totalBidsReceived,
      totalViews,
    },
    auctions: {
      active,
      completed,
      pendingPayment,
      cancelled,
    },
  });
});

// 8. ADMIN DASHBOARD
apiRouter.get('/admin/metrics', requireAuth, requireAdmin, (_req, res) => {
  const allAuctions = Array.from(db.auctions.values());
  const allUsers = Array.from(db.users.values());
  const allBids = Array.from(db.bids.values());

  const liveAuctions = allAuctions.filter((a) => a.status === 'LIVE').length;
  const totalGrossValue = allAuctions
    .filter((a) => a.status === 'COMPLETED' || a.status === 'PAYMENT_PENDING')
    .reduce((acc, a) => acc + a.currentHighestBid, 0);

  res.json({
    totalUsers: allUsers.length,
    activeAuctions: liveAuctions,
    totalAuctions: allAuctions.length,
    totalBidsPlaced: allBids.length,
    grossMerchandiseVolume: totalGrossValue,
    suspendedUsers: allUsers.filter((u) => u.isSuspended).length,
  });
});

apiRouter.get('/admin/users', requireAuth, requireAdmin, (_req, res) => {
  const users = Array.from(db.users.values()).map(({ passwordHash: _, ...u }) => u);
  res.json({ users });
});

apiRouter.post('/admin/users/:id/toggle-suspend', requireAuth, requireAdmin, (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.role === 'ADMIN') {
    return res.status(400).json({ error: 'Super administrators cannot be suspended' });
  }

  user.isSuspended = !user.isSuspended;
  user.updatedAt = new Date().toISOString();
  db.users.set(user.id, user);

  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

apiRouter.get('/admin/audit-logs', requireAuth, requireAdmin, (_req, res) => {
  const logs = [...db.auditLogs].reverse().slice(0, 100);
  res.json({ logs });
});
