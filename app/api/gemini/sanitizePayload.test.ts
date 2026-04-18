import { describe, expect, it } from 'vitest';

import { sanitizeGeminiPayload } from './sanitizePayload';

describe('sanitizeGeminiPayload', () => {
  it('elimina responseMimeType de generationConfig', () => {
    const out = sanitizeGeminiPayload({
      contents: [{ parts: [{ text: 'hi' }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    });
    expect(out.generationConfig).toEqual({ temperature: 0.2 });
  });

  it('elimina responseMimeType de generation_config (snake_case)', () => {
    const out = sanitizeGeminiPayload({
      generation_config: { responseMimeType: 'text/plain', maxOutputTokens: 100 },
    });
    expect(out.generation_config).toEqual({ maxOutputTokens: 100 });
  });

  it('no muta el objeto original', () => {
    const original = {
      generationConfig: { responseMimeType: 'application/json' as const, topP: 1 },
    };
    const snapshot = structuredClone(original);
    sanitizeGeminiPayload(original);
    expect(original).toEqual(snapshot);
  });

  it('deja el payload intacto si no hay MIME en config', () => {
    const payload = { foo: 'bar', generationConfig: { temperature: 1 } };
    expect(sanitizeGeminiPayload(payload)).toEqual(payload);
  });
});
