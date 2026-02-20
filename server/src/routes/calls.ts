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
import { insertCallRecord, listCallRecords, getCallRecord, createBooking } from '../lib/db-supabase.js';
import { upsertRceCustomer } from '../lib/db-supabase.js';

// In-memory store for ACTIVE calls only
const activeCallStore: Map<string, CallRecord> = new Map();
// In-memory store for call summaries (keyed by call id)
const callSummaryStore: Map<string, CallSummary> = new Map();

export interface CallSummary {
  customerName: string;
  customerPhone: string;
  vehicleModel: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  bookingCreated?: boolean;
}

export async function callsApiRoutes(app: FastifyInstance) {

  /** GET /api/calls */
  app.get('/', async () => {
    const dbRecords = await listCallRecords(50);
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
    const db = await getCallRecord(id);
    if (!db) return reply.code(404).send({ error: 'Call not found' });
    return db;
  });

  /** POST /api/calls/:id/summary — AI-generate call summary + extract booking info */
  app.post<{
    Params: { id: string };
    Body: { transcript: TranscriptEntry[] };
  }>('/:id/summary', async (req, reply) => {
    const { transcript } = req.body;
    const callId = req.params.id;
    const active = activeCallStore.get(callId);

    if (!env.OPENAI_API_KEY || env.MOCK_MODE) {
      // Mock summary for demo
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const mock: CallSummary = {
        customerName: active?.callerName ?? '김민수',
        customerPhone: active?.callerPhone ?? '010-1234-5678',
        vehicleModel: '그랜저 IG (2020)',
        serviceType: '엔진오일 교체 + 브레이크 패드',
        preferredDate: tomorrow,
        preferredTime: '14:00',
        summary: '고객이 내일 오후 2시에 엔진오일 교체와 브레이크 패드 교체를 요청하였습니다. 차량은 그랜저 IG 2020년식이며, 예약 확정을 희망합니다.',
        sentiment: 'positive',
      };
      callSummaryStore.set(callId, mock);
      return reply.send(mock);
    }

    try {
      const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      const context = (transcript ?? [])
        .map(t => `${t.role === 'caller' ? '고객' : 'AI 비서'}: ${t.text}`)
        .join('\n');

      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 자동차 정비소 AI 비서의 통화 요약 엔진입니다.
통화 내용을 분석하여 아래 JSON 형식으로 요약하세요:
{
  "customerName": "고객 이름 (불명이면 '미확인 고객')",
  "vehicleModel": "차종 (불명이면 '차종 미확인')",
  "serviceType": "요청 서비스 (예: 엔진오일 교체, 타이어 교체 등)",
  "preferredDate": "YYYY-MM-DD (불명이면 내일 날짜)",
  "preferredTime": "HH:MM (불명이면 '14:00')",
  "summary": "3줄 이내 한국어 요약",
  "sentiment": "positive | neutral | negative"
}`,
          },
          { role: 'user', content: context || '고객: 안녕하세요, 내일 오후에 엔진오일 교체 가능한가요?' },
        ],
        max_tokens: 300,
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}');
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const result: CallSummary = {
        customerName: parsed.customerName ?? active?.callerName ?? '미확인 고객',
        customerPhone: active?.callerPhone ?? '010-0000-0000',
        vehicleModel: parsed.vehicleModel ?? '차종 미확인',
        serviceType: parsed.serviceType ?? '정비 문의',
        preferredDate: parsed.preferredDate ?? tomorrow,
        preferredTime: parsed.preferredTime ?? '14:00',
        summary: parsed.summary ?? '통화 요약 생성 실패',
        sentiment: parsed.sentiment ?? 'neutral',
      };
      callSummaryStore.set(callId, result);
      return reply.send(result);
    } catch (err) {
      app.log.warn(err, 'Summary generation failed, returning mock');
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const fallback: CallSummary = {
        customerName: active?.callerName ?? '미확인 고객',
        customerPhone: active?.callerPhone ?? '010-0000-0000',
        vehicleModel: '차종 미확인',
        serviceType: '정비 문의',
        preferredDate: tomorrow,
        preferredTime: '14:00',
        summary: '통화 내용을 기반으로 자동 요약할 수 없었습니다.',
        sentiment: 'neutral',
      };
      callSummaryStore.set(callId, fallback);
      return reply.send(fallback);
    }
  });

  /** POST /api/calls/:id/book — Create booking from call summary */
  app.post<{
    Params: { id: string };
    Body?: Partial<CallSummary>;
  }>('/:id/book', async (req, reply) => {
    const callId = req.params.id;
    const stored = callSummaryStore.get(callId);
    const summaryData = { ...stored, ...req.body };

    if (!summaryData.customerName || !summaryData.serviceType) {
      return reply.code(400).send({ error: 'Call summary not found. Generate summary first.' });
    }

    try {
      const booking = await createBooking({
        ownerName: summaryData.customerName,
        ownerPhone: summaryData.customerPhone ?? '010-0000-0000',
        vehicleModel: summaryData.vehicleModel,
        serviceType: summaryData.serviceType,
        startTime: `${summaryData.preferredDate} ${summaryData.preferredTime}`,
        status: 'confirmed',
        notes: `[AI 통화 요약] ${summaryData.summary ?? ''}`,
      });

      // Mark summary as booked
      if (stored) {
        stored.bookingCreated = true;
        callSummaryStore.set(callId, stored);
      }

      return reply.send({ ok: true, booking });
    } catch (err) {
      app.log.error(err, 'Failed to create booking from call summary');
      return reply.code(500).send({ error: 'Booking creation failed' });
    }
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
            content: `당신은 AI 전화 비서의 코파일럿입니다. 현재 통화 맥락을 보고 비서가 할 수 있는 최선의 다음 행동 3가지를 제안하세요.\n응답 형식: JSON { \"suggestions\": [\"제안1\", \"제안2\", \"제안3\"] }`,
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
        { role: 'caller', text: '안녕하세요, 내일 오후 2시에 엔진오일이랑 브레이크 패드 교체 가능한가요?', timestamp: Date.now() - 3000 },
        { role: 'agent',  text: '안녕하세요! 오토메이트 정비소입니다. 내일 오후 2시 예약 가능 여부 확인해드리겠습니다.', timestamp: Date.now() - 2000 },
      ],
      copilotSuggestions: mockSuggestions([]),
    };
    activeCallStore.set(id, record);
    return reply.send(record);
  });

  /** POST /api/calls/:id/end  — end active call & persist */
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

    // Persist to Supabase
    await insertCallRecord(finalized);

    // Auto-register caller as RCE customer if phone is real
    if (!active.callerPhone.includes('시뮬레이션') && active.callerPhone.startsWith('0')) {
      await upsertRceCustomer({
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
    '📅 예약 날짜와 차량 번호를 확인하세요',
    '🚗 차종과 정비 항목을 물어보세요',
    '💰 예상 견적 범위를 안내하세요',
  ];
}

function mockSuggestions(transcript: TranscriptEntry[]): string[] {
  if (transcript.some((t) => t.text.includes('예약') || t.text.includes('교체'))) {
    return [
      '📅 엔진오일/패드 세트 할인 상품을 안내하세요',
      '⏰ 차량 입고 시간을 확인하세요 (대차 필요 여부)',
      '✅ 차량 번호를 확인하여 정비 이력을 조회하세요',
    ];
  }
  if (transcript.some((t) => t.text.includes('비용') || t.text.includes('공임') || t.text.includes('얼마'))) {
    return [
      '💰 공임 포함 정찰제 가격을 안내하세요',
      '🎁 첫 방문 10% 부품 할인 혜택을 알려주세요',
      '📲 SMS로 상세 견적서를 보내드릴까요?',
    ];
  }
  return defaultSuggestions();
}
