import {
  AlertCircle,
  Check,
  Clock,
  Hand,
  Loader2,
  Mic,
  Plus,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react';
import type { AdvanceMode, Batch, SessionStatus, VadUpdate } from '../lib/types';
import { formatClock, formatMs } from '../lib/text';

interface SessionPanelProps {
  status: SessionStatus;
  batch: Batch | null;
  batchIndex: number;
  batchCount: number;
  activeWord: number;
  advanceMode: AdvanceMode;
  vadUpdate: VadUpdate | null;
  countdown: number | null;
  predictedTotal: number;
  predictedMs: number | null;
  modelReady: boolean;
  trainingEnabled: boolean;
  recordsCount: number;
  minSamples: number;
  engineProgress: number;
  engineStatus: string;
  errorMessage: string | null;
  onBegin: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReplay: () => void;
  onMoreTime: () => void;
  onEnd: () => void;
  onCancelStart: () => void;
  onRetry: () => void;
  onBack: () => void;
  onOpenTraining: () => void;
}

export function SessionPanel({
  status,
  batch,
  batchIndex,
  batchCount,
  activeWord,
  advanceMode,
  vadUpdate,
  countdown,
  predictedTotal,
  predictedMs,
  modelReady,
  trainingEnabled,
  recordsCount,
  minSamples,
  engineProgress,
  engineStatus,
  errorMessage,
  onBegin,
  onNext,
  onPrevious,
  onReplay,
  onMoreTime,
  onEnd,
  onCancelStart,
  onRetry,
  onBack,
  onOpenTraining,
}: SessionPanelProps) {
  if (status === 'preparing') {
    return (
      <div className="session">
        <div className="session-stage">
          <div className="batch-card">
            <div className="batch-card-inner" style={{ maxWidth: 480, margin: '0 auto' }}>
              <div className="complete-mark" style={{ marginBottom: 18 }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 8 }}>
                Preparing your voice
              </h2>
              <p style={{ color: 'var(--muted)', margin: '0 0 20px' }}>
                {engineStatus || 'Getting everything ready.'}
              </p>
              <div className="predicted-wrap" style={{ margin: '0 auto' }}>
                <div className="predicted-track">
                  <div
                    className="predicted-fill"
                    style={{ width: `${Math.round(Math.max(0.02, engineProgress) * 100)}%` }}
                  />
                </div>
                <div className="predicted-head" style={{ marginTop: 8 }}>
                  <span>One-time setup</span>
                  <span className="predicted-time">{Math.round(engineProgress * 100)}%</span>
                </div>
              </div>
              <button type="button" className="btn" style={{ marginTop: 22 }} onClick={onCancelStart}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="session">
        <div className="session-stage">
          <div className="batch-card">
            <div className="batch-card-inner" style={{ maxWidth: 480, margin: '0 auto' }}>
              <div className="complete-mark" style={{ background: 'var(--danger-bg)', borderColor: '#fecaca', color: 'var(--danger)' }}>
                <AlertCircle size={24} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 8 }}>
                The voice could not start
              </h2>
              <p style={{ color: 'var(--muted)', margin: '0 0 20px' }}>
                {errorMessage ?? 'Something went wrong while preparing the voice.'}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary" onClick={onRetry}>
                  Try again
                </button>
                <button type="button" className="btn" onClick={onBack}>
                  Back to setup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className="session">
        <div className="session-stage">
          <div className="batch-card">
            <div className="batch-card-inner" style={{ maxWidth: 480, margin: '0 auto' }}>
              <div className="complete-mark" style={{ marginBottom: 18 }}>
                <Check size={26} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 8 }}>
                Voice ready
              </h2>
              <p style={{ color: 'var(--muted)', margin: '0 0 8px' }}>
                {batchCount.toLocaleString()} batches · {batch?.words.length ?? 0} words in the first batch.
              </p>
              <p style={{ color: 'var(--muted)', margin: '0 0 22px', fontSize: 13 }}>
                Sit comfortably. The first batch will play when you begin.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary btn-lg" onClick={onBegin}>
                  <Volume2 size={18} />
                  Begin dictation
                </button>
                <button type="button" className="btn" onClick={onCancelStart}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) return null;

  const isPlaying = status === 'playing';
  const isYourTurn = status === 'your-turn';
  const isListening = status === 'listening';
  const isPaused = status === 'paused';
  const isPredicted = advanceMode === 'predicted';
  const isMic = advanceMode === 'mic';
  const lastBatch = batchIndex >= batchCount - 1;
  const countdownActive = countdown !== null && countdown > 0;

  return (
    <div className="session">
      <div className="session-top">
        <div className="session-meta">
          <span className="batch-label">
            Batch <strong>{batchIndex + 1}</strong> of {batchCount}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onEnd}>
            <Square size={14} />
            End session
          </button>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={batchCount}
          aria-valuenow={batchIndex + 1}
          aria-label="Dictation progress"
        >
          <div
            className="progress-fill"
            style={{ width: `${((batchIndex + 1) / Math.max(1, batchCount)) * 100}%` }}
          />
        </div>
      </div>

      <div className="session-stage">
        <div className="batch-card">
          <p className="words" aria-live="polite">
            {batch.words.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className={`word${index === activeWord ? ' is-active' : ''}${
                  activeWord >= 0 && index < activeWord ? ' is-spoken' : ''
                }`}
              >
                {word}
              </span>
            ))}
          </p>

          <div className="session-status" aria-live="polite">
            <StatusText
              status={status}
              advanceMode={advanceMode}
              vadUpdate={vadUpdate}
              countdown={countdown}
              expectedWords={batch.words.length}
            />
          </div>

          {isMic && (isListening || isPaused) && (
            <MicMeter update={vadUpdate} />
          )}

          {isPredicted && (isYourTurn || isPaused) && (
            <PredictedTimer
              countdown={countdown}
              total={predictedTotal}
              predictedMs={predictedMs}
              modelReady={modelReady}
            />
          )}
        </div>
      </div>

      <div className="session-controls">
        <button
          type="button"
          className="btn"
          onClick={onPrevious}
          disabled={batchIndex === 0 || isPlaying}
          aria-label="Previous batch"
        >
          <SkipBack size={16} />
          Previous
        </button>
        <button
          type="button"
          className="btn"
          onClick={onReplay}
          disabled={isPlaying}
          aria-label="Replay this batch"
        >
          <RotateCcw size={16} />
          Replay
        </button>
        {isPredicted && countdownActive && (
          <button type="button" className="btn" onClick={onMoreTime}>
            <Plus size={16} />
            More time
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={onNext}>
          <SkipForward size={16} />
          {lastBatch ? 'Finish' : 'Next'}
        </button>
      </div>

      <div className="session-foot">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className={`pill${trainingEnabled && modelReady ? ' ok' : trainingEnabled ? ' warn' : ''}`}>
            {trainingEnabled ? (
              modelReady ? (
                <>
                  <Sparkles size={12} />
                  <strong>Model ready</strong>
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  Training <strong>{recordsCount}/{minSamples}</strong>
                </>
              )
            ) : (
              <>
                <Hand size={12} />
                Training off
              </>
            )}
          </span>
          <button type="button" className="pill" onClick={onOpenTraining} style={{ borderStyle: 'dashed' }}>
            <Clock size={12} />
            {advanceMode === 'manual' ? 'Manual advance' : advanceMode === 'mic' ? 'Mic advance' : 'Predicted advance'}
          </button>
        </div>
        <span>Microphone audio is analyzed in memory and never recorded.</span>
      </div>
    </div>
  );
}

function StatusText({
  status,
  advanceMode,
  vadUpdate,
  countdown,
  expectedWords,
}: {
  status: SessionStatus;
  advanceMode: AdvanceMode;
  vadUpdate: VadUpdate | null;
  countdown: number | null;
  expectedWords: number;
}) {
  if (status === 'batch-preparing') {
    return (
      <>
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Preparing audio for this batch…</span>
      </>
    );
  }

  if (status === 'playing') {
    return (
      <>
        <Volume2 size={16} />
        <span>Reading this batch aloud.</span>
      </>
    );
  }

  if (status === 'your-turn') {
    if (advanceMode === 'predicted' && countdown !== null && countdown > 0) {
      return (
        <>
          <Clock size={16} />
          <span>
            Your turn — predicted next in <strong>{formatClock(countdown)}</strong>
          </span>
        </>
      );
    }
    if (advanceMode === 'mic') {
      return (
        <>
          <Mic size={16} />
          <span>Your turn — read aloud while you write.</span>
        </>
      );
    }
    return (
      <>
        <Hand size={16} />
        <span>Your turn — read and write, then click Next.</span>
      </>
    );
  }

  if (status === 'listening') {
    if (!vadUpdate) {
      return (
        <>
          <Mic size={16} />
          <span>Starting the microphone…</span>
        </>
      );
    }
    if (vadUpdate.state === 'speaking') {
      return (
        <>
          <span className="status-dot ok" />
          <span>
            Hearing you — <strong>{Math.round(vadUpdate.estimatedWords)}</strong> of{' '}
            {expectedWords} words.
          </span>
        </>
      );
    }
    if (vadUpdate.state === 'paused') {
      return (
        <>
          <span className="status-dot warn" />
          <span>Pause detected — finishing up.</span>
        </>
      );
    }
    return (
      <>
        <Mic size={16} />
        <span>Listening for your voice.</span>
      </>
    );
  }

  if (status === 'paused') {
    return (
      <>
        <Check size={16} />
        <span>Nice — moving to the next batch.</span>
      </>
    );
  }

  return null;
}

function MicMeter({ update }: { update: VadUpdate | null }) {
  const level = update?.level ?? 0;
  const bars = 18;
  return (
    <div className="meter-wrap" aria-hidden="true">
      <div className="meter">
        {Array.from({ length: bars }, (_, index) => {
          const wave = Math.abs(Math.sin((index + 1) * 0.85));
          const height = 16 + level * 84 * (0.35 + 0.65 * wave);
          return (
            <span
              key={index}
              className={`meter-bar${level > 0.22 ? ' is-hot' : ''}`}
              style={{ height: `${Math.max(12, Math.min(100, height))}%` }}
            />
          );
        })}
      </div>
      <div className="meter-labels">
        <span>Quiet</span>
        <span>{update?.state === 'speaking' ? 'Hearing you' : 'Waiting'}</span>
        <span>Speaking</span>
      </div>
    </div>
  );
}

function PredictedTimer({
  countdown,
  total,
  predictedMs,
  modelReady,
}: {
  countdown: number | null;
  total: number;
  predictedMs: number | null;
  modelReady: boolean;
}) {
  const remaining = countdown ?? 0;
  const progress =
    countdown !== null && total > 0 ? Math.max(0, Math.min(1, 1 - remaining / total)) : 0;
  return (
    <div className="predicted-wrap">
      <div className="predicted-head">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            className="pill"
            style={{
              background: 'var(--blue-50)',
              borderColor: 'var(--blue-200)',
              color: 'var(--blue-700)',
              fontSize: 10,
              padding: '2px 6px',
              letterSpacing: '0.02em',
            }}
          >
            Predicted
          </span>
          {modelReady ? 'Your learned pace' : 'Default pace'} ·{' '}
          {predictedMs ? formatMs(predictedMs) : '—'}
        </span>
        <span className="predicted-time">
          {countdown !== null && countdown > 0 ? formatClock(countdown) : 'Take your time'}
        </span>
      </div>
      <div className="predicted-track" aria-hidden="true">
        <div className="predicted-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
