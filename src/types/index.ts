export type Role = 'BUYER' | 'SELLER' | 'ADMIN';

export type AuctionStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'LIVE'
  | 'ENDED'
  | 'PAYMENT_PENDING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  roles: Role[];
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  walletBalance: number;
  isSuspended: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
}

export interface AuctionImage {
  id: string;
  auctionId: string;
  url: string;
  isPrimary: boolean;
  caption?: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName?: string;
  bidderAvatar?: string;
  amount: number;
  idempotencyKey?: string;
  createdAt: string;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  reservePrice?: number;
  minIncrement: number;
  currentHighestBid: number;
  status: AuctionStatus;
  startTime: string;
  endTime: string;
  originalEndTime: string;
  antiSnipingEnabled: boolean;
  extensionCount: number;
  maxExtensions: number;
  viewCount: number;
  bidCount: number;
  sellerId: string;
  sellerName?: string;
  sellerAvatar?: string;
  categoryId: string;
  categoryName?: string;
  winnerId?: string;
  winnerName?: string;
  createdAt: string;
  updatedAt: string;
  images: AuctionImage[];
  isWatchlisted?: boolean;
  userIsWinning?: boolean;
  bids?: Bid[];
  seller?: {
    id: string;
    name: string;
    avatarUrl?: string;
    bio?: string;
  };
  minNextBid?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'OUTBID' | 'WON' | 'AUCTION_STARTING' | 'PAYMENT_CONFIRMED' | 'SELLER_BID_RECEIVED' | 'SYSTEM';
  auctionId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  auctionId: string;
  buyerId: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress?: string;
  createdAt: string;
  updatedAt: string;
  payment?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    transactionRef: string;
    paymentMethod: string;
    createdAt: string;
  };
}

export interface AuditLog {
  id: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  metadata?: any;
  createdAt: string;
}
