import type { FastifyInstance } from 'fastify';
import { twilioRoutes } from './twilio.js';
import { callsApiRoutes } from './calls.js';
import { ocrRoutes } from './ocr.js';
import { smsRoutes } from './sms.js';
import { rceRoutes } from './rce.js';
import { accountingRoutes } from './accounting.js';

export async function initRoutes(app: FastifyInstance) {
  // Twilio voice webhook + media stream
  await app.register(twilioRoutes, { prefix: '/twilio' });

  // REST API for frontend
  await app.register(callsApiRoutes, { prefix: '/api/calls' });
  await app.register(ocrRoutes,      { prefix: '/api/ocr' });
  await app.register(smsRoutes,      { prefix: '/api/sms' });

  // Accounting (ledger + receipts)
  await app.register(accountingRoutes);

  // RCE (Re-engagement Campaign) API
  await app.register(rceRoutes);
}
