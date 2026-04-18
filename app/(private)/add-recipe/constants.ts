import { Camera, Globe, Type } from 'lucide-react';
import InstagramIcon from './components/InstagramIcon';
import type { AddRecipeModeOption } from './types';

export const SCAN_SCHEMA = `{
  "scanType": "recipe|product",
  "safetyAlert": { "headline": "¡CUIDADO! Contiene [alérgeno]", "detectedAllergens": ["..."], "detectedDislikes": ["..."] },
  "title": "Nombre del plato o producto",
  "description": "Descripción breve",
  "prepTime": "XX min",
  "cookTime": "XX min",
  "cuisine": "Tipo de cocina",
  "servings": "X porciones",
  "ingredients": [{ "name": "ingrediente", "amount": "cantidad", "substitute": "sustituto opcional", "suggestedSubstitute": "sustituto inmediato", "isDislike": false, "allergyAlert": false }],
  "steps": ["Paso 1...", "Paso 2..."],
  "macros": { "calories": "aprox kcal", "protein": "Xg", "carbs": "Xg", "fat": "Xg", "fiber": "Xg" },
  "tips": "Consejo de cocina"
}`;

export const PLACEHOLDERS: Record<string, string> = {
  text: 'Pega aquí la receta completa — ingredientes, cantidades, pasos...\n\nEj:\nTortilla de patatas\n\nIngredientes:\n- 3 huevos\n- 2 patatas medianas\n- 1/2 cebolla\n...',
  url: 'https://www.recetasgratis.net/...',
  instagram: 'Pega aquí el caption o descripción del post de Instagram con la receta...',
};

export const MODES: AddRecipeModeOption[] = [
  { id: 'text', label: 'Texto libre', icon: Type, description: 'Pega cualquier receta escrita' },
  { id: 'url', label: 'URL web', icon: Globe, description: 'Link de cualquier receta online' },
  { id: 'instagram', label: 'Instagram', description: 'Descripción del post o caption', icon: InstagramIcon },
  { id: 'photo', label: 'Foto', icon: Camera, description: 'Escanea una receta o producto' },
];

export const ADD_RECIPE_UI = {
  pageTitle: 'Agregar Receta',
  subtitle: 'La IA extrae y calcula los macros automáticamente.',
  back: 'Volver',
} as const;

export const ADD_RECIPE_MESSAGES = {
  emptyInput: 'Ingresa el contenido antes de continuar.',
  recipeProcessingError: 'Error al procesar la receta.',
  photoProcessingError: 'Error al procesar la foto.',
} as const;

/** Retraso antes de navegar a guardados tras guardar */
export const ADD_RECIPE_SAVED_REDIRECT_MS = 1200;
