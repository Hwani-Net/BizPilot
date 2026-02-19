// Validated, typed environment variables
export const env = {
  OPENAI_API_KEY: requireEnv('OPENAI_API_KEY'),
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? '',
  SERVER_URL: process.env.SERVER_URL ?? 'http://localhost:3001',
  PORT: Number(process.env.PORT ?? 3001),

  // Feature flags
  MOCK_MODE: process.env.MOCK_MODE === 'true',

  // AI Agent settings
  AI_GREETING: process.env.AI_GREETING ?? '안녕하세요, 무엇을 도와드릴까요?',
  AI_VOICE: (process.env.AI_VOICE ?? 'marin') as 'marin' | 'cedar' | 'coral' | 'sage',
  AI_MODEL: process.env.AI_MODEL ?? 'gpt-4o-realtime-preview',

  // Supabase (PostgreSQL)
  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ?? '',
} as const;

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val && process.env.MOCK_MODE !== 'true') {
    console.warn(`⚠️  Missing env var: ${key} — running in mock mode`);
  }
  return val ?? '';
}
