export type EngineId = 'kitten' | 'browser';

export type AdvanceMode = 'manual' | 'mic' | 'predicted';

export type BatchMode = 'words' | 'sentence' | 'phrase';

export type SessionStatus =
  | 'idle'
  | 'preparing'
  | 'batch-preparing'
  | 'ready'
  | 'playing'
  | 'your-turn'
  | 'listening'
  | 'paused'
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
  wordCount: number;
  charCount: number;
  avgWordLength: number;
  syllables: number;
  punctuation: number;
  capitals: number;
  batchSize: number;
  durationMs: number;
  gapBeforeMs: number;
  predictedMs?: number;
  mode: AdvanceMode;
  engine: EngineId;
  speed: number;
}

export interface RegressionModel {
  version: 1;
  trainedAt: string;
  sampleCount: number;
  coefficients: number[];
  featureMeans: number[];
  featureScales: number[];
  residualStdDev: number;
  medianMsPerWord: number;
  meanMsPerWord: number;
  settings: {
    ridgeLambda: number;
    minSamples: number;
    windowSize: number;
  };
}

export interface TrainingBundle {
  version: 1;
  exportedAt: string;
  records: TrainingRecord[];
  model: RegressionModel | null;
  settings: TrainingSettings;
}

export interface TrainingSettings {
  enabled: boolean;
  minSamples: number;
  windowSize: number;
  ridgeLambda: number;
}

export interface VadUpdate {
  rms: number;
  level: number;
  state: 'waiting' | 'speaking' | 'paused' | 'complete';
  speechMs: number;
  silenceMs: number;
  estimatedWords: number;
}

export interface VadOptions {
  silenceMs?: number;
  minSpeechMs?: number;
  expectedSpeechMs?: number;
  expectedWords?: number;
  onUpdate?: (update: VadUpdate) => void;
  onComplete?: (reason: 'silence' | 'estimated') => void;
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
