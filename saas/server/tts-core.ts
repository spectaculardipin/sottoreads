/**
 * Shared TTS server logic. This module is used by both the Vite dev middleware
 * and the Cloudflare Pages Functions, so it must stick to Web APIs only.
 */

export interface TtsEnv {
  FISH_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  TTS_DEFAULT_PROVIDER?: string;
  FISH_MODEL?: string;
  OPENROUTER_TTS_MODEL?: string;
  OPENROUTER_TTS_VOICE?: string;
  TTS_MOCK?: string;
  TTS_MOCK_DELAY_MS?: string;
  /** Test-only overrides, used by scripts/fake-upstream.ts. */
  FISH_API_BASE?: string;
  OPENROUTER_API_BASE?: string;
}

export type ProviderId = 'fish' | 'openrouter';

export interface TtsRequest {
  text?: string;
  provider?: ProviderId | 'auto';
  voiceId?: string;
  speed?: number;
}

export interface TtsTiming {
  text: string;
  start: number;
  end: number;
}

export interface TtsResult {
  audio: string;
  mimeType: string;
  provider: ProviderId | 'mock';
  model: string;
  timings?: TtsTiming[];
  durationSec?: number;
  alignment?: 'exact' | 'estimated' | null;
}

export class TtsHttpError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 502, code = 'tts_failed') {
    super(message);
    this.name = 'TtsHttpError';
    this.status = status;
    this.code = code;
  }
}

const FISH_DEFAULT_MODEL = 's2.1-pro-free';
const OPENROUTER_DEFAULT_MODEL = 'fish-audio/s2.1-pro-free:free';
const MAX_TEXT_LENGTH = 2000;

function isMock(env: TtsEnv): boolean {
  return env.TTS_MOCK === '1' || env.TTS_MOCK === 'true';
}

function fishModel(env: TtsEnv): string {
  return env.FISH_MODEL?.trim() || FISH_DEFAULT_MODEL;
}

function openRouterModel(env: TtsEnv): string {
  return env.OPENROUTER_TTS_MODEL?.trim() || OPENROUTER_DEFAULT_MODEL;
}

function fishBase(env: TtsEnv): string {
  return (env.FISH_API_BASE?.trim() || 'https://api.fish.audio').replace(/\/+$/, '');
}

function openRouterBase(env: TtsEnv): string {
  return (env.OPENROUTER_API_BASE?.trim() || 'https://openrouter.ai').replace(/\/+$/, '');
}

function clampSpeed(value: number | undefined): number {
  const speed = Number(value);
  if (!Number.isFinite(speed)) return 1;
  return Math.min(2, Math.max(0.5, speed));
}

export function getStatus(env: TtsEnv) {
  const mock = isMock(env);
  const fishConfigured = Boolean(env.FISH_API_KEY?.trim()) || mock;
  const openRouterConfigured = Boolean(env.OPENROUTER_API_KEY?.trim()) && !mock;

  let defaultProvider: 'fish' | 'openrouter' | 'browser' = 'browser';
  const requested = env.TTS_DEFAULT_PROVIDER?.trim().toLowerCase();
  if (requested === 'openrouter' && openRouterConfigured) defaultProvider = 'openrouter';
  else if (requested === 'fish' && fishConfigured) defaultProvider = 'fish';
  else if (fishConfigured) defaultProvider = 'fish';
  else if (openRouterConfigured) defaultProvider = 'openrouter';

  return {
    configured: defaultProvider !== 'browser',
    defaultProvider,
    mock,
    providers: {
      fish: {
        configured: fishConfigured,
        model: mock ? 'mock-s2.1' : fishModel(env),
        label: mock ? 'Mock cloud voice' : 'Fish Audio S2.1',
        timing: 'exact' as const,
      },
      openrouter: {
        configured: openRouterConfigured,
        model: openRouterModel(env),
        label: 'OpenRouter · Fish S2.1 free',
        timing: 'estimated' as const,
      },
    },
  };
}

export async function handleTtsRequest(body: TtsRequest, env: TtsEnv): Promise<TtsResult> {
  const text = (body.text ?? '').trim();
  if (!text) throw new TtsHttpError('There is no text to read.', 400, 'empty_text');
  if (text.length > MAX_TEXT_LENGTH) {
    throw new TtsHttpError(
      `That batch is too long for the voice provider (${text.length} characters).`,
      400,
      'text_too_long',
    );
  }

  const status = getStatus(env);
  let provider: ProviderId | 'browser' = body.provider === 'auto' || !body.provider
    ? status.defaultProvider
    : body.provider;

  if (provider === 'browser') {
    if (isMock(env) && !env.FISH_API_KEY && !env.OPENROUTER_API_KEY) {
      return mockSynthesizeDelayed(text, clampSpeed(body.speed), env);
    }
    throw new TtsHttpError(
      'Cloud voice is not configured. Add OPENROUTER_API_KEY or FISH_API_KEY to the server environment.',
      503,
      'not_configured',
    );
  }

  if (provider === 'fish') {
    if (isMock(env) && !env.FISH_API_KEY) {
      return mockSynthesizeDelayed(text, clampSpeed(body.speed), env);
    }
    if (!env.FISH_API_KEY?.trim()) {
      if (isMock(env)) return mockSynthesizeDelayed(text, clampSpeed(body.speed), env);
      throw new TtsHttpError(
        'Fish Audio is not configured. Add FISH_API_KEY or choose OpenRouter.',
        503,
        'not_configured',
      );
    }
    return fishSynthesize(text, clampSpeed(body.speed), body.voiceId, env.FISH_API_KEY.trim(), env);
  }

  if (provider === 'openrouter') {
    if (!env.OPENROUTER_API_KEY?.trim()) {
      if (isMock(env)) return mockSynthesizeDelayed(text, clampSpeed(body.speed), env);
      throw new TtsHttpError(
        'OpenRouter is not configured. Add OPENROUTER_API_KEY or choose Fish Audio.',
        503,
        'not_configured',
      );
    }
    return openRouterSynthesize(text, clampSpeed(body.speed), env.OPENROUTER_API_KEY.trim(), env);
  }

  throw new TtsHttpError('Unknown voice provider.', 400, 'bad_provider');
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(bytes.length, offset + chunkSize));
    for (const byte of chunk) binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function joinChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

async function errorMessage(response: Response): Promise<string> {
  const raw = await response.text().catch(() => '');
  if (!raw) return `The voice provider returned ${response.status}.`;
  try {
    const parsed = JSON.parse(raw) as {
      message?: string;
      error?: string | { message?: string };
      reason?: string;
    };
    if (parsed.message) return parsed.message;
    if (typeof parsed.error === 'string') return parsed.error;
    if (parsed.error && typeof parsed.error.message === 'string') return parsed.error.message;
    if (parsed.reason) return parsed.reason;
  } catch {
    // Fall through to a trimmed text response.
  }
  return raw.slice(0, 280);
}

interface FishAlignmentEvent {
  audio_base64?: string;
  content?: string;
  chunk_seq?: number;
  chunk_audio_offset_sec?: number;
  alignment?: {
    audio_duration?: number;
    segments?: Array<{ text?: string; start?: number; end?: number }>;
  } | null;
  error?: string;
  message?: string;
}

function parseFishStreamEvent(data: string): FishAlignmentEvent | null {
  const trimmed = data.trim();
  if (!trimmed || trimmed === '[DONE]') return null;
  try {
    return JSON.parse(trimmed) as FishAlignmentEvent;
  } catch {
    return null;
  }
}

async function fishSynthesize(
  text: string,
  speed: number,
  voiceId: string | undefined,
  apiKey: string,
  env: TtsEnv,
): Promise<TtsResult> {
  const model = fishModel(env);
  const payload = {
    text,
    format: 'mp3',
    mp3_bitrate: 128,
    latency: 'balanced',
    normalize: true,
    language: 'en',
    chunk_length: 300,
    prosody: { speed, normalize_loudness: true },
    ...(voiceId ? { reference_id: voiceId } : {}),
  };

  let response: Response;
  try {
    response = await fetch(`${fishBase(env)}/v1/tts/stream/with-timestamp`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        model,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    return fishSynthesizePlain(text, speed, voiceId, apiKey, env, model);
  }

  if (!response.ok) {
    const message = await errorMessage(response);
    // The timestamp stream may not be enabled for an account/model. Fall back
    // to the standard endpoint rather than failing the batch outright.
    if (response.status === 404 || response.status === 405) {
      return fishSynthesizePlain(text, speed, voiceId, apiKey, env, model);
    }
    throw new TtsHttpError(message, response.status === 402 ? 402 : 502, 'fish_failed');
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/event-stream') || !response.body) {
    return fishSynthesizePlain(text, speed, voiceId, apiKey, env, model);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const audioChunks: Uint8Array[] = [];
  const alignments = new Map<
    number,
    { offset: number; segments: TtsTiming[]; duration: number }
  >();
  let pending = '';
  let maxDuration = 0;

  const processBlock = (block: string) => {
    const dataLines = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart());
    if (dataLines.length === 0) return;
    const event = parseFishStreamEvent(dataLines.join('\n'));
    if (!event) return;
    if (event.error || event.message) {
      throw new TtsHttpError(event.error || event.message || 'Fish Audio failed.', 502, 'fish_failed');
    }

    if (event.audio_base64) {
      const binary = atob(event.audio_base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      audioChunks.push(bytes);
    }

    const chunkSeq = Number.isFinite(event.chunk_seq) ? Number(event.chunk_seq) : 0;
    const offset = Number.isFinite(event.chunk_audio_offset_sec)
      ? Number(event.chunk_audio_offset_sec)
      : 0;
    const segments = event.alignment?.segments;
    const duration = Number(event.alignment?.audio_duration) || 0;

    if (segments && segments.length > 0) {
      const mapped: TtsTiming[] = [];
      for (const segment of segments) {
        if (typeof segment.text !== 'string') continue;
        const start = Number(segment.start);
        const end = Number(segment.end);
        if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
        mapped.push({
          text: segment.text,
          start: start + offset,
          end: Math.max(end + offset, start + offset + 0.02),
        });
      }
      if (mapped.length > 0) {
        alignments.set(chunkSeq, {
          offset,
          segments: mapped,
          duration: duration + offset,
        });
        maxDuration = Math.max(maxDuration, duration + offset);
      }
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const blocks = pending.split(/\r?\n\r?\n/);
      pending = blocks.pop() ?? '';
      for (const block of blocks) processBlock(block);
    }
    pending += decoder.decode();
    if (pending.trim()) processBlock(pending);
  } catch (caught) {
    if (caught instanceof TtsHttpError) throw caught;
    return fishSynthesizePlain(text, speed, voiceId, apiKey, env, model);
  }

  if (audioChunks.length === 0) {
    return fishSynthesizePlain(text, speed, voiceId, apiKey, env, model);
  }

  const timings: TtsTiming[] = [];
  const ordered = [...alignments.entries()].sort(([a], [b]) => a - b);
  for (const [, alignment] of ordered) timings.push(...alignment.segments);
  timings.sort((a, b) => a.start - b.start);

  return {
    audio: bytesToBase64(joinChunks(audioChunks)),
    mimeType: 'audio/mpeg',
    provider: 'fish',
    model,
    timings: timings.length > 0 ? dedupeTimings(timings) : undefined,
    durationSec: maxDuration || undefined,
    alignment: timings.length > 0 ? 'exact' : null,
  };
}

function dedupeTimings(timings: TtsTiming[]): TtsTiming[] {
  const seen = new Set<string>();
  return timings.filter((timing) => {
    const key = `${timing.start.toFixed(3)}|${timing.end.toFixed(3)}|${timing.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fishSynthesizePlain(
  text: string,
  speed: number,
  voiceId: string | undefined,
  apiKey: string,
  env: TtsEnv,
  model = fishModel(env),
): Promise<TtsResult> {
  let response: Response;
  try {
    response = await fetch(`${fishBase(env)}/v1/tts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        model,
      },
      body: JSON.stringify({
        text,
        format: 'mp3',
        mp3_bitrate: 128,
        latency: 'balanced',
        normalize: true,
        language: 'en',
        prosody: { speed, normalize_loudness: true },
        ...(voiceId ? { reference_id: voiceId } : {}),
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new TtsHttpError(
      'Fish Audio could not be reached. Check the connection and the API key.',
      502,
      'network',
    );
  }

  if (!response.ok) {
    const message = await errorMessage(response);
    throw new TtsHttpError(message, response.status === 402 ? 402 : 502, 'fish_failed');
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0) {
    throw new TtsHttpError('Fish Audio returned no audio.', 502, 'empty_audio');
  }

  return {
    audio: bytesToBase64(bytes),
    mimeType: response.headers.get('content-type') || 'audio/mpeg',
    provider: 'fish',
    model,
    alignment: null,
  };
}

async function openRouterSynthesize(
  text: string,
  speed: number,
  apiKey: string,
  env: TtsEnv,
): Promise<TtsResult> {
  const model = openRouterModel(env);
  const voice = env.OPENROUTER_TTS_VOICE?.trim();
  const body: Record<string, unknown> = {
    model,
    input: text,
    response_format: 'mp3',
  };
  if (voice) body.voice = voice;
  if (Math.abs(speed - 1) > 0.001) body.speed = speed;

  const request = () =>
    fetch(`${openRouterBase(env)}/api/v1/audio/speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sottoreads.pages.dev',
        'X-Title': 'Sotto Reads',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });

  let response: Response;
  try {
    response = await request();
  } catch {
    throw new TtsHttpError(
      'OpenRouter could not be reached. Check the connection and the API key.',
      502,
      'network',
    );
  }

  // Some TTS providers reject a non-default speed. Sotto only needs the voice
  // to be intelligible; retry at normal speed rather than losing the batch.
  if (!response.ok && body.speed) {
    const message = await errorMessage(response.clone());
    if (response.status === 400 && /speed/i.test(message)) {
      delete body.speed;
      try {
        response = await request();
      } catch {
        throw new TtsHttpError('OpenRouter could not be reached.', 502, 'network');
      }
    }
  }

  if (!response.ok) {
    const message = await errorMessage(response);
    throw new TtsHttpError(message, 502, 'openrouter_failed');
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0) {
    throw new TtsHttpError('OpenRouter returned no audio.', 502, 'empty_audio');
  }

  return {
    audio: bytesToBase64(bytes),
    mimeType: response.headers.get('content-type') || 'audio/mpeg',
    provider: 'openrouter',
    model,
    alignment: null,
  };
}

function createMockWav(text: string, speed: number): {
  bytes: Uint8Array;
  timings: TtsTiming[];
  durationSec: number;
} {
  const words = text.split(/\s+/).filter(Boolean);
  const sampleRate = 22050;
  const lead = 0.12;
  const trail = 0.08;
  const timings: TtsTiming[] = [];
  let cursor = lead;

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const letters = word.replace(/[^\p{L}\p{N}]/gu, '').length;
    const duration = Math.max(0.16, Math.min(0.62, 0.13 + letters * 0.032)) / Math.max(0.6, speed);
    timings.push({ text: word, start: cursor, end: cursor + duration });
    cursor += duration + (/[.!?]$/.test(word) ? 0.14 : 0.045);
  }

  const totalSeconds = cursor + trail;
  const frames = Math.ceil(totalSeconds * sampleRate);
  const samples = new Int16Array(frames);
  timings.forEach((timing, index) => {
    const startFrame = Math.floor(timing.start * sampleRate);
    const endFrame = Math.min(frames, Math.floor(timing.end * sampleRate));
    const frequency = 175 + (index * 43) % 195;
    const fade = Math.min(Math.floor(sampleRate * 0.008), Math.floor((endFrame - startFrame) / 2));
    for (let frame = startFrame; frame < endFrame; frame += 1) {
      const local = frame - startFrame;
      const length = endFrame - startFrame;
      let envelope = 1;
      if (fade > 0) {
        if (local < fade) envelope = local / fade;
        else if (length - local < fade) envelope = (length - local) / fade;
      }
      const value =
        Math.sin(((frame - startFrame) / sampleRate) * frequency * Math.PI * 2) *
        0.23 *
        envelope;
      samples[frame] = Math.max(-32768, Math.min(32767, Math.round(value * 32767)));
    }
  });

  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.byteLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.byteLength, true);

  const bytes = new Uint8Array(44 + samples.byteLength);
  bytes.set(new Uint8Array(header), 0);
  bytes.set(new Uint8Array(samples.buffer), 44);

  return { bytes, timings, durationSec: totalSeconds };
}

async function mockSynthesizeDelayed(
  text: string,
  speed: number,
  env: TtsEnv,
): Promise<TtsResult> {
  const delayMs = Math.min(10_000, Math.max(0, Number(env.TTS_MOCK_DELAY_MS) || 0));
  if (delayMs > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  }
  return mockSynthesize(text, speed);
}

function mockSynthesize(text: string, speed: number): TtsResult {
  const mock = createMockWav(text, speed);
  return {
    audio: bytesToBase64(mock.bytes),
    mimeType: 'audio/wav',
    provider: 'mock',
    model: 'mock-s2.1',
    timings: mock.timings,
    durationSec: mock.durationSec,
    alignment: 'exact',
  };
}

