import http from 'http';
import path from 'path';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { apiRouter } from './src/server/apiRouter.js';
import { setupAuctionSockets } from './src/server/socket/auctionSocket.js';
import { setSocketIO } from './src/server/services/biddingEngine.js';
import { LifecycleWorker } from './src/server/services/lifecycleWorker.js';

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

  app.use(express.json());
  app.use('/api', apiRouter);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'BidXchange Real-Time Auction Engine (Pure JavaScript)',
      timestamp: new Date().toISOString(),
    });
  });

  if (!isProduction) {
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
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[BidXchange] JavaScript Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[BidXchange] Startup error:', err);
  process.exit(1);
});
