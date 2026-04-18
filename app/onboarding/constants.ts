import { AlertTriangle, ChefHat, CheckCircle2, Target, type LucideIcon } from 'lucide-react';

export type OnboardingStepId = 'welcome' | 'goal' | 'safety' | 'done';

export type OnboardingStepDef = {
  id: OnboardingStepId;
  title: string;
  icon: LucideIcon;
  optional: boolean;
};

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  { id: 'welcome', title: 'Bienvenido', icon: ChefHat, optional: false },
  { id: 'goal', title: 'Objetivo', icon: Target, optional: false },
  { id: 'safety', title: 'Filtros de Seguridad', icon: AlertTriangle, optional: true },
  { id: 'done', title: 'Listo', icon: CheckCircle2, optional: false },
];

export const ONBOARDING_GOAL_OPTIONS = [
  { value: 'Mantenimiento y energia', label: 'Mantener peso y energía', emoji: '⚖️' },
  { value: 'Déficit calórico (Pérdida de peso)', label: 'Perder peso', emoji: '📉' },
  { value: 'Superávit calórico (Ganancia muscular)', label: 'Ganar músculo', emoji: '💪' },
  { value: 'Comer más saludable general', label: 'Comer más sano', emoji: '🥗' },
] as const;

export const ONBOARDING_DIETARY_STYLES = [
  { value: 'Ninguna', label: 'Ninguna' },
  { value: 'Vegetariana', label: 'Vegetariana' },
  { value: 'Vegano', label: 'Vegano' },
  { value: 'Pescetariana', label: 'Pescetariana' },
] as const;

export const ONBOARDING_RELIGIOUS_DIETS = [
  { value: 'Ninguna', label: 'Ninguna' },
  { value: 'Kosher', label: 'Kosher' },
  { value: 'Halal', label: 'Halal' },
  { value: 'Hindú (Sin carne de res)', label: 'Hindú (Sin carne de res)' },
  { value: 'Jainista', label: 'Jainista' },
] as const;

export const ONBOARDING_COMMON_ALLERGIES = [
  { value: 'Alergia al Maní', label: 'Maní (cacahuete)' },
  { value: 'Alergia a Frutos Secos', label: 'Frutos secos (nuez, almendra...)' },
  { value: 'Alergia al Huevo', label: 'Huevo' },
  { value: 'Alergia a Mariscos', label: 'Mariscos (camarón, cangrejo...)' },
  { value: 'Alergia al Pescado', label: 'Pescado' },
  { value: 'Sin Lácteos', label: 'Lácteos (leche, queso...)' },
  { value: 'Sin Gluten', label: 'Gluten (celiaquía)' },
  { value: 'Sin Soya', label: 'Soya / Soja' },
  { value: 'Alergia al Sésamo', label: 'Sésamo (ajonjolí)' },
  { value: 'Alergia al Trigo', label: 'Trigo' },
] as const;

export const ONBOARDING_WELCOME_CHECKLIST = [
  'Tu objetivo nutricional',
  'Tus filtros de seguridad y alergias',
] as const;
