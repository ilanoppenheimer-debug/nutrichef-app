import { Camera, Plus, RefreshCw, ShoppingBag } from 'lucide-react';
import type { ChangeEvent, RefObject } from 'react';

import type { RecipeResultCardRecipe } from '@/components/ui/RecipeResultCard';
import ActionCard from '@/components/ui/ActionCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import RecipeResultCard from '@/components/ui/RecipeResultCard';

import { SUGGESTED_INGREDIENTS } from '../constants';
import { runIngredientsGeneration } from '../utils/runIngredientsGeneration';

export default function CookIngredientsCard({
  ingredientes,
  setIngredientes,
  ingredientsExpanded,
  setIngredientsExpanded,
  scanning,
  fileInputRef,
  currentIngredientsRecipe,
  ingredientsParams,
  isLoading,
  getError,
  generate,
  buildIngredientsParams,
  setCurrentIngredientsRecipe,
  setViewingRecipe,
  addIngredient,
  handleImageScan,
}: {
  ingredientes: string;
  setIngredientes: (v: string | ((p: string) => string)) => void;
  ingredientsExpanded: boolean;
  setIngredientsExpanded: (v: boolean) => void;
  scanning: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  currentIngredientsRecipe: RecipeResultCardRecipe | null;
  ingredientsParams: Record<string, unknown>;
  isLoading: (mode: string, params: Record<string, unknown>) => boolean;
  getError: (mode: string, params: Record<string, unknown>) => string | undefined;
  generate: (mode: string, params: object, options?: object) => Promise<unknown>;
  buildIngredientsParams: () => Record<string, unknown>;
  setCurrentIngredientsRecipe: (r: RecipeResultCardRecipe | null) => void;
  setViewingRecipe: (r: RecipeResultCardRecipe | null) => void;
  addIngredient: (item: string) => void;
  handleImageScan: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <ActionCard
      icon={ShoppingBag}
      title="Tengo ingredientes"
      subtitle="Dime qué tienes y resuelvo el resto"
    >
      {!ingredientsExpanded && !ingredientes.trim() && !currentIngredientsRecipe ? (
        <button
          type="button"
          onClick={() => setIngredientsExpanded(true)}
          className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold border-2 border-dashed border-slate-200 dark:border-gray-700 text-slate-500 dark:text-slate-400 active:scale-[0.98] transition-transform"
        >
          <Plus size={16} strokeWidth={2.5} /> Agregar ingredientes
        </button>
      ) : (
        <>
          <div className="relative">
            <textarea
              value={ingredientes}
              onChange={(e) => setIngredientes(e.target.value)}
              placeholder="Ej: pollo, arroz, zanahoria..."
              rows={2}
              className="w-full px-4 py-3 pb-10 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:outline-none focus:border-[--c-primary-border] transition-colors"
              autoFocus={ingredientsExpanded && !ingredientes.trim()}
            />
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageScan} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-500 dark:text-slate-300 active:scale-95 transition-all"
            >
              {scanning ? <RefreshCw size={12} className="animate-spin" /> : <Camera size={12} />}
              {scanning ? 'Escaneando...' : 'Escanear foto'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_INGREDIENTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => addIngredient(item)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-gray-700 active:scale-95 transition-transform"
              >
                <Plus size={11} strokeWidth={3} /> {item}
              </button>
            ))}
          </div>

          <PrimaryButton
            onClick={() =>
              runIngredientsGeneration({
                ingredientes,
                buildIngredientsParams,
                generate,
                setCurrentIngredientsRecipe,
                setViewingRecipe,
              })
            }
            disabled={!ingredientes.trim()}
            loading={isLoading('ingredients', ingredientsParams)}
            loadingLabel="Generando receta..."
          >
            {currentIngredientsRecipe ? 'Generar otra receta' : '¿Qué puedo cocinar?'}
          </PrimaryButton>
        </>
      )}

      {currentIngredientsRecipe != null && (
        <RecipeResultCard
          recipe={currentIngredientsRecipe}
          onView={() => setViewingRecipe(currentIngredientsRecipe)}
        />
      )}

      {getError('ingredients', ingredientsParams) && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
          {getError('ingredients', ingredientsParams)}
        </p>
      )}
    </ActionCard>
  );
}
