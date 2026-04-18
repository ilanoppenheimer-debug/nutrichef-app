import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

function postRequest(body: unknown, extraHeaders: Record<string, string> = {}) {
  return new Request('http://localhost/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '198.51.100.10',
      ...extraHeaders,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/gemini', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ modelResponse: true }),
      } as Response),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('responde 500 si falta GEMINI_API_KEY', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const res = await POST(postRequest({ kind: 'text', payload: { contents: [] } }));
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/misconfiguration|Server/i);
  });

  it('responde 400 sin payload u objeto inválido', async () => {
    const resMissing = await POST(postRequest({ kind: 'text' }));
    expect(resMissing.status).toBe(400);

    const resBadJson = await POST(
      new Request('http://localhost/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.11' },
        body: 'not-json{{{',
      }),
    );
    expect(resBadJson.status).toBe(400);
  });

  it('proxifica a Gemini y devuelve JSON 200 cuando la API responde ok', async () => {
    const res = await POST(
      postRequest({
        kind: 'text',
        payload: { contents: [{ parts: [{ text: 'hola' }] }] },
      }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { modelResponse: boolean };
    expect(data.modelResponse).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalled();
  });

  it('propaga error de Gemini cuando la respuesta no es ok y no es reintentable', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Bad request' } }),
    } as Response);

    const res = await POST(
      postRequest({
        kind: 'text',
        payload: { contents: [{ parts: [{ text: 'x' }] }] },
      }),
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('Bad request');
  });
});
