import { Camera, RefreshCw, X } from 'lucide-react';
import type { RefObject } from 'react';
import { PLACEHOLDERS } from '../../constants';
import type { AddRecipeMode } from '../../types';

type AddRecipeInputSectionProps = {
  mode: AddRecipeMode;
  input: string;
  loading: boolean;
  error: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  setInput: (value: string) => void;
  extractFromPhoto: (file: File) => Promise<void>;
  extractRecipe: () => Promise<void>;
};

export default function AddRecipeInputSection({
  mode,
  input,
  loading,
  error,
  fileInputRef,
  setInput,
  extractFromPhoto,
  extractRecipe,
}: AddRecipeInputSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 space-y-4">
      {mode === 'photo' ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-2xl p-10 text-center cursor-pointer hover:border-[--c-primary] transition-colors"
        >
          <Camera size={40} className="mx-auto mb-3 text-slate-400" />
          <p className="font-semibold text-slate-600 dark:text-slate-300">Toca para subir una foto</p>
          <p className="text-xs text-slate-400 mt-1">Puede ser receta escrita, empaque o etiqueta de ingredientes.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) extractFromPhoto(file);
            }}
          />
        </div>
      ) : mode === 'url' ? (
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">URL de la receta</label>
          <input
            type="url"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDERS.url}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && extractRecipe()}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Funciona mejor con páginas que tengan el texto de la receta visible. Algunos sitios bloquean el acceso externo.
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {mode === 'instagram' ? 'Caption de Instagram' : 'Texto de la receta'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDERS[mode] ?? PLACEHOLDERS.text}
            rows={10}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 text-sm resize-none"
          />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-sm border border-red-200 dark:border-red-800">
          <X size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {mode !== 'photo' && (
        <button
          onClick={extractRecipe}
          disabled={loading || !input.trim()}
          className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--c-primary)' }}
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : null}
          {loading ? 'Analizando con IA...' : 'Extraer receta'}
        </button>
      )}

      {loading && mode === 'photo' && (
        <div className="text-center py-4 text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
          <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--c-primary)' }} />
          <p className="text-sm">Analizando la foto...</p>
        </div>
      )}
    </div>
  );
}
