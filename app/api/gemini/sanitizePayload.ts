/** Quita campos que no deben enviarse al proxy (p. ej. forzar MIME solo en servidor). */
export function sanitizeGeminiPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const clone = structuredClone(payload);
  const generationConfig = clone.generationConfig as Record<string, unknown> | undefined;
  const generation_config = clone.generation_config as Record<string, unknown> | undefined;

  if (generationConfig?.responseMimeType) {
    delete generationConfig.responseMimeType;
  }

  if (generation_config?.responseMimeType) {
    delete generation_config.responseMimeType;
  }

  return clone;
}
