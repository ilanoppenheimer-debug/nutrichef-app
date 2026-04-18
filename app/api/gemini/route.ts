import { NextResponse } from 'next/server';

import { sanitizeGeminiPayload } from './sanitizePayload';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 15;
const ipHits = new Map<string, { count: number; resetAt: number }>();
const RETRYABLE_GEMINI_STATUS = new Set([404, 429, 503]);
const GEMINI_RETRY_DELAY_MS = 1200;
const GEMINI_TEXT_MODELS = ['gemini-2.5-flash'];
const GEMINI_VISION_MODELS = ['gemini-2.5-flash'];

function isRateLimited(ip: string) {
  const now = Date.now();
  const entry = ipHits.get(ip);

  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchGeminiWithRetry(kind: 'text' | 'vision', payload: Record<string, unknown>, apiKey: string) {
  const models = kind === 'vision' ? GEMINI_VISION_MODELS : GEMINI_TEXT_MODELS;
  let lastErrorData: unknown = null;
  let lastStatus = 500;

  for (const modelName of Array.from(new Set(models))) {
    const apiVersion = modelName.includes('2.0') ? 'v1' : 'v1beta';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return { status: 200, data };
    }

    lastStatus = response.status;
    lastErrorData = data;

    if (RETRYABLE_GEMINI_STATUS.has(response.status)) {
      if (response.status === 429) {
        await sleep(GEMINI_RETRY_DELAY_MS);
      }
      continue;
    }

    return { status: response.status, data };
  }

  return { status: lastStatus, data: lastErrorData };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en un momento.' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const payload = body?.payload;
    const kind = body?.kind === 'vision' ? 'vision' : 'text';

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Missing or invalid payload' }, { status: 400 });
    }

    const sanitizedPayload = sanitizeGeminiPayload(payload);
    const { status, data } = await fetchGeminiWithRetry(kind, sanitizedPayload, apiKey);

    if (status !== 200) {
      return NextResponse.json(
        { error: (data as { error?: { message?: string } })?.error?.message || 'Gemini API error', raw: data },
        { status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
