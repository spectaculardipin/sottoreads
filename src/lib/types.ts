export type EngineId = 'kitten' | 'browser';

export type AdvanceMode = 'manual' | 'smart';

export type BatchMode = 'words' | 'sentence' | 'phrase';

export type FeedbackRating =
  | 'too-slow'
  | 'a-little-slow'
  | 'okay'
  | 'a-little-fast'
  | 'too-fast';

export type SessionStatus =
  | 'idle'
  | 'preparing'
  | 'batch-preparing'
  | 'ready'
  | 'playing'
  | 'your-turn'
  | 'paused'
  | 'training'
  | 'complete'
  | 'error';

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

export interface SpeechHandle {
  durationMs: number;
  wordTimings?: WordTiming[];
  play: (onWordIndex?: (index: number) => void) => Promise<void>;
  stop: () => Promise<void>;
}

export interface TtsEngine {
  readonly id: EngineId;
  init: (
    onProgress?: (progress: number, label: string) => void,
    options?: { voice?: string; speed?: number },
  ) => Promise<void>;
  prepare: (
    text: string,
    options: { voice?: string; speed?: number },
  ) => Promise<SpeechHandle>;
  stop: () => Promise<void>;
  dispose: () => Promise<void>;
  getVoices: () => VoiceOption[];
}

export interface VoiceOption {
  id: string;
  label: string;
}

export interface TextStats {
  wordCount: number;
  charCount: number;
  avgWordLength: number;
  syllables: number;
  punctuation: number;
  capitals: number;
}

export interface Batch {
  index: number;
  text: string;
  words: string[];
  stats: TextStats;
}

export interface TrainingRecord {
  id: string;
  createdAt: string;
  charCount: number;
  durationMs: number;
}

export interface TrainingModel {
  version: 1;
  sampleCount: number;
  msPerChar: number;
  trainedAt: string;
}

export interface AppSettings {
  engine: EngineId;
  voice: string;
  speed: number;
  batchSize: number;
  batchMode: BatchMode;
  advanceMode: AdvanceMode;
  trainingCompleted: boolean;
  msPerChar: number | null;
}

export interface TrainingStore {
  records: TrainingRecord[];
  model: TrainingModel | null;
}

export interface KittenWordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

export interface KittenResult {
  duration: number;
  sampleRate: number;
  wordTimings: KittenWordTiming[];
  inputText: string;
  voice: string;
  effectiveSpeed: number;
  samples: Float32Array;
}

export interface KittenInstance {
  generate: (
    text: string,
    options?: { voice?: string; speed?: number },
  ) => Promise<KittenResult>;
  play: (
    result: KittenResult,
    options?: { onPlaybackStart?: () => void },
  ) => Promise<void>;
  stopSpeaking: () => Promise<void>;
  dispose: () => Promise<void>;
}

export interface KittenGlobal {
  KittenTTS: {
    create: (
      options: Record<string, unknown>,
      onProgress?: (progress: number, info?: { stage?: string; asset?: string }) => void,
    ) => Promise<KittenInstance>;
    cacheInfo: (config?: Record<string, unknown>) => Promise<{
      isCached: boolean;
      directory?: string;
    }>;
    clearModelCache: (config?: Record<string, unknown>) => Promise<void>;
  };
  ALL_VOICE_IDS: string[];
  createBrowserAudioPlayer: () => unknown;
  modelDisplayName?: (model: string) => string;
  voiceDisplayName?: (voice: string) => string;
}

declare global {
  interface Window {
    KittenTTSWeb?: KittenGlobal;
  }
}
