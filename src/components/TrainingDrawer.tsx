import { useEffect, useRef } from 'react';
import {
  Download,
  Info,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { RegressionModel, TrainingRecord, TrainingSettings } from '../lib/types';
import { formatMs } from '../lib/text';

interface TrainingDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: TrainingSettings;
  onSettingsChange: (settings: TrainingSettings) => void;
  records: TrainingRecord[];
  model: RegressionModel | null;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

export function TrainingDrawer({
  open,
  onClose,
  settings,
  onSettingsChange,
  records,
  model,
  onExport,
  onImport,
  onReset,
}: TrainingDrawerProps) {
  const importRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    const timer = window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  const target = Math.max(1, settings.minSamples);
  const collected = records.length;
  const progress = Math.min(1, collected / target);
  const confidence = model
    ? Math.round((Math.exp(Math.max(0.12, model.residualStdDev)) - 1) * 100)
    : null;

  return (
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="training-title">
        <div className="drawer-head">
          <div>
            <h2 id="training-title">Training &amp; privacy</h2>
            <p>Everything here stays in this browser.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close training settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          <section className="drawer-section">
            <div className="switch-row" style={{ borderTop: 0, paddingTop: 0 }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>Learn my pace</h3>
                <p>
                  Collects batch size, word length, syllables, punctuation, and how long you take.
                  It never collects audio or text.
                </p>
              </div>
              <button
                type="button"
                className="switch"
                role="switch"
                aria-checked={settings.enabled}
                aria-label="Enable local pace training"
                onClick={() => onSettingsChange({ ...settings, enabled: !settings.enabled })}
              />
            </div>

            {settings.enabled ? (
              <div style={{ marginTop: 12 }}>
                <div className="predicted-head" style={{ marginBottom: 4 }}>
                  <span>{model ? 'Model ready' : 'Collecting examples'}</span>
                  <span className="word-count">
                    {Math.min(collected, target)} / {target} batches
                  </span>
                </div>
                <div className="training-progress" aria-hidden="true">
                  <span style={{ width: `${progress * 100}%` }} />
                </div>
                <p style={{ marginTop: 8 }}>
                  {model
                    ? 'Your pace model is active. Predictions update as you complete more batches.'
                    : collected >= target
                      ? 'Enough examples collected. The model will train on the next completed batch.'
                      : `Complete ${Math.max(0, target - collected)} more batches to build your first model.`}
                </p>
              </div>
            ) : (
              <p style={{ marginTop: 10 }}>
                Training is off. Turn it on to collect local timing examples and build a personal
                pace model. You can use the microphone or manual advance while training.
              </p>
            )}
          </section>

          {model && (
            <section className="drawer-section">
              <h3>Your pace model</h3>
              <div className="model-stats">
                <div className="model-stat">
                  <strong>{model.sampleCount}</strong>
                  <span>batches used</span>
                </div>
                <div className="model-stat">
                  <strong>{formatMs(model.medianMsPerWord)}</strong>
                  <span>median per word</span>
                </div>
                <div className="model-stat">
                  <strong>{formatMs(model.meanMsPerWord)}</strong>
                  <span>average per word</span>
                </div>
                <div className="model-stat">
                  <strong>{confidence === null ? '—' : `±${confidence}%`}</strong>
                  <span>typical spread</span>
                </div>
              </div>
              <p style={{ marginTop: 10 }}>
                The model uses word count, syllables, average word length, and punctuation to
                estimate your writing time. It works without a microphone.
              </p>
            </section>
          )}

          <section className="drawer-section">
            <h3>Portable training data</h3>
            <p>
              Download a JSON file with your batches, completion times, learned parameters, and
              model settings. Import it later to restore your pace without retraining.
            </p>
            <div className="data-actions">
              <button
                type="button"
                className="btn"
                onClick={onExport}
                disabled={records.length === 0}
              >
                <Download size={15} />
                Export training data
              </button>
              <button type="button" className="btn" onClick={() => importRef.current?.click()}>
                <Upload size={15} />
                Import training data
              </button>
              <button
                type="button"
                className="btn"
                onClick={onReset}
                disabled={records.length === 0 && !model}
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={15} />
                Reset training data
              </button>
            </div>
            <input
              ref={importRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
                event.target.value = '';
              }}
            />
          </section>

          <section className="drawer-section">
            <h3>How predictions work</h3>
            <p>
              After about {target} batches, the app fits a small statistical model to your own
              completion times. It weighs word count, syllables, average word length, and
              punctuation. Predictions are recalculated after every batch, so the model follows
              your pace as you speed up or slow down.
            </p>
            <div className="privacy-note" style={{ marginTop: 12 }}>
              <ShieldCheck size={16} />
              <span>
                Audio is analyzed in memory only. Training data is saved in this browser&apos;s
                local storage. Nothing is uploaded to a server. Export or reset it at any time.
              </span>
            </div>
          </section>

          <section className="drawer-section">
            <h3>Model settings</h3>
            <div className="field" style={{ marginTop: 4 }}>
              <label className="field-label" htmlFor="min-samples">
                Batches before first model
              </label>
              <div className="stepper">
                <button
                  type="button"
                  aria-label="Decrease training batch target"
                  onClick={() =>
                    onSettingsChange({
                      ...settings,
                      minSamples: Math.max(5, settings.minSamples - 1),
                    })
                  }
                >
                  −
                </button>
                <input
                  id="min-samples"
                  type="number"
                  min={5}
                  max={40}
                  value={settings.minSamples}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isFinite(next)) {
                      onSettingsChange({
                        ...settings,
                        minSamples: Math.max(5, Math.min(40, next)),
                      });
                    }
                  }}
                />
                <button
                  type="button"
                  aria-label="Increase training batch target"
                  onClick={() =>
                    onSettingsChange({
                      ...settings,
                      minSamples: Math.min(40, settings.minSamples + 1),
                    })
                  }
                >
                  +
                </button>
              </div>
              <span className="field-note">
                A smaller target trains faster. A larger target gives a steadier model.
              </span>
            </div>
          </section>

          <div className="privacy-note">
            <Info size={15} />
            <span>
              <strong>Privacy first.</strong> The local neural voice runs on your device. The
              browser voice may use your browser vendor&apos;s online service. Neither sends your
              text to this app&apos;s server, because there is no server.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={onClose} style={{ flex: 1 }}>
              Done
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
