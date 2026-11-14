import type { WordTiming } from './types';

const MIN_WORD_SECONDS = 0.055;

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function wordWeight(word: string): number {
  const letters = word.replace(/[^\p{L}\p{N}]/gu, '');
  const vowels = (letters.match(/[aeiouy]/gi) ?? []).length;
  let weight = 1 + Math.min(2.2, letters.length * 0.11) + Math.min(1.2, vowels * 0.16);
  if (/[.!?]["')\]]?$/.test(word)) weight += 1.5;
  else if (/[,;:]["')\]]?$/.test(word)) weight += 0.65;
  return weight;
}

function distributeTimings(
  words: string[],
  startSec: number,
  endSec: number,
): WordTiming[] {
  const total = Math.max(0.12, endSec - startSec);
  const weights = words.map(wordWeight);
  const weightSum = weights.reduce((sum, value) => sum + value, 0) || 1;
  let cursor = startSec;

  return words.map((word, index) => {
    const duration = Math.max(MIN_WORD_SECONDS, (weights[index] / weightSum) * total);
    const start = cursor;
    const end = Math.min(endSec, start + duration);
    cursor = end;
    return { word, start, end };
  });
}

/**
 * Fallback timing for providers that do not return alignment data. The result
 * follows syllables and punctuation closely enough for word-by-word display.
 */
export function estimateWordTimings(
  words: string[],
  durationSec: number,
  leadSec = 0,
  trailSec = 0,
): WordTiming[] {
  if (words.length === 0) return [];
  const speechStart = leadSec;
  const speechEnd = Math.max(speechStart + 0.2, durationSec - trailSec);
  return distributeTimings(words, speechStart, speechEnd);
}

/** Longest common subsequence of normalized word/segment strings. */
function matchSequences(wordTokens: string[], segmentTokens: string[]): Array<[number, number]> {
  const rows = wordTokens.length + 1;
  const cols = segmentTokens.length + 1;
  const table: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      table[i][j] =
        wordTokens[i - 1] === segmentTokens[j - 1]
          ? table[i - 1][j - 1] + 1
          : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }

  const pairs: Array<[number, number]> = [];
  let i = wordTokens.length;
  let j = segmentTokens.length;
  while (i > 0 && j > 0) {
    if (wordTokens[i - 1] === segmentTokens[j - 1]) {
      pairs.push([i - 1, j - 1]);
      i -= 1;
      j -= 1;
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  return pairs.reverse();
}

export interface AlignmentSegment {
  text: string;
  start: number;
  end: number;
}

/**
 * Convert Fish Audio's alignment segments to timings for the original words.
 * Fish sometimes normalizes text ("it's" becomes "its"), so this aligns by
 * normalized tokens and interpolates any words that do not have a segment.
 */
export function mapAlignmentToWords(
  words: string[],
  segments: AlignmentSegment[],
  durationSec: number,
  leadSec = 0,
  trailSec = 0,
): { timings: WordTiming[]; exact: boolean } {
  const usable = segments
    .filter((segment) => segment.text.trim().length > 0)
    .map((segment) => ({
      ...segment,
      token: normalizeToken(segment.text),
    }))
    .filter((segment) => segment.token.length > 0);

  if (words.length === 0) return { timings: [], exact: false };
  if (usable.length === 0) {
    return {
      timings: estimateWordTimings(words, durationSec, leadSec, trailSec),
      exact: false,
    };
  }

  const wordTokens = words.map(normalizeToken);
  const sameLength = words.length === usable.length;
  const direct =
    sameLength && wordTokens.every((token, index) => token === usable[index].token);

  if (!direct) {
    const pairs = matchSequences(wordTokens, usable.map((segment) => segment.token));
    if (pairs.length < Math.min(words.length, usable.length) * 0.55) {
      return {
        timings: estimateWordTimings(words, durationSec, leadSec, trailSec),
        exact: false,
      };
    }
  }

  const pairs = direct
    ? words.map((_, index) => [index, index] as [number, number])
    : matchSequences(wordTokens, usable.map((segment) => segment.token));

  const timings: Array<WordTiming | null> = new Array(words.length).fill(null);
  const matchedWordIndices = new Set<number>();

  for (const [wordIndex, segmentIndex] of pairs) {
    if (wordIndex >= words.length) continue;
    const segment = usable[segmentIndex];
    const start = leadSec + Math.max(0, segment.start);
    const end = leadSec + Math.max(segment.end, segment.start + MIN_WORD_SECONDS);
    timings[wordIndex] = { word: words[wordIndex], start, end };
    matchedWordIndices.add(wordIndex);
  }

  // Fill gaps between matched anchors with a proportional estimate.
  let wordCursor = 0;
  while (wordCursor < words.length) {
    if (timings[wordCursor]) {
      wordCursor += 1;
      continue;
    }
    let gapEnd = wordCursor;
    while (gapEnd < words.length && !timings[gapEnd]) gapEnd += 1;

    const previous = wordCursor > 0 ? timings[wordCursor - 1] : null;
    const next = gapEnd < words.length ? timings[gapEnd] : null;
    const gapStart = previous ? previous.end : leadSec;
    const gapFinish = next
      ? Math.max(gapStart + 0.08, next.start)
      : Math.max(gapStart + 0.08, durationSec - trailSec);

    const gapWords = words.slice(wordCursor, gapEnd);
    const gapTimings = distributeTimings(gapWords, gapStart, gapFinish);
    gapTimings.forEach((timing, offset) => {
      timings[wordCursor + offset] = timing;
    });
    wordCursor = gapEnd;
  }

  const resolved = timings.map((timing, index) => {
    if (timing) return { ...timing, word: words[index] };
    return {
      word: words[index],
      start: leadSec + (durationSec / words.length) * index,
      end: leadSec + (durationSec / words.length) * (index + 1),
    };
  });

  // Keep the timeline monotonic even if the provider returned a zero-length
  // segment at the end of a chunk.
  for (let index = 1; index < resolved.length; index += 1) {
    if (resolved[index].start < resolved[index - 1].start) {
      resolved[index].start = resolved[index - 1].start;
    }
    if (resolved[index].end < resolved[index].start + MIN_WORD_SECONDS) {
      resolved[index].end = resolved[index].start + MIN_WORD_SECONDS;
    }
  }

  return {
    timings: resolved,
    exact: matchedWordIndices.size === words.length,
  };
}

/** Last word whose start time has passed. -1 during the lead-in silence. */
export function findActiveWord(timings: WordTiming[], elapsedSec: number): number {
  if (timings.length === 0) return -1;
  if (elapsedSec < timings[0].start) return -1;

  let low = 0;
  let high = timings.length - 1;
  let result = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (timings[mid].start <= elapsedSec) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return result;
}
