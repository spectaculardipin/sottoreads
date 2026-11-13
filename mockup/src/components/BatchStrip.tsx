import type { CSSProperties } from 'react';
import { RotateCcw, SkipBack, SkipForward } from 'lucide-react';

interface BatchStripProps {
  words: string[];
  activeWord: number;
  batchIndex: number;
  batchCount: number;
  playing: boolean;
  onPlay: () => void;
  onNext: () => void;
  onPrevious?: () => void;
  nextLabel?: string;
  advanceLabel?: string;
  advanceValue?: string;
}

const BARS = Array.from({ length: 44 }, (_, index) => {
  const wave = Math.abs(Math.sin(index * 1.31) * 0.7 + Math.sin(index * 0.47) * 0.3);
  return Math.round(5 + wave * 27);
});

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function BatchStrip({
  words,
  activeWord,
  batchIndex,
  batchCount,
  playing,
  onPlay,
  onNext,
  onPrevious,
  nextLabel = 'Next',
  advanceLabel = 'Smart advance',
  advanceValue = '00:07',
}: BatchStripProps) {
  const progress =
    activeWord >= 0 && words.length > 0
      ? Math.max(8, Math.min(100, ((activeWord + 1) / words.length) * 100))
      : 58;
  const hotBars = Math.round((progress / 100) * BARS.length);

  return (
    <div className="instrument">
      <div className="instrument-top">
        <span>
          <strong>Sotto</strong> / practice
        </span>
        <span className="instrument-led">{playing ? 'Reading' : 'Ready'}</span>
        <span>{batchCount} batches</span>
      </div>

      <div className="instrument-body">
        <div className="strip-head">
          <span className="strip-batch">
            Batch <strong>{pad(batchIndex + 1)}</strong> / {pad(batchCount)}
          </span>
          <span className="strip-speed">0.92x</span>
        </div>

        <div className="waveform" data-playing={playing} aria-hidden="true">
          {BARS.map((height, index) => (
            <span
              key={index}
              className={`wave-bar${index < hotBars ? ' is-hot' : ''}`}
              style={{ height: `${height}px`, '--i': index } as CSSProperties}
            />
          ))}
        </div>

        <p className="strip-phrase">
          {words.map((word, index) => {
            const state =
              activeWord < 0
                ? 'is-spoken'
                : index < activeWord
                  ? 'is-spoken'
                  : index === activeWord
                    ? 'is-current'
                    : '';
            return (
              <span key={`${word}-${index}`} className={`strip-word ${state}`}>
                {word}
              </span>
            );
          })}
        </p>

        <div className="strip-state">
          <div>
            <div className="strip-state-label">{playing ? 'Reading aloud' : 'Your turn'}</div>
            <div className="strip-state-value">
              {playing ? 'Listen once, then write.' : 'Write it down.'}
            </div>
          </div>
          <div className="strip-timer">
            <div className="strip-timer-head">
              <span className="strip-state-label">{advanceLabel}</span>
              <span className="strip-advance">{advanceValue}</span>
            </div>
            <div className="strip-track" aria-hidden="true">
              <div className="strip-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="strip-controls">
          <button
            type="button"
            className="btn"
            onClick={onPrevious}
            disabled={!onPrevious || batchIndex === 0}
            aria-label="Previous batch"
          >
            <SkipBack size={14} />
            Previous
          </button>
          <button type="button" className="btn" onClick={onPlay}>
            <RotateCcw size={14} />
            {playing ? 'Stop' : 'Replay'}
          </button>
          <button type="button" className="btn btn-primary" onClick={onNext}>
            {nextLabel}
            <SkipForward size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
