/**
 * routes/rce.ts — Vehicle-based Maintenance & RCE API
 *
 * GET  /api/rce/vehicles               List all vehicles
 * POST /api/rce/vehicles               Register / update vehicle
 * GET  /api/rce/vehicles/:phone        Get vehicle + maintenance status
 * POST /api/rce/vehicles/:phone/visit  Record a visit (odometer reading)
 * POST /api/rce/service                Record completed service item
 * GET  /api/rce/due                    Vehicles due for maintenance alert
 * GET  /api/rce/logs                   Recent SMS history
 * POST /api/rce/run                    Manually trigger campaign
 * POST /api/rce/send                   Send single SMS immediately
 */
import type { FastifyInstance } from 'fastify';
import {
  listVehicles,
  upsertVehicle,
  getVehicleByPhone,
  getMaintenanceStatus,
  recordService,
  getVehiclesDueForAlert,
  listRceLogs,
  estimateCurrentKm,
  MAINTENANCE_INTERVALS,
} from '../lib/db.js';
import { runRceCampaign, sendRceSms } from '../lib/scheduler.js';

export async function rceRoutes(fastify: FastifyInstance) {

  // GET /api/rce/vehicles
  fastify.get('/api/rce/vehicles', async (_req, reply) => {
    const vehicles = listVehicles();
    return reply.send(vehicles.map(v => ({
      ...v,
      estimatedKm: estimateCurrentKm(v),
    })));
  });

  // POST /api/rce/vehicles  — register or update vehicle
  fastify.post<{
    Body: {
      ownerName: string;
      ownerPhone: string;
      vehicleModel: string;
      vehicleType?: string;
      regYear?: number;
      regKm?: number;
      currentKm?: number; // odometer reading right now (at first visit)
    };
  }>('/api/rce/vehicles', async (req, reply) => {
    const { ownerName, ownerPhone, vehicleModel, vehicleType, regYear, regKm, currentKm } = req.body;

    if (!ownerName || !ownerPhone || !vehicleModel) {
      return reply.status(400).send({ error: 'ownerName, ownerPhone, vehicleModel required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const vehicle = upsertVehicle({
      ownerName,
      ownerPhone,
      vehicleModel,
      vehicleType: vehicleType ?? '세단',
      regYear,
      regKm: regKm ?? 0,
      firstVisitKm: currentKm,
      firstVisitDate: currentKm ? today : undefined,
      lastVisitKm: currentKm,
      lastVisitDate: currentKm ? today : undefined,
    });

    return reply.status(201).send(vehicle);
  });

  // GET /api/rce/vehicles/:phone  — full status including maintenance predictions
  fastify.get<{ Params: { phone: string } }>('/api/rce/vehicles/:phone', async (req, reply) => {
    const vehicle = getVehicleByPhone(req.params.phone);
    if (!vehicle) return reply.status(404).send({ error: 'Vehicle not found' });

    const { km: estimatedKm, tier } = estimateCurrentKm(vehicle);
    const maintenanceStatus = getMaintenanceStatus(vehicle);

    return reply.send({
      vehicle,
      estimatedKm,
      predictionTier: tier,
      predictionTierLabel: ['국가 평균', '생애 주행 추정', '실측 평균'][tier],
      maintenanceStatus: maintenanceStatus
        .sort((a, b) => a.kmRemaining - b.kmRemaining)
        .slice(0, 8), // top 8 items
      availableItems: Object.entries(MAINTENANCE_INTERVALS).map(([key, meta]) => ({
        key,
        ...meta,
      })),
    });
  });

  // POST /api/rce/vehicles/:phone/visit  — record new odometer reading at visit
  fastify.post<{
    Params: { phone: string };
    Body: { currentKm: number; services?: string[] }; // services done this visit
  }>('/api/rce/vehicles/:phone/visit', async (req, reply) => {
    const vehicle = getVehicleByPhone(req.params.phone);
    if (!vehicle) return reply.status(404).send({ error: 'Vehicle not found' });

    const today = new Date().toISOString().split('T')[0];
    const { currentKm, services = [] } = req.body;

    if (!currentKm || currentKm < 0) {
      return reply.status(400).send({ error: 'currentKm required and must be positive' });
    }

    // Update vehicle with new reading
    const updated = upsertVehicle({
      ...vehicle,
      lastVisitKm: currentKm,
      lastVisitDate: today,
    });

    // Record any services done during this visit
    for (const itemKey of services) {
      recordService(vehicle.id, itemKey, currentKm);
    }

    const { km: estimatedKm, tier } = estimateCurrentKm(updated);

    return reply.send({
      vehicle: updated,
      estimatedKm,
      predictionTier: tier,
      servicesRecorded: services,
    });
  });

  // POST /api/rce/service  — record a completed service item
  fastify.post<{
    Body: { phone: string; itemKey: string; doneAtKm: number };
  }>('/api/rce/service', async (req, reply) => {
    const { phone, itemKey, doneAtKm } = req.body;
    if (!phone || !itemKey || !doneAtKm) {
      return reply.status(400).send({ error: 'phone, itemKey, doneAtKm required' });
    }

    const vehicle = getVehicleByPhone(phone);
    if (!vehicle) return reply.status(404).send({ error: 'Vehicle not found' });

    const interval = MAINTENANCE_INTERVALS[itemKey];
    if (!interval) {
      return reply.status(400).send({
        error: `Unknown itemKey. Available: ${Object.keys(MAINTENANCE_INTERVALS).join(', ')}`
      });
    }

    recordService(vehicle.id, itemKey, doneAtKm);
    return reply.send({
      ok: true,
      vehicleId: vehicle.id,
      itemKey,
      doneAtKm,
      nextDueKm: doneAtKm + interval.km,
      label: interval.label,
    });
  });

  // GET /api/rce/due  — vehicles due for maintenance notification
  fastify.get<{ Querystring: { threshold?: string } }>('/api/rce/due', async (req, reply) => {
    const threshold = parseInt(req.query.threshold ?? '1500', 10);
    const targets = getVehiclesDueForAlert(threshold);
    return reply.send({
      count: targets.length,
      thresholdKm: threshold,
      targets: targets.map(t => ({
        vehicle: t.vehicle,
        estimatedKm: t.estimatedKm,
        dueItems: t.dueItems.map(i => ({
          ...i,
          urgencyLabel: i.urgent ? '🔴 즉시 교환 권장' : '🟡 교환 시기 임박',
        })),
      })),
    });
  });

  // GET /api/rce/logs
  fastify.get<{ Querystring: { limit?: string } }>('/api/rce/logs', async (req, reply) => {
    const limit = parseInt(req.query.limit ?? '50', 10);
    return reply.send(listRceLogs(limit));
  });

  // POST /api/rce/run  — manual campaign trigger
  fastify.post('/api/rce/run', async (_req, reply) => {
    // Fire and forget — respond instantly
    runRceCampaign().catch(err => console.error('[RCE] Manual run error:', err));
    return reply.send({ status: 'started', message: 'RCE campaign triggered (mileage-based)' });
  });

  // POST /api/rce/send  — single immediate SMS
  fastify.post<{
    Body: { phone: string; message: string };
  }>('/api/rce/send', async (req, reply) => {
    const { phone, message } = req.body;
    if (!phone || !message) return reply.status(400).send({ error: 'phone, message required' });

    const result = await sendRceSms(phone, message);
    return reply.status(result.ok ? 200 : 500).send({ ok: result.ok, sid: result.sid, phone });
  });
}
