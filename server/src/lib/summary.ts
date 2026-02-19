/**
 * Call summary generator
 * Uses OpenAI Chat Completions to summarize the transcript after a call ends.
 */
import OpenAI from 'openai';
import { env } from '../config.js';
import type { TranscriptEntry } from '../types.js';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

export async function generateCallSummary(transcript: TranscriptEntry[]): Promise<string> {
  if (!transcript.length) return '통화 내용 없음';

  if (env.MOCK_MODE || !env.OPENAI_API_KEY) {
    return `[Mock 요약] 고객 문의 처리 완료. 총 ${transcript.length}개 발화.`;
  }

  const formatted = transcript
    .map((t) => `${t.role === 'caller' ? '고객' : 'AI'}: ${t.text}`)
    .join('\n');

  try {
    const res = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '다음 통화 내용을 3줄 이내로 한국어로 요약하세요. 예약/문의/결과를 포함.' },
        { role: 'user', content: formatted },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });
    return res.choices[0]?.message?.content ?? '요약 생성 실패';
  } catch (err) {
    console.error('Summary generation failed:', err);
    return '요약 생성 오류';
  }
}
