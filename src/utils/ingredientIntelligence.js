const ALLERGY_KEYWORDS = {
  'Sin Gluten': ['gluten', 'trigo', 'harina', 'pan', 'pasta', 'cebada', 'centeno', 'avena'],
  'Sin Lácteos': ['leche', 'queso', 'mantequilla', 'crema', 'yogur', 'suero', 'lactosa'],
  'Alergia al Maní': ['mani', 'maní', 'cacahuate', 'cacahuete', 'peanut'],
  'Alergia a Mariscos': ['marisco', 'mariscos', 'camaron', 'camarón', 'langostino', 'gamba', 'ostion', 'ostión', 'mejillon', 'mejillón'],
  'Sin Soya': ['soya', 'soja', 'tofu', 'salsa de soja', 'salsa de soya', 'edamame', 'miso'],
};

const SUBSTITUTE_LIBRARY = [
  { keywords: ['cilantro'], substitute: 'Perejil o albahaca' },
  { keywords: ['cebolla'], substitute: 'Cebollín o puerro' },
  { keywords: ['ajo'], substitute: 'Aceite infusionado o cebollín suave' },
  { keywords: ['leche', 'lactosa'], substitute: 'Bebida vegetal sin azúcar' },
  { keywords: ['crema'], substitute: 'Crema vegetal o yogur sin lactosa' },
  { keywords: ['queso'], substitute: 'Queso vegetal o levadura nutricional' },
  { keywords: ['mantequilla'], substitute: 'Aceite de oliva o margarina vegetal' },
  { keywords: ['mani', 'maní', 'cacahuate', 'cacahuete'], substitute: 'Semillas de girasol o almendras seguras' },
  { keywords: ['gluten', 'trigo', 'harina', 'pan', 'pasta'], substitute: 'Arroz, quinoa o mezcla sin gluten' },
  { keywords: ['camaron', 'camarón', 'langostino', 'gamba', 'marisco', 'mariscos'], substitute: 'Pescado blanco, pollo o champiñones' },
  { keywords: ['soya', 'soja', 'tofu'], substitute: 'Legumbres seguras, coco aminos o proteína de arveja' },
  { keywords: ['salmon', 'salmón'], substitute: 'Atún en conserva o jurel' },
  { keywords: ['quinoa'], substitute: 'Arroz integral o cuscús seguro' },
];

export function normalizeIngredientText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitFreeTextTerms(value = '') {
  return String(value || '')
    .split(/[,;\n]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

export function mergeUniqueTerms(existing = [], rawValue = '') {
  const merged = [...(existing || [])];
  const seen = new Set(merged.map(item => normalizeIngredientText(item)));

  for (const term of splitFreeTextTerms(rawValue)) {
    const normalized = normalizeIngredientText(term);
    if (!normalized || seen.has(normalized)) continue;
    merged.push(term);
    seen.add(normalized);
  }

  return merged;
}

function findMatchingKeyword(text, keywords = []) {
  const normalizedText = normalizeIngredientText(text);
  if (!normalizedText) return null;

  return keywords.find(keyword => {
    const normalizedKeyword = normalizeIngredientText(keyword);
    return normalizedKeyword && (
      normalizedText.includes(normalizedKeyword) ||
      normalizedKeyword.includes(normalizedText)
    );
  }) || null;
}

function getCustomAllergyKeywords(allergy) {
  const normalized = normalizeIngredientText(allergy);
  if (!normalized) return [];
  return ALLERGY_KEYWORDS[allergy] || [allergy];
}

export function getAllergyTerms(allergies = []) {
  return [...new Set((allergies || []).flatMap(getCustomAllergyKeywords))];
}

export function inferIngredientSubstitute(name = '', fallbackHint = '') {
  const source = `${name} ${fallbackHint}`.trim();
  for (const entry of SUBSTITUTE_LIBRARY) {
    if (findMatchingKeyword(source, entry.keywords)) {
      return entry.substitute;
    }
  }
  return '';
}

export function normalizeIngredientEntry(entry = {}) {
  if (typeof entry === 'string') {
    return {
      name: entry,
      amount: '',
      substitute: '',
      suggestedSubstitute: '',
      isDislike: false,
      allergyAlert: false,
    };
  }

  const name = entry.name || entry.nombre || entry.ingredient || entry.producto || entry.item || '';
  const cantidad = entry.cantidad || '';
  const unidad = entry.unidad || '';
  // Build amount: prefer explicit field, fall back to combining cantidad+unidad, then legacy amount
  const amount = entry.amount || (cantidad && unidad ? `${cantidad} ${unidad}` : cantidad || unidad) || entry.quantity || '';
  const substitute = entry.suggestedSubstitute || entry.sustituto_sugerido || entry.substitute || entry.sustituto || '';
  const isDislike = Boolean(entry.isDislike ?? entry.is_dislike ?? entry.es_dislike);
  const allergyAlert = Boolean(entry.allergyAlert ?? entry.alerta_alergia);

  return {
    ...entry,
    name,
    cantidad,
    unidad,
    amount,
    substitute,
    suggestedSubstitute: substitute,
    isDislike,
    allergyAlert,
    es_seguro_kosher: Boolean(entry.es_seguro_kosher),
    es_seguro_halal: Boolean(entry.es_seguro_halal),
    marca_sugerida: entry.marca_sugerida || '',
  };
}

export function annotateIngredientEntry(entry, profile = {}) {
  const ingredient = normalizeIngredientEntry(entry);
  const dislikeMatch = (profile.dislikes || []).find(term => findMatchingKeyword(ingredient.name, [term]));
  const allergyTerms = getAllergyTerms(profile.allergies || []);
  const allergyMatch = allergyTerms.find(term => findMatchingKeyword(ingredient.name, [term]));
  const suggestedSubstitute = ingredient.suggestedSubstitute || inferIngredientSubstitute(ingredient.name, `${dislikeMatch || ''} ${allergyMatch || ''}`);

  return {
    ...ingredient,
    substitute: suggestedSubstitute,
    suggestedSubstitute,
    isDislike: ingredient.isDislike || Boolean(dislikeMatch),
    allergyAlert: ingredient.allergyAlert || Boolean(allergyMatch),
    matchedDislike: dislikeMatch || null,
    matchedAllergy: allergyMatch || null,
    isFlagged: (ingredient.isDislike || Boolean(dislikeMatch)) || (ingredient.allergyAlert || Boolean(allergyMatch)),
  };
}

export function annotateRecipeIngredients(recipe, profile = {}) {
  const ingredients = (recipe?.ingredients || recipe?.ingredientes || []).map(item => annotateIngredientEntry(item, profile));
  const dislikeCount = ingredients.filter(item => item.isDislike).length;
  const allergyCount = ingredients.filter(item => item.allergyAlert).length;

  return {
    ingredients,
    dislikeCount,
    allergyCount,
    flaggedCount: dislikeCount + allergyCount,
  };
}

export function normalizeRecipePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;

  const rawIngredients = payload.ingredients || payload.ingredientes || [];
  const rawSteps = payload.steps || payload.pasos || [];

  return {
    ...payload,
    title: payload.title || payload.titulo || payload.nombre || '',
    description: payload.description || payload.descripcion || '',
    prepTime: payload.prepTime || payload.tiempoPreparacion || '',
    cookTime: payload.cookTime || payload.tiempoCoccion || '',
    cuisine: payload.cuisine || payload.cocina || '',
    servings: payload.servings || payload.porciones || '',
    ingredients: rawIngredients.map(normalizeIngredientEntry),
    steps: rawSteps.map(step => {
      if (typeof step === 'string') return step;
      return step?.text || step?.texto || JSON.stringify(step);
    }),
    tips: payload.tips || payload.tip || payload.consejos || '',
    scanType: payload.scanType || payload.tipoEscaneo || '',
    safetyAlert: payload.safetyAlert || payload.alertaSeguridad || null,
    detectedAllergens: payload.detectedAllergens || payload.alergenosDetectados || [],
    detectedDislikes: payload.detectedDislikes || payload.preferenciasDetectadas || [],
  };
}

export function applyShoppingListSafetySwaps(shoppingList, profile = {}) {
  if (!shoppingList?.categories) return shoppingList;

  return {
    ...shoppingList,
    categories: shoppingList.categories.map(category => ({
      ...category,
      items: (category.items || []).map(item => {
        const baseItem = typeof item === 'string' ? { name: item } : item;
        const annotated = annotateIngredientEntry(baseItem, profile);

        if (!annotated.isFlagged || !annotated.suggestedSubstitute) {
          return typeof item === 'string' ? annotated.name : { ...item, name: annotated.name };
        }

        const swapNote = `Sustituido por seguridad: ${annotated.name} → ${annotated.suggestedSubstitute}`;
        if (typeof item === 'string') return annotated.suggestedSubstitute;

        return {
          ...item,
          name: annotated.suggestedSubstitute,
          substituteFor: annotated.name,
          allergyAlert: annotated.allergyAlert,
          isDislike: annotated.isDislike,
          budgetTip: item.budgetTip ? `${item.budgetTip} · ${swapNote}` : swapNote,
        };
      }),
    })),
  };
}
