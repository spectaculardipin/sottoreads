import type { CSSProperties } from 'react';

const BARS = Array.from({ length: 42 }, (_, index) => {
  const wave = Math.abs(Math.sin(index * 1.17) * 0.72 + Math.sin(index * 0.41) * 0.28);
  return Math.round(6 + wave * 26);
});

interface WaveformProps {
  progress: number;
  playing: boolean;
  compact?: boolean;
}

export function Waveform({ progress, playing, compact = false }: WaveformProps) {
  const normalized = Math.max(0, Math.min(1, progress));
  const hot = Math.round(normalized * BARS.length);

  return (
    <div
      className={`waveform${compact ? ' is-compact' : ''}`}
      data-playing={playing}
      aria-hidden="true"
    >
      {BARS.map((height, index) => (
        <span
          key={index}
          className={index < hot ? 'is-hot' : undefined}
          style={{ height: `${height}px`, '--bar-index': index } as CSSProperties}
        />
      ))}
    </div>
  );
}
