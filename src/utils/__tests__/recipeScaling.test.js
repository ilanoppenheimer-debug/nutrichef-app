import { describe, expect, it } from 'vitest';
import {
  clampServings,
  parseServingsCount,
  scaleNutritionLabel,
  scaleQuantityText,
} from '../recipeScaling.js';

describe('parseServingsCount', () => {
  it('returns 1 for empty input', () => {
    expect(parseServingsCount('')).toBe(1);
    expect(parseServingsCount(null)).toBe(1);
  });

  it('parses plain integers', () => {
    expect(parseServingsCount('4')).toBe(4);
    expect(parseServingsCount(6)).toBe(6);
  });

  it('parses fractions in text', () => {
    expect(parseServingsCount('2 porciones')).toBe(2);
  });
});

describe('clampServings', () => {
  it('clamps to min and max', () => {
    expect(clampServings(0)).toBe(1);
    expect(clampServings(20)).toBe(12);
    expect(clampServings(4)).toBe(4);
  });
});

describe('scaleQuantityText', () => {
  it('returns original when factor is 1', () => {
    expect(scaleQuantityText('200 g', 1)).toBe('200 g');
  });

  it('scales a simple numeric amount', () => {
    const out = scaleQuantityText('100 g', 2);
    expect(out).toMatch(/200/);
  });
});

describe('scaleNutritionLabel', () => {
  it('returns original when factor is 1', () => {
    expect(scaleNutritionLabel('350 kcal', 1)).toBe('350 kcal');
  });

  it('scales numeric nutrition values', () => {
    const out = scaleNutritionLabel('25g proteína', 2);
    expect(out).toMatch(/50/);
  });
});
