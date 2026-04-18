/** @vitest-environment jsdom */
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, THEMES, useTheme } from './ThemeContext.jsx';

function mockMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation(() => ({
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  document.documentElement.removeAttribute('style');
  window.matchMedia = mockMatchMedia(false) as unknown as typeof window.matchMedia;
});

describe('useTheme', () => {
  it('lanza fuera de ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow('useTheme must be used within ThemeProvider');
  });
});

describe('ThemeProvider', () => {
  function ThemeProbe() {
    const { theme, themeId, setTheme, setMode, colorMode, isDark } = useTheme();
    return (
      <div>
        <span>{`id:${themeId}`}</span>
        <span>{`label:${theme.label}`}</span>
        <span>{`dark:${isDark ? '1' : '0'}`}</span>
        <span>{`mode:${colorMode === null ? 'null' : String(colorMode)}`}</span>
        <button type="button" onClick={() => setTheme('green')}>
          tema-verde
        </button>
        <button type="button" onClick={() => setMode('dark')}>
          modo-oscuro
        </button>
        <button type="button" onClick={() => setMode(null)}>
          modo-sistema
        </button>
      </div>
    );
  }

  it('usa tema por defecto orange si no hay valor en localStorage', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByText('id:orange')).toBeTruthy();
    expect(screen.getByText('label:Naranja')).toBeTruthy();
  });

  it('lee nutrichef_theme inicial desde localStorage', () => {
    localStorage.setItem('nutrichef_theme', 'blue');
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByText('id:blue')).toBeTruthy();
    expect(screen.getByText('label:Azul')).toBeTruthy();
  });

  it('setTheme persiste en localStorage y actualiza el tema activo', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /tema-verde/i }));
    expect(screen.getByText('id:green')).toBeTruthy();
    expect(localStorage.getItem('nutrichef_theme')).toBe('green');
  });

  it('aplica variables CSS del tema en documentElement', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(document.documentElement.style.getPropertyValue('--c-primary')).toBe(
      THEMES.orange.cssVars['--c-primary'],
    );
  });

  it('modo sistema (null) quita nutrichef_colormode y sigue el esquema claro si el OS no es oscuro', () => {
    localStorage.setItem('nutrichef_colormode', 'dark');
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByText('dark:1')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /modo-sistema/i }));
    expect(screen.getByText('mode:null')).toBeTruthy();
    expect(screen.getByText('dark:0')).toBeTruthy();
    expect(localStorage.getItem('nutrichef_colormode')).toBeNull();
  });
});
