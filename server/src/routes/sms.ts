/**
 * SMS Routes — RCE (Revenue Continuity Engine) 자동 문자 발송
 * POST /api/sms/send
 * POST /api/sms/rce  (batch)
 */
import type { FastifyInstance } from 'fastify';
import { env } from '../config.js';
import type { SmsRequest } from '../types.js';

export async function smsRoutes(app: FastifyInstance) {
  /**
   * POST /api/sms/send
   * Send a single SMS.
   */
  app.post<{ Body: SmsRequest }>('/send', async (req, reply) => {
    const { to, message } = req.body;

    if (!to || !message) {
      return reply.code(400).send({ error: 'to and message required' });
    }

    if (env.MOCK_MODE || !env.TWILIO_ACCOUNT_SID) {
      app.log.info({ to, message }, '[MOCK] SMS sent');
      return reply.send({ mock: true, to, message, sent: true });
    }

    try {
      const { default: twilio } = await import('twilio');
      const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

      const msg = await client.messages.create({
        to,
        from: env.TWILIO_PHONE_NUMBER,
        body: message,
      });

      app.log.info({ to, sid: msg.sid }, 'SMS sent');
      return reply.send({ success: true, sid: msg.sid });
    } catch (err) {
      app.log.error(err, 'SMS send failed');
      return reply.code(500).send({ error: 'SMS send failed' });
    }
  });

  /**
   * POST /api/sms/rce
   * Batch send RCE (재방문 유도) messages to multiple customers.
   */
  app.post<{
    Body: {
      customers: Array<{ phone: string; name: string; lastVisitDate: string }>;
      daysInterval: number;
    };
  }>('/rce', async (req, reply) => {
    const { customers, daysInterval } = req.body;

    if (!customers?.length) {
      return reply.code(400).send({ error: 'customers array required' });
    }

    const results: Array<{ phone: string; success: boolean; error?: string }> = [];

    for (const customer of customers) {
      const message = buildRceMessage(customer.name, daysInterval);

      if (env.MOCK_MODE || !env.TWILIO_ACCOUNT_SID) {
        app.log.info({ phone: customer.phone, message }, '[MOCK] RCE SMS');
        results.push({ phone: customer.phone, success: true });
        continue;
      }

      try {
        const { default: twilio } = await import('twilio');
        const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

        await client.messages.create({
          to: customer.phone,
          from: env.TWILIO_PHONE_NUMBER,
          body: message,
        });
        results.push({ phone: customer.phone, success: true });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        results.push({ phone: customer.phone, success: false, error: errMsg });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    app.log.info({ successCount, total: customers.length }, 'RCE batch complete');

    return reply.send({ results, successCount, total: customers.length });
  });
}

function buildRceMessage(name: string, daysInterval: number): string {
  return `안녕하세요, ${name}님 😊 
저희 매장을 방문하신 지 ${daysInterval}일이 지났네요!
오늘 예약하시면 특별 할인을 드립니다 ✨
AI 전화 비서 BizPilot이 대신 알려드렸습니다.
예약: 010-0000-0000`;
}
