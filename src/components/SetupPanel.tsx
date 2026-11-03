import { useRef, useState } from 'react';
import {
  BookOpen,
  Clock,
  Hand,
  Info,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { AppSettings } from '../lib/storage';
import type { BatchMode, VoiceOption } from '../lib/types';
import { FileDrop } from './FileDrop';

const ACCEPT = '.pdf,.docx,.txt,.md,.text,application/pdf,text/plain';

interface SetupPanelProps {
  text: string;
  onTextChange: (text: string) => void;
  settings: AppSettings;
  onSettingsChange: (patch: Partial<AppSettings>) => void;
  voices: VoiceOption[];
  onStart: () => void;
  isParsing: boolean;
  parseLabel?: string;
  parseProgress: number;
  fileName: string | null;
  onFile: (file: File) => void;
  onStartTraining: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onLoadSample: () => void;
  onClear: () => void;
}

export function SetupPanel({
  text,
  onTextChange,
  settings,
  onSettingsChange,
  voices,
  onStart,
  isParsing,
  parseLabel,
  parseProgress,
  fileName,
  onFile,
  onStartTraining,
  onExport,
  onImport,
  onReset,
  onLoadSample,
  onClear,
}: SetupPanelProps) {
  const importRef = useRef<HTMLInputElement>(null);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const batches = !text.trim()
    ? 0
    : settings.batchMode === 'words'
      ? Math.ceil(words / settings.batchSize)
      : settings.batchMode === 'sentence'
        ? Math.max(1, text.match(/[.!?]+/g)?.length ?? 1)
        : Math.max(1, text.match(/[;:,]+/g)?.length ?? 1);
  const canStart = words > 0 && !isParsing;

  return (
    <>
      <section className="hero">
        <span className="eyebrow">
          <Sparkles size={13} strokeWidth={2.2} />
          Browser dictation practice
        </span>
        <h1>Read. Write. Keep pace.</h1>
        <p>
          Load your notes, hear them in small batches, and write at your own pace. Train your
          personal pace once, then let Smart mode advance automatically. Everything stays on your
          device.
        </p>
      </section>

      <div className="setup-grid">
        <section className="panel">
          <div className="panel-pad">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Your text</h2>
                <span className="panel-hint">Paste notes or upload a document.</span>
              </div>
            </div>

            <TextTabs
              text={text}
              onTextChange={onTextChange}
              onFile={onFile}
              isParsing={isParsing}
              parseLabel={parseLabel}
              parseProgress={parseProgress}
              fileName={fileName}
              onLoadSample={onLoadSample}
              onClear={onClear}
            />

            <div className="input-footer">
              <span className="word-count">
                {words.toLocaleString()} words · {batches.toLocaleString()} batches
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" className="link-btn" onClick={onLoadSample}>
                  Load sample
                </button>
                {text.length > 0 && (
                  <button type="button" className="link-btn" onClick={onClear}>
                    <Trash2 size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="panel panel-pad">
          <div className="settings">
            <div className="field">
              <label className="field-label" htmlFor="batch-mode">
                Batch by
              </label>
              <select
                id="batch-mode"
                className="select"
                value={settings.batchMode}
                onChange={(event) =>
                  onSettingsChange({ batchMode: event.target.value as BatchMode })
                }
              >
                <option value="words">Words</option>
                <option value="sentence">Sentence</option>
                <option value="phrase">Phrase</option>
              </select>
            </div>

            {settings.batchMode === 'words' && (
              <div className="field">
                <label className="field-label" htmlFor="batch-size">
                  Words per batch
                </label>
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="Decrease words per batch"
                    onClick={() =>
                      onSettingsChange({ batchSize: Math.max(1, settings.batchSize - 1) })
                    }
                  >
                    −
                  </button>
                  <input
                    id="batch-size"
                    type="number"
                    min={1}
                    max={20}
                    value={settings.batchSize}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (Number.isFinite(next)) {
                        onSettingsChange({ batchSize: Math.max(1, Math.min(20, next)) });
                      }
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Increase words per batch"
                    onClick={() =>
                      onSettingsChange({ batchSize: Math.min(20, settings.batchSize + 1) })
                    }
                  >
                    +
                  </button>
                </div>
                <span className="field-note">
                  A short phrase is easier to hold in mind while writing.
                </span>
              </div>
            )}

            <div className="field">
              <span className="field-label">Voice engine</span>
              <div className="segmented" role="group" aria-label="Voice engine">
                <button
                  type="button"
                  aria-pressed={settings.engine === 'kitten'}
                  onClick={() => onSettingsChange({ engine: 'kitten' })}
                >
                  Local neural
                </button>
                <button
                  type="button"
                  aria-pressed={settings.engine === 'browser'}
                  onClick={() => onSettingsChange({ engine: 'browser' })}
                >
                  Browser voice
                </button>
              </div>
              <span className="field-note">
                {settings.engine === 'kitten'
                  ? 'KittenTTS runs on your device. The voice model downloads once and is cached.'
                  : 'Uses your browser’s built-in voice. Instant, no download.'}
              </span>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="voice">
                Voice
              </label>
              <select
                id="voice"
                className="select"
                value={settings.voice}
                onChange={(event) => onSettingsChange({ voice: event.target.value })}
              >
                {voices.length === 0 && <option value="">System default</option>}
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="speed">
                Speaking speed
                <span className="range-value">{settings.speed.toFixed(2)}×</span>
              </label>
              <div className="range-row">
                <input
                  id="speed"
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={settings.speed}
                  onChange={(event) => onSettingsChange({ speed: Number(event.target.value) })}
                />
              </div>
              <span className="field-note">Slower is usually better for dictation.</span>
            </div>

            <div className="field">
              <span className="field-label">Advance to next batch</span>
              <div className="segmented" role="group" aria-label="Advance mode">
                <button
                  type="button"
                  aria-pressed={settings.advanceMode === 'manual'}
                  onClick={() => onSettingsChange({ advanceMode: 'manual' })}
                >
                  <Hand size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Manual
                </button>
                <button
                  type="button"
                  aria-pressed={settings.advanceMode === 'smart'}
                  onClick={() =>
                    settings.trainingCompleted
                      ? onSettingsChange({ advanceMode: 'smart' })
                      : null
                  }
                  disabled={!settings.trainingCompleted}
                  title={settings.trainingCompleted ? 'Use your learned pace' : 'Train first to unlock Smart mode'}
                >
                  <Clock size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Smart
                </button>
              </div>
              <span className="field-note">
                {settings.advanceMode === 'manual'
                  ? 'Click Next when you finish writing.'
                  : 'Smart advances using your learned pace.'}
              </span>
            </div>

            <div className="switch-row">
              <div>
                <div className="field-label" style={{ marginBottom: 2 }}>
                  Personal pace
                </div>
                <span className="field-note">
                  {settings.trainingCompleted
                    ? 'Training complete. Smart mode is unlocked.'
                    : 'A short training session teaches the app your writing speed.'}
                </span>
              </div>
              <span className={`pill${settings.trainingCompleted ? ' ok' : ' warn'}`}>
                {settings.trainingCompleted ? 'Trained' : 'Not trained'}
              </span>
            </div>

            <div className="data-actions" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button type="button" className="link-btn" onClick={onExport}>
                Export pace data
              </button>
              <button type="button" className="link-btn" onClick={() => importRef.current?.click()}>
                Import
              </button>
              <button type="button" className="link-btn" onClick={onReset} style={{ color: 'var(--danger)' }}>
                Reset
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

            <div className="start-row">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={onStart}
                disabled={!canStart}
              >
                <BookOpen size={18} strokeWidth={2} />
                Start dictation
              </button>
              <button type="button" className="btn" onClick={onStartTraining}>
                <Sparkles size={15} />
                Start training session
              </button>
            </div>

            <div className="privacy-note">
              <Info size={15} />
              <span>
                Text, timing, and training data stay in this browser. No account, no server, no
                paid API. No microphone is used.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

interface TextTabsProps {
  text: string;
  onTextChange: (text: string) => void;
  onFile: (file: File) => void;
  isParsing: boolean;
  parseLabel?: string;
  parseProgress: number;
  fileName: string | null;
  onLoadSample: () => void;
  onClear: () => void;
}

function TextTabs({
  text,
  onTextChange,
  onFile,
  isParsing,
  parseLabel,
  parseProgress,
  fileName,
  onLoadSample,
  onClear,
}: TextTabsProps) {
  const [tab, setTab] = useState<'paste' | 'upload'>('paste');

  return (
    <div>
      <div className="panel-head" style={{ marginBottom: 12 }}>
        <div className="tabs" role="tablist" aria-label="Text input method">
          <button
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === 'paste'}
            onClick={() => setTab('paste')}
          >
            Paste text
          </button>
          <button
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === 'upload'}
            onClick={() => setTab('upload')}
          >
            Upload file
          </button>
        </div>
        {fileName && tab === 'upload' && (
          <span className="word-count" title={fileName}>
            {fileName.length > 28 ? `${fileName.slice(0, 25)}…` : fileName}
          </span>
        )}
      </div>

      {tab === 'paste' ? (
        <textarea
          className="textarea"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Paste your notes here. The app will split them into small batches and read each one aloud."
          spellCheck={false}
          aria-label="Text to dictate"
        />
      ) : (
        <FileDrop
          accept={ACCEPT}
          onFile={onFile}
          isParsing={isParsing}
          progressLabel={parseLabel}
          progress={parseProgress}
        />
      )}

      {tab === 'upload' && text.length > 0 && (
        <div className="input-footer">
          <span className="word-count">
            Text loaded. Switch to Paste text to review or edit it.
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button type="button" className="link-btn" onClick={() => setTab('paste')}>
              View text
            </button>
            <button type="button" className="link-btn" onClick={onLoadSample}>
              Load sample
            </button>
            <button type="button" className="link-btn" onClick={onClear}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
