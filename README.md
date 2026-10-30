# BidXchange
> **Bid Live. Compete Smart. Win Fair.**

BidXchange is a production-grade, commercial-quality **Real-Time Bidding & Auction Marketplace** designed for high-velocity live auctions with sub-second WebSocket synchronization, ACID concurrency locks, automated anti-sniping protection, and complete buyer/seller/admin control centers.

---

## 1. Project Overview & Architecture

BidXchange provides a transparent, fair, and high-velocity marketplace:
- **Server-Authoritative Bidding**: Bids are validated, processed, and broadcast entirely on the server. Client countdowns or bids are never trusted without backend verification.
- **Concurrency-Safe Mutex Engine**: Eliminates race conditions and lost updates when multiple bidders submit bids at the exact same millisecond.
- **Anti-Sniping Protocol**: Automatically adds +30 seconds to the clock if a valid bid arrives in the final 30 seconds of an auction.
- **Idempotency Protection**: Guarantees that network retries with an `idempotencyKey` cannot create duplicate bids.
- **Simulated Escrow Settlement**: When an auction concludes, the winner can complete an escrow payment flow that locks simulated funds and notifies the merchant.

### Architecture Diagram
```
  [ Browser Client (React + Socket.IO) ]
                 │
                 ├── HTTP REST (/api/*)
                 └── WebSockets (Socket.IO Rooms: auction:<id>, user:<id>)
                 │
        [ Express Server (Node.js) ]
                 │
  ┌──────────────┼───────────────────────────┐
  │              │                           │
[Auth Service] [Bidding Engine]   [Lifecycle Worker]
(JWT + bcrypt) (ACID Mutex Lock)   (SCHEDULED->LIVE->ENDED)
                 │
        [ Transactional Store / PostgreSQL (Prisma) ]
```

---

## 2. Technology Stack

- **Frontend**: React 19, JavaScript (ES6+), Tailwind CSS, Framer Motion, Socket.IO Client, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js 22, Express.js, Socket.IO, JWT (`jsonwebtoken`), `bcryptjs`.
- **Database & Schema**: PostgreSQL, Prisma ORM (`prisma/schema.prisma`), Docker Compose.
- **Testing**: Built-in Node test runner (`node:test`) and strict assertions (`node:assert/strict`).

---

## 3. Folder Structure

```
├── docker-compose.yml       # Docker Compose for PostgreSQL 16 & Redis 7
├── Dockerfile               # Multi-stage production container build
├── index.html               # Main HTML entry with typography & meta tags
├── metadata.json            # AI Studio app metadata
├── package.json             # NPM dependencies & scripts
├── prisma/
│   └── schema.prisma        # Normalized PostgreSQL Prisma models
├── server.ts                # Express server + Vite middleware + Socket.IO
├── src/
│   ├── components/          # Reusable UI widgets
│   │   ├── AuctionCard.tsx
│   │   ├── BidModal.tsx
│   │   ├── CheckoutModal.tsx
│   │   ├── CountdownTimer.tsx
│   │   ├── DemoSwitcherModal.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   └── NotificationBell.tsx
│   ├── context/
│   │   ├── AuthContext.tsx  # Authentication and persona switcher
│   │   └── SocketContext.tsx# Real-time WebSocket connection
│   ├── pages/
│   │   ├── AdminPage.tsx    # Governance & audit logs
│   │   ├── AuthModal.tsx    # Sign In & Registration modal
│   │   ├── BuyerDashboardPage.tsx # My Bidding & Won lots
│   │   ├── ExplorePage.tsx  # Marketplace catalog & filters
│   │   ├── HomePage.tsx     # Landing page & featured spotlight
│   │   ├── LiveAuctionPage.tsx # Core Live Auction Room
│   │   └── SellerStudioPage.tsx # Merchant lot manager & creation
│   ├── server/
│   │   ├── apiRouter.ts     # Express REST APIs
│   │   ├── db/database.ts   # In-memory ACID transactional database
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── biddingEngine.ts # Concurrency mutex & anti-sniping
│   │   │   └── lifecycleWorker.ts
│   │   └── socket/auctionSocket.ts
│   ├── tests/
│   │   ├── auth.test.ts
│   │   ├── biddingEngine.test.ts
│   │   └── lifecycle.test.ts
│   ├── types/index.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
```

---

## 4. Demo Credentials & Accounts

For instant 1-click evaluation, click the **"Demo Personas"** button in the top navigation bar, or log in with:

| Persona | Email | Password | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Mercer** | `alex@bidxchange.com` | `Password123!` | BUYER | High-volume bidder ($25k balance) with active bids on Rolex & Jordan |
| **Sarah Jenkins** | `sarah@bidxchange.com` | `Password123!` | SELLER | Luxury Merchant ($125k balance) managing watch and art auctions |
| **David Vance** | `david@bidxchange.com` | `Password123!` | SELLER | Automotive & Tech Curator ($88k balance) |
| **Marcus Stone** | `admin@bidxchange.com` | `Password123!` | ADMIN | Super Administrator with full governance & audit log control |

---

## 5. API Endpoints

### Authentication
- `POST /api/auth/register` - Create account (email, password, name, role)
- `POST /api/auth/login` - Authenticate and receive JWT token
- `GET /api/auth/me` - Get authenticated profile
- `POST /api/auth/toggle-role` - Switch between buyer/seller role

### Auctions & Bidding
- `GET /api/auctions` - Query auctions with category, status, search, and sorting
- `GET /api/auctions/:id` - Fetch auction details, full bid history, and live stats
- `POST /api/auctions` - Create new auction (Authenticated Seller)
- `POST /api/auctions/:id/bids` - Concurrency-safe bid submission with idempotency
- `POST /api/auctions/:id/cancel` - Cancel listing (if no bids placed)

### Buyer & Seller Dashboards
- `GET /api/buyer/dashboard` - Active bids, won auctions, watchlist, lost bids
- `POST /api/buyer/checkout` - Simulated escrow settlement for won auctions
- `GET /api/seller/dashboard` - Seller analytics, active lots, completed sales
- `GET /api/watchlist` - Current user's tracked lots
- `POST /api/watchlist/toggle` - Toggle watchlist status

### Admin & Governance
- `GET /api/admin/metrics` - Real-time KPI telemetry
- `GET /api/admin/users` - User directory
- `POST /api/admin/users/:id/toggle-suspend` - Suspend or restore user
- `GET /api/admin/audit-logs` - Live audit trail

---

## 6. Running Locally & Testing

### Installation & Development
```bash
# 1. Install dependencies
npm install

# 2. Start full-stack application (Express + Socket.IO + Vite)
npm run dev

# App runs on http://localhost:3000
```

### Running Automated Unit Tests
```bash
npm run test
# Executes auth.test.ts, biddingEngine.test.ts, and lifecycle.test.ts
```

### Docker Compose
```bash
docker compose up --build
```
