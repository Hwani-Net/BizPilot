/**
 * OCR Route — Receipt scanning via OpenAI Vision API
 * POST /api/ocr/receipt
 *
 * Body: { image: string (base64), mimeType?: string }
 *    OR { imageBase64: string, mimeType?: string }  (legacy)
 */
import type { FastifyInstance } from 'fastify';
import OpenAI from 'openai';
import { env } from '../config.js';
import type { OcrResult } from '../types.js';
import { insertReceipt, insertLedgerEntry } from '../lib/db.js';

/**
 * Save OCR result to DB: receipts + auto-add as expense ledger entry.
 */
function saveReceiptToDB(result: OcrResult): void {
  try {
    const receipt = insertReceipt({
      vendor: result.vendor,
      amount: result.amount,
      date: result.date,
      category: result.category ?? '기타',
      items: result.items,
      status: 'pending',
    });
    // Auto-create expense ledger entry
    insertLedgerEntry({
      date: result.date,
      description: `[OCR] ${result.vendor}`,
      category: result.category ?? '기타',
      amount: result.amount,
      type: 'expense',
      receiptId: receipt.id,
    });
  } catch (err) {
    console.warn('[OCR] DB save failed (non-fatal):', err);
  }
}

export async function ocrRoutes(app: FastifyInstance) {
  app.post<{ Body: { image?: string; imageBase64?: string; mimeType?: string } }>(
    '/receipt',
    async (req, reply) => {
      const base64 = req.body.image ?? req.body.imageBase64;
      const mimeType = req.body.mimeType ?? 'image/jpeg';

      if (!base64) {
        return reply.code(400).send({ error: 'image (base64) required' });
      }

      if (env.MOCK_MODE || !env.OPENAI_API_KEY) {
        const mock = mockOcrResult();
        saveReceiptToDB(mock);
        return reply.send(mock);
      }

      try {
        const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

        const res = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `이 영수증 이미지를 분석하여 다음 JSON 형식으로 반환하세요. 카테고리는 [부품매입, 소모품, 공구/설비, 식대, 기타] 중 하나를 선택하세요.
{
  "vendor": "상호명",
  "amount": 총금액(숫자, 부가세포함),
  "date": "YYYY-MM-DD",
  "category": "카테고리",
  "items": [
    { "name": "품목명", "quantity": 수량(숫자), "totalPrice": 금액(숫자) }
  ]
}
반드시 유효한 JSON만 반환하세요.`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          max_tokens: 600,
          response_format: { type: 'json_object' },
        });

        const raw = JSON.parse(res.choices[0]?.message?.content ?? '{}') as Record<string, unknown>;
        const result: OcrResult = {
          vendor: (raw.vendor as string) ?? '알 수 없음',
          amount: Number(raw.amount ?? 0),
          date: (raw.date as string) ?? new Date().toISOString().split('T')[0],
          category: (raw.category as string) ?? '기타',
          items: (raw.items as OcrResult['items']) ?? [],
          raw,
        };

        saveReceiptToDB(result);
        return reply.send(result);
      } catch (err) {
        app.log.error(err, 'OCR failed');
        return reply.code(500).send({ error: 'OCR processing failed' });
      }
    }
  );
}

function mockOcrResult(): OcrResult {
  return {
    vendor: '모비스 부품대리점 (강남점)',
    amount: 145000,
    date: new Date().toISOString().split('T')[0],
    category: '부품매입',
    items: [
      { name: '엔진오일 5W30 (4L)', quantity: 2, totalPrice: 90000 },
      { name: '오일필터 (26300)',   quantity: 2, totalPrice: 12000 },
      { name: '에어크리너 (28113)', quantity: 2, totalPrice: 18000 },
      { name: '와이퍼 블레이드 650',quantity: 2, totalPrice: 25000 },
    ],
    raw: { mock: true },
  };
}
