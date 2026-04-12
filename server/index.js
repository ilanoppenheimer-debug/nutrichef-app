import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFile } from './utils/env.js';
import { logServerGeminiConfig } from './services/geminiService.js';
import { handleGeminiApiRequest } from './controllers/geminiController.js';
import { handleStaticRequest } from './controllers/staticController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const envPath = path.join(rootDir, '.env');

loadEnvFile(envPath);

const PORT = Number(process.env.PORT || 8787);

logServerGeminiConfig();

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  if (req.method === 'POST' && req.url === '/api/gemini') {
    await handleGeminiApiRequest(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  await handleStaticRequest(req, res, distDir);
});

server.listen(PORT, () => {
  console.log(`NutriChef server listening on http://127.0.0.1:${PORT}`);
});
