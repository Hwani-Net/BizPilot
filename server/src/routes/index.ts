import type { FastifyInstance } from 'fastify';
import { twilioRoutes } from './twilio.js';
import { callsApiRoutes } from './calls.js';
import { ocrRoutes } from './ocr.js';
import { smsRoutes } from './sms.js';
import { rceRoutes } from './rce.js';
import { accountingRoutes } from './accounting.js';
import { dashboardRoutes } from './dashboard.js';
import { partsRoutes } from './parts.js';

export async function initRoutes(app: FastifyInstance) {
  // Health check/root already handled in index.ts

  // OCR (Receipts)
  await app.register(ocrRoutes, { prefix: '/api/ocr' });

  // Calls (Twilio inbound + history)
  await app.register(twilioRoutes, { prefix: '/twilio' });
  await app.register(callsApiRoutes, { prefix: '/api/calls' });

  // SMS
  await app.register(smsRoutes, { prefix: '/api/sms' });

  // RCE (Campaigns)
  await app.register(rceRoutes, { prefix: '/api/rce' });

  // Accounting (ledger + receipts)
  await app.register(accountingRoutes, { prefix: '/api/accounting' });

  // Dashboard Summary
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  // Parts Scanner (AR/Vision)
  await app.register(partsRoutes, { prefix: '/api/parts' });
}
