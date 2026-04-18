import { CheckCircle2, X } from 'lucide-react';
import type { RecipePreview } from '../../types';

type AddRecipeRecipePreviewProps = {
  preview: RecipePreview;
  onClosePreview: () => void;
  onRetry: () => void;
  onSave: () => void;
};

export default function AddRecipeRecipePreview({
  preview,
  onClosePreview,
  onRetry,
  onSave,
}: AddRecipeRecipePreviewProps) {
  return (
    <>
      <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg, var(--c-primary), var(--c-accent))' }}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black">{preview.title}</h3>
            <p className="text-white/80 text-sm mt-1">{preview.description}</p>
          </div>
          <button onClick={onClosePreview} className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="p-5 space-y-5">
        <div className="flex gap-3 pt-2">
          <button
            onClick={onRetry}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-gray-600 text-slate-600 dark:text-slate-300 font-bold text-sm hover:border-slate-400 transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={onSave}
            className="flex-2 flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{ background: 'var(--c-primary)' }}
          >
            <CheckCircle2 size={18} /> Guardar receta
          </button>
        </div>
      </div>
    </>
  );
}
