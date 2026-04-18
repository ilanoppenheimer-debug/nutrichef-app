export const SPORT_OPTIONS = [
  'Ninguno',
  'Cardio',
  'Fuerza/Powerlifting',
  'Crossfit',
  'HIIT',
  'Deportes de equipo',
] as const;

export const DIETARY_STYLES = [
  'Ninguna',
  'Vegetariana',
  'Vegana',
  'Pescatariana',
  'Keto',
  'Paleo',
] as const;

export const RELIGIOUS_DIETS = [
  'Ninguna',
  'Halal',
  'Kosher',
  'Hindú (Sin carne de res)',
  'Jainista',
] as const;

export const COMMON_ALLERGIES = [
  'Sin Gluten',
  'Sin Lácteos',
  'Alergia al Maní',
  'Alergia a Mariscos',
  'Sin Soya',
] as const;

export const DIETARY_META: Record<
  string,
  { icon: string; active: string }
> = {
  Ninguna: { icon: '•', active: 'border-slate-300 bg-slate-100 text-slate-700' },
  Vegetariana: { icon: '🥬', active: 'border-green-300 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
  Vegana: { icon: '🌱', active: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300' },
  Pescatariana: { icon: '🐟', active: 'border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-900/20 dark:text-sky-300' },
  Keto: { icon: '🥑', active: 'border-lime-300 bg-lime-50 text-lime-800 dark:bg-lime-900/20 dark:text-lime-300' },
  Paleo: { icon: '🥩', active: 'border-orange-300 bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' },
};

export const RELIGIOUS_META: Record<string, { icon: string; active: string }> = {
  Ninguna: { icon: '•', active: 'border-slate-300 bg-slate-100 text-slate-700' },
  Halal: { icon: '☪', active: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300' },
  Kosher: { icon: '✡', active: 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.22)]' },
  'Hindú (Sin carne de res)': { icon: '🕉', active: 'border-orange-300 bg-orange-50 text-orange-900 dark:bg-orange-900/20 dark:text-orange-300' },
  Jainista: { icon: '◌', active: 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-900 dark:bg-fuchsia-900/20 dark:text-fuchsia-300' },
};

export const ALLERGY_META: Record<string, { icon: string }> = {
  'Sin Gluten': { icon: 'GF' },
  'Sin Lácteos': { icon: 'DF' },
  'Alergia al Maní': { icon: 'PN' },
  'Alergia a Mariscos': { icon: 'SF' },
  'Sin Soya': { icon: 'SY' },
};
