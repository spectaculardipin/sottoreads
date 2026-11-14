import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { getStatus, handleTtsRequest, TtsHttpError, type TtsEnv } from './server/tts-core.ts';

interface MiddlewareStack {
  use: (
    handler: (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => void,
  ) => void;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function writeJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function attachTtsApi(middlewares: MiddlewareStack, env: TtsEnv): void {
  middlewares.use(async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith('/api/')) {
      next();
      return;
    }

    if (url.pathname === '/api/tts/status' && req.method === 'GET') {
      writeJson(res, 200, getStatus(env));
      return;
    }

    if (url.pathname === '/api/tts' && req.method === 'POST') {
      try {
        const raw = await readBody(req);
        const body = JSON.parse(raw || '{}') as Record<string, unknown>;
        const result = await handleTtsRequest(body, env);
        writeJson(res, 200, result);
      } catch (caught) {
        if (caught instanceof TtsHttpError) {
          writeJson(res, caught.status, { error: caught.message, code: caught.code });
        } else {
          const message =
            caught instanceof Error ? caught.message : 'The voice server failed unexpectedly.';
          writeJson(res, 500, { error: message, code: 'server_error' });
        }
      }
      return;
    }

    writeJson(res, 404, { error: 'Not found.', code: 'not_found' });
  });
}

function ttsApiPlugin(env: TtsEnv): Plugin {
  return {
    name: 'sotto-tts-api',
    configureServer(server) {
      attachTtsApi(server.middlewares, env);
      const status = getStatus(env);
      if (status.mock) {
        server.config.logger.info('[sotto] cloud voice: MOCK mode (TTS_MOCK=1)');
      } else if (status.providers.fish.configured) {
        server.config.logger.info('[sotto] cloud voice: Fish Audio (exact word timing)');
      } else if (status.providers.openrouter.configured) {
        server.config.logger.info('[sotto] cloud voice: OpenRouter (estimated word timing)');
      } else {
        server.config.logger.warn(
          '[sotto] cloud voice is not configured. Add OPENROUTER_API_KEY or FISH_API_KEY to .env.local',
        );
      }
    },
    configurePreviewServer(server) {
      attachTtsApi(server.middlewares, env);
    },
  };
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const env: TtsEnv = {
    FISH_API_KEY: process.env.FISH_API_KEY || fileEnv.FISH_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || fileEnv.OPENROUTER_API_KEY,
    TTS_DEFAULT_PROVIDER: process.env.TTS_DEFAULT_PROVIDER || fileEnv.TTS_DEFAULT_PROVIDER,
    FISH_MODEL: process.env.FISH_MODEL || fileEnv.FISH_MODEL,
    OPENROUTER_TTS_MODEL: process.env.OPENROUTER_TTS_MODEL || fileEnv.OPENROUTER_TTS_MODEL,
    OPENROUTER_TTS_VOICE: process.env.OPENROUTER_TTS_VOICE || fileEnv.OPENROUTER_TTS_VOICE,
    TTS_MOCK: process.env.TTS_MOCK || fileEnv.TTS_MOCK,
    TTS_MOCK_DELAY_MS: process.env.TTS_MOCK_DELAY_MS || fileEnv.TTS_MOCK_DELAY_MS,
    FISH_API_BASE: process.env.FISH_API_BASE || fileEnv.FISH_API_BASE,
    OPENROUTER_API_BASE: process.env.OPENROUTER_API_BASE || fileEnv.OPENROUTER_API_BASE,
  };

  return {
    plugins: [react(), ttsApiPlugin(env)],
  };
});
