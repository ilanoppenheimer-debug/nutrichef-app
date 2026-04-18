const COUNTRY_USD_MULTIPLIER = {
  Chile: 950,
  Argentina: 1100,
  México: 17,
  Colombia: 4000,
  Perú: 3.7,
  España: 0.92,
  Uruguay: 39,
  Ecuador: 1,
  Israel: 3.7,
  'Estados Unidos': 1,
  Brasil: 5,
  Venezuela: 36,
  Bolivia: 6.9,
  Paraguay: 7400,
};

const INGREDIENT_PRICE_BOOK = [
  { keywords: ['pollo', 'pechuga'], unit: 'kg', usd: 7, unitWeightKg: 0.2, cupKg: 0.18 },
  { keywords: ['res', 'vacuno', 'carne molida', 'beef'], unit: 'kg', usd: 12, unitWeightKg: 0.18, cupKg: 0.2 },
  { keywords: ['salmon', 'salmón'], unit: 'kg', usd: 16, unitWeightKg: 0.18 },
  { keywords: ['atun', 'atún'], unit: 'can', usd: 1.8, unitWeightKg: 0.14 },
  { keywords: ['jurel'], unit: 'can', usd: 1.5, unitWeightKg: 0.14 },
  { keywords: ['quinoa'], unit: 'kg', usd: 6, cupKg: 0.17 },
  { keywords: ['arroz'], unit: 'kg', usd: 2, cupKg: 0.19 },
  { keywords: ['lenteja', 'garbanzo', 'poroto', 'frijol'], unit: 'kg', usd: 3, cupKg: 0.2 },
  { keywords: ['papa', 'patata'], unit: 'kg', usd: 1.6, unitWeightKg: 0.18 },
  { keywords: ['cebolla'], unit: 'kg', usd: 1.3, unitWeightKg: 0.12 },
  { keywords: ['tomate'], unit: 'kg', usd: 2.2, unitWeightKg: 0.12 },
  { keywords: ['palta', 'aguacate'], unit: 'kg', usd: 4.2, unitWeightKg: 0.2 },
  { keywords: ['huevo'], unit: 'unit', usd: 0.25 },
  { keywords: ['leche'], unit: 'l', usd: 1.3, cupL: 0.24 },
  { keywords: ['crema'], unit: 'l', usd: 3.2, cupL: 0.24 },
  { keywords: ['aceite'], unit: 'l', usd: 7, spoonL: 0.015, tspL: 0.005 },
  { keywords: ['queso'], unit: 'kg', usd: 9, cupKg: 0.12 },
  { keywords: ['yogur', 'yogurt'], unit: 'kg', usd: 4, cupKg: 0.24 },
  { keywords: ['tofu'], unit: 'pack', usd: 3, unitWeightKg: 0.35 },
  { keywords: ['avena'], unit: 'kg', usd: 3, cupKg: 0.09 },
  { keywords: ['manzana', 'platano', 'plátano', 'banana'], unit: 'kg', usd: 2.1, unitWeightKg: 0.16 },
  { keywords: ['espinaca', 'lechuga', 'verdura'], unit: 'kg', usd: 4, cupKg: 0.03 },
  { keywords: ['pan'], unit: 'loaf', usd: 2.5, unitWeightKg: 0.55 },
];

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function parseAmountValue(amount = '') {
  const matches = normalizeText(amount).match(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)/g);
  if (!matches?.length) return 1;

  return matches.reduce((sum, token) => {
    const clean = token.replace(',', '.').trim();
    if (/^\d+\s+\d+\/\d+$/.test(clean)) {
      const [whole, fraction] = clean.split(/\s+/);
      const [num, den] = fraction.split('/').map(Number);
      return sum + Number(whole) + (num / den);
    }
    if (/^\d+\/\d+$/.test(clean)) {
      const [num, den] = clean.split('/').map(Number);
      return sum + (num / den);
    }
    return sum + (Number.parseFloat(clean) || 0);
  }, 0) || 1;
}

function detectAmountUnit(amount = '') {
  const text = normalizeText(amount);
  if (/\bkg|\bkilo/.test(text)) return 'kg';
  if (/\bg\b|\bgram/.test(text)) return 'g';
  if (/\bl\b|\blitro/.test(text)) return 'l';
  if (/\bml\b/.test(text)) return 'ml';
  if (/\blata|\bcan\b/.test(text)) return 'can';
  if (/\btaza|\bcup\b/.test(text)) return 'cup';
  if (/\bcucharada\b/.test(text)) return 'tbsp';
  if (/\bcucharadita\b/.test(text)) return 'tsp';
  if (/\bpan\b/.test(text)) return 'loaf';
  if (/\bpack|\bpaquete/.test(text)) return 'pack';
  return 'unit';
}

function findPriceEntry(name = '') {
  const normalized = normalizeText(name);
  return INGREDIENT_PRICE_BOOK.find(entry => entry.keywords.some(keyword => normalized.includes(keyword))) || null;
}

function convertAmountToCatalogUnit(amountValue, amountUnit, entry) {
  switch (entry.unit) {
    case 'kg':
      if (amountUnit === 'kg') return amountValue;
      if (amountUnit === 'g') return amountValue / 1000;
      if (amountUnit === 'cup') return amountValue * (entry.cupKg || 0.18);
      if (amountUnit === 'unit') return amountValue * (entry.unitWeightKg || 0.12);
      return amountValue * (entry.unitWeightKg || 0.12);
    case 'l':
      if (amountUnit === 'l') return amountValue;
      if (amountUnit === 'ml') return amountValue / 1000;
      if (amountUnit === 'cup') return amountValue * (entry.cupL || 0.24);
      if (amountUnit === 'tbsp') return amountValue * (entry.spoonL || 0.015);
      if (amountUnit === 'tsp') return amountValue * (entry.tspL || 0.005);
      return amountValue;
    case 'can':
    case 'pack':
    case 'loaf':
    case 'unit':
    default:
      return amountValue;
  }
}

export function estimateIngredientCost(ingredient, country = 'Chile') {
  const entry = findPriceEntry(ingredient?.name || '');
  if (!entry) return 0;

  const amountValue = parseAmountValue(ingredient?.amount || '');
  const amountUnit = detectAmountUnit(ingredient?.amount || '');
  const normalizedQuantity = convertAmountToCatalogUnit(amountValue, amountUnit, entry);
  const currencyMultiplier = COUNTRY_USD_MULTIPLIER[country] || 1;

  return normalizedQuantity * entry.usd * currencyMultiplier;
}

export function estimateRecipeCost(ingredients = [], country = 'Chile') {
  return Math.round(
    (ingredients || []).reduce((sum, ingredient) => sum + estimateIngredientCost(ingredient, country), 0)
  );
}
