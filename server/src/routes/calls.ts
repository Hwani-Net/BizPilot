/**
 * Calls API — REST endpoints for the frontend
 * GET  /api/calls              List all calls (DB + in-memory)
 * GET  /api/calls/:id          Get specific call
 * POST /api/calls/:id/copilot  AI copilot suggestions
 * POST /api/calls/mock/start   Demo call
 * POST /api/calls/:id/end      End & persist call to DB
 */
import type { FastifyInstance } from 'fastify';
import OpenAI from 'openai';
import { env } from '../config.js';
import type { TranscriptEntry, CallRecord } from '../types.js';
import { insertCallRecord, listCallRecords, getCallRecord } from '../lib/db.js';
import { upsertRceCustomer } from '../lib/db.js';

// In-memory store for ACTIVE calls only
const activeCallStore: Map<string, CallRecord> = new Map();

export async function callsApiRoutes(app: FastifyInstance) {

  /** GET /api/calls */
  app.get('/', async () => {
    const dbRecords = listCallRecords(50);
    const activeRecords = Array.from(activeCallStore.values());

    // Merge: active calls take precedence
    const ids = new Set(activeRecords.map(c => c.id));
    const merged = [
      ...activeRecords,
      ...dbRecords.filter(r => !ids.has(r.id)),
    ].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return { calls: merged };
  });

  /** GET /api/calls/:id */
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const id = req.params.id;
    const active = activeCallStore.get(id);
    if (active) return active;
    const db = getCallRecord(id);
    if (!db) return reply.code(404).send({ error: 'Call not found' });
    return db;
  });

  /** POST /api/calls/:id/copilot */
  app.post<{
    Params: { id: string };
    Body: { transcript: TranscriptEntry[] };
  }>('/:id/copilot', async (req, reply) => {
    const { transcript } = req.body;

    if (!transcript?.length) {
      return reply.send({ suggestions: defaultSuggestions() });
    }

    if (env.MOCK_MODE || !env.OPENAI_API_KEY) {
      return reply.send({ suggestions: mockSuggestions(transcript) });
    }

    try {
      const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      const lastTurn = transcript.slice(-4);
      const context = lastTurn
        .map((t) => `${t.role === 'caller' ? '고객' : 'AI'}: ${t.text}`)
        .join('\n');

      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 AI 전화 비서의 코파일럿입니다. 현재 통화 맥락을 보고 비서가 할 수 있는 최선의 다음 행동 3가지를 제안하세요.
응답 형식: JSON { "suggestions": ["제안1", "제안2", "제안3"] }`,
          },
          { role: 'user', content: context },
        ],
        max_tokens: 200,
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      let suggestions: string[] = [];
      try {
        const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}') as Record<string, unknown>;
        const arr = parsed.suggestions ?? parsed[Object.keys(parsed)[0]];
        suggestions = Array.isArray(arr) ? arr : defaultSuggestions();
      } catch {
        suggestions = defaultSuggestions();
      }

      return reply.send({ suggestions });
    } catch (err) {
      app.log.warn(err, 'Copilot generation failed, returning defaults');
      return reply.send({ suggestions: defaultSuggestions() });
    }
  });

  /** POST /api/calls/mock/start */
  app.post('/mock/start', async (_req, reply) => {
    const id = `mock-${Date.now()}`;
    const now = new Date().toISOString();
    const record: CallRecord = {
      id,
      callerName: '김민수 (시뮬레이션)',
      callerPhone: '010-1234-5678',
      startedAt: now,
      status: 'active',
      durationSec: 0,
      transcript: [
        { role: 'caller', text: '안녕하세요, 내일 오후 2시에 커트 예약 가능한가요?', timestamp: Date.now() - 3000 },
        { role: 'agent',  text: '안녕하세요! 내일 오후 2시 커트 예약 확인해드리겠습니다.', timestamp: Date.now() - 2000 },
      ],
      copilotSuggestions: mockSuggestions([]),
    };
    activeCallStore.set(id, record);
    return reply.send(record);
  });

  /** POST /api/calls/:id/end  — end active call & persist to SQLite */
  app.post<{
    Params: { id: string };
    Body?: { summary?: string; callerName?: string };
  }>('/:id/end', async (req, reply) => {
    const id = req.params.id;
    const active = activeCallStore.get(id);
    if (!active) return reply.code(404).send({ error: 'Active call not found' });

    const endedAt = new Date().toISOString();
    const durationSec = Math.round(
      (new Date(endedAt).getTime() - new Date(active.startedAt).getTime()) / 1000
    );

    const finalized: CallRecord = {
      ...active,
      callerName: req.body?.callerName ?? active.callerName,
      endedAt,
      durationSec,
      status: 'completed',
      summary: req.body?.summary ?? active.summary,
    };

    // Persist to SQLite
    insertCallRecord(finalized);

    // Auto-register caller as RCE customer if phone is real
    if (!active.callerPhone.includes('시뮬레이션') && active.callerPhone.startsWith('0')) {
      upsertRceCustomer({
        name: finalized.callerName ?? '알 수 없음',
        phone: active.callerPhone,
        lastVisit: endedAt.split('T')[0],
        service: '전화 문의',
      });
    }

    activeCallStore.delete(id);
    return reply.send(finalized);
  });
}

// ── Helpers ──────────────────────────────────────────────

function defaultSuggestions(): string[] {
  return [
    '📅 예약 날짜/시간을 확인하세요',
    '👤 고객 이름을 물어보세요',
    '💬 원하는 서비스 종류를 확인하세요',
  ];
}

function mockSuggestions(transcript: TranscriptEntry[]): string[] {
  if (transcript.some((t) => t.text.includes('예약'))) {
    return [
      '📅 예약 가능한 날짜를 안내하세요',
      '⏰ 원하는 시간대를 확인하세요',
      '✅ 예약을 즉시 확정해도 될지 물어보세요',
    ];
  }
  if (transcript.some((t) => t.text.includes('가격') || t.text.includes('얼마'))) {
    return [
      '💰 가격표를 안내하세요',
      '🎁 현재 프로모션을 알려주세요',
      '📲 카카오톡으로 가격표를 전송해드릴까요?',
    ];
  }
  return defaultSuggestions();
}
