import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  FileUp,
  Loader2,
  Lock,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  SkipBack,
  SkipForward,
  Square,
} from 'lucide-react';
import { useDictation } from '../hooks/useDictation';
import { loadBrowserVoices, browserSpeechSupported } from '../lib/browserSpeech';
import { parseFile } from '../lib/files';
import { makeBatches, SAMPLE_TEXT, splitWords } from '../lib/text';
import type { BatchMode } from '../lib/types';
import { WordPhrase } from './session/WordPhrase';

interface FreePracticeProps {
  onOpenPro: () => void;
}

const MODES: Array<{ id: BatchMode; label: string }> = [
  { id: 'sentence', label: 'Sentence' },
  { id: 'phrase', label: 'Phrase' },
  { id: 'words', label: 'Words' },
];

const FREE_VOICE_LIMIT = 3;

function statusText(status: string): string {
  if (status === 'preparing') return 'Preparing the voice…';
  if (status === 'playing') return 'Reading aloud.';
  if (status === 'paused') return 'Paused. Press Play to start this batch again.';
  if (status === 'your-turn') return 'Your turn. Write it down, then press Next.';
  if (status === 'complete') return 'Session complete.';
  if (status === 'error') return 'The voice could not start.';
  return 'Ready.';
}

export function FreePractice({ onOpenPro }: FreePracticeProps) {
  const dictation = useDictation();
  const [text, setText] = useState(SAMPLE_TEXT);
  const [mode, setMode] = useState<BatchMode>('sentence');
  const [wordsPerBatch, setWordsPerBatch] = useState(6);
  const [speed, setSpeed] = useState(0.92);
  const [voiceURI, setVoiceURI] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [editing, setEditing] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [fileProgress, setFileProgress] = useState<string | null>(null);
  const [smartUpsell, setSmartUpsell] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    if (!browserSpeechSupported()) return;
    void loadBrowserVoices().then((loaded) => {
      if (!active) return;
      setVoices(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  const freeVoices = useMemo(() => voices.slice(0, FREE_VOICE_LIMIT), [voices]);
  const selectedVoiceURI = freeVoices.some((voice) => voice.voiceURI === voiceURI)
    ? voiceURI
    : (freeVoices[0]?.voiceURI ?? '');

  const words = useMemo(() => splitWords(text), [text]);
  const batchCount = useMemo(
    () => makeBatches(text, wordsPerBatch, mode).length,
    [text, wordsPerBatch, mode],
  );
  const activeBatch = dictation.batches[dictation.index];
  const isActive = dictation.batches.length > 0;
  const sessionStatus = dictation.status;
  const preparing = sessionStatus === 'preparing';
  const playing = sessionStatus === 'playing';
  const paused = sessionStatus === 'paused';
  const revealAll = sessionStatus === 'your-turn' || sessionStatus === 'complete';
  const completed = sessionStatus === 'complete';
  const lastBatch = dictation.index >= dictation.batches.length - 1;
  const totalWords = dictation.batches.reduce((sum, batch) => sum + batch.words.length, 0);
  const progress = isActive
    ? Math.min(100, ((dictation.index + 1) / Math.max(1, dictation.batches.length)) * 100)
    : 0;

  async function handleFile(file: File | null) {
    if (!file) return;
    setFormError(null);
    setFileProgress('Reading file');
    try {
      const parsed = await parseFile(file, (progressUpdate) => {
        setFileProgress(progressUpdate.label);
      });
      if (!parsed.trim()) {
        setFormError('That file did not contain readable text.');
        return;
      }
      setText(parsed);
      setFileLabel(`${file.name} · ${splitWords(parsed).length} words`);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'That file could not be opened.');
    } finally {
      setFileProgress(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function startSession() {
    if (!text.trim()) {
      setFormError('Paste or upload some text first.');
      return;
    }
    if (!browserSpeechSupported()) {
      setFormError('This browser does not support built-in speech synthesis. Try Chrome or Edge.');
      return;
    }
    setFormError(null);
    setSmartUpsell(false);
    setEditing(false);
    void dictation.start(text, {
      voice: 'browser',
      speed,
      batchMode: mode,
      wordsPerBatch,
      browserVoiceURI: selectedVoiceURI,
      cloudVoiceId: '',
      advance: 'manual',
      prefetchAhead: 4,
      learnPace: false,
    });
  }

  function editText() {
    dictation.reset();
    setEditing(true);
    setSmartUpsell(false);
  }

  function clearText() {
    setText('');
    setFileLabel(null);
    setFormError(null);
  }

  function adjustWords(delta: number) {
    setWordsPerBatch((current) => Math.max(2, Math.min(12, current + delta)));
  }

  return (
    <section className="section free-section" id="free">
      <div className="shell">
        <div className="free-head">
          <div>
            <span className="chip chip-free">
              <span className="chip-dot" />
              Free · Browser voice
            </span>
            <h2 className="free-title">Free dictation</h2>
            <p className="free-sub">
              Paste text, choose a voice, and start. No account needed.
            </p>
          </div>
          <div className="free-head-meta">
            <span>{freeVoices.length > 0 ? `${freeVoices.length} browser voices` : 'Browser voice'}</span>
            <span>Manual advance</span>
          </div>
        </div>

        <div className="free-app-shell">
          {editing || !isActive ? (
            <div className="free-setup-layout">
              <section className="free-panel free-text-panel">
                <div className="free-panel-head">
                  <div>
                    <h3>Your text</h3>
                    <span>Paste notes or upload a document.</span>
                  </div>
                  <span className="free-count">
                    {words.length} words · {batchCount} {batchCount === 1 ? 'batch' : 'batches'}
                  </span>
                </div>

                <textarea
                  id="free-text"
                  className="free-input-area"
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    setFileLabel(null);
                  }}
                  placeholder="Paste your notes here. Sotto reads one short batch at a time."
                  spellCheck={false}
                  aria-label="Text for free dictation"
                />

                <div className="free-input-tools">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md,text/plain,application/pdf"
                    className="sr-only"
                    id="free-file"
                    onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    className="file-button"
                    onClick={() => fileRef.current?.click()}
                  >
                    <FileUp size={14} />
                    Upload
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => {
                      setText(SAMPLE_TEXT);
                      setFileLabel(null);
                      setFormError(null);
                    }}
                  >
                    Sample
                  </button>
                  <button type="button" className="text-link" onClick={clearText}>
                    Clear
                  </button>
                  <span className="free-file-note">
                    {fileProgress ? (
                      <>
                        <Loader2 size={11} className="spin" />
                        {fileProgress}
                      </>
                    ) : fileLabel ? (
                      <>
                        <Check size={11} />
                        {fileLabel}
                      </>
                    ) : (
                      'Stays in your browser'
                    )}
                  </span>
                </div>

                {formError ? (
                  <p className="form-error" role="alert">
                    <AlertCircle size={14} />
                    {formError}
                  </p>
                ) : null}
              </section>

              <aside className="free-panel free-config">
                <div className="free-field">
                  <label className="free-field-label" htmlFor="free-mode">
                    Batch by
                  </label>
                  <select
                    id="free-mode"
                    className="select"
                    value={mode}
                    onChange={(event) => setMode(event.target.value as BatchMode)}
                  >
                    {MODES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {mode === 'words' ? (
                  <div className="free-field">
                    <label className="free-field-label" htmlFor="free-batch-size">
                      Words per batch
                    </label>
                    <div className="free-stepper">
                      <button
                        type="button"
                        onClick={() => adjustWords(-1)}
                        aria-label="Decrease words per batch"
                      >
                        −
                      </button>
                      <input
                        id="free-batch-size"
                        type="number"
                        min={2}
                        max={12}
                        value={wordsPerBatch}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          if (Number.isFinite(next)) {
                            setWordsPerBatch(Math.max(2, Math.min(12, next)));
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => adjustWords(1)}
                        aria-label="Increase words per batch"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="free-field">
                  <label className="free-field-label" htmlFor="free-voice">
                    Voice
                  </label>
                  <select
                    id="free-voice"
                    className="select"
                    value={selectedVoiceURI}
                    onChange={(event) => setVoiceURI(event.target.value)}
                  >
                    {freeVoices.length === 0 ? <option value="">System default</option> : null}
                    {freeVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} · {voice.lang}
                      </option>
                    ))}
                  </select>
                  <span className="free-field-note">
                    {freeVoices.length > 0
                      ? `${freeVoices.length} browser voices available on this device.`
                      : 'Uses your system default voice.'}
                  </span>
                </div>

                <div className="free-field">
                  <label className="free-field-label" htmlFor="free-speed">
                    Speaking speed
                    <strong>{speed.toFixed(2)}×</strong>
                  </label>
                  <input
                    id="free-speed"
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    value={speed}
                    onChange={(event) => setSpeed(Number(event.target.value))}
                  />
                  <span className="free-field-note">Slower is usually easier for dictation.</span>
                </div>

                <div className="free-field">
                  <span className="free-field-label">Advance</span>
                  <div className="segmented free-advance" role="group" aria-label="Advance mode">
                    <button type="button" aria-pressed={true} onClick={() => setSmartUpsell(false)}>
                      Manual
                    </button>
                    <button
                      type="button"
                      className="smart-lock"
                      aria-pressed={false}
                      onClick={() => setSmartUpsell(true)}
                      title="Smart mode is a Pro feature"
                    >
                      <Lock size={11} />
                      Smart
                      <span className="pro-tag">Pro</span>
                    </button>
                  </div>
                  <span className="free-field-note">
                    Manual: press Next when you finish writing. Smart is Pro.
                  </span>
                </div>

                {smartUpsell ? (
                  <div className="smart-paywall" role="note">
                    <div className="smart-paywall-head">
                      <Lock size={14} />
                      <strong>Smart mode is a Pro feature.</strong>
                    </div>
                    <p>
                      It learns how long you take to write a batch, then starts the next one for
                      you.
                    </p>
                    <div className="smart-paywall-actions">
                      <button type="button" className="btn btn-primary btn-sm" onClick={onOpenPro}>
                        Open Pro
                        <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => setSmartUpsell(false)}
                      >
                        Keep manual
                      </button>
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="btn btn-primary btn-lg free-start-btn"
                  onClick={startSession}
                >
                  Start dictation
                </button>
                <p className="free-privacy-line">
                  Uses your browser voice. Nothing is uploaded.
                </p>
              </aside>
            </div>
          ) : (
            <div className="free-session-shell">
              <div className="free-session-header">
                <span className="free-batch-meta">
                  Batch <strong>{dictation.index + 1}</strong> of {dictation.batches.length}
                </span>
                <div className="free-session-actions">
                  <span className="free-session-voice">Browser voice · Manual</span>
                  <button type="button" className="text-link" onClick={editText}>
                    <Square size={11} />
                    End session
                  </button>
                </div>
              </div>

              <div
                className="free-progress"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={dictation.batches.length}
                aria-valuenow={dictation.index + 1}
                aria-label="Session progress"
              >
                <span className="free-progress-fill" style={{ width: `${progress}%` }} />
              </div>

              {dictation.error ? (
                <div className="inline-error" role="alert">
                  <AlertCircle size={15} />
                  <span>{dictation.error}</span>
                  <button type="button" className="btn btn-sm" onClick={dictation.retry}>
                    Try again
                  </button>
                </div>
              ) : null}

              {completed ? (
                <div className="free-complete">
                  <span className="free-complete-mark">
                    <Check size={22} />
                  </span>
                  <h3>Session complete.</h3>
                  <p>
                    {dictation.batches.length} batches · {totalWords} words.
                  </p>
                  <div className="free-complete-actions">
                    <button type="button" className="btn btn-primary" onClick={startSession}>
                      <RefreshCw size={14} />
                      Practice again
                    </button>
                    <button type="button" className="btn" onClick={editText}>
                      Edit text
                    </button>
                  </div>
                </div>
              ) : activeBatch ? (
                <>
                  <div className="free-batch-card">
                    <WordPhrase
                      words={activeBatch.words}
                      activeWord={dictation.activeWord}
                      revealAll={revealAll}
                      className="free-words"
                    />
                    <p className="free-status" aria-live="polite">
                      {statusText(sessionStatus)}
                    </p>
                  </div>

                  <div className="free-session-controls">
                    <button
                      type="button"
                      className="btn"
                      onClick={dictation.previous}
                      disabled={dictation.index === 0 || preparing}
                    >
                      <SkipBack size={15} />
                      Previous
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={dictation.replay}
                      disabled={preparing}
                    >
                      <RotateCcw size={15} />
                      Replay
                    </button>
                    {playing || paused ? (
                      <button type="button" className="btn" onClick={dictation.play}>
                        {playing ? <Pause size={15} /> : <Play size={15} />}
                        {playing ? 'Pause' : 'Play'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={dictation.next}
                      disabled={preparing}
                    >
                      {lastBatch ? 'Finish' : 'Next'}
                      <SkipForward size={15} />
                    </button>
                  </div>

                  <div className="free-session-foot">
                    <span>Manual advance</span>
                    <span>Browser voice</span>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
