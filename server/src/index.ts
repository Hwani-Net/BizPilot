import Fastify from 'fastify';
import FastifyWebSocket from '@fastify/websocket';
import FastifyCors from '@fastify/cors';
import { config } from 'dotenv';
import { initRoutes } from './routes/index.js';
import { startScheduler } from './lib/scheduler.js';
import { seedPartsIfEmpty } from './lib/db-supabase.js';

config(); // load server/.env

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

async function bootstrap() {
  const app = Fastify({ logger: { level: 'info' } });

  // CORS — allow frontend origins (localhost + all Vercel previews)
  await app.register(FastifyCors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server / curl
      const allowed =
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /\.vercel\.app$/.test(origin) ||
        /\.onrender\.com$/.test(origin) ||
        origin === (process.env.FRONTEND_URL ?? '');
      cb(null, allowed);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Enable WebSocket support
  await app.register(FastifyWebSocket);

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    ts: new Date().toISOString(),
    db: 'supabase',
  }));

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

    // Seed demo parts data on first boot (non-blocking)
    seedPartsIfEmpty().catch(e => console.error('[seed] parts 시드 실패:', e));
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
