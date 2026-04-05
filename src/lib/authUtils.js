import { auth } from './firebase.js';

/**
 * Obtiene un token de Firebase siempre fresco.
 * - Espera a que Firebase restaure la sesión si aún no lo hizo.
 * - Fuerza refresh del token para evitar tokens expirados.
 * - Lanza un error descriptivo si no hay usuario autenticado.
 *
 * @returns {Promise<string>} ID token válido
 */
export async function getAuthToken() {
  // Si auth.currentUser es null, Firebase puede estar restaurando la sesión.
  // Esperamos el primer evento de cambio de estado en lugar de fallar inmediatamente.
  const user = await new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      unsubscribe();
      resolve(firebaseUser);
    });
  });

  if (!user) {
    throw new Error('No hay sesión activa. Por favor inicia sesión.');
  }

  // forceRefresh=true: siempre pide un token nuevo al servidor de Firebase.
  // Los tokens duran 1 hora; sin esto se reutiliza el cacheado aunque esté vencido.
  const token = await user.getIdToken(true);
  return token;
}

/**
 * fetch() wrapper que inyecta automáticamente el token de Firebase.
 * Úsalo en cualquier llamada a tu backend autenticado.
 *
 * @param {string} url
 * @param {RequestInit} options - mismas opciones que fetch(), sin tocar headers.Authorization
 * @returns {Promise<Response>}
 */
export async function fetchWithAuth(url, options = {}) {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, { ...options, headers });
}
