const UNICODE_FRACTIONS = {
  '¼': '1/4',
  '½': '1/2',
  '¾': '3/4',
  '⅓': '1/3',
  '⅔': '2/3',
  '⅛': '1/8',
};

function normalizeFractions(text = '') {
  return Object.entries(UNICODE_FRACTIONS).reduce(
    (acc, [symbol, replacement]) => acc.replaceAll(symbol, ` ${replacement}`),
    String(text || '')
  );
}

function parseNumericToken(token) {
  const clean = token.trim().replace(',', '.');
  if (!clean) return null;

  if (/^\d+\s+\d+\/\d+$/.test(clean)) {
    const [whole, fraction] = clean.split(/\s+/);
    const [num, den] = fraction.split('/').map(Number);
    if (!den) return null;
    return Number(whole) + (num / den);
  }

  if (/^\d+\/\d+$/.test(clean)) {
    const [num, den] = clean.split('/').map(Number);
    if (!den) return null;
    return num / den;
  }

  const parsed = Number.parseFloat(clean);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatScaledNumber(value) {
  if (!Number.isFinite(value)) return '';

  const rounded = Math.round(value * 100) / 100;
  const whole = Math.round(rounded);
  if (Math.abs(rounded - whole) < 0.02) return String(whole);

  const fractionMap = [
    { decimal: 0.25, label: '1/4' },
    { decimal: 0.33, label: '1/3' },
    { decimal: 0.5, label: '1/2' },
    { decimal: 0.67, label: '2/3' },
    { decimal: 0.75, label: '3/4' },
  ];

  const integerPart = Math.floor(rounded);
  const decimalPart = rounded - integerPart;
  const matchedFraction = fractionMap.find(({ decimal }) => Math.abs(decimalPart - decimal) < 0.04);

  if (matchedFraction) {
    return integerPart > 0 ? `${integerPart} ${matchedFraction.label}` : matchedFraction.label;
  }

  return rounded.toFixed(1).replace('.0', '').replace('.', ',');
}

export function parseServingsCount(servings) {
  if (typeof servings === 'number' && Number.isFinite(servings)) {
    return Math.max(1, Math.round(servings));
  }

  const raw = String(servings || '').trim();
  if (!raw) return 1;
  const match = normalizeFractions(raw).match(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)/);
  const parsed = match ? parseNumericToken(match[1]) : Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.round(parsed));
}

export function clampServings(value, min = 1, max = 12) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function scaleQuantityText(amount, factor) {
  if (!amount || factor === 1) return amount;

  const normalized = normalizeFractions(amount);
  return normalized.replace(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)/g, (match) => {
    const parsed = parseNumericToken(match);
    if (!Number.isFinite(parsed)) return match;
    return formatScaledNumber(parsed * factor);
  }).replace(/\s+/g, ' ').trim();
}

export function scaleNutritionLabel(value, factor) {
  if (!value || factor === 1) return value;
  const normalized = normalizeFractions(value);
  return normalized.replace(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)/g, (match) => {
    const parsed = parseNumericToken(match);
    if (!Number.isFinite(parsed)) return match;
    return formatScaledNumber(parsed * factor);
  });
}
