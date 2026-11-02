import type { Batch, TextStats } from './types';

const WORD_SPLIT = /\s+/;

export function normalizeText(input: string): string {
  return input
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function splitWords(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized.split(WORD_SPLIT).filter(Boolean);
}

export function countSyllables(rawWord: string): number {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;

  let cleaned = word
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '');

  if (!cleaned) cleaned = word;
  const groups = cleaned.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function getTextStats(words: string[]): TextStats {
  const wordCount = words.length;
  const charCount = words.reduce((sum, word) => sum + word.length, 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const punctuation = words.reduce(
    (sum, word) => sum + (word.match(/[.,;:!?—–\-()[\]{}"']/g)?.length ?? 0),
    0,
  );
  const capitals = words.reduce(
    (sum, word) => sum + (word.match(/[A-Z]/g)?.length ?? 0),
    0,
  );

  return {
    wordCount,
    charCount,
    avgWordLength: wordCount > 0 ? charCount / wordCount : 0,
    syllables,
    punctuation,
    capitals,
  };
}

export function makeBatches(text: string, wordsPerBatch: number): Batch[] {
  const words = splitWords(text);
  if (words.length === 0) return [];

  const size = Math.max(1, Math.min(50, Math.round(wordsPerBatch)));
  const batches: Batch[] = [];

  for (let i = 0; i < words.length; i += size) {
    const slice = words.slice(i, i + size);
    batches.push({
      index: batches.length,
      text: slice.join(' '),
      words: slice,
      stats: getTextStats(slice),
    });
  }

  return batches;
}

export function estimateSpeechMs(words: string[], speed = 1): number {
  const stats = getTextStats(words);
  const base = stats.wordCount * 430 + stats.syllables * 110;
  return Math.max(650, base / Math.max(0.5, speed));
}

export function estimateDefaultWritingMs(stats: TextStats): number {
  // Conservative fallback used before the personal model has enough data.
  // Longer words and more syllables require more writing time.
  const base = 1300;
  const perWord = 1450 + Math.min(700, Math.max(0, stats.avgWordLength - 4) * 220);
  const syllableExtra = Math.max(0, stats.syllables - stats.wordCount) * 160;
  const punctuationExtra = stats.punctuation * 120;
  return base + stats.wordCount * perWord + syllableExtra + punctuationExtra;
}

export function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0.0s';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
