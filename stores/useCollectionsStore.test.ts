import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn().mockResolvedValue(undefined),
  collection: vi.fn(() => ({})),
}));

import { addDoc, collection } from 'firebase/firestore';

import { useCollectionsStore } from './useCollectionsStore.js';

beforeEach(() => {
  vi.mocked(addDoc).mockClear();
  vi.mocked(collection).mockClear();
  useCollectionsStore.getState().reset();
});

describe('useCollectionsStore', () => {
  it('setFavoriteRecipes acepta valor o función', () => {
    useCollectionsStore.getState().setFavoriteRecipes([{ id: 'a' }]);
    useCollectionsStore.getState().setFavoriteRecipes((prev) => [...prev, { id: 'b' }]);
    expect(useCollectionsStore.getState().favoriteRecipes).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('setPlan acepta valor o función', () => {
    useCollectionsStore.getState().setPlan({ title: 'Semana 1' });
    useCollectionsStore.getState().setPlan((prev) => (prev ? { ...prev, days: 7 } : prev));
    expect(useCollectionsStore.getState().plan).toEqual({ title: 'Semana 1', days: 7 });
  });

  it('saveGeneratedRecipe no hace nada sin título', async () => {
    await useCollectionsStore.getState().saveGeneratedRecipe({}, 'uid', false);
    expect(useCollectionsStore.getState().generatedRecipes).toEqual([]);
    expect(vi.mocked(addDoc)).not.toHaveBeenCalled();
  });

  it('saveGeneratedRecipe añade en local y no llama Firestore en modo local', async () => {
    const recipe = { title: 'Tarta única' };
    await useCollectionsStore.getState().saveGeneratedRecipe(recipe, 'uid-1', true);

    expect(useCollectionsStore.getState().generatedRecipes).toHaveLength(1);
    expect(useCollectionsStore.getState().generatedRecipes[0].title).toBe('Tarta única');
    expect(vi.mocked(addDoc)).not.toHaveBeenCalled();
  });

  it('saveGeneratedRecipe evita duplicados por título', async () => {
    const recipe = { title: 'Misma' };
    await useCollectionsStore.getState().saveGeneratedRecipe(recipe, '', true);
    await useCollectionsStore.getState().saveGeneratedRecipe(recipe, '', true);
    expect(useCollectionsStore.getState().generatedRecipes).toHaveLength(1);
  });

  it('saveGeneratedRecipe con uid y cloud llama addDoc', async () => {
    const recipe = { title: 'Guardar en nube' };
    await useCollectionsStore.getState().saveGeneratedRecipe(recipe, 'user-99', false);

    expect(vi.mocked(addDoc)).toHaveBeenCalledTimes(1);
    const [, payload] = vi.mocked(addDoc).mock.calls[0];
    expect((payload as { title: string }).title).toBe('Guardar en nube');
  });
});
