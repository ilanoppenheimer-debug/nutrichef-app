---
name: readme-maintainer
description: Mantiene README.md actualizado a partir de cambios en el proyecto. Usar cuando se agreguen features, cambien scripts, variables de entorno, arquitectura, instalación, despliegue o cualquier comportamiento que impacte documentación.
---

# README Maintainer

## Objetivo

Mantener `README.md` siempre alineado con el estado real del proyecto, con cambios mínimos, claros y verificables.

## Cuándo usar este skill

Activa este skill cuando:

- Se añadan o eliminen comandos en `package.json`
- Cambien variables en `.env.example` o requisitos de configuración
- Se modifique flujo de instalación, ejecución o despliegue
- Se creen endpoints, integraciones o features visibles para usuario
- El usuario pida "actualizar README", "documentar cambios" o similar

## Flujo recomendado

1. Revisar qué cambió
   - Leer `README.md`
   - Identificar archivos fuente del cambio (`package.json`, `.env.example`, rutas/API, scripts)
2. Detectar secciones afectadas
   - Instalación
   - Scripts disponibles
   - Configuración/entorno
   - Uso y comportamiento
   - Arquitectura o estructura del proyecto
3. Editar solo lo necesario
   - No reescribir todo el README si no hace falta
   - Mantener tono y formato existente
   - Priorizar instrucciones accionables y exactas
4. Verificar consistencia
   - Comandos válidos y existentes
   - Variables de entorno correctas
   - No dejar placeholders ni secciones contradictorias
5. Reportar cambios
   - Explicar qué se actualizó y por qué
   - Señalar cualquier dato que aún requiera confirmación del usuario

## Reglas de calidad

- Preferir listas y pasos concretos sobre texto largo
- Mantener encabezados estables para no romper enlaces
- Evitar duplicar información entre secciones
- Si falta contexto técnico, pedir confirmación antes de inventar detalles
- Si hay incertidumbre, documentar de forma explícita ("pendiente de definir")

## Checklist rápido

- [ ] El README describe cómo ejecutar el proyecto hoy
- [ ] Scripts y comandos coinciden con `package.json`
- [ ] Variables de entorno reflejan `.env.example`
- [ ] Funcionalidades nuevas relevantes están documentadas
- [ ] No hay información obsoleta evidente
