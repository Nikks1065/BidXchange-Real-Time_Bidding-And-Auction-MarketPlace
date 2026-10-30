import http from 'http';
import path from 'path';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { apiRouter } from './src/server/apiRouter.ts';
import { setupAuctionSockets } from './src/server/socket/auctionSocket.ts';
import { setSocketIO } from './src/server/services/biddingEngine.ts';
import { LifecycleWorker } from './src/server/services/lifecycleWorker.ts';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Setup Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  setSocketIO(io);
  setupAuctionSockets(io);
  LifecycleWorker.start(io);

  // Parse JSON payloads
  app.use(express.json());

  // Mount API Router
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'BidXchange Real-Time Auction Engine',
      timestamp: new Date().toISOString(),
    });
  });

  if (!isProduction) {
    // In development mode, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // In production, serve built static assets
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[BidXchange] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[BidXchange] Fatal startup error:', err);
  process.exit(1);
});
