const RETRYABLE_GEMINI_STATUS = new Set([404, 429, 503]);
const GEMINI_RETRY_DELAY_MS = 1200;

const GEMINI_TEXT_MODELS = ['gemini-2.5-flash'];
const GEMINI_VISION_MODELS = ['gemini-2.5-flash'];

export class GeminiRequestError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'GeminiRequestError';
    this.status = options.status;
    this.retryable = Boolean(options.retryable);
    this.modelName = options.modelName;
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

export async function fetchGeminiContent(kind, payload) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  console.log('📦 PAYLOAD FINAL:', JSON.stringify(payload, null, 2));
  if (!GEMINI_API_KEY) {
    throw new Error('Falta GEMINI_API_KEY en el servidor.');
  }

  if (payload) {
    if (payload.generation_config?.responseMimeType) {
      delete payload.generation_config.responseMimeType;
    }
    if (payload.generationConfig?.responseMimeType) {
      delete payload.generationConfig.responseMimeType;
    }
  }

  const modelNames = kind === 'vision' ? GEMINI_VISION_MODELS : GEMINI_TEXT_MODELS;
  const uniqueModels = [...new Set(modelNames)];
  let lastError = null;
  let sawRateLimit = false;
  let sawTemporaryUnavailable = false;

  for (const modelName of uniqueModels) {
    const API_VERSION = modelName.includes('2.0') ? 'v1' : 'v1beta';

    const url = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

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

export function logServerGeminiConfig() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  console.log('====================================');
  console.log('🔑 CLAVE CARGADA EN EL SERVIDOR:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 15)}...` : 'NINGUNA');
  console.log('====================================');
  console.log('🚀 MODELOS ACTIVOS:', GEMINI_TEXT_MODELS);
  console.log('🚀 MODELOS ACTIVOS:', GEMINI_VISION_MODELS);
}
