import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  FileUp,
  Headphones,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useDictation } from '../hooks/useDictation';
import { loadBrowserVoices, browserSpeechSupported } from '../lib/browserSpeech';
import { parseFile } from '../lib/files';
import { formatClock, makeBatches, SAMPLE_TEXT, splitWords } from '../lib/text';
import type { AdvanceMode, BatchMode } from '../lib/types';
import { PlayerPanel } from './session/PlayerPanel';

interface FreePracticeProps {
  onOpenPro: () => void;
}

const MODES: Array<{ id: BatchMode; label: string }> = [
  { id: 'sentence', label: 'Sentence' },
  { id: 'phrase', label: 'Phrase' },
  { id: 'words', label: 'Words' },
];

export function FreePractice({ onOpenPro }: FreePracticeProps) {
  const dictation = useDictation();
  const [text, setText] = useState(SAMPLE_TEXT);
  const [mode, setMode] = useState<BatchMode>('sentence');
  const [wordsPerBatch, setWordsPerBatch] = useState(6);
  const [advance, setAdvance] = useState<AdvanceMode>('manual');
  const [speed, setSpeed] = useState(0.92);
  const [voiceURI, setVoiceURI] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [editing, setEditing] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [fileProgress, setFileProgress] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    if (!browserSpeechSupported()) return;
    void loadBrowserVoices().then((loaded) => {
      if (!active) return;
      setVoices(loaded);
      setVoiceURI((current) => {
        if (current) return current;
        const english = loaded.find((voice) => voice.lang.toLowerCase().startsWith('en'));
        return (english ?? loaded[0])?.voiceURI ?? '';
      });
    });
    return () => {
      active = false;
    };
  }, []);

  const words = useMemo(() => splitWords(text), [text]);
  const batchCount = useMemo(
    () => makeBatches(text, wordsPerBatch, mode).length,
    [text, wordsPerBatch, mode],
  );
  const activeBatch = dictation.batches[dictation.index];
  const isActive = dictation.batches.length > 0;
  const sessionStatus = dictation.status;
  const revealAll = sessionStatus === 'your-turn' || sessionStatus === 'complete';
  const playing = sessionStatus === 'playing';
  const progress = revealAll
    ? 1
    : activeBatch && dictation.activeWord >= 0
      ? Math.min(1, (dictation.activeWord + 0.65) / activeBatch.words.length)
      : 0;

  const statusLabel =
    sessionStatus === 'preparing'
      ? 'Preparing voice'
      : sessionStatus === 'playing'
        ? 'Reading aloud'
        : sessionStatus === 'paused'
          ? 'Paused'
          : sessionStatus === 'your-turn'
            ? 'Your turn'
            : sessionStatus === 'complete'
              ? 'Session complete'
              : sessionStatus === 'error'
                ? 'Voice error'
                : 'Ready';

  const advanceLabel =
    sessionStatus === 'your-turn'
      ? dictation.settings.advance === 'smart' && dictation.remainingMs !== null
        ? 'Smart advance in'
        : 'Manual advance'
      : undefined;
  const advanceValue =
    sessionStatus === 'your-turn'
      ? dictation.settings.advance === 'smart' && dictation.remainingMs !== null
        ? formatClock(dictation.remainingMs)
        : 'when ready'
      : undefined;

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
    setEditing(false);
    void dictation.start(text, {
      voice: 'browser',
      speed,
      batchMode: mode,
      wordsPerBatch,
      browserVoiceURI: voiceURI,
      cloudVoiceId: '',
      advance,
      prefetchAhead: 4,
    });
  }

  function editText() {
    dictation.reset();
    setEditing(true);
  }

  return (
    <section className="section free-section" id="free">
      <div className="shell">
        <div className="free-head">
          <span className="chip chip-free">
            <span className="chip-dot" />
            Free · Browser voice
          </span>
          <h2 className="section-title">The free room. Start with one paste.</h2>
          <p className="section-lede">
            No account, no upload, no card. Paste your notes and your browser reads one short
            batch, then waits while you write it down.
          </p>
        </div>

        <div className="free-room">
          {editing || !isActive ? (
            <div className="free-setup">
              <div className="free-input-col">
                <div className="free-field-head">
                  <label htmlFor="free-text">Your text</label>
                  <span>
                    {words.length} words · {batchCount} {batchCount === 1 ? 'batch' : 'batches'}
                  </span>
                </div>
                <textarea
                  id="free-text"
                  className="free-textarea"
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    setFileLabel(null);
                  }}
                  placeholder="Paste a paragraph, a lecture note, or a page from a book…"
                  spellCheck={false}
                />
                <div className="free-input-foot">
                  <div className="free-file-actions">
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
                      <FileUp size={15} />
                      Upload a file
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
                      Use the sample
                    </button>
                  </div>
                  <span className="free-privacy">
                    {fileProgress ? (
                      <>
                        <Loader2 size={12} className="spin" />
                        {fileProgress}
                      </>
                    ) : fileLabel ? (
                      <>
                        <Check size={12} />
                        {fileLabel}
                      </>
                    ) : (
                      'Runs in your browser'
                    )}
                  </span>
                </div>
                {formError ? (
                  <p className="form-error" role="alert">
                    <AlertCircle size={14} />
                    {formError}
                  </p>
                ) : null}
              </div>

              <aside className="free-controls">
                <div className="control-block">
                  <span className="control-label">Batch style</span>
                  <div className="segmented" role="group" aria-label="Batch style">
                    {MODES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={mode === item.id}
                        onClick={() => setMode(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {mode === 'words' ? (
                    <label className="control-inline">
                      <span>Words per batch</span>
                      <select
                        value={wordsPerBatch}
                        onChange={(event) => setWordsPerBatch(Number(event.target.value))}
                      >
                        {[4, 6, 8, 10].map((count) => (
                          <option key={count} value={count}>
                            {count}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>

                <div className="control-block">
                  <span className="control-label">Advance</span>
                  <div className="segmented" role="group" aria-label="Advance mode">
                    <button
                      type="button"
                      aria-pressed={advance === 'manual'}
                      onClick={() => setAdvance('manual')}
                    >
                      Manual
                    </button>
                    <button
                      type="button"
                      aria-pressed={advance === 'smart'}
                      onClick={() => setAdvance('smart')}
                    >
                      Smart
                    </button>
                  </div>
                  <p className="control-note">
                    {advance === 'smart'
                      ? 'Smart uses your writing pace and shows a countdown.'
                      : 'You press Next when the line is written.'}
                  </p>
                </div>

                <div className="control-block">
                  <label className="control-inline" htmlFor="free-speed">
                    <span>Speed</span>
                    <strong>{speed.toFixed(2)}×</strong>
                  </label>
                  <input
                    id="free-speed"
                    type="range"
                    min={0.7}
                    max={1.15}
                    step={0.02}
                    value={speed}
                    onChange={(event) => setSpeed(Number(event.target.value))}
                  />
                </div>

                <div className="control-block">
                  <label className="control-label" htmlFor="free-voice">
                    Browser voice
                  </label>
                  <select
                    id="free-voice"
                    className="select"
                    value={voiceURI}
                    onChange={(event) => setVoiceURI(event.target.value)}
                  >
                    {voices.length === 0 ? <option value="">System default</option> : null}
                    {voices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} · {voice.lang}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="button" className="btn btn-primary btn-lg free-start" onClick={startSession}>
                  Start free session
                  <ArrowRight size={17} className="btn-arrow" />
                </button>
                <p className="free-fine">
                  Uses only your browser's built-in voice. Nothing leaves this device.
                </p>
              </aside>
            </div>
          ) : (
            <div className="free-session">
              <div className="free-session-head">
                <div className="free-session-meta">
                  <span className="chip chip-free">
                    <span className="chip-dot" />
                    Free · Browser voice
                  </span>
                  <span className="free-session-count">
                    {dictation.batches.length} batches · {dictation.batches.reduce((sum, batch) => sum + batch.words.length, 0)} words
                  </span>
                </div>
                <div className="free-session-actions">
                  <span className="free-clock">{formatClock(dictation.elapsedMs)}</span>
                  <button type="button" className="text-link" onClick={editText}>
                    Edit text
                  </button>
                  <button type="button" className="text-link" onClick={onOpenPro}>
                    <Headphones size={13} />
                    Pro studio
                  </button>
                </div>
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

              {activeBatch ? (
                <PlayerPanel
                  label="Free practice"
                  badge="Browser voice"
                  words={activeBatch.words}
                  activeWord={dictation.activeWord}
                  playing={playing}
                  revealAll={revealAll}
                  statusLabel={statusLabel}
                  batchIndex={dictation.index}
                  batchCount={dictation.batches.length}
                  progress={progress}
                  advanceLabel={advanceLabel}
                  advanceValue={advanceValue}
                  nextLabel={dictation.index === dictation.batches.length - 1 ? 'Finish' : 'Next'}
                  playDisabled={sessionStatus === 'preparing' || sessionStatus === 'complete'}
                  nextDisabled={sessionStatus === 'preparing' || sessionStatus === 'complete'}
                  onTogglePlay={dictation.play}
                  onNext={dictation.next}
                  onPrevious={dictation.index > 0 ? dictation.previous : undefined}
                  onReplay={dictation.replay}
                  variant="free"
                />
              ) : null}

              {sessionStatus === 'complete' ? (
                <div className="session-complete">
                  <span className="complete-mark">
                    <Check size={22} />
                  </span>
                  <div>
                    <h3>Session complete.</h3>
                    <p>
                      {dictation.batches.length} batches ·{' '}
                      {dictation.batches.reduce((sum, batch) => sum + batch.words.length, 0)} words
                      · {formatClock(dictation.elapsedMs)}. Write the last line, then start again
                      whenever you want.
                    </p>
                  </div>
                  <div className="session-complete-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        void dictation.start(text, dictation.settings);
                      }}
                    >
                      <RefreshCw size={14} />
                      Practice again
                    </button>
                    <button type="button" className="btn" onClick={editText}>
                      Edit text
                    </button>
                  </div>
                </div>
              ) : null}

              <p className="free-session-note">
                Free practice reads with your browser's own voice and never sends your text to a
                server. Pro adds Fish Audio cloud voices and prepares four batches ahead.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
