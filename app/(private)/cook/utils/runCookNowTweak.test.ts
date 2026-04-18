import { describe, expect, it, vi } from 'vitest';

import { runCookNowTweak } from './runCookNowTweak';

function baseDeps(overrides: Partial<Parameters<typeof runCookNowTweak>[0]> = {}) {
  return {
    currentCookNowRecipe: { id: 'r1' },
    cookNowTweakingType: null,
    buildCookNowParams: () => ({ base: true }),
    generate: vi.fn(),
    setCurrentCookNowRecipe: vi.fn(),
    setViewingRecipe: vi.fn(),
    setCookNowTweakingType: vi.fn(),
    ...overrides,
  };
}

describe('runCookNowTweak', () => {
  it('no hace nada sin receta actual', async () => {
    const deps = baseDeps({ currentCookNowRecipe: null });
    await runCookNowTweak(deps as never, 'más_rápido');
    expect(deps.generate).not.toHaveBeenCalled();
    expect(deps.setCookNowTweakingType).not.toHaveBeenCalled();
  });

  it('no hace nada si ya hay tweak en curso', async () => {
    const deps = baseDeps({ cookNowTweakingType: 'busy' });
    await runCookNowTweak(deps as never, 'otro');
    expect(deps.generate).not.toHaveBeenCalled();
  });

  it('llama generate con cookNow, change_type y previousRecipe', async () => {
    const current = { id: 'cur' };
    const next = { id: 'next' };
    const generate = vi.fn().mockResolvedValue(next);
    const setTweak = vi.fn();
    const setCur = vi.fn();
    const setView = vi.fn();

    await runCookNowTweak(
      {
        currentCookNowRecipe: current,
        cookNowTweakingType: null,
        buildCookNowParams: () => ({ a: 1 }),
        generate,
        setCurrentCookNowRecipe: setCur,
        setViewingRecipe: setView,
        setCookNowTweakingType: setTweak,
      },
      'ligero',
    );

    expect(setTweak).toHaveBeenNthCalledWith(1, 'ligero');
    expect(generate).toHaveBeenCalledWith(
      'cookNow',
      { a: 1, change_type: 'ligero' },
      { previousRecipe: current },
    );
    expect(setCur).toHaveBeenCalledWith(next);
    expect(setView).toHaveBeenCalledWith(next);
    expect(setTweak).toHaveBeenLastCalledWith(null);
  });

  it('resetea tweaking aunque generate devuelva falsy', async () => {
    const generate = vi.fn().mockResolvedValue(null);
    const setTweak = vi.fn();
    await runCookNowTweak(
      {
        currentCookNowRecipe: {},
        cookNowTweakingType: null,
        buildCookNowParams: () => ({}),
        generate,
        setCurrentCookNowRecipe: vi.fn(),
        setViewingRecipe: vi.fn(),
        setCookNowTweakingType: setTweak,
      },
      'x',
    );
    expect(setTweak).toHaveBeenLastCalledWith(null);
  });
});
