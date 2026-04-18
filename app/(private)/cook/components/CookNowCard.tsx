import { Flame } from 'lucide-react';

import type { RecipeResultCardRecipe } from '@/components/ui/RecipeResultCard';
import ActionCard from '@/components/ui/ActionCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import RecipeResultCard from '@/components/ui/RecipeResultCard';

import { runCookNowGeneration } from '../utils/runCookNowGeneration';

export default function CookNowCard({
  currentCookNowRecipe,
  cookNowParams,
  isLoading,
  getError,
  generate,
  buildCookNowParams,
  setCurrentCookNowRecipe,
  setViewingRecipe,
}: {
  currentCookNowRecipe: RecipeResultCardRecipe | null;
  cookNowParams: Record<string, unknown>;
  isLoading: (mode: string, params: Record<string, unknown>) => boolean;
  getError: (mode: string, params: Record<string, unknown>) => string | undefined;
  generate: (mode: string, params: object, options?: object) => Promise<unknown>;
  buildCookNowParams: () => Record<string, unknown>;
  setCurrentCookNowRecipe: (r: RecipeResultCardRecipe | null) => void;
  setViewingRecipe: (r: RecipeResultCardRecipe | null) => void;
}) {
  return (
    <ActionCard icon={Flame} title="Cocinar ahora" subtitle="Yo decido qué preparar">
      <PrimaryButton
        onClick={() =>
          runCookNowGeneration({
            buildCookNowParams,
            generate,
            setCurrentCookNowRecipe,
            setViewingRecipe,
          })
        }
        loading={isLoading('cookNow', cookNowParams)}
        loadingLabel="Generando receta..."
      >
        {currentCookNowRecipe ? 'Generar otra receta' : 'Sugerir receta'}
      </PrimaryButton>

      {currentCookNowRecipe != null && (
        <RecipeResultCard
          recipe={currentCookNowRecipe}
          onView={() => setViewingRecipe(currentCookNowRecipe)}
        />
      )}

      {getError('cookNow', cookNowParams) && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
          {getError('cookNow', cookNowParams)}
        </p>
      )}
    </ActionCard>
  );
}
