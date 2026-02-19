import { useState, useCallback, useRef, useEffect } from 'react';
import type { CallRecord, TranscriptEntry, CopilotSuggestion } from '@/types';

type AgentStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'processing' | 'error';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

interface UseCallAgentReturn {
  status: AgentStatus;
  currentCall: CallRecord | null;
  transcript: TranscriptEntry[];
  suggestions: CopilotSuggestion[];
  startAgent: () => Promise<void>;
  stopAgent: () => void;
  error: string | null;
}

/**
 * Hook for managing the AI phone agent.
 * In real mode: backend server handles Twilio + OpenAI Realtime bridge.
 * In demo mode: simulates a call with mock data.
 */
export function useCallAgent(): UseCallAgentReturn {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [currentCall, setCurrentCall] = useState<CallRecord | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAgent = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);
      setTranscript([]);
      setSuggestions([]);

      // Try to start a mock call on the backend server
      const res = await fetch(`${SERVER_URL}/api/calls/mock/start`, {
        method: 'POST',
      }).catch(() => null);

      if (res?.ok) {
        const data = await res.json() as {
          id: string;
          callerPhone: string;
          startedAt: number;
          transcript: TranscriptEntry[];
        };
        setStatus('listening');
        setCurrentCall({
          id: data.id,
          callerName: '시뮬레이션 고객',
          callerPhone: data.callerPhone,
          startedAt: new Date(data.startedAt).toISOString(),
          durationSec: 0,
          status: 'active',
        });
        setTranscript(data.transcript ?? []);

        // Poll for copilot suggestions every 3s
        pollRef.current = setInterval(async () => {
          if (!data.transcript?.length) return;
          const copilotRes = await fetch(
            `${SERVER_URL}/api/calls/${data.id}/copilot`,
            { method: 'POST', body: JSON.stringify({ transcript }), headers: { 'Content-Type': 'application/json' } }
          ).catch(() => null);

          if (copilotRes?.ok) {
            const { suggestions: newSuggestions } = await copilotRes.json() as { suggestions: string[] };
            if (newSuggestions?.length) {
              setSuggestions(
                newSuggestions.map((s: string, i: number) => ({
                  id: `s${i}`,
                  type: 'action' as const,
                  title: s.substring(0, 20),
                  content: s,
                  confidence: 0.9 - i * 0.1,
                }))
              );
            }
          }
        }, 3000);

        // Simulate conversation progression after 2s
        setTimeout(() => {
          setTranscript([
            { role: 'caller', text: '안녕하세요, 내일 오후 2시에 예약 가능한가요?', timestamp: Date.now() },
          ]);
          setStatus('processing');
          setTimeout(() => {
            setTranscript((prev) => [
              ...prev,
              { role: 'agent', text: '안녕하세요! 내일 오후 2시 확인해드리겠습니다. 성함이 어떻게 되세요?', timestamp: Date.now() },
            ]);
            setSuggestions([
              { id: 's1', type: 'booking', title: '예약 가능 안내', content: '📅 내일 오후 2시, 4시 자리가 있습니다.', confidence: 0.95 },
              { id: 's2', type: 'upsell', title: '프리미엄 업셀', content: '✨ 헤어 트리트먼트 추가 추천 (+30분)', confidence: 0.78 },
              { id: 's3', type: 'action', title: '이름 확인 필요', content: '👤 고객 이름을 먼저 확인하세요.', confidence: 0.91 },
            ]);
            setStatus('listening');
          }, 1500);
        }, 2000);

        return;
      }

      // Fallback: pure demo mode (no server)
      runDemoMode(setStatus, setCurrentCall, setTranscript, setSuggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  }, [transcript]);

  const stopAgent = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setStatus('idle');
    if (currentCall) {
      setCurrentCall({
        ...currentCall,
        status: 'completed',
        endedAt: new Date().toISOString(),
      });
    }
  }, [currentCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return { status, currentCall, transcript, suggestions, startAgent, stopAgent, error };
}

// Pure demo mode (no server available)
function runDemoMode(
  setStatus: (s: AgentStatus) => void,
  setCurrentCall: (c: CallRecord | null) => void,
  setTranscript: (fn: (prev: TranscriptEntry[]) => TranscriptEntry[]) => void,
  setSuggestions: (s: CopilotSuggestion[]) => void
) {
  setStatus('listening');
  setCurrentCall({
    id: `demo-${Date.now()}`,
    callerName: '데모 고객',
    callerPhone: '010-1234-5678',
    startedAt: new Date().toISOString(),
    durationSec: 0,
    status: 'active',
  });

  setTimeout(() => {
    setTranscript((prev) => [
      ...prev,
      { role: 'caller', text: '안녕하세요, 예약하고 싶은데요.', timestamp: Date.now() },
    ]);
    setStatus('processing');
    setTimeout(() => {
      setTranscript((prev) => [
        ...prev,
        { role: 'agent', text: '네, 안녕하세요! 어떤 날짜를 원하시나요?', timestamp: Date.now() },
      ]);
      setSuggestions([
        { id: 's1', type: 'booking', title: '예약 안내', content: '📅 오늘 오후 3시, 5시 자리가 있습니다.', confidence: 0.92 },
        { id: 's2', type: 'upsell', title: '업셀 기회', content: '✨ 프리미엄 서비스 추천 가능', confidence: 0.78 },
      ]);
      setStatus('listening');
    }, 1500);
  }, 2000);
}
