/**
 * BridgeSession — shared state for a single call
 * Manages the lifecycle of: Twilio WS ↔ OpenAI Realtime WS
 */
import type { WebSocket } from 'ws';
import type { TranscriptEntry } from '../types.js';

export interface BridgeSession {
  callSid: string;
  callerPhone: string;
  startedAt: number;
  lastActivity: number;
  status: 'active' | 'completed' | 'error';
  transcript: TranscriptEntry[];
  summary?: string;
  socket: WebSocket;
}

interface CreateBridgeSessionParams {
  callSid: string;
  callerPhone: string;
  socket: WebSocket;
}

export function createBridgeSession(params: CreateBridgeSessionParams): BridgeSession {
  const now = Date.now();
  return {
    callSid: params.callSid,
    callerPhone: params.callerPhone,
    startedAt: now,
    lastActivity: now,
    status: 'active',
    transcript: [],
    socket: params.socket,
  };
}
