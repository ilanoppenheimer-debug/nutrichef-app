export const PREFERENCES_PAGE = {
  title: 'Preferencias alimentarias',
  description:
    'Estas reglas se aplican siempre en recetas, exploración y generación con IA.',
} as const;

export const GUARDRAIL_SECTION = {
  title: 'Guardrail activo',
  body: 'Nunca se debe generar contenido que viole estas preferencias.',
  empty: 'Aún no tienes preferencias activas.',
  clearLabel: 'Limpiar',
} as const;

export const KOSHER_SECTION = {
  title: 'Kosher',
  description: 'Se aplica como restricción absoluta en prompts y resultados.',
  ariaLabel: 'Activar kosher',
} as const;

export const DIETS_SECTION = {
  title: 'Dietas',
  description: 'Puedes activar varias al mismo tiempo.',
} as const;

export const RESTRICTIONS_SECTION = {
  title: 'Restricciones adicionales',
  description: 'Ejemplo: Sin lácteos, Sin gluten, Sin soya.',
  placeholder: 'Agregar restricción',
  addLabel: 'Añadir',
  empty: 'No hay restricciones adicionales cargadas.',
} as const;
