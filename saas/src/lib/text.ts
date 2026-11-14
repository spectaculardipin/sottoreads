import type { Batch, BatchMode } from './types';

export const SAMPLE_TEXT =
  'The morning light moved slowly across the desk, and the room stayed quiet. Small habits, repeated daily, become the quiet architecture of a good day. Read each phrase aloud, then write it down with care.';

export const SHORT_SAMPLE_TEXT =
  'The morning light moved slowly across the desk. Small habits, repeated daily, become the quiet architecture. Read each phrase aloud, then write it down with care.';

export const APP_STARTER_TEXT =
  'The morning light moved slowly across the desk, and the room stayed quiet. Small habits, repeated daily, become the quiet architecture of a good day. Read each phrase aloud, then write it down with care. Take your time with each line. The page keeps the batch on screen while you write. When you are ready, press Next or let Smart advance decide.';

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
  return normalized.split(/\s+/).filter(Boolean);
}

export function countCharacters(text: string): number {
  return text.replace(/\s+/g, '').length;
}

function makeBatch(text: string, index: number): Batch {
  const words = splitWords(text);
  return {
    index,
    text,
    words,
    charCount: Math.max(1, countCharacters(text)),
  };
}

function chunkByWords(text: string, size: number): string[] {
  const words = splitWords(text);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(' '));
  }
  return chunks;
}

function splitParagraphs(text: string): string[] {
  return normalizeText(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Merge very short segments (for example "Yes.") into the next segment so a
 * batch is always worth writing. Keeps the original punctuation.
 */
function mergeShortSegments(segments: string[], minWords = 4): string[] {
  const merged: string[] = [];
  let carry = '';

  for (const segment of segments) {
    const next = carry ? `${carry} ${segment}` : segment;
    if (splitWords(next).length < minWords) {
      carry = next;
      continue;
    }
    merged.push(next);
    carry = '';
  }

  if (carry) {
    if (merged.length > 0) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${carry}`;
    } else {
      merged.push(carry);
    }
  }

  return merged;
}

function sentenceSegments(text: string): string[] {
  const segments: string[] = [];
  for (const paragraph of splitParagraphs(text)) {
    const pieces = paragraph
      .split(/(?<=[.!?])\s+/)
      .map((piece) => piece.trim())
      .filter(Boolean);

    for (const piece of pieces) {
      // A giant unpunctuated line is still a sentence-shaped batch; split it
      // into readable chunks rather than turning it into one endless read.
      if (splitWords(piece).length > 45) {
        segments.push(...chunkByWords(piece, 14));
      } else {
        segments.push(piece);
      }
    }
  }
  return mergeShortSegments(segments, 4);
}

function phraseSegments(text: string): string[] {
  const segments: string[] = [];
  for (const paragraph of splitParagraphs(text)) {
    const pieces = paragraph
      .split(/(?<=[;:,])\s+/)
      .map((piece) => piece.trim())
      .filter(Boolean);

    for (const piece of pieces) {
      if (splitWords(piece).length > 30) {
        segments.push(...chunkByWords(piece, 10));
      } else {
        segments.push(piece);
      }
    }
  }
  return mergeShortSegments(segments, 3);
}

export function makeBatches(
  text: string,
  wordsPerBatch: number,
  batchMode: BatchMode = 'sentence',
): Batch[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  let segments: string[];
  if (batchMode === 'sentence') {
    segments = sentenceSegments(normalized);
  } else if (batchMode === 'phrase') {
    segments = phraseSegments(normalized);
  } else {
    const size = Math.max(1, Math.min(20, Math.round(wordsPerBatch) || 6));
    segments = chunkByWords(normalized, size);
  }

  return segments.map((segment, index) => makeBatch(segment, index));
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

export function estimateSpeechMs(words: string[], speed = 1): number {
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const base = words.length * 390 + syllables * 125;
  return Math.max(700, base / Math.max(0.5, speed));
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00';
  return formatClock(ms);
}

export function truncate(text: string, max = 90): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function batchModeLabel(mode: BatchMode): string {
  if (mode === 'sentence') return 'Sentence';
  if (mode === 'phrase') return 'Phrase';
  return 'Words';
}
