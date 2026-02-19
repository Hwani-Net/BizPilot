import { FastifyInstance } from 'fastify';
import { OpenAI } from 'openai';
import { env } from '../config.js';
import { listParts, getPartByNumber } from '../lib/db-supabase.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function partsRoutes(app: FastifyInstance) {
  
  // 1. Search parts by keyword (text/voice)
  app.get<{ Querystring: { q: string } }>('/search', async (req) => {
    const { q } = req.query;
    if (!q) return [];
    
    // First, try direct DB search
    const dbResults = await listParts(q);
    if (dbResults.length > 0) return { results: dbResults, analysis: null };

    // If no results, ask AI to interpret the user query and suggest keywords
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an auto parts expert. Extract key search terms (part name, car model) from the user query. Output JSON: { "keywords": ["term1", "term2"] }' },
        { role: 'user', content: q }
      ],
      response_format: { type: 'json_object' }
    });
    
    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
    const keywords = aiResponse.keywords || [];
    
    // Search again with AI keywords
    let aiResults: any[] = [];
    for (const k of keywords) {
      const res = await listParts(k);
      aiResults = [...aiResults, ...res];
    }
    
    // Deduplicate
    const uniqueResults = Array.from(new Set(aiResults.map(p => p.part_number)))
      .map(num => aiResults.find(p => p.part_number === num));

    return { results: uniqueResults, analysis: `AI가 '${keywords.join(', ')}' 관련 부품을 찾았습니다.` };
  });

  // 2. Analyze Image (Vision API)
  app.post<{ Body: { imageBase64: string } }>('/analyze-image', async (req) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) throw new Error('Image required');

    // Call GPT-4o Vision
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert automotive mechanic AI. 
          Identify the car part in the image. 
          Return a JSON object with:
          - part_name_ko: Korean name
          - part_name_en: English name
          - likely_car_model: Estimated car model (e.g. Sonata, Avante) if visible
          - confidence: 0-100
          - description: Brief explanation of the part's condition or type.`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identify this car part.' },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Search DB using identified name
    const searchName = analysis.part_name_ko || analysis.part_name_en;
    const dbResults = searchName ? await listParts(searchName) : [];

    return { analysis, results: dbResults };
  });

  // 3. Decode VIN
  app.get<{ Querystring: { vin: string } }>('/vin', async (req) => {
    const { vin } = req.query;
    if (!vin || vin.length < 17) throw new Error('Invalid VIN');

    // NHTSA API (Free)
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
    const data = await response.json();
    
    // Extract Make, Model, Year
    const results = data.Results || [];
    const make = results.find((r: any) => r.Variable === 'Make')?.Value;
    const model = results.find((r: any) => r.Variable === 'Model')?.Value;
    const year = results.find((r: any) => r.Variable === 'Model Year')?.Value;

    if (!make || !model) return { error: 'Could not decode VIN or unknown vehicle' };

    const carName = `${year} ${make} ${model}`;
    
    // Search parts compatible with this model
    // This is a naive search; in production, use array contains
    // For MVP, we search strictly by model name string
    const parts = await listParts(model); 

    return { 
      car_info: { make, model, year, full_name: carName },
      compatible_parts: parts
    };
  });
}
