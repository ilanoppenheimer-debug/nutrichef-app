import { fetchGeminiContent, GeminiRequestError } from '../services/geminiService.js';
import { sendJson } from '../http/send.js';

export async function handleGeminiApiRequest(req, res) {
  let rawBody = '';

  for await (const chunk of req) {
    rawBody += chunk;
  }

  let body;

  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    sendJson(res, 400, { error: 'El cuerpo de la solicitud no es JSON valido.' });
    return;
  }

  const { kind, payload } = body;

  if (!payload || (kind !== 'text' && kind !== 'vision')) {
    sendJson(res, 400, { error: 'La solicitud a Gemini es invalida.' });
    return;
  }

  try {
    const data = await fetchGeminiContent(kind, payload);
    sendJson(res, 200, data);
  } catch (error) {
    const status = error instanceof GeminiRequestError && error.status ? error.status : 500;
    console.error('Gemini proxy error:', {
      status,
      message: error.message,
      modelName: error instanceof GeminiRequestError ? error.modelName : undefined,
    });
    sendJson(res, status, { error: error.message || 'No se pudo completar la solicitud a Gemini.' });
  }
}
