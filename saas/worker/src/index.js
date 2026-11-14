/**
 * Sotto Reads TTS Worker
 *
 * The browser never sees the OpenRouter key. This Worker is the only place
 * the key is used. It validates origin and input, rate-limits, streams the
 * audio back without a base64 round-trip, and caches successful audio at the
 * edge keyed by a SHA-256 of the request.
 */

const DEFAULT_MODEL = 'fish-audio/s2.1-pro-free:free';
const MAX_TEXT_LENGTH = 2000;
const MAX_BODY_BYTES = 20_000;
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const CACHE_SECONDS = 86_400;

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/(?:[a-z0-9-]+\.)?sottouidraft\.pages\.dev$/i,
  /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i,
];

const rateBuckets = new Map();

function getModel(env) {
  return (env.OPENROUTER_TTS_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
}

function allowedOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin)) ? origin : null;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Accept',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Expose-Headers':
      'Content-Type,X-Sotto-Provider,X-Sotto-Model,X-Sotto-Timing,X-Sotto-Cache,X-OpenRouter-Generation-Id',
    Vary: 'Origin',
  };
}

function jsonResponse(payload, status, origin, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(origin ? corsHeaders(origin) : {}),
    ...extraHeaders,
  };
  return new Response(JSON.stringify(payload), { status, headers });
}

function errorResponse(message, status, code, origin, extraHeaders = {}) {
  return jsonResponse({ error: message, code }, status, origin, extraHeaders);
}

function isRateLimited(request) {
  const key =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'local';
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || bucket.reset <= now) {
    if (rateBuckets.size > 20_000) rateBuckets.clear();
    rateBuckets.set(key, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function statusPayload(env) {
  const configured = Boolean(env.OPENROUTER_API_KEY);
  return {
    configured,
    defaultProvider: configured ? 'openrouter' : 'browser',
    mock: false,
    providers: {
      fish: {
        configured: false,
        model: 'unavailable',
        label: 'Fish Audio direct',
        timing: 'estimated',
      },
      openrouter: {
        configured,
        model: getModel(env),
        label: 'OpenRouter · Fish S2.1 free',
        timing: 'estimated',
      },
    },
  };
}

function audioHeaders(origin, model, cacheStatus) {
  return {
    'Content-Type': 'audio/mpeg',
    'Cache-Control': `public, max-age=${CACHE_SECONDS}, stale-while-revalidate=604800`,
    'X-Sotto-Provider': 'openrouter',
    'X-Sotto-Model': model,
    'X-Sotto-Timing': 'estimated',
    'X-Sotto-Cache': cacheStatus,
    'X-Content-Type-Options': 'nosniff',
    ...corsHeaders(origin),
  };
}

async function callOpenRouter(env, text, speed, origin) {
  const model = getModel(env);
  const payload = {
    model,
    input: text,
    response_format: 'mp3',
  };
  if (typeof speed === 'number' && Number.isFinite(speed) && speed !== 1) {
    payload.speed = Math.min(2, Math.max(0.5, speed));
  }

  const makeRequest = () =>
    fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': origin || 'https://sottouidraft.pages.dev',
        'X-Title': 'Sotto Reads',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
    });

  let response = await makeRequest();

  // OpenRouter routes use different TTS adapters. Some reject a speed field
  // instead of ignoring it, so retry once at normal speed rather than losing
  // the batch.
  if (!response.ok && payload.speed) {
    const body = await response.clone().text().catch(() => '');
    if (response.status === 400 && /speed/i.test(body)) {
      delete payload.speed;
      response = await makeRequest();
    }
  }

  return { response, model };
}

async function handleTts(request, env, ctx, origin) {
  const started = Date.now();
  if (isRateLimited(request)) {
    return errorResponse(
      'Too many requests. Please wait a minute and try again.',
      429,
      'rate_limited',
      origin,
      { 'Retry-After': '60' },
    );
  }

  const length = Number(request.headers.get('Content-Length') || 0);
  if (length && length > MAX_BODY_BYTES) {
    return errorResponse('The request is too large.', 413, 'body_too_large', origin);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('The request body must be valid JSON.', 400, 'bad_json', origin);
  }

  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return errorResponse('There is no text to read.', 400, 'empty_text', origin);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return errorResponse(
      `That batch is too long for the voice provider (${text.length} characters).`,
      400,
      'text_too_long',
      origin,
    );
  }

  const rawSpeed = Number(body?.speed);
  const speed = Number.isFinite(rawSpeed) ? Math.min(2, Math.max(0.5, rawSpeed)) : 1;
  const model = getModel(env);
  const hash = await sha256Hex(`${model}|${speed}|${text}`);
  const cacheKey = new Request(`https://sotto-tts-cache.internal/v1/${hash}`, { method: 'GET' });
  const cached = await caches.default.match(cacheKey);

  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set('X-Sotto-Cache', 'HIT');
    headers.set('X-Sotto-Model', model);
    headers.set('X-Sotto-Timing', 'estimated');
    for (const [key, value] of Object.entries(corsHeaders(origin))) headers.set(key, value);
    console.log(
      JSON.stringify({
        event: 'tts',
        cache: 'HIT',
        ms: Date.now() - started,
        textLength: text.length,
      }),
    );
    return new Response(cached.body, { status: 200, headers });
  }

  if (!env.OPENROUTER_API_KEY) {
    return errorResponse(
      'Cloud voice is not configured on the Worker.',
      503,
      'not_configured',
      origin,
    );
  }

  let upstream;
  let resolvedModel;
  try {
    const result = await callOpenRouter(env, text, body?.speed, origin);
    upstream = result.response;
    resolvedModel = result.model;
  } catch {
    console.log(JSON.stringify({ event: 'tts', cache: 'MISS', error: 'network', ms: Date.now() - started }));
    return errorResponse(
      'The voice provider could not be reached. Please try again.',
      502,
      'network',
      origin,
    );
  }

  if (!upstream.ok) {
    console.log(
      JSON.stringify({
        event: 'tts',
        cache: 'MISS',
        error: 'upstream',
        providerStatus: upstream.status,
        ms: Date.now() - started,
      }),
    );
    const status = upstream.status === 429 ? 429 : upstream.status === 402 ? 402 : 502;
    return errorResponse(
      status === 429
        ? 'The voice provider is rate-limiting this preview. Please wait a moment.'
        : 'The voice provider could not generate this batch.',
      status,
      status === 429 ? 'upstream_rate_limited' : 'upstream_error',
      origin,
    );
  }

  if (!upstream.body) {
    return errorResponse('The voice provider returned no audio.', 502, 'empty_audio', origin);
  }

  const mime = upstream.headers.get('Content-Type') || 'audio/mpeg';
  const headers = new Headers(audioHeaders(origin, resolvedModel, 'MISS'));
  headers.set('Content-Type', mime);
  const generationId = upstream.headers.get('X-Generation-Id');
  if (generationId) headers.set('X-OpenRouter-Generation-Id', generationId);

  const cacheCopy = upstream.clone();
  const cacheHeaders = new Headers({
    'Content-Type': mime,
    'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
    'X-Sotto-Provider': 'openrouter',
    'X-Sotto-Model': resolvedModel,
    'X-Sotto-Timing': 'estimated',
  });
  ctx.waitUntil(
    caches.default
      .put(cacheKey, new Response(cacheCopy.body, { status: 200, headers: cacheHeaders }))
      .catch(() => {}),
  );

  console.log(
    JSON.stringify({
      event: 'tts',
      cache: 'MISS',
      ms: Date.now() - started,
      textLength: text.length,
      model: resolvedModel,
    }),
  );

  return new Response(upstream.body, { status: 200, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = allowedOrigin(request);

    if (request.method === 'OPTIONS') {
      const requestOrigin = request.headers.get('Origin');
      if (requestOrigin && !origin) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, {
        status: 204,
        headers: requestOrigin ? corsHeaders(requestOrigin) : {},
      });
    }

    if (request.headers.get('Origin') && !origin) {
      return errorResponse('This origin is not allowed.', 403, 'origin_not_allowed', null);
    }

    if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
      return jsonResponse(
        { ok: true, service: 'sotto-tts', configured: Boolean(env.OPENROUTER_API_KEY) },
        200,
        origin,
      );
    }

    if (request.method === 'GET' && url.pathname === '/api/tts/status') {
      return jsonResponse(statusPayload(env), 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/api/tts') {
      if (!origin) {
        return errorResponse(
          'A request from the Sotto Reads site is required.',
          403,
          'origin_required',
          null,
        );
      }
      return handleTts(request, env, ctx, origin);
    }

    return errorResponse('Not found.', 404, 'not_found', origin);
  },
};
