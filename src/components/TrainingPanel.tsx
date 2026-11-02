import {
  AlertCircle,
  Check,
  Hand,
  Loader2,
  Volume2,
} from 'lucide-react';
import type { Batch, SessionStatus } from '../lib/types';
import { formatMs } from '../lib/text';

interface TrainingPanelProps {
  batches: Batch[];
  currentIndex: number;
  batch: Batch | null;
  status: SessionStatus;
  activeWord: number;
  engineStatus: string;
  errorMessage: string | null;
  predictedMs: number | null;
  onBegin: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReplay: () => void;
  onEnd: () => void;
  onCancelStart: () => void;
  onRetry: () => void;
  onBack: () => void;
}

export function TrainingPanel({
  batches,
  currentIndex,
  batch,
  status,
  activeWord,
  engineStatus,
  errorMessage,
  predictedMs,
  onBegin,
  onNext,
  onPrevious,
  onReplay,
  onEnd,
  onCancelStart,
  onRetry,
  onBack,
}: TrainingPanelProps) {
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
                {batches.length.toLocaleString()} training batches.
              </p>
              <p style={{ color: 'var(--muted)', margin: '0 0 22px', fontSize: 13 }}>
                Write each batch as it is read. Your timing builds your personal pace model.
              </p>
              <button type="button" className="btn btn-primary btn-lg" onClick={onBegin}>
                <Volume2 size={18} />
                Begin training
              </button>
              <button type="button" className="btn" onClick={onCancelStart}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) return null;

  const isPlaying = status === 'playing';
  const lastBatch = currentIndex >= batches.length - 1;

  return (
    <div className="session">
      <div className="session-top">
        <div className="session-meta">
          <span className="batch-label">
            Training <strong>{currentIndex + 1}</strong> of {batches.length}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onEnd}>
            <Hand size={14} />
            End training
          </button>
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
            {status === 'batch-preparing' && (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Preparing this batch…</span>
              </>
            )}
            {status === 'playing' && (
              <>
                <Volume2 size={16} />
                <span>Reading this batch aloud.</span>
              </>
            )}
            {status === 'your-turn' && (
              <>
                <Hand size={16} />
                <span>Your turn — write it down.</span>
              </>
            )}
          </div>

          {predictedMs && (
            <div className="predicted-wrap" style={{ marginTop: 16 }}>
              <div className="predicted-head">
                <span>Estimated time</span>
                <span className="predicted-time">{formatMs(predictedMs)}</span>
              </div>
              <div className="predicted-track" aria-hidden="true">
                <div className="predicted-fill" style={{ width: '100%' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="session-controls">
        <button
          type="button"
          className="btn"
          onClick={onPrevious}
          disabled={currentIndex === 0 || isPlaying}
        >
          Previous
        </button>
        <button type="button" className="btn" onClick={onReplay} disabled={isPlaying}>
          Replay
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNext}
          disabled={status === 'batch-preparing'}
        >
          {lastBatch ? 'Finish training' : 'Next'}
        </button>
      </div>

      <div className="session-foot">
        <span>Write each batch as it is read aloud.</span>
      </div>
    </div>
  );
}
