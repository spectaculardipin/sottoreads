import type { FeedbackRating, TrainingModel, TrainingRecord } from './types';

/** Remove distractions: very fast clicks or very long pauses. */
export function filterTrainingRecords(records: TrainingRecord[]): TrainingRecord[] {
  return records.filter(
    (record) =>
      Number.isFinite(record.durationMs) &&
      record.durationMs > 350 &&
      record.durationMs < 300_000 &&
      record.charCount > 0,
  );
}

export function trainModel(records: TrainingRecord[]): TrainingModel | null {
  const usable = filterTrainingRecords(records);
  if (usable.length < 3) return null;

  const totalMs = usable.reduce((sum, record) => sum + record.durationMs, 0);
  const totalChars = usable.reduce((sum, record) => sum + record.charCount, 0);
  const msPerChar = totalChars > 0 ? totalMs / totalChars : 0;

  return {
    version: 1,
    sampleCount: usable.length,
    msPerChar: Number.isFinite(msPerChar) && msPerChar > 0 ? msPerChar : 60,
    trainedAt: new Date().toISOString(),
  };
}

/** Estimate writing time for a batch from its character count. */
export function predictMs(model: TrainingModel | null, charCount: number): number | null {
  if (!model || charCount <= 0) return null;
  if (!Number.isFinite(model.msPerChar) || model.msPerChar <= 0) return null;
  return Math.max(800, charCount * model.msPerChar);
}

export function adjustMsPerChar(
  model: TrainingModel | null,
  rating: FeedbackRating,
): TrainingModel | null {
  if (!model) return null;
  const factors: Record<FeedbackRating, number> = {
    'too-slow': 0.85,
    'a-little-slow': 0.925,
    okay: 1.0,
    'a-little-fast': 1.075,
    'too-fast': 1.15,
  };
  return {
    ...model,
    msPerChar: Math.max(20, Math.min(500, model.msPerChar * factors[rating])),
    trainedAt: new Date().toISOString(),
  };
}
