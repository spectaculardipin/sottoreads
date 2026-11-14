import { ArrowRight, Loader2, Pause, Play, RotateCcw, SkipBack } from 'lucide-react';
import type { TimingKind } from '../../lib/types';
import { Waveform } from './Waveform';
import { WordPhrase } from './WordPhrase';

interface PlayerPanelProps {
  label: string;
  badge?: string;
  words: string[];
  activeWord: number;
  playing: boolean;
  revealAll: boolean;
  statusLabel: string;
  batchIndex: number;
  batchCount: number;
  progress: number;
  timingKind?: TimingKind | null;
  advanceLabel?: string;
  advanceValue?: string;
  nextLabel?: string;
  playDisabled?: boolean;
  nextDisabled?: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious?: () => void;
  onReplay?: () => void;
  variant?: 'free' | 'app';
}

export function PlayerPanel({
  label,
  badge,
  words,
  activeWord,
  playing,
  revealAll,
  statusLabel,
  batchIndex,
  batchCount,
  progress,
  timingKind,
  advanceLabel,
  advanceValue,
  nextLabel = 'Next',
  playDisabled = false,
  nextDisabled = false,
  onTogglePlay,
  onNext,
  onPrevious,
  onReplay,
  variant = 'free',
}: PlayerPanelProps) {
  const preparing = statusLabel === 'Preparing voice';

  return (
    <div className={`player player--${variant}`}>
      <div className="player-top">
        <span className="player-brand">
          <span className="player-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="player-label">{label}</span>
          {badge ? <span className="player-badge">{badge}</span> : null}
        </span>

        <div className="player-top-actions">
          {timingKind ? (
            <span className="player-timing" title="How word timing is produced">
              <span className="player-timing-dot" />
              {timingKind === 'exact' ? 'Exact word timing' : 'Estimated word timing'}
            </span>
          ) : null}
          <button
            type="button"
            className="player-play"
            onClick={onTogglePlay}
            disabled={playDisabled}
            aria-label={playing ? 'Pause the batch' : 'Play the batch'}
          >
            {preparing ? (
              <Loader2 size={15} className="spin" />
            ) : playing ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
          </button>
        </div>
      </div>

      <div className="player-meter">
        <Waveform progress={progress} playing={playing} />
        <span className="player-batch">
          Batch {batchIndex + 1} of {batchCount}
        </span>
      </div>

      <WordPhrase words={words} activeWord={activeWord} revealAll={revealAll} />

      <div className="player-foot">
        <div className="player-state-group">
          <span className="player-state" aria-live="polite">
            {statusLabel}
          </span>
          <div className="player-mini-actions">
            {onPrevious ? (
              <button
                type="button"
                className="player-mini"
                onClick={onPrevious}
                disabled={batchIndex === 0}
                aria-label="Previous batch"
                title="Previous batch"
              >
                <SkipBack size={14} />
              </button>
            ) : null}
            {onReplay ? (
              <button
                type="button"
                className="player-mini"
                onClick={onReplay}
                aria-label="Replay this batch"
                title="Replay this batch"
              >
                <RotateCcw size={14} />
              </button>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className={`advance-pill${advanceLabel ? '' : ' is-bare'}`}
          onClick={onNext}
          disabled={nextDisabled}
        >
          {advanceLabel ? (
            <span className="advance-copy">
              {advanceLabel} <strong>{advanceValue}</strong>
            </span>
          ) : null}
          <span className="advance-next">
            {nextLabel}
            <ArrowRight size={17} />
          </span>
        </button>
      </div>
    </div>
  );
}
