import { estimateSpeechMs } from './text';
import type {
  EngineId,
  KittenGlobal,
  KittenInstance,
  KittenResult,
  SpeechHandle,
  TtsEngine,
  VoiceOption,
  WordTiming,
} from './types';

const KITTEN_MODEL = 'nano-int8';
const KITTEN_SCRIPT_TIMEOUT_MS = 60_000;

function baseUrl(): string {
  return import.meta.env.BASE_URL || '/';
}

export function getKittenGlobal(): KittenGlobal | null {
  return typeof window !== 'undefined' ? window.KittenTTSWeb ?? null : null;
}

let bundlePromise: Promise<KittenGlobal> | null = null;

export function loadKittenBundle(): Promise<KittenGlobal> {
  const existing = getKittenGlobal();
  if (existing) return Promise.resolve(existing);
  if (bundlePromise) return bundlePromise;

  bundlePromise = new Promise<KittenGlobal>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${baseUrl()}vendor/kittentts-web.js`;
    script.async = true;
    script.dataset.kittentts = 'true';

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(
        new Error(
          'The local neural voice took too long to load. Check your connection and try again.',
        ),
      );
    }, KITTEN_SCRIPT_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
    };

    script.onload = () => {
      cleanup();
      const global = getKittenGlobal();
      if (global) {
        resolve(global);
      } else {
        reject(new Error('The local neural voice loaded but did not initialise.'));
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Could not load the local neural voice bundle.'));
    };

    document.head.appendChild(script);
  }).catch((error) => {
    bundlePromise = null;
    throw error;
  });

  return bundlePromise;
}

function formatVoiceName(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

function findVoice(voices: VoiceOption[], id: string | undefined): string {
  if (id && voices.some((voice) => voice.id === id)) return id;
  return voices[0]?.id ?? 'luna';
}

export class KittenEngine implements TtsEngine {
  readonly id: EngineId = 'kitten';
  private instance: KittenInstance | null = null;
  private global: KittenGlobal | null = null;
  private voice = 'luna';
  private speed = 0.9;
  private currentStop: (() => Promise<void>) | null = null;

  getVoices(): VoiceOption[] {
    const ids = this.global?.ALL_VOICE_IDS ?? [
      'bella',
      'jasper',
      'luna',
      'bruno',
      'rosie',
      'hugo',
      'kiki',
      'leo',
    ];
    return ids.map((id) => ({
      id,
      label: this.global?.voiceDisplayName?.(id) ?? formatVoiceName(id),
    }));
  }

  async init(
    onProgress?: (progress: number, label: string) => void,
    options?: { voice?: string; speed?: number },
  ): Promise<void> {
    if (this.instance) return;
    this.voice = findVoice(this.getVoices(), options?.voice ?? this.voice);
    this.speed = options?.speed ?? this.speed;

    const global = await loadKittenBundle();
    this.global = global;
    this.voice = findVoice(this.getVoices(), options?.voice ?? this.voice);

    const player = global.createBrowserAudioPlayer();
    const instance = await global.KittenTTS.create(
      {
        model: KITTEN_MODEL,
        defaultVoice: this.voice,
        speed: this.speed,
        player,
        analytics: false,
        ortNumThreads: 1,
        ortWasmPath: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0/dist/',
      },
      (progress, info) => {
        const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);
        const stage = info?.stage;
        let label = 'Preparing the local voice';
        if (stage === 'downloading' || stage === 'retrying') {
          label = `Downloading voice model ${percent}%`;
        } else if (stage === 'checking-cache') {
          label = 'Checking cached voice model';
        } else if (stage === 'complete' || stage === 'cached') {
          label = 'Voice model ready';
        } else if (stage) {
          label = `${stage.replace(/-/g, ' ')} ${percent}%`;
        }
        onProgress?.(Math.max(0, Math.min(1, progress)), label);
      },
    );

    this.instance = instance;
    onProgress?.(1, 'Local neural voice ready');
  }

  async prepare(
    text: string,
    options: { voice?: string; speed?: number } = {},
  ): Promise<SpeechHandle> {
    if (!this.instance) throw new Error('The local neural voice is not ready yet.');
    const voice = findVoice(this.getVoices(), options.voice ?? this.voice);
    const speed = options.speed ?? this.speed;
    const result = await this.instance.generate(text, { voice, speed });

    return {
      durationMs: Math.max(200, result.duration * 1000),
      wordTimings: result.wordTimings?.map(
        (timing): WordTiming => ({
          word: timing.word,
          startTime: timing.startTime,
          endTime: timing.endTime,
        }),
      ),
      play: async (onWordIndex) => {
        let timer: number | null = null;
        let started = 0;
        const timings = result.wordTimings ?? [];
        const stopHighlight = () => {
          if (timer !== null) {
            window.clearInterval(timer);
            timer = null;
          }
        };
        const handle = this.instance;
        if (!handle) throw new Error('The local neural voice was disposed.');

        try {
          await handle.play(result, {
            onPlaybackStart: () => {
              started = performance.now();
              if (!onWordIndex || timings.length === 0) return;
              timer = window.setInterval(() => {
                const elapsed = (performance.now() - started) / 1000;
                let active = -1;
                for (let i = 0; i < timings.length; i += 1) {
                  if (elapsed >= timings[i].startTime) active = i;
                  if (elapsed < timings[i].endTime) break;
                }
                onWordIndex(active);
              }, 80);
            },
          });
        } finally {
          stopHighlight();
        }
      },
      stop: async () => {
        await this.instance?.stopSpeaking();
      },
    };
  }

  async stop(): Promise<void> {
    await this.currentStop?.();
    await this.instance?.stopSpeaking();
    this.currentStop = null;
  }

  async dispose(): Promise<void> {
    this.currentStop = null;
    await this.instance?.dispose().catch(() => {});
    this.instance = null;
  }
}

export class BrowserEngine implements TtsEngine {
  readonly id: EngineId = 'browser';
  private voices: SpeechSynthesisVoice[] = [];
  private voiceId = '';
  private speed = 0.9;
  private cancelled = false;
  private currentStop: (() => void) | null = null;

  getVoices(): VoiceOption[] {
    if (this.voices.length === 0) {
      this.voices = this.loadVoices();
    }
    return this.voices.map((voice) => ({
      id: voice.voiceURI,
      label: `${voice.name} (${voice.lang})`,
    }));
  }

  private loadVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    const all = window.speechSynthesis.getVoices();
    const english = all.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
    return english.length > 0 ? english : all;
  }

  async init(
    _onProgress?: (progress: number, label: string) => void,
    options?: { voice?: string; speed?: number },
  ): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      throw new Error('This browser does not support built-in speech synthesis.');
    }

    this.voices = this.loadVoices();
    if (this.voices.length === 0) {
      await new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.speechSynthesis.removeEventListener('voiceschanged', finish);
          this.voices = this.loadVoices();
          resolve();
        };
        window.speechSynthesis.addEventListener('voiceschanged', finish);
        window.setTimeout(finish, 2500);
      });
    }

    const voices = this.getVoices();
    this.voiceId =
      options?.voice && voices.some((voice) => voice.id === options.voice)
        ? options.voice
        : voices[0]?.id ?? '';
    this.speed = options?.speed ?? this.speed;
  }

  async prepare(
    text: string,
    options: { voice?: string; speed?: number } = {},
  ): Promise<SpeechHandle> {
    const voices = this.getVoices();
    const voiceId =
      options.voice && voices.some((voice) => voice.id === options.voice)
        ? options.voice
        : this.voiceId;
    const speed = options.speed ?? this.speed;
    const durationMs = estimateSpeechMs(text.split(/\s+/), speed);

    return {
      durationMs,
      play: async (onWordIndex) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          throw new Error('This browser does not support built-in speech synthesis.');
        }

        window.speechSynthesis.cancel();
        this.cancelled = false;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = Math.max(0.5, Math.min(2, speed));
        utterance.pitch = 1;
        utterance.lang = 'en-US';

        const selected = this.voices.find((voice) => voice.voiceURI === voiceId);
        if (selected) utterance.voice = selected;

        const words = text.split(/\s+/).filter(Boolean);
        utterance.onboundary = (event) => {
          if (!onWordIndex || event.name !== 'word') return;
          const before = text.slice(0, event.charIndex);
          const index = before.split(/\s+/).filter(Boolean).length;
          onWordIndex(Math.max(0, Math.min(words.length - 1, index)));
        };

        await new Promise<void>((resolve, reject) => {
          let settled = false;
          const settle = (error?: unknown) => {
            if (settled) return;
            settled = true;
            this.currentStop = null;
            if (error && !this.cancelled) reject(error);
            else resolve();
          };

          this.currentStop = () => {
            this.cancelled = true;
            window.speechSynthesis.cancel();
            settle();
          };

          utterance.onend = () => settle();
          utterance.onerror = (event) => {
            if (this.cancelled || event.error === 'canceled' || event.error === 'interrupted') {
              settle();
            } else {
              settle(new Error(`Speech synthesis failed: ${event.error}`));
            }
          };

          window.speechSynthesis.speak(utterance);
        });
      },
      stop: async () => {
        this.cancelled = true;
        this.currentStop?.();
        window.speechSynthesis?.cancel();
      },
    };
  }

  async stop(): Promise<void> {
    this.cancelled = true;
    this.currentStop?.();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentStop = null;
  }

  async dispose(): Promise<void> {
    await this.stop();
  }
}

export function createEngine(id: EngineId): TtsEngine {
  return id === 'browser' ? new BrowserEngine() : new KittenEngine();
}

export type { KittenResult };
