// Base de datos local de marcas verificadas por categoría.
// Sirve como contexto para la IA y como filtro estricto en la UI.

import { getFoodPreferenceSummaryLines, isDietSelected, withFoodPreferences } from './foodPreferences.js';

function createBrand(name, note, category, safety = {}) {
  return { name, note, category, safety };
}

export const SAFE_BRANDS = {
  pesach: [
    createBrand('Kedem', 'Línea clásica con productos Kasher lePésaj certificados', 'pesach', { kosher: true, kosherPassover: true, vegetarian: true }),
    createBrand('Manischewitz', 'Referente histórico en productos de Pésaj con sello KP', 'pesach', { kosher: true, kosherPassover: true, vegetarian: true }),
    createBrand("Streit's", 'Matzot y básicos de temporada con certificación KP', 'pesach', { kosher: true, kosherPassover: true, vegetarian: true }),
  ],
  kosher: [
    createBrand('Kirkland Signature', 'Certificación OU Kosher en varias líneas seleccionadas', 'kosher', { kosher: true, vegetarian: true }),
    createBrand('Philadelphia', 'Queso crema con certificación Kosher en mercados seleccionados', 'kosher', { kosher: true, vegetarian: true, glutenFree: true }),
    createBrand('Nature Valley', 'Barras de granola con certificación Kosher en referencias específicas', 'kosher', { kosher: true, vegetarian: true }),
    createBrand('Isopure Low Carb', 'Proteína whey certificada Kosher y libre de gluten', 'kosher', { kosher: true, vegetarian: true, glutenFree: true }),
    createBrand('Empire Kosher', 'Pollo y pavo certificado Kosher', 'kosher', { kosher: true }),
  ],
  halal: [
    createBrand('Saffron Road', 'Línea completa certificada Halal y varias opciones sin gluten', 'halal', { halal: true, glutenFree: true }),
    createBrand('American Halal', 'Carnes certificadas Halal', 'halal', { halal: true }),
    createBrand('Crescent Foods', 'Pollo y carnes Halal certificadas', 'halal', { halal: true, glutenFree: true }),
    createBrand('Ziyad', 'Productos mediterráneos certificados Halal en referencias seleccionadas', 'halal', { halal: true, vegetarian: true }),
  ],
  vegan: [
    createBrand('NotCo (NotMeat, NotMilk)', 'Alternativas vegetales de amplia disponibilidad en Latam', 'vegan', { vegan: true, vegetarian: true, dairyFree: true }),
    createBrand('Silk', 'Bebidas vegetales y bases culinarias de origen vegetal', 'vegan', { vegan: true, vegetarian: true, dairyFree: true }),
    createBrand('Beyond Meat', 'Proteína vegetal con perfil apto vegano', 'vegan', { vegan: true, vegetarian: true, dairyFree: true, glutenFree: true }),
    createBrand('Violife', 'Quesos veganos certificados, sin lácteos y sin gluten', 'vegan', { vegan: true, vegetarian: true, dairyFree: true, glutenFree: true, soyFree: true }),
    createBrand('Oatly', 'Leches y cremas de avena de perfil vegano', 'vegan', { vegan: true, vegetarian: true, dairyFree: true }),
  ],
  powerlifting: [
    createBrand('Optimum Nutrition Gold Standard', 'Whey referente para fuerza y recuperación', 'powerlifting', { vegetarian: true }),
    createBrand('MyProtein Impact Whey', 'Buena relación precio/calidad para rendimiento', 'powerlifting', { vegetarian: true }),
    createBrand('Dymatize ISO100', 'Aislado de alta absorción y libre de gluten', 'powerlifting', { vegetarian: true, glutenFree: true }),
    createBrand('Ghost Whey', 'Alto sabor y densidad proteica para volumen', 'powerlifting', { vegetarian: true }),
    createBrand('Isopure Zero Carb', 'Proteína aislada sin carbohidratos y sin gluten', 'powerlifting', { vegetarian: true, glutenFree: true }),
  ],
  vegetariana: [
    createBrand('Quorn', 'Proteína de micoproteína apta para vegetarianos', 'vegetariana', { vegetarian: true }),
    createBrand('Garden Gourmet', 'Alternativas plant-based de Nestlé para vegetarianos', 'vegetariana', { vegetarian: true }),
    createBrand('Field Roast', 'Embutidos y salchichas vegetarianas', 'vegetariana', { vegetarian: true }),
  ],
  chile: {
    supermercados: ['Líder (Walmart)', 'Jumbo', 'Santa Isabel', 'Unimarc', 'Tottus'],
    tiendas_especializadas: ['GNC Chile', 'Nutri Express', 'Bodytech', 'Sport Life'],
    vegan_local: ['NotCo', 'Love Corn', 'El Granero'],
    proteinas_local: ['Optimum Nutrition (GNC)', 'MyProtein (envío directo)', 'Dymatize (Jumbo)'],
  },
};

const ALLERGY_RULES = {
  'Sin Gluten': { key: 'glutenFree', label: 'Sin Gluten' },
  'Sin Lácteos': { key: 'dairyFree', label: 'Sin Lácteos' },
  'Alergia al Maní': { key: 'peanutFree', label: 'Sin Maní' },
  'Alergia a Mariscos': { key: 'shellfishFree', label: 'Sin Mariscos' },
  'Sin Soya': { key: 'soyFree', label: 'Sin Soya' },
};

function flattenBrandCatalog() {
  return Object.values(SAFE_BRANDS)
    .filter(Array.isArray)
    .flat()
    .map(brand => ({
      ...brand,
      normalizedName: normalizeBrandName(brand.name),
    }));
}

function getRequiredSafetyChecks(profile) {
  profile = withFoodPreferences(profile, profile?.foodPreferences);
  const checks = [];

  if (profile.pesachMode) checks.push({ key: 'kosherPassover', label: 'Apto Pésaj' });
  if (profile.religiousDiet === 'Kosher') checks.push({ key: 'kosher', label: 'Apto Kosher' });
  if (profile.religiousDiet === 'Halal') checks.push({ key: 'halal', label: 'Apto Halal' });

  if (profile.dietaryStyle === 'Vegana' || isDietSelected(profile, 'vegan')) {
    checks.push({ key: 'vegan', label: 'Vegano' });
  } else if (profile.dietaryStyle === 'Vegetariana' || isDietSelected(profile, 'vegetarian')) {
    checks.push({ anyOf: ['vegetarian', 'vegan'], label: 'Vegetariano' });
  }

  return [
    ...checks,
    ...(profile.allergies || []).map(allergy => ALLERGY_RULES[allergy]).filter(Boolean),
  ];
}

export function normalizeBrandName(name = '') {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function findBrandByName(name) {
  const normalized = normalizeBrandName(name);
  if (!normalized) return null;

  return flattenBrandCatalog().find(brand =>
    brand.normalizedName === normalized ||
    brand.normalizedName.includes(normalized) ||
    normalized.includes(brand.normalizedName)
  ) || null;
}

export function getRelevantBrandCategories(profile) {
  profile = withFoodPreferences(profile, profile?.foodPreferences);
  const cats = [];
  if (profile.pesachMode) cats.push('pesach');
  if (profile.religiousDiet === 'Kosher') cats.push('kosher');
  if (profile.religiousDiet === 'Halal') cats.push('halal');
  if (profile.dietaryStyle === 'Vegana' || isDietSelected(profile, 'vegan')) cats.push('vegan');
  if (profile.dietaryStyle === 'Vegetariana' || isDietSelected(profile, 'vegetarian')) cats.push('vegetariana');
  if (profile.sportType === 'Fuerza/Powerlifting' || profile.useProteinPowder || isDietSelected(profile, 'high_protein')) cats.push('powerlifting');
  return [...new Set(cats)];
}

export function buildAbsoluteGuardrail(profile) {
  profile = withFoodPreferences(profile, profile?.foodPreferences);
  const rules = [];
  const foodPreferenceLines = getFoodPreferenceSummaryLines(profile);
  if (profile.religiousDiet && profile.religiousDiet !== 'Ninguna') rules.push(`Dieta religiosa: ${profile.religiousDiet}`);
  if (profile.dietaryStyle && profile.dietaryStyle !== 'Ninguna') rules.push(`Estilo: ${profile.dietaryStyle}`);
  if (profile.allergies?.length) rules.push(`Alergias: ${profile.allergies.join(', ')}`);
  if (foodPreferenceLines.length) rules.push(`Core: ${foodPreferenceLines.join(', ')}`);
  if (profile.dislikes?.length) rules.push(`Ingredientes que no le gustan: ${profile.dislikes.join(', ')}`);
  if (profile.pesachMode) rules.push('Modo Pésaj activo');

  if (!rules.length) return '';

  return `GUARDRAIL ABSOLUTO:
Si el usuario tiene una restricción por Alergia, Dieta Religiosa o Estilo Vegetariano/Vegano, estas reglas INVALIDAN cualquier otra sugerencia.
CONSIDERA ESTO UNA ORDEN: Bajo ninguna circunstancia sugieras ingredientes presentes en la lista de Alergias del usuario.
Si la receta tradicionalmente lleva ese ingrediente, SUSTITUYELO automaticamente por una alternativa segura y coherente.
NO sugieras marcas que no tengan certificación Kosher si el modo está activo, ni ingredientes con alérgenos declarados, incluso si son económicos.
Restricciones activas: ${rules.join(' | ')}.
ORDEN DE PRIORIDAD EN CONFLICTOS: Prioridad 1: Alergias. Prioridad 2: Dieta Religiosa (Kosher/Pésaj). Prioridad 3: Estilo de vida (Vegano/Vegetariano). Si hay conflicto entre restricciones, la restricción de salud/religión siempre domina sobre la de estilo de vida.${profile.pesachMode ? `
MODO PÉSAJ ACTIVO: PROHIBIDO sugerir cualquier ingrediente Jametz (trigo, cebada, centeno, avena, espelta, levadura, polvo de hornear, bicarbonato). ${profile.allowsKitniot === false ? 'SIN KITNIOT: también prohibidos arroz, legumbres, maíz, soja y sus derivados.' : 'Kitniot permitido (tradición sefardí): arroz y legumbres son aceptables.'} Si la receta original requiere estos ingredientes, DEBES reemplazarlos obligatoriamente por alternativas aptas para Pésaj.` : ''}`;
}

export function isBrandCompatibleWithProfile(brand, profile) {
  if (!brand) return false;

  const catalogBrand = findBrandByName(brand.name || brand);
  const target = catalogBrand || brand;
  const safety = target.safety || {};
  const checks = getRequiredSafetyChecks(profile);

  if (!checks.length) return true;

  return checks.every(check => {
    if (check.key) return safety[check.key] === true;
    if (check.anyOf) return check.anyOf.some(key => safety[key] === true);
    return true;
  });
}

export function getBrandSafetyReasons(brand, profile) {
  const catalogBrand = findBrandByName(brand.name || brand);
  const target = catalogBrand || brand;
  const safety = target?.safety || {};
  const checks = getRequiredSafetyChecks(profile);

  if (!checks.length) {
    const fallback = [];
    if (target?.category === 'powerlifting') fallback.push('Rendimiento');
    if (target?.category === 'vegan') fallback.push('Vegetal');
    if (target?.category === 'kosher') fallback.push('Kosher');
    if (target?.category === 'halal') fallback.push('Halal');
    return fallback.slice(0, 2);
  }

  return checks.flatMap(check => {
    if (check.key && safety[check.key] === true) return [check.label];
    if (check.anyOf && check.anyOf.some(key => safety[key] === true)) return [check.label];
    return [];
  });
}

export function normalizeAndFilterBrandsForProfile(brands, profile) {
  return (brands || [])
    .map((brand) => {
      const normalized = typeof brand === 'string'
        ? findBrandByName(brand) || { name: brand, note: '', category: 'general', safety: {} }
        : { ...brand, ...(findBrandByName(brand.name) || {}) };

      return {
        ...normalized,
        reasons: getBrandSafetyReasons(normalized, profile),
      };
    })
    .filter((brand) => isBrandCompatibleWithProfile(brand, profile));
}

// Texto de contexto para incluir en el prompt de Gemini
export function buildBrandContext(profile) {
  const cats = getRelevantBrandCategories(profile);
  if (!cats.length) return '';

  const filteredLines = cats.flatMap(cat => {
    const brands = SAFE_BRANDS[cat];
    if (!Array.isArray(brands)) return [];

    const compatible = normalizeAndFilterBrandsForProfile(brands, profile);
    if (!compatible.length) return [];

    return [`${cat.toUpperCase()}: ${compatible.map(b => b.name).join(', ')}`];
  });

  if (!filteredLines.length) {
    return '\nNo sugieras marcas si no puedes verificar que cumplen las restricciones del usuario.';
  }

  return `\nMARCAS DE REFERENCIA VERIFICADAS (incluye algunas en "marcas_sugeridas" solo si cumplen el guardrail):\n${filteredLines.join('\n')}`;
}

// Etiqueta y color para cada categoría en la UI
export const BRAND_LABELS = {
  pesach: {
    label: 'Pésaj',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  kosher: {
    label: 'Kosher',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  halal: {
    label: 'Halal',
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  vegan: {
    label: 'Vegano',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  },
  vegetariana: {
    label: 'Vegetariano',
    color: 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800',
  },
  powerlifting: {
    label: 'Rendimiento',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  general: {
    label: 'Verificada',
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
};
