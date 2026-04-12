---
name: nutrichef-tdd
description: Flujo TDD con Vitest y capas pages/services/utils en NutriChef. Usar al implementar lógica nueva, refactorizar extracción de hooks o añadir cobertura en utils/services.
---

# Skill: NutriChef TDD y capas

## Cuándo aplicar

- Nueva lógica en `src/utils` o `src/services`.
- Refactor de componentes grandes: extraer cálculos a `utils` o efectos/API a `services` / `hooks`.
- Regresión detectada: escribir test que falle, corregir, mantener el test.

## Comandos

```bash
npm run test        # modo watch
npm run test:run    # CI / una pasada
```

Los tests viven junto al código: `src/utils/__tests__/*.test.js` o `*.spec.js` según convención del archivo.

## Flujo TDD

1. **Red**: test que describe el comportamiento esperado (caso normal, borde, error si aplica).
2. **Green**: implementación mínima en `utils` o `services` (sin acoplar UI si se puede evitar).
3. **Refactor**: limpiar nombres, duplicación; volver a ejecutar `npm run test:run`.

## Dónde colocar código

| Tipo | Ubicación |
|------|-----------|
| Números, texto, reglas sin `fetch` | `src/utils/` |
| Firebase, `/api/gemini`, auth token | `src/services/` |
| Estado React compartido o efectos largos | `src/hooks/` |
| Pantalla y composición | `src/pages/` |

## Imports

Usar `@/` hacia `src/` (ej. `import { parseServingsCount } from '@/utils/recipeScaling.js'`).

## Qué evitar en tests

- Mockear toda Firebase en la primera iteración para una función pura: preferir test directo del `utils`.
- Tests que dependan del orden de keys en objetos JSON sin necesidad.

## Referencias en el repo

- Guía unificada del agente (orquestación, estándares, Cursor): [AGENTS.md](../../../AGENTS.md).
- Config de Vitest: [vite.config.js](../../../vite.config.js) (`test` + alias `@`).
- Ejemplo de tests: [src/utils/__tests__/recipeScaling.test.js](../../../src/utils/__tests__/recipeScaling.test.js).
