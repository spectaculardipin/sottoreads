import type { CSSProperties } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';

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

const BARS = Array.from({ length: 40 }, (_, index) => {
  const wave = Math.abs(Math.sin(index * 1.17) * 0.72 + Math.sin(index * 0.41) * 0.28);
  return Math.round(6 + wave * 26);
});

export function BatchStrip({
  words,
  activeWord,
  batchIndex,
  batchCount,
  playing,
  onPlay,
  onNext,
  nextLabel = 'Next',
  advanceLabel = 'Smart advance in',
  advanceValue = '0:03',
}: BatchStripProps) {
  const progress =
    activeWord >= 0 && words.length > 0
      ? Math.max(8, Math.min(100, ((activeWord + 1) / words.length) * 100))
      : 38;
  const hotBars = Math.round((progress / 100) * BARS.length);

  return (
    <div className="sample-panel">
      <div className="sample-top">
        <span className="sample-brand">
          <span className="sample-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="sample-name">Practice</span>
        </span>
        <button
          type="button"
          className="sample-play"
          onClick={onPlay}
          aria-label={playing ? 'Stop the sample' : 'Play the sample'}
        >
          {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>
      </div>

      <div className="sample-meter">
        <div className="sample-wave" data-playing={playing} aria-hidden="true">
          {BARS.map((height, index) => (
            <span
              key={index}
              className={index < hotBars ? 'is-hot' : undefined}
              style={{ height: `${height}px`, '--i': index } as CSSProperties}
            />
          ))}
        </div>
        <span className="sample-batch">
          Batch {batchIndex + 1} of {batchCount}
        </span>
      </div>

      <p className="sample-phrase">
        {words.map((word, index) => {
          const state =
            activeWord < 0
              ? 'is-spoken'
              : index < activeWord
                ? 'is-spoken'
                : index === activeWord
                  ? 'is-current'
                  : 'is-upcoming';
          return (
            <span key={`${word}-${index}`} className={`sample-word ${state}`}>
              {word}
            </span>
          );
        })}
      </p>

      <div className="sample-foot">
        <span className="sample-state">{playing ? 'Reading aloud' : 'Your turn'}</span>
        <button type="button" className="advance-pill" onClick={onNext}>
          <span className="advance-copy">
            {advanceLabel} <strong>{advanceValue}</strong>
          </span>
          <span className="advance-next">
            {nextLabel}
            <ArrowRight size={17} />
          </span>
        </button>
      </div>
    </div>
  );
}
