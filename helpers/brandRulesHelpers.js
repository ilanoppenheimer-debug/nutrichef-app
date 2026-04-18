import { isDietSelected } from '../lib/foodPreferences.js';

export const ALLERGY_RULES = {
  'Sin Gluten': { key: 'glutenFree', label: 'Sin Gluten' },
  'Sin Lácteos': { key: 'dairyFree', label: 'Sin Lácteos' },
  'Alergia al Maní': { key: 'peanutFree', label: 'Sin Maní' },
  'Alergia a Mariscos': { key: 'shellfishFree', label: 'Sin Mariscos' },
  'Sin Soya': { key: 'soyFree', label: 'Sin Soya' },
};

export function resolveReligiousChecks(profile) {
  const checks = [];
  if (profile.pesachMode) checks.push({ key: 'kosherPassover', label: 'Apto Pésaj' });
  if (profile.religiousDiet === 'Kosher') checks.push({ key: 'kosher', label: 'Apto Kosher' });
  if (profile.religiousDiet === 'Halal') checks.push({ key: 'halal', label: 'Apto Halal' });
  return checks;
}

export function resolveLifestyleChecks(profile) {
  if (profile.dietaryStyle === 'Vegana' || isDietSelected(profile, 'vegan')) {
    return [{ key: 'vegan', label: 'Vegano' }];
  }
  if (profile.dietaryStyle === 'Vegetariana' || isDietSelected(profile, 'vegetarian')) {
    return [{ anyOf: ['vegetarian', 'vegan'], label: 'Vegetariano' }];
  }
  return [];
}

export function resolveRelevantBrandCategories(profile) {
  const categories = [];
  if (profile.pesachMode) categories.push('pesach');
  if (profile.religiousDiet === 'Kosher') categories.push('kosher');
  if (profile.religiousDiet === 'Halal') categories.push('halal');
  if (profile.dietaryStyle === 'Vegana' || isDietSelected(profile, 'vegan')) categories.push('vegan');
  if (profile.dietaryStyle === 'Vegetariana' || isDietSelected(profile, 'vegetarian')) categories.push('vegetariana');
  if (profile.sportType === 'Fuerza/Powerlifting' || profile.useProteinPowder || isDietSelected(profile, 'high_protein')) {
    categories.push('powerlifting');
  }
  return [...new Set(categories)];
}
