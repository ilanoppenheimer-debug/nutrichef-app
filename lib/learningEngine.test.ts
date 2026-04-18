/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildLearningPromptBlock,
  clearLearningData,
  getAutoTweaks,
  getRecentRecipeTitles,
  recordDislike,
  recordGeneratedRecipe,
  recordLike,
  recordTweak,
} from './learningEngine.js';

const STORAGE_KEY = 'nutrichef_learning_v1';

beforeEach(() => {
  localStorage.removeItem(STORAGE_KEY);
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('learningEngine', () => {
  it('recordLike y recordDislike persisten en localStorage', () => {
    recordLike('  Limón  ', 0.5);
    recordDislike('Cilantro', 0.4, false);
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as {
      likes: Record<string, { weight: number }>;
      dislikes: Record<string, { count: number }>;
    };
    expect(raw.likes['limón'].weight).toBeGreaterThanOrEqual(0.5);
    expect(raw.dislikes.cilantro.count).toBe(1);
  });

  it('recordDislike permanente aparece en buildLearningPromptBlock', () => {
    recordDislike('Ajo', 0.2, true);
    const block = buildLearningPromptBlock();
    expect(block).toContain('NUNCA usar');
    expect(block).toContain('ajo');
  });

  it('buildLearningPromptBlock vacío sin señales', () => {
    expect(buildLearningPromptBlock()).toBe('');
  });

  it('recordGeneratedRecipe y getRecentRecipeTitles', () => {
    recordGeneratedRecipe('Pollo al curry', 'proteico');
    recordGeneratedRecipe('Ensalada', 'liviano');
    expect(getRecentRecipeTitles(1)).toEqual(['Ensalada']);
    expect(getRecentRecipeTitles(5).length).toBe(2);
  });

  it('getAutoTweaks promueve un tipo con 3+ usos en la última semana', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'));
    recordTweak('mas_simple');
    recordTweak('mas_simple');
    recordTweak('mas_simple');
    expect(getAutoTweaks()).toEqual(['mas_simple']);
    vi.useRealTimers();
  });

  it('getAutoTweaks ignora tweaks de hace más de 7 días', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T12:00:00Z'));
    recordTweak('mas_simple');
    recordTweak('mas_simple');
    recordTweak('mas_simple');
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    expect(getAutoTweaks()).toEqual([]);
    vi.useRealTimers();
  });

  it('clearLearningData elimina el almacenamiento', () => {
    recordLike('perejil');
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    clearLearningData();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('recordLike sin clave no persiste nada', () => {
    recordLike('', 1);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
