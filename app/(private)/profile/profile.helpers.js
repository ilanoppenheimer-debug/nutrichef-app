/** Contador de restricciones activas para el badge del acordeón de dieta. */
export function getProfileDietActiveCount(profile) {
  const dietary = profile.dietaryStyle && profile.dietaryStyle !== 'Ninguna' ? 1 : 0;
  const religious = profile.religiousDiet && profile.religiousDiet !== 'Ninguna' ? 1 : 0;
  const allergies = profile.allergies?.length || 0;
  return dietary + religious + allergies;
}
