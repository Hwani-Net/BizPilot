/**
 * Twilio Voice Webhook Routes
 *
 * Flow:
 *  1. Twilio calls POST /twilio/voice when a call arrives
 *  2. We respond with TwiML that opens a Media Stream WS to /twilio/stream
 *  3. The WS handler bridges audio between Twilio & OpenAI Realtime API
 */
import type { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { env } from '../config.js';
import { createBridgeSession, type BridgeSession } from '../lib/bridge.js';
import { generateCallSummary } from '../lib/summary.js';

// In-memory call store (replace with DB in production)
const activeCalls = new Map<string, BridgeSession>();

export async function twilioRoutes(app: FastifyInstance) {
  /**
   * POST /twilio/voice
   * Twilio calls this when an inbound call arrives.
   * Returns TwiML instructing Twilio to stream audio to our WebSocket.
   */
  app.post('/voice', async (req, reply) => {
    const callSid = (req.body as Record<string, string>)?.CallSid ?? 'unknown';
    const callerPhone = (req.body as Record<string, string>)?.From ?? '';

    app.log.info({ callSid, callerPhone }, 'Inbound call received');

    const streamUrl = `wss://${new URL(env.SERVER_URL).host}/twilio/stream`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="callSid" value="${callSid}" />
      <Parameter name="callerPhone" value="${callerPhone}" />
    </Stream>
  </Connect>
</Response>`;

    reply.type('text/xml').send(twiml);
  });

  /**
   * POST /twilio/voice/outbound
   * Initiates an outbound call via Twilio (for RCE campaigns).
   */
  app.post<{ Body: { to: string; message: string } }>('/voice/outbound', async (req, reply) => {
    if (env.MOCK_MODE || !env.TWILIO_ACCOUNT_SID) {
      return reply.send({ mock: true, to: req.body.to, message: 'Outbound call simulated' });
    }

    try {
      const { default: twilio } = await import('twilio');
      const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

      const call = await client.calls.create({
        to: req.body.to,
        from: env.TWILIO_PHONE_NUMBER,
        twiml: `<Response><Say language="ko-KR">${req.body.message}</Say></Response>`,
      });

      return reply.send({ success: true, callSid: call.sid });
    } catch (err) {
      app.log.error(err, 'Outbound call failed');
      return reply.code(500).send({ error: 'Outbound call failed' });
    }
  });

  /**
   * WebSocket /twilio/stream
   * Receives Twilio Media Stream audio and bridges it to OpenAI Realtime API.
   */
  app.get('/stream', { websocket: true }, async (socket, req) => {
    app.log.info('Twilio Media Stream WebSocket connected');

    let callSid = '';
    let callerPhone = '';
    let openAiWs: WebSocket | null = null;
    let session: BridgeSession | null = null;

    // Clean up on close
    const cleanup = async () => {
      app.log.info({ callSid }, 'Call ended — generating summary');

      if (session) {
        const summary = await generateCallSummary(session.transcript);
        session.summary = summary;
        activeCalls.set(callSid, session);
        app.log.info({ callSid, summary }, 'Call summary generated');
      }

      openAiWs?.close();
    };

    socket.on('message', async (raw: Buffer) => {
      const msg = JSON.parse(raw.toString()) as TwilioStreamMessage;

      switch (msg.event) {
        case 'connected':
          app.log.info('Twilio stream connected');
          break;

        case 'start': {
          callSid = msg.start?.callSid ?? '';
          callerPhone = msg.start?.customParameters?.callerPhone ?? '';
          app.log.info({ callSid, callerPhone }, 'Stream started');

          // Create bridge session (Twilio WS ↔ OpenAI Realtime WS)
          session = createBridgeSession({ callSid, callerPhone, socket });
          activeCalls.set(callSid, session);

          if (env.MOCK_MODE || !env.OPENAI_API_KEY) {
            // Demo: send a fake greeting back after 1s
            app.log.info('MOCK_MODE: simulating AI greeting');
            setTimeout(() => {
              const mockGreeting = enkode(env.AI_GREETING);
              socket.send(JSON.stringify({ event: 'media', media: { payload: mockGreeting } }));
            }, 1000);
          } else {
            // Connect to OpenAI Realtime API
            openAiWs = await connectToOpenAI(session, socket);
          }
          break;
        }

        case 'media': {
          // Forward Twilio μ-law 8kHz audio → OpenAI
          if (openAiWs?.readyState === WebSocket.OPEN && msg.media?.payload) {
            openAiWs.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: msg.media.payload, // base64 μ-law already
            }));
          }

          // Track transcript entry for copilot
          if (session) {
            session.lastActivity = Date.now();
          }
          break;
        }

        case 'stop':
          await cleanup();
          break;
      }
    });

    socket.on('close', cleanup);
    socket.on('error', (err) => {
      app.log.error(err, 'Twilio WS error');
      cleanup();
    });
  });

  /**
   * GET /twilio/calls
   * Returns all call sessions (active + recent).
   */
  app.get('/calls', async () => {
    return { calls: Array.from(activeCalls.values()).map(sessionToRecord) };
  });

  /**
   * GET /twilio/calls/:callSid
   * Returns a specific call session.
   */
  app.get<{ Params: { callSid: string } }>('/calls/:callSid', async (req, reply) => {
    const session = activeCalls.get(req.params.callSid);
    if (!session) return reply.code(404).send({ error: 'Call not found' });
    return sessionToRecord(session);
  });
}

// ===== OpenAI Realtime Connection =====
async function connectToOpenAI(
  session: BridgeSession,
  twilioSocket: import('ws').WebSocket
): Promise<WebSocket> {
  const ws = new WebSocket(
    `wss://api.openai.com/v1/realtime?model=${env.AI_MODEL}`,
    {
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    }
  );

  ws.on('open', () => {
    // Configure session
    ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
          create_response: true,
        },
        input_audio_format: 'g711_ulaw',   // Twilio's native format
        output_audio_format: 'g711_ulaw',  // Send back in same format
        voice: env.AI_VOICE,
        instructions: buildSystemPrompt(session.callerPhone),
        modalities: ['text', 'audio'],
        temperature: 0.7,
      },
    }));
  });

  ws.on('message', (raw: Buffer) => {
    const event = JSON.parse(raw.toString()) as OpenAIRealtimeEvent;

    switch (event.type) {
      case 'response.audio.delta':
        // Forward AI audio → Twilio
        if (event.delta && twilioSocket.readyState === WebSocket.OPEN) {
          twilioSocket.send(JSON.stringify({
            event: 'media',
            streamSid: session.callSid,
            media: { payload: event.delta },
          }));
        }
        break;

      case 'response.audio_transcript.delta':
        // Append to transcript (agent utterance)
        if (event.delta) {
          session.transcript.push({
            role: 'agent',
            text: event.delta,
            timestamp: Date.now(),
          });
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // Append caller utterance to transcript
        if (event.transcript) {
          session.transcript.push({
            role: 'caller',
            text: event.transcript,
            timestamp: Date.now(),
          });
        }
        break;

      case 'error':
        console.error('OpenAI Realtime error:', event.error);
        break;
    }
  });

  ws.on('error', (err) => console.error('OpenAI WS error:', err));

  return ws;
}

// ===== Helpers =====
function buildSystemPrompt(callerPhone: string): string {
  return `당신은 소상공인 매장의 AI 전화 비서 'BizPilot'입니다.
역할:
- 고객의 전화를 받아 친절하게 응대합니다
- 예약 요청을 받아 날짜/시간/서비스를 확인합니다
- 영업시간 문의에 답변합니다
- 모든 대화를 한국어로 진행합니다

현재 전화 고객 번호: ${callerPhone}
오늘 날짜: ${new Date().toLocaleDateString('ko-KR')}
영업시간: 09:00 ~ 21:00

응대 규칙:
- 항상 공손하고 친절하게 말하세요
- 예약 시 이름, 날짜, 시간, 서비스를 확인하세요
- 모호한 요청은 명확히 질문하세요
- 통화는 간결하게 진행하세요`;
}

function enkode(text: string): string {
  // Simple base64 encode for mock mode
  return Buffer.from(text).toString('base64');
}

function sessionToRecord(s: BridgeSession) {
  return {
    callSid: s.callSid,
    callerPhone: s.callerPhone,
    startedAt: s.startedAt,
    status: s.status,
    transcript: s.transcript,
    summary: s.summary,
    durationSec: Math.floor((Date.now() - s.startedAt) / 1000),
  };
}

// ===== Types =====
interface TwilioStreamMessage {
  event: 'connected' | 'start' | 'media' | 'stop';
  start?: {
    callSid: string;
    customParameters?: Record<string, string>;
  };
  media?: {
    payload: string; // base64 audio
  };
}

interface OpenAIRealtimeEvent {
  type: string;
  delta?: string;
  transcript?: string;
  error?: { message: string };
}
