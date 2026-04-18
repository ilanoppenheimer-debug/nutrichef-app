'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = {
  orange: {
    id: 'orange',
    label: 'Naranja',
    emoji: '🍊',
    primary: '#ea580c',
    primaryLight: '#fff7ed',
    primaryBorder: '#fed7aa',
    primaryText: '#9a3412',
    accent: '#f97316',
    cssVars: {
      '--c-primary': '#ea580c',
      '--c-primary-light': '#fff7ed',
      '--c-primary-border': '#fed7aa',
      '--c-primary-text': '#9a3412',
      '--c-accent': '#f97316',
      '--c-bg': '#fff7ed',
      '--c-bg-dark': '#1c0a00',
    }
  },
  green: {
    id: 'green',
    label: 'Verde',
    emoji: '🌿',
    primary: '#16a34a',
    primaryLight: '#f0fdf4',
    primaryBorder: '#bbf7d0',
    primaryText: '#14532d',
    accent: '#22c55e',
    cssVars: {
      '--c-primary': '#16a34a',
      '--c-primary-light': '#f0fdf4',
      '--c-primary-border': '#bbf7d0',
      '--c-primary-text': '#14532d',
      '--c-accent': '#22c55e',
      '--c-bg': '#f0fdf4',
      '--c-bg-dark': '#052e16',
    }
  },
  blue: {
    id: 'blue',
    label: 'Azul',
    emoji: '🫐',
    primary: '#2563eb',
    primaryLight: '#eff6ff',
    primaryBorder: '#bfdbfe',
    primaryText: '#1e3a8a',
    accent: '#3b82f6',
    cssVars: {
      '--c-primary': '#2563eb',
      '--c-primary-light': '#eff6ff',
      '--c-primary-border': '#bfdbfe',
      '--c-primary-text': '#1e3a8a',
      '--c-accent': '#3b82f6',
      '--c-bg': '#eff6ff',
      '--c-bg-dark': '#0f1f5c',
    }
  },
  purple: {
    id: 'purple',
    label: 'Morado',
    emoji: '🍇',
    primary: '#7c3aed',
    primaryLight: '#faf5ff',
    primaryBorder: '#ddd6fe',
    primaryText: '#4c1d95',
    accent: '#8b5cf6',
    cssVars: {
      '--c-primary': '#7c3aed',
      '--c-primary-light': '#faf5ff',
      '--c-primary-border': '#ddd6fe',
      '--c-primary-text': '#4c1d95',
      '--c-accent': '#8b5cf6',
      '--c-bg': '#faf5ff',
      '--c-bg-dark': '#2e1065',
    }
  },
  rose: {
    id: 'rose',
    label: 'Rosa',
    emoji: '🌸',
    primary: '#e11d48',
    primaryLight: '#fff1f2',
    primaryBorder: '#fecdd3',
    primaryText: '#881337',
    accent: '#f43f5e',
    cssVars: {
      '--c-primary': '#e11d48',
      '--c-primary-light': '#fff1f2',
      '--c-primary-border': '#fecdd3',
      '--c-primary-text': '#881337',
      '--c-accent': '#f43f5e',
      '--c-bg': '#fff1f2',
      '--c-bg-dark': '#4c0519',
    }
  },
};

const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

function getSystemDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getStoredValue(key, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  return value ?? fallback;
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => getStoredValue('nutrichef_theme', 'orange'));
  // null = seguir sistema, 'light' = forzar claro, 'dark' = forzar oscuro
  const [colorMode, setColorMode] = useState(() => getStoredValue('nutrichef_colormode', null));
  const [systemDark, setSystemDark] = useState(() => getSystemDark());

  // Escuchar cambios del sistema operativo
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = colorMode === 'dark' || (colorMode === null && systemDark);
  const theme = THEMES[themeId] || THEMES.orange;

  // Aplicar CSS vars y clase dark al <html>
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.cssVars).forEach(([key, val]) => root.style.setProperty(key, val));
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme, isDark]);

  const setTheme = (id) => {
    setThemeId(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('nutrichef_theme', id);
    }
  };

  const setMode = (mode) => {
    setColorMode(mode);
    if (typeof window === 'undefined') return;
    if (mode === null) window.localStorage.removeItem('nutrichef_colormode');
    else window.localStorage.setItem('nutrichef_colormode', mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme, isDark, colorMode, setMode, systemDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
