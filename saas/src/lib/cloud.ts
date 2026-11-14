import { decodeAudioArrayBuffer, decodeAudioBase64, padAudioBuffer } from './audio';
import { estimateWordTimings, mapAlignmentToWords } from './timings';
import type {
  CloudStatus,
  PreparedAudio,
  TimingKind,
  TtsApiResponse,
  TtsApiTiming,
  VoiceProvider,
} from './types';

export class CloudTtsError extends Error {
  code: string;

  constructor(message: string, code = 'tts_failed') {
    super(message);
    this.name = 'CloudTtsError';
    this.code = code;
  }
}

const PROD_WORKER_BASE = 'https://sotto-tts.spectaculardipin.workers.dev';
const LEAD_SECONDS = 0.12;
const TRAIL_SECONDS = 0.08;

const FALLBACK_STATUS: CloudStatus = {
  configured: false,
  defaultProvider: 'browser',
  providers: {
    fish: {
      configured: false,
      model: 's2.1-pro-free',
      label: 'Fish Audio S2.1',
      timing: 'exact',
    },
    openrouter: {
      configured: false,
      model: 'fish-audio/s2.1-pro-free:free',
      label: 'OpenRouter · Fish S2.1 free',
      timing: 'estimated',
    },
  },
  mock: false,
};

/**
 * Local development uses the Vite proxy at /api. Production uses the
 * standalone Cloudflare Worker, which owns the provider key. `VITE_TTS_API_BASE`
 * can point development at the Worker too.
 */
function apiBase(): string {
  const configured = (import.meta.env.VITE_TTS_API_BASE as string | undefined)?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return import.meta.env.PROD ? PROD_WORKER_BASE : '';
}

export function ttsApiUrl(path: string): string {
  return `${apiBase()}${path}`;
}

export async function getCloudStatus(): Promise<CloudStatus> {
  try {
    const response = await fetch(ttsApiUrl('/api/tts/status'), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return FALLBACK_STATUS;
    const data = (await response.json()) as CloudStatus;
    if (!data || typeof data !== 'object' || !data.providers) return FALLBACK_STATUS;
    return data;
  } catch {
    return FALLBACK_STATUS;
  }
}

export type VoiceChoice = 'auto' | 'browser' | 'fish' | 'openrouter';

export function resolveVoiceChoice(
  status: CloudStatus | null,
  choice: VoiceChoice,
): VoiceProvider {
  if (choice === 'browser') return 'browser';
  if (!status) return 'browser';
  if (choice === 'fish') return status.providers.fish.configured ? 'fish' : status.defaultProvider;
  if (choice === 'openrouter') {
    return status.providers.openrouter.configured ? 'openrouter' : status.defaultProvider;
  }
  return status.defaultProvider;
}

export function resolveProvider(
  status: CloudStatus | null,
  requested: VoiceProvider,
): VoiceProvider {
  if (requested === 'browser') return 'browser';
  if (!status) return 'browser';
  if (requested === 'fish' && status.providers.fish.configured) return 'fish';
  if (requested === 'openrouter' && status.providers.openrouter.configured) return 'openrouter';
  if (requested === 'fish' || requested === 'openrouter') {
    if (status.providers.fish.configured) return 'fish';
    if (status.providers.openrouter.configured) return 'openrouter';
    return 'browser';
  }
  return status.defaultProvider;
}

export interface SynthesizeOptions {
  text: string;
  provider: 'fish' | 'openrouter';
  voiceId?: string;
  speed?: number;
  signal?: AbortSignal;
}

function providerFromHeader(value: string | null, fallback: 'fish' | 'openrouter'): VoiceProvider {
  if (value === 'fish' || value === 'openrouter' || value === 'browser') return value;
  return fallback;
}

function prepareAudio(
  rawBuffer: AudioBuffer,
  text: string,
  provider: VoiceProvider | 'mock',
  model: string,
  timings: TtsApiTiming[] | undefined,
  declaredTiming: TimingKind | null | undefined,
): PreparedAudio {
  const rawDuration = rawBuffer.duration;
  const buffer = padAudioBuffer(rawBuffer, LEAD_SECONDS, TRAIL_SECONDS);
  const words = text.split(/\s+/).filter(Boolean);

  let timingResult: { timings: PreparedAudio['timings']; exact: boolean };
  if (timings && timings.length > 0) {
    timingResult = mapAlignmentToWords(
      words,
      timings,
      rawDuration,
      LEAD_SECONDS,
      TRAIL_SECONDS,
    );
  } else {
    timingResult = {
      timings: estimateWordTimings(words, rawDuration, LEAD_SECONDS, TRAIL_SECONDS),
      exact: false,
    };
  }

  return {
    buffer,
    timings: timingResult.timings,
    durationMs: Math.round(buffer.duration * 1000),
    timingKind:
      declaredTiming === 'exact' && timingResult.exact ? 'exact' : 'estimated',
    provider,
    model,
  };
}

export async function synthesizeCloud(options: SynthesizeOptions): Promise<PreparedAudio> {
  let response: Response;
  try {
    response = await fetch(ttsApiUrl('/api/tts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg, application/json' },
      body: JSON.stringify({
        text: options.text,
        provider: options.provider,
        voiceId: options.voiceId || undefined,
        speed: options.speed ?? 1,
      }),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new CloudTtsError(
      'The cloud voice could not be reached. Check your connection and try again.',
      'network',
    );
  }

  if (!response.ok) {
    let message = 'The cloud voice could not generate this batch.';
    let code = 'tts_failed';
    try {
      const body = (await response.json()) as { error?: string; code?: string };
      if (body.error) message = body.error;
      if (body.code) code = body.code;
    } catch {
      // Keep the friendly default when the server did not return JSON.
    }
    throw new CloudTtsError(message, code);
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as TtsApiResponse;
    if (!payload.audio) {
      throw new CloudTtsError('The cloud voice returned no audio.', 'empty_audio');
    }
    const rawBuffer = await decodeAudioBase64(
      payload.audio,
      payload.mimeType || 'audio/mpeg',
    );
    return prepareAudio(
      rawBuffer,
      options.text,
      payload.provider,
      payload.model,
      payload.timings,
      payload.alignment,
    );
  }

  if (contentType.startsWith('audio/') || contentType === 'application/octet-stream') {
    const arrayBuffer = await response.arrayBuffer();
    const rawBuffer = await decodeAudioArrayBuffer(arrayBuffer);
    const headerTiming = response.headers.get('x-sotto-timing');
    return prepareAudio(
      rawBuffer,
      options.text,
      providerFromHeader(response.headers.get('x-sotto-provider'), options.provider),
      response.headers.get('x-sotto-model') || 'worker-model',
      undefined,
      headerTiming === 'exact' ? 'exact' : 'estimated',
    );
  }

  throw new CloudTtsError(
    'The voice server returned an unexpected response.',
    'unexpected_response',
  );
}
