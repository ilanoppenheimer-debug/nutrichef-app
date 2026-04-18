import { MODES } from '../../constants';
import type { AddRecipeMode } from '../../types';

type AddRecipeModeSelectorProps = {
  mode: AddRecipeMode;
  onModeChange: (mode: AddRecipeMode) => void;
};

export default function AddRecipeModeSelector({ mode, onModeChange }: AddRecipeModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onModeChange(m.id)}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center ${
            mode === m.id
              ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
              : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:border-[--c-primary-border]'
          }`}
        >
          <m.icon size={22} />
          <div>
            <div className="font-bold text-xs">{m.label}</div>
            <div className="text-[10px] opacity-60 mt-0.5">{m.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
