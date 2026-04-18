import type { RefObject } from 'react';
import AddRecipeInputSection from './AddRecipeInputSection';
import AddRecipePreviewSection from './AddRecipePreviewSection';
import type { AddRecipeMode, RecipePreview } from '../../types';

type Props = {
  mode: AddRecipeMode;
  input: string;
  loading: boolean;
  error: string | null;
  preview: RecipePreview | null;
  saved: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  setInput: (value: string) => void;
  setPreview: (value: RecipePreview | null) => void;
  extractFromPhoto: (file: File) => Promise<void>;
  extractRecipe: () => Promise<void>;
  saveRecipe: () => void;
};

export default function AddRecipeConditionalContent({
  mode,
  input,
  loading,
  error,
  preview,
  saved,
  fileInputRef,
  setInput,
  setPreview,
  extractFromPhoto,
  extractRecipe,
  saveRecipe,
}: Props) {
  return (
    <>
      {!preview && (
        <AddRecipeInputSection
          mode={mode}
          input={input}
          loading={loading}
          error={error}
          fileInputRef={fileInputRef}
          setInput={setInput}
          extractFromPhoto={extractFromPhoto}
          extractRecipe={extractRecipe}
        />
      )}

      {preview && !saved && <AddRecipePreviewSection preview={preview} setPreview={setPreview} setInput={setInput} saveRecipe={saveRecipe} />}

      {saved && (
        <div className="text-center py-10 animate-in fade-in">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">¡Receta guardada!</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Redirigiendo a tus guardados...</p>
        </div>
      )}
    </>
  );
}
