export const GEMINI_API_ENDPOINT = '/api/gemini';
export const GEMINI_COOLDOWN_KEY = 'nutrichef_gemini_cooldown_until';
export const GEMINI_COOLDOWN_MS = 5 * 1000;
export const GENERATOR_SUGGESTIONS_CACHE_KEY = 'nutrichef_generator_suggestions_cache';
export const GENERATOR_RECIPE_CACHE_KEY = 'nutrichef_generator_recipe_cache';

export function readStoredJson(key, fallbackValue) {
  if (typeof window === 'undefined') {
    return fallbackValue;
  }

  const storedValue = window.localStorage.getItem(key);

  if (!storedValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`No se pudo leer ${key} desde localStorage:`, error);
    return fallbackValue;
  }
}

export function writeStoredJson(key, value) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`No se pudo guardar ${key} en localStorage:`, error);
  }
}

export function getGeminiCooldownUntil() {
  const storedValue = readStoredJson(GEMINI_COOLDOWN_KEY, 0);
  const numericValue = Number(storedValue);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function setGeminiCooldownUntil(timestamp) {
  writeStoredJson(GEMINI_COOLDOWN_KEY, timestamp);
}

export function getCooldownMessage(cooldownUntil) {
  const remainingMs = Math.max(0, cooldownUntil - Date.now());
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  return `Gemini esta en pausa por limite de solicitudes. Espera ${remainingMinutes} min antes de intentar otra vez.`;
}

export function buildGeneratorSuggestionsCacheKey({ ingredients, dishType, difficulty, cuisine, profile }) {
  return JSON.stringify({
    ingredients: ingredients.trim().toLowerCase(),
    dishType,
    difficulty,
    cuisine,
    budgetFriendly: profile.budgetFriendly,
    goals: profile.goals,
    dietaryStyle: profile.dietaryStyle,
    religiousDiet: profile.religiousDiet,
    allergies: profile.allergies,
    dislikes: profile.dislikes,
    learnedPreferences: profile.learnedPreferences,
    favoriteTitles: profile.favoriteTitles || [],
    dailyCalories: profile.dailyCalories,
  });
}

export function buildGeneratorRecipeCacheKey({ suggestion, ingredients, profile }) {
  return JSON.stringify({
    suggestionName: suggestion.name,
    suggestionType: suggestion.type,
    suggestionDescription: suggestion.description,
    ingredients: ingredients.trim().toLowerCase(),
    goals: profile.goals,
    dietaryStyle: profile.dietaryStyle,
    religiousDiet: profile.religiousDiet,
    allergies: profile.allergies,
    dislikes: profile.dislikes,
    learnedPreferences: profile.learnedPreferences,
    useProteinPowder: profile.useProteinPowder,
    dailyCalories: profile.dailyCalories,
    proteinTarget: profile.proteinTarget,
    fiberTarget: profile.fiberTarget,
  });
}

export async function fetchGeminiContent({ kind, payload }) {
  const cooldownUntil = getGeminiCooldownUntil();

  if (cooldownUntil > Date.now()) {
    throw new Error(getCooldownMessage(cooldownUntil));
  }

  const response = await fetch(GEMINI_API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, payload })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error || 'No se pudo completar la solicitud a Gemini.';

    if (response.status === 429) {
      const nextCooldownUntil = Date.now() + GEMINI_COOLDOWN_MS;
      setGeminiCooldownUntil(nextCooldownUntil);
      throw new Error(`${message} ${getCooldownMessage(nextCooldownUntil)} Si el problema persiste, revisa la cuota o rota la API key del servidor.`);
    }

    throw new Error(message);
  }

  return data;
}

export async function callGeminiAPI(promptText) {
  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  try {
    const data = await fetchGeminiContent({ kind: 'text', payload });
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
      throw new Error('La IA no devolvio ningun texto.');
    }

    const cleanText = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Fallo general en la conexion con la IA:', error);
    throw error;
  }
}

export async function callGeminiVisionAPI(promptText, base64Image, mimeType) {
  const payload = {
    contents: [{
      role: 'user',
      parts: [
        { text: promptText },
        { inlineData: { mimeType, data: base64Image } }
      ]
    }]
  };

  const data = await fetchGeminiContent({ kind: 'vision', payload });
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
