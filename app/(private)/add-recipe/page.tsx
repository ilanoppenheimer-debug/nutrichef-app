'use client';

import { useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/stores/useProfileStore.js';
import { useCollectionsStore } from '@/stores/useCollectionsStore.js';
import { ROUTES } from '@/lib/routes.js';
import { extractRecipeFromPhoto, extractRecipeFromText } from './hooks/useRecipeExtraction';
import AddRecipeConditionalContent from './components/sections/AddRecipeConditionalContent';
import AddRecipeModeSelector from './components/sections/AddRecipeModeSelector';
import type { AddRecipeMode, RecipePreview } from './types';
import { ADD_RECIPE_MESSAGES, ADD_RECIPE_SAVED_REDIRECT_MS, ADD_RECIPE_UI } from './constants';

type SavedRecipe = RecipePreview & {
  title: string;
  addedAt?: string;
};

export default function AddRecipeView() {
  const profile = useProfileStore((s: any) => s.profile) as unknown;
  const savedRecipes = useCollectionsStore((s: any) => s.savedRecipes) as SavedRecipe[];
  const setSavedRecipes = useCollectionsStore((s: any) => s.setSavedRecipes) as (recipes: SavedRecipe[]) => void;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<AddRecipeMode>('text');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<RecipePreview | null>(null); // receta parseada antes de guardar
  const [saved, setSaved] = useState(false);

  const extractRecipe = async () => {
    if (!input.trim() && mode !== 'photo') {
      setError(ADD_RECIPE_MESSAGES.emptyInput);
      return;
    }
    if (mode === 'photo') return;
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const nextPreview = await extractRecipeFromText(mode, input, profile);
      setPreview(nextPreview);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : ADD_RECIPE_MESSAGES.recipeProcessingError);
    } finally {
      setLoading(false);
    }
  };

  const extractFromPhoto = async (file: File) => {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const nextPreview = await extractRecipeFromPhoto(file, profile);
      setPreview(nextPreview);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : ADD_RECIPE_MESSAGES.photoProcessingError);
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = () => {
    if (!preview || preview.scanType === 'product') return;
    const previewTitle = typeof preview.title === 'string' ? preview.title : '';
    if (!previewTitle) return;
    const alreadyExists = savedRecipes.some((recipe) => recipe.title === previewTitle);
    if (!alreadyExists) {
      setSavedRecipes([...savedRecipes, { ...preview, title: previewTitle, addedAt: new Date().toISOString() }]);
    }
    setSaved(true);
    setTimeout(() => router.push(ROUTES.saved), ADD_RECIPE_SAVED_REDIRECT_MS);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="mb-3 flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--c-primary)' }}>
          <ChevronRight className="rotate-180" size={16} /> {ADD_RECIPE_UI.back}
        </button>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">{ADD_RECIPE_UI.pageTitle}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{ADD_RECIPE_UI.subtitle}</p>
      </div>

      <AddRecipeModeSelector
        mode={mode}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          setInput('');
          setError(null);
          setPreview(null);
          setSaved(false);
        }}
      />

      <AddRecipeConditionalContent
        mode={mode}
        input={input}
        loading={loading}
        error={error}
        preview={preview}
        saved={saved}
        fileInputRef={fileInputRef}
        setInput={setInput}
        setPreview={setPreview}
        extractFromPhoto={extractFromPhoto}
        extractRecipe={extractRecipe}
        saveRecipe={saveRecipe}
      />
    </div>
  );
}


