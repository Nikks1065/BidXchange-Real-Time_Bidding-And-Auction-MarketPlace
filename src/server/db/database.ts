import bcrypt from 'bcryptjs';

export type Role = 'BUYER' | 'SELLER' | 'ADMIN';
export type AuctionStatus = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED' | 'PAYMENT_PENDING' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  roles: Role[];
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  walletBalance: number;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  createdAt: string;
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
}

export interface Watchlist {
  id: string;
  userId: string;
  auctionId: string;
  createdAt: string;
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
  status: OrderStatus;
  shippingAddress?: string;
  createdAt: string;
  updatedAt: string;
  payment?: Payment;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  transactionRef: string;
  createdAt: string;
  updatedAt: string;
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

class TransactionalDatabase {
  public users: Map<string, User> = new Map();
  public categories: Map<string, Category> = new Map();
  public auctions: Map<string, Auction> = new Map();
  public bids: Map<string, Bid> = new Map();
  public watchlist: Map<string, Watchlist> = new Map();
  public notifications: Map<string, Notification> = new Map();
  public orders: Map<string, Order> = new Map();
  public payments: Map<string, Payment> = new Map();
  public auditLogs: AuditLog[] = [];
  public idempotencyKeys: Map<string, { bid: Bid; auction: Auction }> = new Map();

  // Concurrency control: per-auction mutex queue for strict serializable bid execution
  private auctionLocks: Map<string, Promise<void>> = new Map();

  constructor() {
    this.seedInitialData();
  }

  // Mutex lock helper to guarantee race-condition free bidding
  public async withAuctionLock<T>(auctionId: string, task: () => Promise<T>): Promise<T> {
    while (this.auctionLocks.has(auctionId)) {
      await this.auctionLocks.get(auctionId);
    }
    let resolveLock!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.auctionLocks.set(auctionId, lockPromise);

    try {
      return await task();
    } finally {
      this.auctionLocks.delete(auctionId);
      resolveLock();
    }
  }

  public seedInitialData() {
    // 1. Categories
    const categoriesList: Category[] = [
      {
        id: 'cat-1',
        name: 'Luxury Watches & Jewelry',
        slug: 'watches-jewelry',
        description: 'Authentic horology masterpieces, diamond pieces, and limited chronographs.',
        icon: 'Watch',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cat-2',
        name: 'Electronics & Gadgets',
        slug: 'electronics',
        description: 'High-end flagship technology, audio gear, and prototype computing hardware.',
        icon: 'Laptop',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cat-3',
        name: 'Supercars & Vehicles',
        slug: 'vehicles',
        description: 'Rare collector automobiles, modern track weapons, and pristine classics.',
        icon: 'Car',
        imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cat-4',
        name: 'Collectibles & Memorabilia',
        slug: 'collectibles',
        description: 'Vintage trading cards, signed sports memorabilia, and museum-grade artifacts.',
        icon: 'Sparkles',
        imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cat-5',
        name: 'Modern Art & Sculptures',
        slug: 'modern-art',
        description: 'Original canvas paintings, physical sculptures, and generative gallery works.',
        icon: 'Palette',
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cat-6',
        name: 'Gaming & Cyber Gear',
        slug: 'gaming',
        description: 'Custom liquid-cooled rigs, sealed retro consoles, and tournament gear.',
        icon: 'Gamepad2',
        imageUrl: 'https://images.unsplash.com/photo-1612287233207-6a2c2069b244?w=800&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const cat of categoriesList) {
      this.categories.set(cat.id, cat);
    }

    // 2. Demo Users (Pre-hashed password: "Password123!")
    const samplePasswordHash = bcrypt.hashSync('Password123!', 10);

    const demoUsers: User[] = [
      {
        id: 'usr-buyer-alex',
        email: 'alex@bidxchange.com',
        passwordHash: samplePasswordHash,
        name: 'Alex Mercer',
        role: 'BUYER',
        roles: ['BUYER'],
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        bio: 'Tech enthusiast & mechanical watch collector.',
        phone: '+1 555-019-2831',
        walletBalance: 25000,
        isSuspended: false,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr-seller-sarah',
        email: 'sarah@bidxchange.com',
        passwordHash: samplePasswordHash,
        name: 'Sarah Jenkins',
        role: 'SELLER',
        roles: ['BUYER', 'SELLER'],
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        bio: 'Verified Premier Merchant specializing in luxury timepieces & design artifacts.',
        phone: '+1 555-014-9922',
        walletBalance: 125000,
        isSuspended: false,
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr-seller-david',
        email: 'david@bidxchange.com',
        passwordHash: samplePasswordHash,
        name: 'David Vance',
        role: 'SELLER',
        roles: ['BUYER', 'SELLER'],
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
        bio: 'Automotive curator and high-end electronics restorer.',
        phone: '+1 555-018-7734',
        walletBalance: 88000,
        isSuspended: false,
        createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr-collector-elena',
        email: 'elena@bidxchange.com',
        passwordHash: samplePasswordHash,
        name: 'Elena Rostova',
        role: 'BUYER',
        roles: ['BUYER', 'SELLER'],
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
        bio: 'Fine art appraiser and sports card investor.',
        phone: '+1 555-011-4490',
        walletBalance: 42000,
        isSuspended: false,
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr-admin-bidx',
        email: 'admin@bidxchange.com',
        passwordHash: samplePasswordHash,
        name: 'Marcus Stone (Admin)',
        role: 'ADMIN',
        roles: ['BUYER', 'SELLER', 'ADMIN'],
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        bio: 'BidXchange Platform Operations & Integrity Lead.',
        phone: '+1 555-010-0001',
        walletBalance: 500000,
        isSuspended: false,
        createdAt: new Date(Date.now() - 100 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const u of demoUsers) {
      this.users.set(u.id, u);
    }

    // 3. 16 Realistic sample auctions covering all categories and lifecycles
    const now = Date.now();

    const sampleAuctions: Array<{
      id: string;
      title: string;
      description: string;
      startingPrice: number;
      reservePrice: number;
      minIncrement: number;
      currentHighestBid: number;
      status: AuctionStatus;
      startTime: string;
      endTime: string;
      antiSnipingEnabled: boolean;
      sellerId: string;
      categoryId: string;
      winnerId?: string;
      images: Array<{ id: string; url: string; isPrimary: boolean; caption?: string }>;
    }> = [
      {
        id: 'auc-rolex-daytona',
        title: 'Rolex Cosmograph Daytona "Panda" Ref. 116500LN',
        description: 'Unworn 2023 full set Rolex Cosmograph Daytona featuring the iconic white monobloc Cerachrom ceramic bezel, 4130 movement, Oyster bracelet, box, papers, and factory warranty cards.',
        startingPrice: 15000,
        reservePrice: 24000,
        minIncrement: 250,
        currentHighestBid: 28750,
        status: 'LIVE',
        startTime: new Date(now - 3600000 * 4).toISOString(),
        endTime: new Date(now + 1000 * 180).toISOString(), // Ends in 3 minutes! Perfect for live bidding test
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-sarah',
        categoryId: 'cat-1',
        winnerId: 'usr-collector-elena',
        images: [
          {
            id: 'img-1',
            url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Rolex Daytona front dial and tachymetric bezel',
          },
          {
            id: 'img-1b',
            url: 'https://images.unsplash.com/photo-1547996160-71dfabb1d0a5?w=1000&auto=format&fit=crop&q=80',
            isPrimary: false,
            caption: 'Case profile and pushers',
          },
        ],
      },
      {
        id: 'auc-porsche-gt3rs',
        title: '2023 Porsche 911 GT3 RS Weissach Package',
        description: 'Finished in Shark Blue with lightweight Weissach Carbon Package, magnesium centerlock wheels, Clubsport roll cage, PCCB carbon ceramic brakes. Only 820 delivery miles.',
        startingPrice: 180000,
        reservePrice: 280000,
        minIncrement: 2500,
        currentHighestBid: 315000,
        status: 'LIVE',
        startTime: new Date(now - 3600000 * 12).toISOString(),
        endTime: new Date(now + 3600000 * 8).toISOString(),
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-david',
        categoryId: 'cat-3',
        winnerId: 'usr-buyer-alex',
        images: [
          {
            id: 'img-2',
            url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Porsche GT3 RS rear wing and aerodynamics',
          },
          {
            id: 'img-2b',
            url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop&q=80',
            isPrimary: false,
            caption: 'Front angle track shot',
          },
        ],
      },
      {
        id: 'auc-charizard-1st-ed',
        title: '1999 Pokémon Base Set 1st Edition Shadowless Charizard PSA 10 Gem Mint',
        description: 'Holy Grail of trading cards. Flawless 50/50 centering, zero silvering, pristine holographic sheen. Certified and encapsulated by PSA with verifiable population under 125.',
        startingPrice: 50000,
        reservePrice: 90000,
        minIncrement: 1000,
        currentHighestBid: 142000,
        status: 'LIVE',
        startTime: new Date(now - 3600000 * 20).toISOString(),
        endTime: new Date(now + 1000 * 55).toISOString(), // Ends in 55 seconds (anti-sniping ready!)
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-sarah',
        categoryId: 'cat-4',
        winnerId: 'usr-buyer-alex',
        images: [
          {
            id: 'img-3',
            url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Card slab front view under calibrated museum light',
          },
        ],
      },
      {
        id: 'auc-macbook-m4-prototype',
        title: 'Apple Developer Titanium Development Station Prototype',
        description: 'Unreleased enterprise lab unit with dual high-bandwidth neural clusters, unpolished brushed aerospace chassis, custom debugging headers, complete with test firmware.',
        startingPrice: 4000,
        reservePrice: 6500,
        minIncrement: 100,
        currentHighestBid: 7800,
        status: 'LIVE',
        startTime: new Date(now - 3600000 * 2).toISOString(),
        endTime: new Date(now + 3600000 * 14).toISOString(),
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-david',
        categoryId: 'cat-2',
        winnerId: 'usr-collector-elena',
        images: [
          {
            id: 'img-4',
            url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Precision chassis top angle',
          },
        ],
      },
      {
        id: 'auc-monet-oil-study',
        title: 'Claude Monet Studio Impressionist Oil Study (Circa 1894)',
        description: 'Authenticated water lily study sketch on stretched linen. Provenance documented through French estate collection and verified by Paris Art Consortium.',
        startingPrice: 35000,
        reservePrice: 60000,
        minIncrement: 500,
        currentHighestBid: 58500,
        status: 'LIVE',
        startTime: new Date(now - 3600000 * 18).toISOString(),
        endTime: new Date(now + 3600000 * 36).toISOString(),
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-sarah',
        categoryId: 'cat-5',
        winnerId: 'usr-buyer-alex',
        images: [
          {
            id: 'img-5',
            url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Impressionist brush stroke texture detail',
          },
        ],
      },
      {
        id: 'auc-cyber-rig-custom',
        title: 'Overclocked Custom Dual-Loop Liquid Rig (Dual RTX 4090 OC)',
        description: 'Custom CNC-milled acrylic distro-plate, dual loop with EK Quantum fittings, AMD Ryzen 9 9950X binned chip, 128GB DDR5 6400MHz, dual Kingston PCIe Gen5 NVMe.',
        startingPrice: 5500,
        reservePrice: 8000,
        minIncrement: 150,
        currentHighestBid: 9400,
        status: 'LIVE',
        startTime: new Date(now - 3600000 * 6).toISOString(),
        endTime: new Date(now + 3600000 * 5).toISOString(),
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-david',
        categoryId: 'cat-6',
        winnerId: 'usr-collector-elena',
        images: [
          {
            id: 'img-6',
            url: 'https://images.unsplash.com/photo-1612287233207-6a2c2069b244?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Internal coolant tubing and lighting array',
          },
        ],
      },
      {
        id: 'auc-patek-nautilus',
        title: 'Patek Philippe Nautilus 5711/1A-010 Blue Dial',
        description: 'Discontinued icon of modern watch design. Complete collectors set including original purchase receipt from Geneva boutique, cert of origin, walnut display box.',
        startingPrice: 65000,
        reservePrice: 110000,
        minIncrement: 1500,
        currentHighestBid: 124000,
        status: 'SCHEDULED',
        startTime: new Date(now + 3600000 * 2).toISOString(),
        endTime: new Date(now + 3600000 * 26).toISOString(),
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-sarah',
        categoryId: 'cat-1',
        images: [
          {
            id: 'img-7',
            url: 'https://images.unsplash.com/photo-1547996160-71dfabb1d0a5?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Nautilus dial in graduated horizontal embossing',
          },
        ],
      },
      {
        id: 'auc-ferrari-f40-engine',
        title: 'Ferrari F40 Tipo F120A Twin-Turbo 2.9L V8 Crates Engine',
        description: 'Factory-sealed original zero-hour factory replacement engine. Weber-Marelli IAW fuel injection, twin IHI water-cooled turbochargers, original Maranello shipping cradle.',
        startingPrice: 120000,
        reservePrice: 200000,
        minIncrement: 2000,
        currentHighestBid: 215000,
        status: 'SCHEDULED',
        startTime: new Date(now + 3600000 * 5).toISOString(),
        endTime: new Date(now + 3600000 * 48).toISOString(),
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-david',
        categoryId: 'cat-3',
        images: [
          {
            id: 'img-8',
            url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Engine block and manifold casting mark',
          },
        ],
      },
      {
        id: 'auc-leica-m11-edition',
        title: 'Leica M11 Titan Special Edition Rangefinder #042/250',
        description: 'Solid milled titanium top and base plates. Included APO-Summicron-M 50mm f/2 ASPH Titanium edition lens, leather strap and presentation showcase.',
        startingPrice: 11000,
        reservePrice: 16000,
        minIncrement: 200,
        currentHighestBid: 18200,
        status: 'ENDED',
        startTime: new Date(now - 3600000 * 48).toISOString(),
        endTime: new Date(now - 3600000 * 2).toISOString(),
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-sarah',
        categoryId: 'cat-2',
        winnerId: 'usr-buyer-alex',
        images: [
          {
            id: 'img-9',
            url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Leica rangefinder optical viewfinder and engraved top plate',
          },
        ],
      },
      {
        id: 'auc-jordan-1985-signed',
        title: 'Michael Jordan 1985 Air Jordan 1 Chicago (Game-Issued & Signed)',
        description: 'Authentic 1985 player sample, stamped 850204TYPS. Signed by Michael Jordan on collar with Upper Deck Authenticated hologram and certificate of authenticity.',
        startingPrice: 40000,
        reservePrice: 70000,
        minIncrement: 1000,
        currentHighestBid: 86500,
        status: 'PAYMENT_PENDING',
        startTime: new Date(now - 3600000 * 72).toISOString(),
        endTime: new Date(now - 3600000 * 1).toISOString(),
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-david',
        categoryId: 'cat-4',
        winnerId: 'usr-buyer-alex',
        images: [
          {
            id: 'img-10',
            url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: '1985 Air Jordan 1 leather patina and signature',
          },
        ],
      },
      {
        id: 'auc-sennheiser-orpheus',
        title: 'Sennheiser HE 1 (Orpheus 2) Electrostatic Headphone System',
        description: 'The pinnacle of personal audio engineering. Carrara marble tube amplifier, 8 internal ESS SABRE DACs, motorized glass enclosure, zero discernible distortion.',
        startingPrice: 30000,
        reservePrice: 45000,
        minIncrement: 500,
        currentHighestBid: 54000,
        status: 'COMPLETED',
        startTime: new Date(now - 3600000 * 96).toISOString(),
        endTime: new Date(now - 3600000 * 24).toISOString(),
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-sarah',
        categoryId: 'cat-2',
        winnerId: 'usr-collector-elena',
        images: [
          {
            id: 'img-11',
            url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Acoustic drivers and precision marble housing',
          },
        ],
      },
      {
        id: 'auc-ap-royal-oak',
        title: 'Audemars Piguet Royal Oak "Jumbo" Extra-Thin 16202ST',
        description: '50th Anniversary rotor design, "Petite Tapisserie" blue dial in stainless steel, Calibre 7121 with 55 hours power reserve. Mint condition with archives extract.',
        startingPrice: 38000,
        reservePrice: 62000,
        minIncrement: 500,
        currentHighestBid: 68500,
        status: 'LIVE',
        startTime: new Date(now - 3600000 * 5).toISOString(),
        endTime: new Date(now + 3600000 * 19).toISOString(),
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-sarah',
        categoryId: 'cat-1',
        winnerId: 'usr-buyer-alex',
        images: [
          {
            id: 'img-12',
            url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Octagonal bezel with hexagonal white gold screws',
          },
        ],
      },
      {
        id: 'auc-hasselblad-907x',
        title: 'Hasselblad 907X & CFV 100C Medium Format Camera Kit',
        description: '100-megapixel back-illuminated CMOS sensor with 15 stops dynamic range, native ISO 64, XCD 38mm f/2.5 V lens included, aluminum alloy finish.',
        startingPrice: 6000,
        reservePrice: 9000,
        minIncrement: 100,
        currentHighestBid: 9600,
        status: 'LIVE',
        startTime: new Date(now - 3600000 * 8).toISOString(),
        endTime: new Date(now + 3600000 * 11).toISOString(),
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-david',
        categoryId: 'cat-2',
        winnerId: 'usr-collector-elena',
        images: [
          {
            id: 'img-13',
            url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Modular digital back and waist-level viewfinder',
          },
        ],
      },
      {
        id: 'auc-aston-martin-db5',
        title: '1964 Aston Martin DB5 Silver Birch Restoration',
        description: 'Concours d\'elegance award winner. Matching numbers 4.0L straight-six, ZF 5-speed manual, Connoly leather interior, Borrani wire wheels, British Heritage certificate.',
        startingPrice: 450000,
        reservePrice: 700000,
        minIncrement: 5000,
        currentHighestBid: 785000,
        status: 'LIVE',
        startTime: new Date(now - 3600000 * 15).toISOString(),
        endTime: new Date(now + 3600000 * 42).toISOString(),
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-david',
        categoryId: 'cat-3',
        winnerId: 'usr-buyer-alex',
        images: [
          {
            id: 'img-14',
            url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Iconic Silver Birch side profile and fender vents',
          },
        ],
      },
      {
        id: 'auc-banksy-screenprint',
        title: 'Banksy Signed "Girl with Balloon" Screenprint (Pest Control COA)',
        description: 'Original 2004 screenprint on woven paper. Signed in pencil lower right, numbered edition of 150. Complete with Pest Control Certificate of Authenticity.',
        startingPrice: 120000,
        reservePrice: 200000,
        minIncrement: 2500,
        currentHighestBid: 245000,
        status: 'LIVE',
        startTime: new Date(now - 3600000 * 3).toISOString(),
        endTime: new Date(now + 3600000 * 22).toISOString(),
        antiSnipingEnabled: true,
        sellerId: 'usr-seller-sarah',
        categoryId: 'cat-5',
        winnerId: 'usr-collector-elena',
        images: [
          {
            id: 'img-15',
            url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Screenprint detail and emboss verification mark',
          },
        ],
      },
    ];

    for (const a of sampleAuctions) {
      const seller = this.users.get(a.sellerId);
      const category = this.categories.get(a.categoryId);
      const winner = a.winnerId ? this.users.get(a.winnerId) : undefined;

      const auctionRecord: Auction = {
        ...a,
        originalEndTime: a.endTime,
        extensionCount: 0,
        maxExtensions: 10,
        viewCount: Math.floor(Math.random() * 400) + 120,
        bidCount: a.currentHighestBid > a.startingPrice ? Math.floor(Math.random() * 15) + 6 : 0,
        sellerName: seller?.name,
        sellerAvatar: seller?.avatarUrl,
        categoryName: category?.name,
        winnerName: winner?.name,
        createdAt: a.startTime,
        updatedAt: new Date().toISOString(),
      };

      this.auctions.set(auctionRecord.id, auctionRecord);

      // Create realistic bids for auctions that have bids
      if (a.currentHighestBid > a.startingPrice) {
        const step = Math.max(a.minIncrement, Math.round((a.currentHighestBid - a.startingPrice) / 5));
        let curr = a.startingPrice;
        let bidderIdx = 0;
        const bidders = ['usr-buyer-alex', 'usr-collector-elena'];

        while (curr < a.currentHighestBid) {
          curr = Math.min(a.currentHighestBid, curr + step);
          const bId = `bid-${a.id}-${curr}`;
          const bUser = this.users.get(bidders[bidderIdx % 2])!;
          this.bids.set(bId, {
            id: bId,
            auctionId: a.id,
            bidderId: bUser.id,
            bidderName: bUser.name,
            bidderAvatar: bUser.avatarUrl,
            amount: curr,
            createdAt: new Date(now - (a.currentHighestBid - curr) * 10000).toISOString(),
          });
          bidderIdx++;
        }
      }
    }

    // 4. Sample Watchlist
    this.watchlist.set('wl-1', {
      id: 'wl-1',
      userId: 'usr-buyer-alex',
      auctionId: 'auc-rolex-daytona',
      createdAt: new Date().toISOString(),
    });
    this.watchlist.set('wl-2', {
      id: 'wl-2',
      userId: 'usr-buyer-alex',
      auctionId: 'auc-porsche-gt3rs',
      createdAt: new Date().toISOString(),
    });

    // 5. Sample Notifications
    this.notifications.set('notif-1', {
      id: 'notif-1',
      userId: 'usr-buyer-alex',
      title: 'Outbid Alert',
      message: 'Someone placed a higher bid of $28,750 on Rolex Cosmograph Daytona!',
      type: 'OUTBID',
      auctionId: 'auc-rolex-daytona',
      isRead: false,
      createdAt: new Date(now - 120000).toISOString(),
    });
    this.notifications.set('notif-2', {
      id: 'notif-2',
      userId: 'usr-buyer-alex',
      title: 'Auction Won!',
      message: 'Congratulations! You won the 1985 Air Jordan 1 Chicago for $86,500. Complete checkout.',
      type: 'WON',
      auctionId: 'auc-jordan-1985-signed',
      isRead: false,
      createdAt: new Date(now - 3600000).toISOString(),
    });

    // 6. Sample Order & Payment for the won item
    this.orders.set('ord-1', {
      id: 'ord-1',
      auctionId: 'auc-jordan-1985-signed',
      buyerId: 'usr-buyer-alex',
      totalAmount: 86500,
      status: 'PENDING',
      createdAt: new Date(now - 3600000).toISOString(),
      updatedAt: new Date(now - 3600000).toISOString(),
    });

    // 7. Audit log initial entries
    this.auditLogs.push({
      id: 'log-sys-1',
      action: 'SYSTEM_BOOTSTRAP',
      entity: 'PLATFORM',
      actorEmail: 'admin@bidxchange.com',
      metadata: { auctionsLoaded: this.auctions.size, usersSeeded: this.users.size },
      createdAt: new Date().toISOString(),
    });
  }

  // Helper query methods
  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): User | undefined {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return u;
      }
    }
    return undefined;
  }

  public getAuctionById(id: string): Auction | undefined {
    return this.auctions.get(id);
  }

  public getAuctionBids(auctionId: string): Bid[] {
    const list: Bid[] = [];
    for (const b of this.bids.values()) {
      if (b.auctionId === auctionId) {
        list.push(b);
      }
    }
    return list.sort((a, b) => b.amount - a.amount);
  }

  public getWatchlistForUser(userId: string): Auction[] {
    const list: Auction[] = [];
    for (const item of this.watchlist.values()) {
      if (item.userId === userId) {
        const auc = this.auctions.get(item.auctionId);
        if (auc) list.push(auc);
      }
    }
    return list;
  }

  public isWatchlisted(userId: string, auctionId: string): boolean {
    for (const item of this.watchlist.values()) {
      if (item.userId === userId && item.auctionId === auctionId) {
        return true;
      }
    }
    return false;
  }

  public toggleWatchlist(userId: string, auctionId: string): boolean {
    for (const [key, item] of this.watchlist.entries()) {
      if (item.userId === userId && item.auctionId === auctionId) {
        this.watchlist.delete(key);
        return false;
      }
    }
    const id = `wl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.watchlist.set(id, {
      id,
      userId,
      auctionId,
      createdAt: new Date().toISOString(),
    });
    return true;
  }
}

export const db = new TransactionalDatabase();
