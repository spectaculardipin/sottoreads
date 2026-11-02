import {
  DEFAULT_TRAINING_SETTINGS,
  isRegressionModel,
} from './model';
import type {
  AdvanceMode,
  EngineId,
  RegressionModel,
  TrainingBundle,
  TrainingRecord,
  TrainingSettings,
} from './types';

const SETTINGS_KEY = 'dictate.settings.v1';
const TRAINING_KEY = 'dictate.training.v1';

export interface AppSettings {
  engine: EngineId;
  voice: string;
  speed: number;
  batchSize: number;
  advanceMode: AdvanceMode;
  training: TrainingSettings;
}

export interface TrainingStore {
  records: TrainingRecord[];
  model: RegressionModel | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  engine: 'kitten',
  voice: 'luna',
  speed: 0.9,
  batchSize: 3,
  advanceMode: 'manual',
  training: { ...DEFAULT_TRAINING_SETTINGS },
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadSettings(): AppSettings {
  const stored = safeParse<Partial<AppSettings>>(
    typeof localStorage === 'undefined' ? null : localStorage.getItem(SETTINGS_KEY),
  );
  if (!stored) return { ...DEFAULT_SETTINGS, training: { ...DEFAULT_TRAINING_SETTINGS } };

  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    training: {
      ...DEFAULT_TRAINING_SETTINGS,
      ...(stored.training ?? {}),
    },
  };
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage may be unavailable in private mode; the app still works in memory.
  }
}

export function loadTraining(): TrainingStore {
  const stored = safeParse<Partial<TrainingStore>>(
    typeof localStorage === 'undefined' ? null : localStorage.getItem(TRAINING_KEY),
  );
  if (!stored) return { records: [], model: null };

  return {
    records: Array.isArray(stored.records) ? stored.records : [],
    model: isRegressionModel(stored.model) ? stored.model : null,
  };
}

export function saveTraining(store: TrainingStore): void {
  try {
    localStorage.setItem(TRAINING_KEY, JSON.stringify(store));
  } catch {
    // Ignore quota/private-mode failures.
  }
}

export function clearTraining(): void {
  try {
    localStorage.removeItem(TRAINING_KEY);
  } catch {
    // Ignore.
  }
}

export function exportTraining(
  records: TrainingRecord[],
  model: RegressionModel | null,
  settings: TrainingSettings,
): TrainingBundle {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    model,
    settings,
  };
}

export function validateBundle(value: unknown): TrainingBundle | null {
  if (!value || typeof value !== 'object') return null;
  const bundle = value as Partial<TrainingBundle>;

  if (bundle.version !== 1) return null;
  if (!Array.isArray(bundle.records)) return null;

  const records = bundle.records.filter(isTrainingRecord);
  if (records.length === 0) return null;

  const settings: TrainingSettings = {
    ...DEFAULT_TRAINING_SETTINGS,
    ...(bundle.settings ?? {}),
  };

  return {
    version: 1,
    exportedAt: typeof bundle.exportedAt === 'string' ? bundle.exportedAt : new Date().toISOString(),
    records,
    model: isRegressionModel(bundle.model) ? bundle.model : null,
    settings,
  };
}

function isTrainingRecord(value: unknown): value is TrainingRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<TrainingRecord>;
  return (
    typeof record.durationMs === 'number' &&
    record.durationMs > 0 &&
    typeof record.wordCount === 'number' &&
    record.wordCount > 0 &&
    typeof record.charCount === 'number' &&
    typeof record.avgWordLength === 'number' &&
    typeof record.syllables === 'number' &&
    typeof record.punctuation === 'number' &&
    typeof record.capitals === 'number' &&
    typeof record.batchSize === 'number' &&
    typeof record.createdAt === 'string' &&
    typeof record.id === 'string'
  );
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result ?? '')));
      } catch {
        reject(new Error('That file is not valid JSON.'));
      }
    };
    reader.readAsText(file);
  });
}
