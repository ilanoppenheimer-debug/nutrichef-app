import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AddRecipeTextMode } from '../types';

const compactProfile = vi.fn(() => 'Perfil compacto');
const buildAbsoluteGuardrail = vi.fn(() => 'Guardrail absoluto');
const sanitizeUserInput = vi.fn((text: string, max: number) => `[sanitized:${max}]${text}`);

vi.mock('@/lib/gemini.js', () => ({
  compactProfile,
  buildAbsoluteGuardrail,
  sanitizeUserInput,
}));

describe('buildPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('modo text concatena instrucciones y entrada saneada', async () => {
    const { buildPrompt } = await import('./prompts');
    const out = buildPrompt('text', 'Mi receta', {});

    expect(compactProfile).toHaveBeenCalledWith({});
    expect(buildAbsoluteGuardrail).toHaveBeenCalledWith({});
    expect(sanitizeUserInput).toHaveBeenCalledWith('Mi receta', 2000);
    expect(out).toContain('Perfil del usuario: Perfil compacto');
    expect(out).toContain('Guardrail absoluto');
    expect(out).toContain('[sanitized:2000]Mi receta');
    expect(out).toContain('CONTENIDO:');
  });

  it('modo url añade línea de URL', async () => {
    const { buildPrompt } = await import('./prompts');
    const out = buildPrompt('url', 'https://ejemplo.com/r', {});
    expect(out).toContain('URL de la receta: [sanitized:2000]https://ejemplo.com/r');
  });

  it('modo instagram añade bloque de caption', async () => {
    const { buildPrompt } = await import('./prompts');
    const out = buildPrompt('instagram', 'Caption IG', {});
    expect(out).toContain('Caption/descripción de Instagram:');
    expect(out).toContain('[sanitized:2000]Caption IG');
  });

  it('lanza si el modo no es soportado', async () => {
    const { buildPrompt } = await import('./prompts');
    expect(() => buildPrompt('photo' as AddRecipeTextMode, 'x', {})).toThrow('Modo no soportado');
  });
});

describe('buildVisionPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('incluye perfil, guardrail y esquema SCAN', async () => {
    const { buildVisionPrompt } = await import('./prompts');
    const out = buildVisionPrompt({ allergies: [] });

    expect(compactProfile).toHaveBeenCalledWith({ allergies: [] });
    expect(buildAbsoluteGuardrail).toHaveBeenCalledWith({ allergies: [] });
    expect(out).toContain('Analiza esta imagen');
    expect(out).toContain('"scanType": "recipe|product"');
    expect(out).toContain('¡CUIDADO! Contiene [alérgeno]');
  });
});
