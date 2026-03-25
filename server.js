import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const envPath = path.join(__dirname, '.env');

loadEnvFile(envPath);

const PORT = Number(process.env.PORT || 8787);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
console.log("====================================");
console.log("🔑 CLAVE CARGADA EN EL SERVIDOR:", GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 15) + "..." : "NINGUNA");
console.log("====================================");
const GEMINI_TEXT_MODELS = [
  process.env.GEMINI_TEXT_MODEL || process.env.VITE_GEMINI_TEXT_MODEL,
  'gemini-1.5-flash',
  'gemini-1.5-flash-001',
  'gemini-2.0-flash',
].filter(Boolean);
const GEMINI_VISION_MODELS = [
  process.env.GEMINI_VISION_MODEL || process.env.VITE_GEMINI_VISION_MODEL,
  'gemini-1.5-flash',
  'gemini-1.5-flash-001',
  'gemini-2.0-flash',
].filter(Boolean);

const RETRYABLE_GEMINI_STATUS = new Set([404, 429, 503]);
const GEMINI_RETRY_DELAY_MS = 1200;
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

class GeminiRequestError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'GeminiRequestError';
    this.status = options.status;
    this.retryable = Boolean(options.retryable);
    this.modelName = options.modelName;
  }
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildGeminiError(status, modelName, errorData = {}) {
  const apiMessage = errorData?.error?.message;
  const retryable = RETRYABLE_GEMINI_STATUS.has(status);

  if (status === 404) {
    return new GeminiRequestError(`El modelo ${modelName} no esta disponible para esta API key.`, { status, retryable, modelName });
  }

  if (status === 429) {
    return new GeminiRequestError(apiMessage || 'Gemini alcanzo el limite de solicitudes o cuota disponible. Intenta de nuevo en unos minutos.', { status, retryable, modelName });
  }

  if (status === 503) {
    return new GeminiRequestError('Gemini no esta disponible temporalmente. Intenta de nuevo en unos minutos.', { status, retryable, modelName });
  }

  return new GeminiRequestError(apiMessage || `HTTP error! status: ${status}`, { status, retryable, modelName });
}

async function fetchGeminiContent(kind, payload) {
  if (!GEMINI_API_KEY) {
    throw new Error('Falta GEMINI_API_KEY en el servidor.');
  }

  const modelNames = kind === 'vision' ? GEMINI_VISION_MODELS : GEMINI_TEXT_MODELS;
  const uniqueModels = [...new Set(modelNames)];
  let lastError = null;
  let sawRateLimit = false;
  let sawTemporaryUnavailable = false;

  for (const modelName of uniqueModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = buildGeminiError(response.status, modelName, errorData);

        if (RETRYABLE_GEMINI_STATUS.has(response.status)) {
          lastError = error;
          if (response.status === 429) {
            sawRateLimit = true;
          }
          if (response.status === 503) {
            sawTemporaryUnavailable = true;
          }
          if (response.status === 429) {
            await sleep(GEMINI_RETRY_DELAY_MS);
          }
          continue;
        }

        throw error;
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (error instanceof GeminiRequestError && error.retryable) {
        continue;
      }

      throw error;
    }
  }

  if (lastError instanceof GeminiRequestError) {
    if (sawRateLimit) {
      throw new GeminiRequestError(
        'Gemini rechazo la solicitud en todos los modelos disponibles por cuota o limite de solicitudes. Intenta de nuevo en unos minutos.',
        { status: 429, retryable: true, modelName: lastError.modelName }
      );
    }

    if (sawTemporaryUnavailable) {
      throw new GeminiRequestError(
        'Gemini no esta disponible temporalmente en los modelos probados. Intenta de nuevo en unos minutos.',
        { status: 503, retryable: true, modelName: lastError.modelName }
      );
    }

    throw lastError;
  }

  throw lastError || new Error('No hay modelos Gemini disponibles para esta API key.');
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  createReadStream(filePath).pipe(res);
}

async function handleApiRequest(req, res) {
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

async function handleStaticRequest(req, res) {
  if (!existsSync(distDir)) {
    sendJson(res, 404, { error: 'No existe dist/. Ejecuta npm run build antes de usar el servidor en produccion.' });
    return;
  }

  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const requestedPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const normalizedPath = path.normalize(path.join(distDir, requestedPath));

  if (!normalizedPath.startsWith(distDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const fileStats = await stat(normalizedPath);

    if (fileStats.isFile()) {
      sendFile(res, normalizedPath);
      return;
    }
  } catch {
    // Fall through to SPA fallback.
  }

  sendFile(res, path.join(distDir, 'index.html'));
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  if (req.method === 'POST' && req.url === '/api/gemini') {
    await handleApiRequest(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  await handleStaticRequest(req, res);
});

server.listen(PORT, () => {
  console.log(`NutriChef server listening on http://127.0.0.1:${PORT}`);
});
