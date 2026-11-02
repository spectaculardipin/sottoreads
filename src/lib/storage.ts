import type { AppSettings, TrainingStore } from './types';

export type { AppSettings } from './types';

const SETTINGS_KEY = 'dictate.settings.v2';
const TRAINING_KEY = 'dictate.training.v2';

export const DEFAULT_SETTINGS: AppSettings = {
  engine: 'kitten',
  voice: 'luna',
  speed: 0.9,
  batchSize: 3,
  batchMode: 'words',
  advanceMode: 'manual',
  trainingCompleted: false,
  msPerChar: null,
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
  const merged: AppSettings = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  if (merged.advanceMode === 'smart' && (!merged.trainingCompleted || merged.msPerChar == null)) {
    merged.advanceMode = 'manual';
  }
  return merged;
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
    model: stored.model && stored.model.version === 1 ? stored.model : null,
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
