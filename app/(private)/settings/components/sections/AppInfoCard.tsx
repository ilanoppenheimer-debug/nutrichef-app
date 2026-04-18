import BaseCard from '@/components/base/BaseCard';

export default function AppInfoCard() {
  return (
    <BaseCard className="overflow-hidden">
      <div className="p-5 space-y-1 text-sm text-slate-500 dark:text-slate-400">
        <p>NutriChef IA - App personal de nutrición</p>
        <p className="text-xs">Potenciado por Google Gemini 2.5 Flash</p>
      </div>
    </BaseCard>
  );
}

