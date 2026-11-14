export type BatchMode = 'sentence' | 'phrase' | 'words';
export type AdvanceMode = 'manual' | 'smart';
export type VoiceProvider = 'browser' | 'fish' | 'openrouter';
export type CloudProvider = 'fish' | 'openrouter';
export type TimingKind = 'exact' | 'estimated';
export type SessionStatus =
  | 'idle'
  | 'preparing'
  | 'playing'
  | 'paused'
  | 'your-turn'
  | 'complete'
  | 'error';
export type BatchPrepState = 'queued' | 'generating' | 'ready' | 'error';
export type WarmupState = 'cold' | 'warming' | 'ready';

export interface Batch {
  index: number;
  text: string;
  words: string[];
  charCount: number;
}

export interface WordTiming {
  start: number;
  end: number;
  word: string;
}

export interface PreparedAudio {
  buffer: AudioBuffer;
  timings: WordTiming[];
  durationMs: number;
  timingKind: TimingKind;
  provider: VoiceProvider | 'mock';
  model: string;
}

export interface QueueItem {
  index: number;
  text: string;
  state: BatchPrepState;
  error?: string;
}

export interface SessionSettings {
  voice: VoiceProvider;
  speed: number;
  batchMode: BatchMode;
  wordsPerBatch: number;
  browserVoiceURI: string;
  cloudVoiceId: string;
  advance: AdvanceMode;
  prefetchAhead: number;
  learnPace: boolean;
}

export interface PaceModel {
  msPerChar: number;
  samples: number;
  updatedAt: string;
}

export interface CloudStatusProvider {
  configured: boolean;
  model: string;
  label: string;
  timing: TimingKind;
}

export interface CloudStatus {
  configured: boolean;
  defaultProvider: VoiceProvider;
  providers: {
    fish: CloudStatusProvider;
    openrouter: CloudStatusProvider;
  };
  mock: boolean;
}

export interface TtsApiTiming {
  text: string;
  start: number;
  end: number;
}

export interface TtsApiResponse {
  audio: string;
  mimeType: string;
  provider: CloudProvider | 'mock';
  model: string;
  timings?: TtsApiTiming[];
  durationSec?: number;
  alignment?: TimingKind | null;
}
