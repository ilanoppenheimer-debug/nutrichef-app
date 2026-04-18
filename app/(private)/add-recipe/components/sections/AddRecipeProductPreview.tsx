import type { RecipePreview } from '../../types';

type AddRecipeProductPreviewProps = {
  preview: RecipePreview;
  onRetryPhoto: () => void;
};

export default function AddRecipeProductPreview({ preview, onRetryPhoto }: AddRecipeProductPreviewProps) {
  return (
    <div className="p-5 space-y-4">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="text-xl font-black text-red-700 dark:text-red-300">
          {preview.safetyAlert?.headline || '¡CUIDADO! Revisa este producto'}
        </h3>
        <p className="mt-2 text-sm text-red-700/80 dark:text-red-300/80">
          {preview.description || 'Detectamos ingredientes que podrían entrar en conflicto con tus alergias o preferencias.'}
        </p>
      </div>
      <button
        onClick={onRetryPhoto}
        className="w-full py-3 rounded-xl border-2 border-slate-200 dark:border-gray-600 text-slate-600 dark:text-slate-300 font-bold text-sm hover:border-slate-400 transition-colors"
      >
        Escanear otra foto
      </button>
    </div>
  );
}
