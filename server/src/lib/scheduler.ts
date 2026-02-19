/**
 * lib/scheduler.ts
 * Mileage-based RCE scheduler.
 *
 * Logic:
 *   1. Estimate current km for each registered vehicle
 *   2. For each maintenance item approaching threshold (< 1500 km away)
 *   3. Send a soft, informative SMS — "주기가 다가오면 편하게 방문해 주세요"
 *   4. No repeated alerts within 30 days per vehicle
 */
import cron from 'node-cron';
import { env } from '../config.js';
import {
  getVehiclesDueForAlert,
  insertRceLog,
  type MaintenanceStatus,
  type Vehicle,
} from './db.js';

type ScheduledTask = ReturnType<typeof cron.schedule>;
let schedulerTask: ScheduledTask | null = null;

// ── Message Generator ─────────────────────────────────────

function buildRceMessage(vehicle: Vehicle, dueItems: MaintenanceStatus[], estimatedKm: number): string {
  const km = estimatedKm.toLocaleString('ko-KR');
  const name = vehicle.ownerName;
  const model = vehicle.vehicleModel;

  // Group urgent vs upcoming
  const urgent   = dueItems.filter(i => i.urgent);
  const upcoming = dueItems.filter(i => !i.urgent);

  let itemLines = '';

  if (urgent.length > 0) {
    itemLines += urgent.map(i =>
      `  ${i.icon} ${i.label}: 권장 주기 도달 (약 ${i.nextDueKm.toLocaleString('ko-KR')}km)`
    ).join('\n');
  }

  if (upcoming.length > 0) {
    if (itemLines) itemLines += '\n';
    itemLines += upcoming.slice(0, 2).map(i =>
      `  ${i.icon} ${i.label}: 약 ${i.kmRemaining.toLocaleString('ko-KR')}km 후 (${i.daysRemaining}일 예상)`
    ).join('\n');
  }

  return [
    `안녕하세요, ${name}님 🔧`,
    ``,
    `${model}의 주행 패턴을 분석해 드렸습니다.`,
    `현재 예상 누적 주행거리: 약 ${km}km`,
    ``,
    `─ 정비 예정 항목 ─`,
    itemLines,
    ``,
    `주기가 도래하면 언제든 편하게 방문해 주세요 😊`,
    `예약: bizpilot.app/book`,
  ].join('\n');
}

// ── SMS Send ──────────────────────────────────────────────

export async function sendRceSms(phone: string, message: string): Promise<{ sid?: string; ok: boolean }> {
  if (env.MOCK_MODE || !env.TWILIO_ACCOUNT_SID) {
    console.log(`[RCE MOCK] → ${phone}\n${message}\n`);
    return { ok: true };
  }
  try {
    const { default: twilio } = await import('twilio');
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    const msg = await client.messages.create({
      body: message,
      from: env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    console.log(`[RCE] Sent to ${phone} — SID: ${msg.sid}`);
    return { sid: msg.sid, ok: true };
  } catch (err) {
    console.error(`[RCE] Failed to send to ${phone}:`, err);
    return { ok: false };
  }
}

// ── Campaign Runner ───────────────────────────────────────

export async function runRceCampaign(): Promise<{ sent: number; total: number }> {
  console.log('[RCE] 🚗 Mileage-based campaign started');

  const threshold = parseInt(process.env.RCE_THRESHOLD_KM ?? '1500', 10);
  const targets = getVehiclesDueForAlert(threshold);

  console.log(`[RCE] ${targets.length} vehicle(s) due for notification`);

  let sent = 0;
  for (const { vehicle, dueItems, estimatedKm } of targets) {
    const message = buildRceMessage(vehicle, dueItems, estimatedKm);
    const result = await sendRceSms(vehicle.ownerPhone, message);

    insertRceLog({
      vehicleId: vehicle.id,
      phone: vehicle.ownerPhone,
      message,
      itemsAlerted: dueItems.map(i => i.itemKey),
      status: result.ok ? 'sent' : 'failed',
      twilioSid: result.sid,
    });

    if (result.ok) sent++;

    // Rate-limit: 200ms between sends
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`[RCE] ✅ Complete — ${sent}/${targets.length} sent`);
  return { sent, total: targets.length };
}

// ── Cron Scheduler ────────────────────────────────────────

export function startScheduler(): void {
  if (schedulerTask) return;

  // Every day at 10:00 AM KST
  schedulerTask = cron.schedule('0 1 * * *', async () => {
    try {
      await runRceCampaign();
    } catch (err) {
      console.error('[RCE] Scheduler error:', err);
    }
  }, { timezone: 'Asia/Seoul' });

  console.log('[RCE] Scheduler started — runs daily at 10:00 AM KST (mileage-based)');
}

export function stopScheduler(): void {
  schedulerTask?.stop();
  schedulerTask = null;
}
