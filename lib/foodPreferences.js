export const FOOD_PREFERENCES_STORAGE_KEY = 'nutrichef_food_preferences';

export const FOOD_DIET_OPTIONS = [
  { id: 'high_protein', label: 'Alta en proteína', aliases: ['alta en proteina', 'high protein', 'high_protein'] },
  { id: 'low_carb', label: 'Baja en carbohidratos', aliases: ['baja en carbohidratos', 'low carb', 'low_carb'] },
  { id: 'vegetarian', label: 'Vegetariana', legacyStyle: 'Vegetariana', aliases: ['vegetariana', 'vegetarian'] },
  { id: 'vegan', label: 'Vegana', legacyStyle: 'Vegana', aliases: ['vegana', 'vegan'] },
  { id: 'pescatarian', label: 'Pescatariana', legacyStyle: 'Pescatariana', aliases: ['pescatariana', 'pescatarian'] },
  { id: 'keto', label: 'Keto', legacyStyle: 'Keto', aliases: ['keto'] },
  { id: 'paleo', label: 'Paleo', legacyStyle: 'Paleo', aliases: ['paleo'] },
];

export const DEFAULT_FOOD_PREFERENCES = Object.freeze({
  kosher: false,
  diets: [],
  restrictions: [],
});

const DIET_OPTIONS_BY_ID = FOOD_DIET_OPTIONS.reduce((acc, option) => {
  acc[option.id] = option;
  return acc;
}, {});

const LEGACY_DIET_IDS = new Set(
  FOOD_DIET_OPTIONS.filter(option => option.legacyStyle).map(option => option.id)
);

const RESTRICTION_ALIASES = [
  { canonical: 'Sin Gluten', aliases: ['sin gluten', 'gluten free'] },
  { canonical: 'Sin Lácteos', aliases: ['sin lacteos', 'sin lácteos', 'sin lactosa', 'lactose free', 'dairy free'] },
  { canonical: 'Alergia al Maní', aliases: ['alergia al mani', 'alergia al maní', 'sin mani', 'sin maní', 'peanut free'] },
  { canonical: 'Alergia a Mariscos', aliases: ['alergia a mariscos', 'sin mariscos', 'shellfish free'] },
  { canonical: 'Sin Soya', aliases: ['sin soya', 'sin soja', 'soy free'] },
];

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueNormalized(values = []) {
  const seen = new Set();
  return values.filter((value) => {
    const key = normalizeText(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function humanizeValue(value = '') {
  const cleaned = String(value || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function getDietOptionById(dietId) {
  return DIET_OPTIONS_BY_ID[dietId] || null;
}

export function getDietLabel(dietId) {
  return getDietOptionById(dietId)?.label || dietId;
}

export function normalizeDietId(value) {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  for (const option of FOOD_DIET_OPTIONS) {
    const candidates = [option.id, option.label, option.legacyStyle, ...(option.aliases || [])];
    if (candidates.some(candidate => normalizeText(candidate) === normalized)) {
      return option.id;
    }
  }

  return null;
}

export function normalizeRestriction(value) {
  const normalized = normalizeText(value);
  if (!normalized) return '';

  const aliasMatch = RESTRICTION_ALIASES.find(entry =>
    entry.aliases.some(alias => normalizeText(alias) === normalized)
  );

  return aliasMatch?.canonical || humanizeValue(String(value).trim());
}

export function normalizeFoodPreferences(value = DEFAULT_FOOD_PREFERENCES) {
  return {
    kosher: Boolean(value?.kosher),
    diets: uniqueNormalized((value?.diets || []).map(normalizeDietId).filter(Boolean)),
    restrictions: uniqueNormalized((value?.restrictions || []).map(normalizeRestriction).filter(Boolean)),
  };
}

export function hasActiveFoodPreferences(value) {
  const normalized = normalizeFoodPreferences(value);
  return normalized.kosher || normalized.diets.length > 0 || normalized.restrictions.length > 0;
}

export function getPrimaryLegacyDietaryStyle(value) {
  const normalized = normalizeFoodPreferences(value);
  const legacyDiet = normalized.diets
    .map(dietId => getDietOptionById(dietId)?.legacyStyle)
    .find(Boolean);

  return legacyDiet || 'Ninguna';
}

export function deriveFoodPreferencesFromProfile(profile = {}) {
  return normalizeFoodPreferences({
    kosher: profile.religiousDiet === 'Kosher' || profile.pesachMode === true,
    diets: profile.dietaryStyle && profile.dietaryStyle !== 'Ninguna' ? [profile.dietaryStyle] : [],
    restrictions: profile.allergies || [],
  });
}

export function mergeFoodPreferences(primaryValue, fallbackValue) {
  const primary = normalizeFoodPreferences(primaryValue || DEFAULT_FOOD_PREFERENCES);
  const fallback = normalizeFoodPreferences(fallbackValue || DEFAULT_FOOD_PREFERENCES);

  return normalizeFoodPreferences({
    kosher: primary.kosher || fallback.kosher,
    diets: [...fallback.diets, ...primary.diets],
    restrictions: [...fallback.restrictions, ...primary.restrictions],
  });
}

export function mergeLegacyProfileIntoFoodPreferences(currentValue, legacyValue) {
  const current = normalizeFoodPreferences(currentValue || DEFAULT_FOOD_PREFERENCES);
  const legacy = normalizeFoodPreferences(legacyValue || DEFAULT_FOOD_PREFERENCES);

  return normalizeFoodPreferences({
    kosher: legacy.kosher,
    diets: [...current.diets.filter(dietId => !LEGACY_DIET_IDS.has(dietId)), ...legacy.diets],
    restrictions: legacy.restrictions,
  });
}

export function withFoodPreferences(profile = {}, preferences = null) {
  const mergedPreferences = preferences
    ? mergeFoodPreferences(preferences, deriveFoodPreferencesFromProfile(profile))
    : deriveFoodPreferencesFromProfile(profile);

  const baseReligiousDiet = profile.religiousDiet && profile.religiousDiet !== 'Kosher'
    ? profile.religiousDiet
    : 'Ninguna';

  return {
    ...profile,
    foodPreferences: mergedPreferences,
    dietaryStyle: getPrimaryLegacyDietaryStyle(mergedPreferences),
    religiousDiet: mergedPreferences.kosher ? 'Kosher' : baseReligiousDiet,
    allergies: uniqueNormalized([...(profile.allergies || []), ...mergedPreferences.restrictions]),
    pesachMode: mergedPreferences.kosher ? Boolean(profile.pesachMode) : false,
    allowsKitniot: mergedPreferences.kosher ? Boolean(profile.allowsKitniot) : false,
  };
}

export function getFoodPreferenceSummaryLines(source) {
  const preferences = normalizeFoodPreferences(source?.foodPreferences || source);
  const lines = [];

  if (preferences.kosher) lines.push('Kosher');
  preferences.diets.forEach(dietId => lines.push(getDietLabel(dietId)));
  preferences.restrictions.forEach(restriction => lines.push(restriction));

  return uniqueNormalized(lines);
}

export function buildFoodPreferencePromptBlock(source) {
  const lines = getFoodPreferenceSummaryLines(source);
  if (!lines.length) return '';

  return `PREFERENCIAS ALIMENTARIAS OBLIGATORIAS:
${lines.map(line => `- ${line}`).join('\n')}
Estas preferencias deben cumplirse SIEMPRE. Nunca generes contenido que las viole; si hay conflicto, sustituye ingredientes, marcas o técnicas por alternativas compatibles.`;
}

export function getFoodPreferenceCacheFragment(source) {
  const preferences = normalizeFoodPreferences(source?.foodPreferences || source);
  return {
    kosher: preferences.kosher,
    diets: preferences.diets,
    restrictions: preferences.restrictions,
  };
}

export function isDietSelected(source, dietId) {
  return normalizeFoodPreferences(source?.foodPreferences || source).diets.includes(dietId);
}

export function matchesRestriction(source, patterns = []) {
  const restrictions = normalizeFoodPreferences(source?.foodPreferences || source).restrictions;
  const normalizedPatterns = patterns.map(pattern => normalizeText(pattern)).filter(Boolean);

  if (!normalizedPatterns.length) return false;

  return restrictions.some((restriction) => {
    const normalizedRestriction = normalizeText(restriction);
    return normalizedPatterns.some(pattern =>
      normalizedRestriction === pattern || normalizedRestriction.includes(pattern)
    );
  });
}
