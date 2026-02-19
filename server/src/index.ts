// BizPilot Server — Twilio Voice + OpenAI Realtime API Bridge
// Architecture: Twilio (call) → Twilio Media Streams (WebSocket) → This server → OpenAI Realtime API
import Fastify from 'fastify';
import FastifyWebSocket from '@fastify/websocket';
import FastifyCors from '@fastify/cors';
import { config } from 'dotenv';
import { initRoutes } from './routes/index.js';
import { startScheduler } from './lib/scheduler.js';
import { getDb } from './lib/db.js';

config({ path: '../.env' });   // load root .env

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

async function bootstrap() {
  const app = Fastify({ logger: { level: 'info' } });

  // CORS — allow frontend dev server
  await app.register(FastifyCors, {
    origin: [
      'http://localhost:5173',  // Vite dev
      'http://localhost:4173',  // Vite preview
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Enable WebSocket support
  await app.register(FastifyWebSocket);

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    ts: new Date().toISOString(),
    db: 'connected',
  }));

  // Initialize SQLite (warm up connection)
  try {
    getDb();
    app.log.info('SQLite database initialized');
  } catch (err) {
    app.log.error(err, 'Failed to initialize SQLite');
  }

  // Register all routes
  await initRoutes(app);

  try {
    await app.listen({ port: PORT, host: HOST });

    console.log(`✅ BizPilot Server running at http://localhost:${PORT}`);
    console.log(`📡 Twilio webhook:       http://localhost:${PORT}/twilio/voice`);
    console.log(`🔌 Media Stream WS:      ws://localhost:${PORT}/twilio/stream`);
    console.log(`📊 Call records API:     http://localhost:${PORT}/api/calls`);
    console.log(`📸 OCR API:              http://localhost:${PORT}/api/ocr/receipt`);
    console.log(`📲 RCE API:              http://localhost:${PORT}/api/rce`);

    // Start RCE cron scheduler
    startScheduler();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
