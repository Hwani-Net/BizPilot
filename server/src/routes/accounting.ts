/**
 * Accounting Routes — Ledger & Receipt CRUD
 *
 * GET  /api/accounting/ledger              — list ledger entries (this month)
 * POST /api/accounting/ledger              — add manual ledger entry
 * GET  /api/accounting/receipts            — list scanned receipts
 * PATCH /api/accounting/receipts/:id/verify — mark receipt as verified
 * GET  /api/accounting/summary             — income/expense/profit totals
 */
import type { FastifyInstance } from 'fastify';
import {
  listLedgerEntries,
  insertLedgerEntry,
  listReceipts,
  updateReceiptStatus,
  getLedgerSummary,
} from '../lib/db.js';
import type { LedgerEntry } from '../types.js';

export async function accountingRoutes(app: FastifyInstance) {

  // ── Ledger ────────────────────────────────────────────────

  app.get('/api/accounting/ledger', async (_req, reply) => {
    const entries = listLedgerEntries(100);
    return reply.send(entries);
  });

  app.post<{
    Body: Omit<LedgerEntry, 'id' | 'createdAt'>;
  }>('/api/accounting/ledger', async (req, reply) => {
    const { date, description, category, amount, type, receiptId } = req.body;

    if (!date || !description || !category || !amount || !type) {
      return reply.code(400).send({ error: 'date, description, category, amount, type required' });
    }
    if (type !== 'income' && type !== 'expense') {
      return reply.code(400).send({ error: 'type must be income or expense' });
    }

    const entry = insertLedgerEntry({ date, description, category, amount, type, receiptId });
    return reply.code(201).send(entry);
  });

  // ── Receipts ──────────────────────────────────────────────

  app.get('/api/accounting/receipts', async (_req, reply) => {
    const receipts = listReceipts(50);
    return reply.send(receipts);
  });

  app.patch<{ Params: { id: string } }>(
    '/api/accounting/receipts/:id/verify',
    async (req, reply) => {
      const id = Number(req.params.id);
      if (isNaN(id)) return reply.code(400).send({ error: 'Invalid id' });
      updateReceiptStatus(id, 'verified');
      return reply.send({ ok: true });
    }
  );

  // ── Summary ───────────────────────────────────────────────

  app.get('/api/accounting/summary', async (_req, reply) => {
    const summary = getLedgerSummary();
    return reply.send(summary);
  });
}
