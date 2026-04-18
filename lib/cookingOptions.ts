/** Opciones de intención compartidas entre Cocinar y Plan (mismos valores en prompts/cache). */
export const INTENT_OPTIONS = [
  { value: 'inspirame', label: '✨ Inspírame' },
  { value: 'proteico', label: '💪 Proteico' },
  { value: 'liviano', label: '🥗 Liviano' },
  { value: 'economico', label: '💸 Económico' },
] as const;

export type CookingIntentValue = (typeof INTENT_OPTIONS)[number]['value'];
