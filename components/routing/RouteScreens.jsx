'use client';

import { ChefHat } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[--c-bg] to-white dark:from-gray-950 dark:to-gray-900">
      <div className="flex flex-col items-center gap-5 animate-pulse">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg rotate-3" style={{ background: 'var(--c-primary)' }}>
          <ChefHat size={42} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-700 dark:text-white">NutriChef <span style={{ color: 'var(--c-primary)' }}>IA</span></h1>
      </div>
    </div>
  );
}
