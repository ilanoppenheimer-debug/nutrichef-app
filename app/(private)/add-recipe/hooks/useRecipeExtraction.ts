import { normalizeRecipePayload } from '@/lib/gemini.js';
import { buildPrompt, buildVisionPrompt } from '../utils/prompts';
import type { AddRecipeTextMode, RecipePreview } from '../types';

function extractJsonText(text: string, fallbackMessage: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(fallbackMessage);
  return normalizeRecipePayload(JSON.parse(match[0])) as RecipePreview;
}

export async function extractRecipeFromText(mode: AddRecipeTextMode, input: string, profile: unknown) {
  const promptText = buildPrompt(mode, input, profile);
  const payload = {
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    generationConfig: { temperature: 0.3 },
  };

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'text', payload }),
  });
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return extractJsonText(text, 'La IA no pudo extraer la receta. Intenta con más detalle.');
}

export async function extractRecipeFromPhoto(file: File, profile: unknown) {
  const base64Data = await new Promise<string>((res, rej) => {
    const reader = new FileReader();
    reader.onloadend = () => res(String(reader.result).split(',')[1]);
    reader.onerror = () => rej(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });

  const payload = {
    contents: [{
      role: 'user',
      parts: [
        { text: buildVisionPrompt(profile) },
        { inlineData: { mimeType: file.type, data: base64Data } },
      ],
    }],
  };

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'vision', payload }),
  });
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return extractJsonText(text, 'No se pudo extraer la receta de la foto.');
}
