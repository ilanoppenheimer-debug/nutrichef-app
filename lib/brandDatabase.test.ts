import { describe, expect, it } from 'vitest';

import {
  buildAbsoluteGuardrail,
  findBrandByName,
  normalizeBrandName,
} from './brandDatabase.js';

describe('normalizeBrandName', () => {
  it('normaliza acentos, minúsculas y signos', () => {
    expect(normalizeBrandName('Café 123')).toBe('cafe 123');
    expect(normalizeBrandName('')).toBe('');
  });
});

describe('findBrandByName', () => {
  it('encuentra marca del catálogo por nombre cercano', () => {
    const b = findBrandByName('Kedem');
    expect(b?.name).toContain('Kedem');
  });

  it('devuelve null sin coincidencia', () => {
    expect(findBrandByName('xyzmarca_inexistente_999')).toBeNull();
  });
});

describe('buildAbsoluteGuardrail', () => {
  it('devuelve cadena vacía sin restricciones relevantes', () => {
    expect(
      buildAbsoluteGuardrail({
        religiousDiet: 'Ninguna',
        dietaryStyle: 'Ninguna',
        allergies: [],
        dislikes: [],
        pesachMode: false,
      }),
    ).toBe('');
  });

  it('incluye alergias y estilo cuando aplican', () => {
    const g = buildAbsoluteGuardrail({
      religiousDiet: 'Ninguna',
      dietaryStyle: 'Vegana',
      allergies: ['Maní'],
      dislikes: [],
      pesachMode: false,
    });
    expect(g).toContain('GUARDRAIL ABSOLUTO');
    expect(g).toMatch(/Alergias|Maní/i);
    expect(g).toMatch(/Vegana|Estilo/i);
  });

  it('añade bloque de Pésaj cuando pesachMode es true', () => {
    const g = buildAbsoluteGuardrail({
      religiousDiet: 'Ninguna',
      dietaryStyle: 'Ninguna',
      allergies: [],
      dislikes: [],
      pesachMode: true,
      allowsKitniot: false,
    });
    expect(g).toMatch(/Pésaj|PESAJ|Jametz/i);
  });
});
