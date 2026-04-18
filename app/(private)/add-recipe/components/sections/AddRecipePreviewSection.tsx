import AddRecipeProductPreview from './AddRecipeProductPreview';
import AddRecipeRecipePreview from './AddRecipeRecipePreview';
import type { RecipePreview } from '../../types';

type AddRecipePreviewSectionProps = {
  preview: RecipePreview;
  setPreview: (value: RecipePreview | null) => void;
  setInput: (value: string) => void;
  saveRecipe: () => void;
};

export default function AddRecipePreviewSection({
  preview,
  setPreview,
  setInput,
  saveRecipe,
}: AddRecipePreviewSectionProps) {
  const handleRetryPhoto = () => {
    setPreview(null);
    setInput('');
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {preview.scanType === 'product' ? (
        <AddRecipeProductPreview preview={preview} onRetryPhoto={handleRetryPhoto} />
      ) : (
        <AddRecipeRecipePreview
          preview={preview}
          onClosePreview={() => setPreview(null)}
          onRetry={handleRetryPhoto}
          onSave={saveRecipe}
        />
      )}
    </div>
  );
}
