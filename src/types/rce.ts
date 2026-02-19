/**
 * src/types/rce.ts
 * Frontend-side type definitions for the RCE (Revenue Continuity Engine) module.
 * Mirrors the server-side interfaces in server/src/lib/db.ts
 */

export interface Vehicle {
  id: number;
  ownerName: string;
  ownerPhone: string;
  vehicleModel: string;
  vehicleType: string;
  regYear?: number;
  regKm: number;
  firstVisitKm?: number;
  firstVisitDate?: string;
  lastVisitKm?: number;
  lastVisitDate?: string;
  measuredAvgKm?: number;
  visitCount: number;
  /** Computed by server from estimateCurrentKm() */
  estimatedKm?: number;
}

export interface MaintenanceStatus {
  itemKey: string;
  label: string;
  icon: string;
  lastDoneKm: number;
  nextDueKm: number;
  kmRemaining: number;
  daysRemaining: number;
  urgent: boolean;
  urgencyLabel?: string;
}

export interface VehicleDetail {
  vehicle: Vehicle;
  estimatedKm: number;
  predictionTier: 0 | 1 | 2;
  predictionTierLabel: string;
  maintenanceStatus: MaintenanceStatus[];
  availableItems: Array<{ key: string; km: number; label: string; icon: string }>;
}

export interface RceLog {
  id: number;
  vehicleId: number;
  phone: string;
  message: string;
  itemsAlerted: string; // JSON array string from server
  status: 'sent' | 'failed' | 'mock';
  sentAt: string;
  twilioSid?: string;
  // joined fields
  ownerName?: string;
  vehicleModel?: string;
}

export interface VehicleDue {
  vehicle: Vehicle;
  estimatedKm: number;
  dueItems: (MaintenanceStatus & { urgencyLabel: string })[];
}

export interface RegisterVehicleInput {
  ownerName: string;
  ownerPhone: string;
  vehicleModel: string;
  vehicleType?: string;
  regYear?: number;
  regKm?: number;
  currentKm?: number;
}

export interface RecordVisitInput {
  phone: string;
  currentKm: number;
  services?: string[];
}
