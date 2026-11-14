import { estimateWordTimings, mapAlignmentToWords, findActiveWord } from '../src/lib/timings';
import { makeBatches, APP_STARTER_TEXT, SAMPLE_TEXT } from '../src/lib/text';
import { predictWritingMs, recordWritingTime, defaultPace } from '../src/lib/pace';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const estimated = estimateWordTimings(['Hello', 'world'], 1, 0.12, 0.08);
assert(estimated.length === 2, 'estimated timing count');
assert(estimated[0].start >= 0.12, 'lead-in is protected');
assert(estimated[1].end <= 0.93, 'trail is protected');

const mapped = mapAlignmentToWords(
  ["It's", 'fine'],
  [
    { text: 'its', start: 0, end: 0.4 },
    { text: 'fine', start: 0.4, end: 0.9 },
  ],
  0.9,
  0.12,
);
assert(mapped.exact, 'normalized alignment maps exactly');
assert(Math.abs(mapped.timings[0].start - 0.12) < 0.001, 'alignment is offset by lead-in');
assert(findActiveWord(mapped.timings, 0.2) === 0, 'active word lookup');

const starter = makeBatches(APP_STARTER_TEXT, 6, 'sentence');
assert(starter.length >= 4, `starter produces enough batches (${starter.length})`);
const freeSample = makeBatches(SAMPLE_TEXT, 6, 'sentence');
assert(freeSample.length >= 3, 'free sample produces batches');
const phrase = makeBatches('One, two, three, four, five, six.', 6, 'phrase');
assert(phrase.length >= 2, 'phrase batching');

const pace = defaultPace();
assert(predictWritingMs(20, pace) > 0, 'pace prediction');
const updated = recordWritingTime(pace, 20, 6000);
assert(updated && updated.samples === 1, 'pace learns from a sample');
assert(updated.msPerChar > 0, 'pace value valid');

console.log('core checks ok', {
  starterBatches: starter.length,
  freeBatches: freeSample.length,
  phraseBatches: phrase.length,
  mapped: mapped.timings,
  pace: updated.msPerChar,
});
