import type { PaceModel } from './types';

const PACE_KEY = 'sotto.pace.v1';
export const DEFAULT_MS_PER_CHAR = 420;
const MIN_MS_PER_CHAR = 120;
const MAX_MS_PER_CHAR = 900;
const MIN_WRITING_MS = 900;
const MAX_WRITING_MS = 120_000;

export function defaultPace(): PaceModel {
  return {
    msPerChar: DEFAULT_MS_PER_CHAR,
    samples: 0,
    updatedAt: new Date(0).toISOString(),
  };
}

export function loadPace(): PaceModel {
  if (typeof localStorage === 'undefined') return defaultPace();
  try {
    const raw = localStorage.getItem(PACE_KEY);
    if (!raw) return defaultPace();
    const parsed = JSON.parse(raw) as Partial<PaceModel>;
    const msPerChar = Number(parsed.msPerChar);
    const samples = Number(parsed.samples);
    if (!Number.isFinite(msPerChar) || msPerChar <= 0) return defaultPace();
    return {
      msPerChar: clamp(msPerChar, MIN_MS_PER_CHAR, MAX_MS_PER_CHAR),
      samples: Number.isFinite(samples) ? Math.max(0, Math.round(samples)) : 0,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return defaultPace();
  }
}

export function savePace(model: PaceModel): void {
  try {
    localStorage.setItem(PACE_KEY, JSON.stringify(model));
  } catch {
    // Private mode or a full quota should never stop a practice session.
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** How long the writer is likely to need for a batch, from the learned pace. */
export function predictWritingMs(charCount: number, pace: PaceModel): number {
  const raw = Math.max(1, charCount) * pace.msPerChar;
  return Math.round(clamp(raw, 1700, 24_000));
}

/**
 * Update the one-number pace model from a real completion time. Only samples
 * between 0.9 s and 2 min are trusted; everything else is noise.
 */
export function recordWritingTime(
  pace: PaceModel,
  charCount: number,
  durationMs: number,
): PaceModel | null {
  if (charCount < 4 || durationMs < MIN_WRITING_MS || durationMs > MAX_WRITING_MS) return null;
  const observed = durationMs / charCount;
  if (!Number.isFinite(observed)) return null;
  const nextValue =
    pace.samples === 0
      ? clamp(observed, MIN_MS_PER_CHAR, MAX_MS_PER_CHAR)
      : clamp(pace.msPerChar * 0.72 + observed * 0.28, MIN_MS_PER_CHAR, MAX_MS_PER_CHAR);

  return {
    msPerChar: Math.round(nextValue),
    samples: pace.samples + 1,
    updatedAt: new Date().toISOString(),
  };
}
