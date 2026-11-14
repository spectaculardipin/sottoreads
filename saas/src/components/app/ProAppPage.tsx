import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Cloud,
  Keyboard,
  RefreshCw,
  Sparkles,
  Timer,
} from 'lucide-react';
import { useDictation } from '../../hooks/useDictation';
import { useTheme } from '../../hooks/useTheme';
import { getCloudStatus, resolveVoiceChoice, type VoiceChoice } from '../../lib/cloud';
import { loadBrowserVoices } from '../../lib/browserSpeech';
import { parseFile } from '../../lib/files';
import { APP_STARTER_TEXT, formatClock, makeBatches, splitWords } from '../../lib/text';
import type {
  AdvanceMode,
  BatchMode,
  CloudStatus,
  VoiceProvider,
} from '../../lib/types';
import { AppHeader } from './AppHeader';
import { SourceCard } from './SourceCard';
import { VoiceCard } from './VoiceCard';
import { QueuePanel } from './QueuePanel';
import { PlayerPanel } from '../session/PlayerPanel';

const PREFETCH_AHEAD = 4;

function playerStatusLabel(status: string): string {
  if (status === 'preparing') return 'Preparing voice';
  if (status === 'playing') return 'Reading aloud';
  if (status === 'paused') return 'Paused';
  if (status === 'your-turn') return 'Your turn';
  if (status === 'complete') return 'Session complete';
  if (status === 'error') return 'Voice error';
  return 'Ready to start';
}

function voiceShortLabel(
  voice: VoiceProvider,
  status: CloudStatus | null,
): string {
  if (voice === 'fish') return status?.mock ? 'Mock voice' : 'Fish S2.1';
  if (voice === 'openrouter') return 'OpenRouter free';
  return 'Browser voice';
}

export function ProAppPage() {
  const { theme, toggle } = useTheme();
  const dictation = useDictation();

  const [cloudStatus, setCloudStatus] = useState<CloudStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [voiceChoice, setVoiceChoice] = useState<VoiceChoice>('auto');
  const [text, setText] = useState(APP_STARTER_TEXT);
  const [mode, setMode] = useState<BatchMode>('sentence');
  const [wordsPerBatch, setWordsPerBatch] = useState(6);
  const [speed, setSpeed] = useState(0.92);
  const [advance, setAdvance] = useState<AdvanceMode>('manual');
  const [cloudVoiceId, setCloudVoiceId] = useState('');
  const [browserVoiceURI, setBrowserVoiceURI] = useState('');
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [fileProgress, setFileProgress] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const activeVoice = resolveVoiceChoice(cloudStatus, voiceChoice);
  const previewBatches = useMemo(
    () => makeBatches(text, wordsPerBatch, mode),
    [text, wordsPerBatch, mode],
  );
  const inputWords = useMemo(() => splitWords(text).length, [text]);
  const isActive = dictation.batches.length > 0;
  const activeBatch = dictation.batches[dictation.index];
  const sessionStatus = dictation.status;
  const revealAll =
    !isActive || sessionStatus === 'your-turn' || sessionStatus === 'complete';
  const playing = sessionStatus === 'playing';
  const previewWords = previewBatches[0]?.words ?? ['Paste', 'or', 'upload', 'some', 'text'];
  const panelWords = activeBatch?.words ?? previewWords;
  const panelBatchCount = isActive ? dictation.batches.length : previewBatches.length;
  const progress = !isActive
    ? 0
    : revealAll
      ? 1
      : activeBatch && dictation.activeWord >= 0
        ? Math.min(1, (dictation.activeWord + 0.65) / activeBatch.words.length)
        : 0;
  const canStart = Boolean(text.trim()) && !statusLoading;
  const totalWords = isActive
    ? dictation.batches.reduce((sum, batch) => sum + batch.words.length, 0)
    : previewBatches.reduce((sum, batch) => sum + batch.words.length, 0);
  const effectiveAdvance = isActive ? dictation.settings.advance : advance;

  const advanceLabel =
    isActive && sessionStatus === 'your-turn'
      ? effectiveAdvance === 'smart' && dictation.remainingMs !== null
        ? 'Smart advance in'
        : 'Manual advance'
      : undefined;
  const advanceValue =
    isActive && sessionStatus === 'your-turn'
      ? effectiveAdvance === 'smart' && dictation.remainingMs !== null
        ? formatClock(dictation.remainingMs)
        : 'when ready'
      : undefined;
  const nextLabel = !isActive
    ? 'Start'
    : sessionStatus === 'complete'
      ? 'Finished'
      : dictation.index === dictation.batches.length - 1
        ? 'Finish'
        : 'Next';

  useEffect(() => {
    let active = true;
    void getCloudStatus().then((status) => {
      if (!active) return;
      setCloudStatus(status);
      setStatusLoading(false);
      if (!status.configured) setVoiceChoice('browser');
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void loadBrowserVoices().then((voices) => {
      if (!active) return;
      setBrowserVoices(voices);
      setBrowserVoiceURI((current) => {
        if (current) return current;
        const english = voices.find((voice) => voice.lang.toLowerCase().startsWith('en'));
        return (english ?? voices[0])?.voiceURI ?? '';
      });
    });
    return () => {
      active = false;
    };
  }, []);

  function startSession() {
    if (!text.trim() || statusLoading) return;
    void dictation.start(text, {
      voice: activeVoice,
      speed,
      batchMode: mode,
      wordsPerBatch,
      browserVoiceURI,
      cloudVoiceId,
      advance,
      prefetchAhead: PREFETCH_AHEAD,
      learnPace: true,
    });
  }

  const startRef = useRef(startSession);
  const apiRef = useRef(dictation);

  useEffect(() => {
    startRef.current = startSession;
    apiRef.current = dictation;
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, button, a, [contenteditable="true"]')
      ) {
        return;
      }

      const api = apiRef.current;
      const active = api.batches.length > 0;
      if (event.code === 'Space') {
        event.preventDefault();
        if (active) api.play();
        else startRef.current();
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'n') {
        event.preventDefault();
        if (active) api.next();
      } else if (key === 'p') {
        event.preventDefault();
        if (active) api.previous();
      } else if (key === 'r') {
        event.preventDefault();
        if (active) api.replay();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  async function handleFile(file: File | null) {
    if (!file) return;
    setFileError(null);
    setFileProgress('Reading file');
    try {
      const parsed = await parseFile(file, (update) => setFileProgress(update.label));
      if (!parsed.trim()) {
        setFileError('That file did not contain readable text.');
        return;
      }
      setText(parsed);
      setFileLabel(`${file.name} · ${splitWords(parsed).length} words`);
    } catch (caught) {
      setFileError(caught instanceof Error ? caught.message : 'That file could not be opened.');
    } finally {
      setFileProgress(null);
    }
  }

  function focusSource() {
    window.setTimeout(() => {
      const textarea = document.getElementById('app-textarea') as HTMLTextAreaElement | null;
      textarea?.focus();
    }, 0);
  }

  const voiceBadge = voiceShortLabel(activeVoice, cloudStatus);
  const statusTone =
    sessionStatus === 'playing'
      ? 'playing'
      : sessionStatus === 'your-turn'
        ? 'turn'
        : sessionStatus === 'error'
          ? 'error'
          : sessionStatus === 'complete'
            ? 'done'
            : 'idle';

  return (
    <div className="app-page">
      <a className="skip-link" href="#app-main">
        Skip to the studio
      </a>

      <AppHeader
        theme={theme}
        onToggleTheme={toggle}
        status={cloudStatus}
        activeVoice={activeVoice}
      />

      <main className="app-main" id="app-main">
        {!statusLoading && cloudStatus && !cloudStatus.configured ? (
          <div className="app-notice is-warn" role="status">
            <AlertTriangle size={18} />
            <div>
              <strong>Cloud voice is not connected.</strong>
              <p>
                The studio is running on your browser voice. Add{' '}
                <code>OPENROUTER_API_KEY</code> or <code>FISH_API_KEY</code> to{' '}
                <code>.env.local</code>, restart the dev server, and reload this page.
              </p>
            </div>
          </div>
        ) : null}

        {cloudStatus?.mock ? (
          <div className="app-notice is-info" role="status">
            <Sparkles size={18} />
            <div>
              <strong>Mock cloud voice is active.</strong>
              <p>
                <code>TTS_MOCK=1</code> generates test tones so the queue and timing can be
                verified offline. Remove it to hear the real Fish Audio voice.
              </p>
            </div>
          </div>
        ) : null}

        <div className="app-grid">
          <aside className="app-col app-col-left">
            <SourceCard
              text={text}
              onTextChange={(value) => {
                setText(value);
                setFileLabel(null);
              }}
              words={inputWords}
              batchCount={previewBatches.length}
              active={isActive}
              startDisabled={!canStart}
              fileLabel={fileLabel}
              fileProgress={fileProgress}
              fileError={fileError}
              onFile={(file) => void handleFile(file)}
              onUseSample={() => {
                setText(APP_STARTER_TEXT);
                setFileLabel(null);
                setFileError(null);
              }}
              onStart={startSession}
              onEnd={dictation.reset}
            />
            <VoiceCard
              status={cloudStatus}
              voiceChoice={voiceChoice}
              onVoiceChoice={setVoiceChoice}
              activeVoice={activeVoice}
              cloudVoiceId={cloudVoiceId}
              onCloudVoiceId={setCloudVoiceId}
              speed={speed}
              onSpeed={setSpeed}
              mode={mode}
              onMode={setMode}
              wordsPerBatch={wordsPerBatch}
              onWordsPerBatch={setWordsPerBatch}
              advance={advance}
              onAdvance={setAdvance}
              browserVoices={browserVoices}
              browserVoiceURI={browserVoiceURI}
              onBrowserVoiceURI={setBrowserVoiceURI}
              prefetchAhead={PREFETCH_AHEAD}
            />
          </aside>

          <section className="app-col app-col-center">
            <div className="app-stage-head">
              <div>
                <span className="app-eyebrow">Pro studio</span>
                <h1>Dictation room</h1>
                <p>
                  {isActive
                    ? `Batch ${dictation.index + 1} of ${dictation.batches.length} · ${totalWords} words`
                    : 'Paste, listen, write. The next four batches stay ready.'}
                </p>
              </div>
              <div className="app-stage-badges">
                <span className={`app-session-chip is-${statusTone}`} aria-live="polite">
                  <span className="app-voice-dot" aria-hidden="true" />
                  {playerStatusLabel(sessionStatus)}
                </span>
                <span className="app-clock">{formatClock(dictation.elapsedMs)}</span>
              </div>
            </div>

            <div className="app-stage-paint">
              <PlayerPanel
                label="Pro practice"
                badge={voiceBadge}
                words={panelWords}
                activeWord={dictation.activeWord}
                playing={playing}
                revealAll={revealAll}
                statusLabel={!isActive ? 'Ready to start' : playerStatusLabel(sessionStatus)}
                batchIndex={isActive ? dictation.index : 0}
                batchCount={panelBatchCount || 1}
                progress={progress}
                timingKind={dictation.timingKind}
                advanceLabel={advanceLabel}
                advanceValue={advanceValue}
                nextLabel={nextLabel}
                playDisabled={!isActive ? !canStart : sessionStatus === 'preparing' || sessionStatus === 'complete'}
                nextDisabled={!isActive ? !canStart : sessionStatus === 'preparing' || sessionStatus === 'complete'}
                onTogglePlay={isActive ? dictation.play : startSession}
                onNext={isActive ? dictation.next : startSession}
                onPrevious={isActive && dictation.index > 0 ? dictation.previous : undefined}
                onReplay={isActive ? dictation.replay : undefined}
                variant="app"
              />
            </div>

            {dictation.error ? (
              <div className="inline-error" role="alert">
                <AlertTriangle size={15} />
                <span>{dictation.error}</span>
                <button type="button" className="btn btn-sm" onClick={dictation.retry}>
                  Try again
                </button>
              </div>
            ) : null}

            <QueuePanel
              items={dictation.queue}
              index={dictation.index}
              active={isActive}
              voice={activeVoice}
              preparedAhead={dictation.preparedAhead}
              prefetchAhead={PREFETCH_AHEAD}
            />

            {sessionStatus === 'complete' ? (
              <div className="app-complete-card">
                <span className="complete-mark">
                  <Check size={22} />
                </span>
                <div className="app-complete-copy">
                  <h2>Session complete.</h2>
                  <p>
                    {dictation.batches.length} batches · {totalWords} words ·{' '}
                    {formatClock(dictation.elapsedMs)}. The pace model has one more sample.
                  </p>
                </div>
                <div className="app-complete-actions">
                  <button type="button" className="btn btn-primary" onClick={startSession}>
                    <RefreshCw size={14} />
                    Practice again
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      dictation.reset();
                      focusSource();
                    }}
                  >
                    Edit text
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="app-col app-col-right">
            <section className="app-card stat-card">
              <div className="app-card-head">
                <div>
                  <span className="app-card-kicker">Session</span>
                  <h2>This run</h2>
                </div>
                <Timer size={17} className="app-head-icon" />
              </div>
              <dl className="app-stats">
                <div>
                  <dt>Batches</dt>
                  <dd>{isActive ? dictation.batches.length : previewBatches.length}</dd>
                </div>
                <div>
                  <dt>Words</dt>
                  <dd>{totalWords}</dd>
                </div>
                <div>
                  <dt>Elapsed</dt>
                  <dd>{formatClock(dictation.elapsedMs)}</dd>
                </div>
                <div>
                  <dt>Ready ahead</dt>
                  <dd>
                    {dictation.preparedAhead}/{PREFETCH_AHEAD}
                  </dd>
                </div>
              </dl>
              <p className="app-field-note">
                {isActive
                  ? sessionStatus === 'complete'
                    ? 'Session finished. Start again or edit the text.'
                    : sessionStatus === 'your-turn'
                      ? 'Write the line, then press Next.'
                      : 'The queue fills itself while this batch plays.'
                  : 'The first four batches are generated when you start.'}
              </p>
            </section>

            <section className="app-card pace-card">
              <div className="app-card-head">
                <div>
                  <span className="app-card-kicker">Pace model</span>
                  <h2>{dictation.pace.msPerChar} ms/char</h2>
                </div>
                <Sparkles size={17} className="app-head-icon" />
              </div>
              <div className="app-pace-bars" aria-hidden="true">
                {[30, 42, 38, 54, 48, 62, 56, 70, 64, 78, 72].map((height, index) => (
                  <span
                    key={index}
                    className={index === 10 ? 'is-last' : undefined}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="app-field-note">
                {dictation.pace.samples > 0
                  ? `Learned from ${dictation.pace.samples} completed ${dictation.pace.samples === 1 ? 'batch' : 'batches'}. Smart advance uses this number.`
                  : 'A starting estimate. It learns each time you press Next.'}
              </p>
            </section>

            <section className="app-card setup-card">
              <div className="app-card-head">
                <div>
                  <span className="app-card-kicker">Setup</span>
                  <h2>
                    {cloudStatus?.mock
                      ? 'Mock mode'
                      : cloudStatus?.configured
                        ? 'Cloud connected'
                        : 'Connect a cloud voice'}
                  </h2>
                </div>
                <Cloud size={17} className="app-head-icon" />
              </div>

              {cloudStatus?.mock ? (
                <p className="app-field-note">
                  <code>TTS_MOCK=1</code> is on. The audio is a generated tone, not speech.
                  Remove it from <code>.env.local</code> for the real Fish voice.
                </p>
              ) : cloudStatus?.configured ? (
                <div className="app-setup-status">
                  <p>
                    {cloudStatus.providers.fish.configured
                      ? 'Fish Audio S2.1 is connected. Exact word timing is available.'
                      : 'OpenRouter is connected with the free Fish S2.1 model. Word timing is estimated from the decoded audio.'}
                  </p>
                  <p className="app-field-note">
                    Switch providers in the Voice card. Keys stay on the server proxy.
                  </p>
                </div>
              ) : (
                <>
                  <p className="app-field-note">
                    Add one key to <code>.env.local</code> beside <code>package.json</code>:
                  </p>
                  <pre className="app-code">
                    <code>OPENROUTER_API_KEY=your_key</code>
                    <code># or</code>
                    <code>FISH_API_KEY=your_key</code>
                  </pre>
                  <p className="app-field-note">
                    Restart <code>npm run dev</code> and reload. On Cloudflare Pages, set the
                    variable in the project's environment settings.
                  </p>
                </>
              )}
            </section>

            <section className="app-card shortcut-card">
              <div className="app-card-head">
                <div>
                  <span className="app-card-kicker">Keyboard</span>
                  <h2>Stay in the flow</h2>
                </div>
                <Keyboard size={17} className="app-head-icon" />
              </div>
              <dl className="shortcut-list">
                <div>
                  <dt>Play or pause</dt>
                  <dd>
                    <kbd>Space</kbd>
                  </dd>
                </div>
                <div>
                  <dt>Next batch</dt>
                  <dd>
                    <kbd>N</kbd>
                  </dd>
                </div>
                <div>
                  <dt>Previous batch</dt>
                  <dd>
                    <kbd>P</kbd>
                  </dd>
                </div>
                <div>
                  <dt>Replay</dt>
                  <dd>
                    <kbd>R</kbd>
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
