import { useState } from 'react';
import {
  BookOpen,
  Clock,
  Hand,
  Info,
  Mic,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { AppSettings } from '../lib/storage';
import type { BatchMode, VoiceOption } from '../lib/types';
import { makeBatches } from '../lib/text';
import { FileDrop } from './FileDrop';

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
  onOpenTraining: () => void;
  recordsCount: number;
  modelReady: boolean;
  onLoadSample: () => void;
  onClear: () => void;
}

const ACCEPT = '.pdf,.docx,.txt,.md,.text,application/pdf,text/plain';

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
  onOpenTraining,
  recordsCount,
  modelReady,
  onLoadSample,
  onClear,
}: SetupPanelProps) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const batches = text.trim() ? makeBatches(text, settings.batchSize, settings.batchMode).length : 0;
  const canStart = words > 0 && !isParsing;
  const minSamples = settings.training.minSamples;

  return (
    <>
      <section className="hero">
        <span className="eyebrow">
          <Sparkles size={13} strokeWidth={2.2} />
          Browser dictation practice
        </span>
        <h1>
          Read. Write. <em>Keep pace.</em>
        </h1>
        <p>
          Load your notes, hear them in small batches, and write at your own pace. The app can
          listen for your voice or learn your rhythm and advance automatically. Everything stays
          on your device.
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
                {settings.engine === 'kitten' ? (
                  <>
                    <strong>KittenTTS</strong> runs on your device. The first use downloads about
                    25&nbsp;MB once and caches it in your browser.
                  </>
                ) : (
                  <>
                    Uses your browser&apos;s built-in voice. It is instant and needs no download,
                    but some browsers may use an online voice service.
                  </>
                )}
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
                  title="Click Next when you finish writing"
                >
                  <Hand size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Manual
                </button>
                <button
                  type="button"
                  aria-pressed={settings.advanceMode === 'mic'}
                  onClick={() => onSettingsChange({ advanceMode: 'mic' })}
                  title="Listen for speech and pauses"
                >
                  <Mic size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Mic
                </button>
                <button
                  type="button"
                  aria-pressed={settings.advanceMode === 'predicted'}
                  onClick={() => onSettingsChange({ advanceMode: 'predicted' })}
                  title="Use your personal timing model"
                >
                  <Clock size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Predicted
                </button>
              </div>
              <span className="field-note">
                {settings.advanceMode === 'manual' &&
                  'You stay in control. Click Next when done.'}
                {settings.advanceMode === 'mic' &&
                  'The app listens for your voice and a short pause. Audio is never recorded.'}
                {settings.advanceMode === 'predicted' &&
                  (modelReady
                    ? 'The app advances using your learned writing pace.'
                    : 'Train a pace model first for personal predictions. Default timing is used until then.')}
              </span>
            </div>

            <div className="switch-row">
              <div>
                <div className="field-label" style={{ marginBottom: 2 }}>
                  Learn my pace
                  {modelReady && (
                    <span className="pill ok" style={{ marginLeft: 8 }}>
                      Model ready
                    </span>
                  )}
                </div>
                <span className="field-note">
                  {settings.training.enabled
                    ? modelReady
                      ? 'Training is on. Predictions improve with each batch.'
                      : `Training is on. ${Math.max(0, minSamples - recordsCount)} more batches to build a model.`
                    : 'Opt in to collect timing locally and predict your writing pace.'}
                </span>
              </div>
              <button
                type="button"
                className="switch"
                role="switch"
                aria-checked={settings.training.enabled}
                aria-label="Enable local pace training"
                onClick={() =>
                  onSettingsChange({
                    training: { ...settings.training, enabled: !settings.training.enabled },
                  })
                }
              />
            </div>

            <div className="engine-status" aria-live="polite">
              <span className="status-dot" />
              <span>
                {settings.engine === 'kitten'
                  ? 'Local neural voice · runs on your device'
                  : 'Browser voice · instant, no download'}
              </span>
            </div>

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
              <button type="button" className="link-btn" onClick={onOpenTraining}>
                <Sparkles size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                Training &amp; privacy settings
              </button>
            </div>

            <div className="privacy-note">
              <Info size={15} />
              <span>
                Text, microphone analysis, and training data stay in this browser. No account, no
                server, no paid API.
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
