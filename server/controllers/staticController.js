import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { sendFile, sendJson } from '../http/send.js';

export async function handleStaticRequest(req, res, distDir) {
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
