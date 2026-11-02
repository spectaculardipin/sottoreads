import type {
  RegressionModel,
  TextStats,
  TrainingRecord,
  TrainingSettings,
} from './types';

export const FEATURE_NAMES = [
  'words',
  'characters',
  'syllables',
  'avg word length',
  'punctuation',
  'capitals',
] as const;

export const DEFAULT_TRAINING_SETTINGS: TrainingSettings = {
  enabled: false,
  minSamples: 10,
  windowSize: 60,
  ridgeLambda: 1.5,
};

export function statsToFeatures(stats: TextStats): number[] {
  return [
    stats.wordCount,
    stats.charCount,
    stats.syllables,
    stats.avgWordLength,
    stats.punctuation,
    stats.capitals,
  ];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function stdDev(values: number[], avg = mean(values)): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const position = (sorted.length - 1) * q;
  const base = Math.floor(position);
  const rest = position - base;
  const next = sorted[base + 1];
  return next === undefined ? sorted[base] : sorted[base] + rest * (next - sorted[base]);
}

/** Remove obvious outliers (very fast clicks, long distractions) using per-word pace. */
export function filterTrainingRecords(records: TrainingRecord[]): TrainingRecord[] {
  const usable = records.filter(
    (record) =>
      Number.isFinite(record.durationMs) &&
      record.durationMs > 350 &&
      record.durationMs < 300_000 &&
      record.wordCount > 0,
  );
  if (usable.length < 6) return usable;

  const paces = usable.map((record) => record.durationMs / record.wordCount).sort((a, b) => a - b);
  const q1 = quantile(paces, 0.25);
  const q3 = quantile(paces, 0.75);
  const iqr = Math.max(1, q3 - q1);
  const lower = Math.max(180, q1 - 1.5 * iqr);
  const upper = Math.min(90_000, q3 + 1.5 * iqr);

  return usable.filter((record) => {
    const pace = record.durationMs / record.wordCount;
    return pace >= lower && pace <= upper;
  });
}

function buildDesignMatrix(
  records: TrainingRecord[],
  means: number[],
  scales: number[],
): number[][] {
  return records.map((record) => {
    const features = statsToFeatures({
      wordCount: record.wordCount,
      charCount: record.charCount,
      avgWordLength: record.avgWordLength,
      syllables: record.syllables,
      punctuation: record.punctuation,
      capitals: record.capitals,
    });
    const row = [1];
    for (let i = 0; i < features.length; i += 1) {
      row.push((features[i] - means[i]) / scales[i]);
    }
    return row;
  });
}

function solveLinearSystem(matrix: number[][], vector: number[]): number[] {
  const n = vector.length;
  const a = matrix.map((row, i) => [...row, vector[i]]);

  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }

    if (Math.abs(a[pivot][col]) < 1e-12) {
      a[pivot][col] = 1e-12;
    }

    if (pivot !== col) {
      [a[col], a[pivot]] = [a[pivot], a[col]];
    }

    const divisor = a[col][col];
    for (let j = col; j <= n; j += 1) {
      a[col][j] /= divisor;
    }

    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = a[row][col];
      if (factor === 0) continue;
      for (let j = col; j <= n; j += 1) {
        a[row][j] -= factor * a[col][j];
      }
    }
  }

  return a.map((row) => row[n]);
}

export function trainModel(
  allRecords: TrainingRecord[],
  settings: TrainingSettings = DEFAULT_TRAINING_SETTINGS,
): RegressionModel | null {
  const filtered = filterTrainingRecords(allRecords);
  if (filtered.length < settings.minSamples) return null;

  // Train on the most recent window so the model adapts to the current pace.
  const records = filtered.slice(-settings.windowSize);
  const featureRows = records.map((record) =>
    statsToFeatures({
      wordCount: record.wordCount,
      charCount: record.charCount,
      avgWordLength: record.avgWordLength,
      syllables: record.syllables,
      punctuation: record.punctuation,
      capitals: record.capitals,
    }),
  );

  const featureCount = featureRows[0].length;
  const means = Array.from({ length: featureCount }, (_, index) =>
    mean(featureRows.map((row) => row[index])),
  );
  const scales = Array.from({ length: featureCount }, (_, index) => {
    const value = stdDev(
      featureRows.map((row) => row[index]),
      means[index],
    );
    return value > 1e-6 ? value : 1;
  });

  const x = buildDesignMatrix(records, means, scales);
  const y = records.map((record) => Math.log(record.durationMs));
  const p = featureCount + 1;

  const xtx = Array.from({ length: p }, () => new Array<number>(p).fill(0));
  const xty = new Array<number>(p).fill(0);

  for (let row = 0; row < x.length; row += 1) {
    for (let i = 0; i < p; i += 1) {
      xty[i] += x[row][i] * y[row];
      for (let j = 0; j < p; j += 1) {
        xtx[i][j] += x[row][i] * x[row][j];
      }
    }
  }

  // Ridge regularization; keep the intercept unregularized.
  for (let i = 1; i < p; i += 1) {
    xtx[i][i] += settings.ridgeLambda;
  }

  const coefficients = solveLinearSystem(xtx, xty);
  const predictions = x.map((row) =>
    row.reduce((sum, value, index) => sum + value * coefficients[index], 0),
  );
  const residuals = predictions.map((prediction, index) => y[index] - prediction);
  const residualStdDev = Math.sqrt(
    residuals.reduce((sum, residual) => sum + residual ** 2, 0) /
      Math.max(1, residuals.length - p),
  );

  const perWord = records.map((record) => record.durationMs / record.wordCount);

  return {
    version: 1,
    trainedAt: new Date().toISOString(),
    sampleCount: records.length,
    coefficients,
    featureMeans: means,
    featureScales: scales,
    residualStdDev: Number.isFinite(residualStdDev) ? residualStdDev : 0.35,
    medianMsPerWord: median(perWord),
    meanMsPerWord: mean(perWord),
    settings: {
      ridgeLambda: settings.ridgeLambda,
      minSamples: settings.minSamples,
      windowSize: settings.windowSize,
    },
  };
}

export interface Prediction {
  ms: number;
  lowMs: number;
  highMs: number;
}

export function predictMs(model: RegressionModel | null, stats: TextStats): Prediction | null {
  if (!model) return null;
  const features = statsToFeatures(stats);
  if (features.length !== model.featureMeans.length) return null;

  let logPrediction = model.coefficients[0] ?? 0;
  for (let i = 0; i < features.length; i += 1) {
    const scale = model.featureScales[i] || 1;
    const standardized = (features[i] - model.featureMeans[i]) / scale;
    logPrediction += standardized * (model.coefficients[i + 1] ?? 0);
  }

  const clamp = (value: number) => Math.max(1500, Math.min(180_000, value));
  const sigma = Math.max(0.12, model.residualStdDev || 0.35);
  const center = Math.exp(logPrediction);

  return {
    ms: clamp(center),
    lowMs: clamp(Math.exp(logPrediction - 1.28 * sigma)),
    highMs: clamp(Math.exp(logPrediction + 1.28 * sigma)),
  };
}

export function isRegressionModel(value: unknown): value is RegressionModel {
  if (!value || typeof value !== 'object') return false;
  const model = value as Partial<RegressionModel>;
  return (
    model.version === 1 &&
    Array.isArray(model.coefficients) &&
    Array.isArray(model.featureMeans) &&
    Array.isArray(model.featureScales) &&
    model.coefficients.length === model.featureMeans.length + 1 &&
    model.featureMeans.length === model.featureScales.length &&
    typeof model.sampleCount === 'number' &&
    typeof model.medianMsPerWord === 'number'
  );
}

export function modelReady(model: RegressionModel | null): boolean {
  return Boolean(model && model.sampleCount >= 1);
}
