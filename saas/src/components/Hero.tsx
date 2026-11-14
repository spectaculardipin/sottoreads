import { ArrowRight, Play, Square } from 'lucide-react';
import { delay } from '../lib/style';
import { BatchStrip } from './BatchStrip';
import { useSampleVoice } from '../hooks/useSampleVoice';

const SAMPLE_WORDS =
  'The morning light moved slowly across the desk, and the room stayed quiet.'.split(' ');

interface HeroProps {
  onStartFree: () => void;
}

export function Hero({ onStartFree }: HeroProps) {
  const { playing, activeWord, play } = useSampleVoice();
  const sampleText = SAMPLE_WORDS.join(' ');

  return (
    <section className="hero" id="top">
      <div className="hero-glow" aria-hidden="true" />

      <div className="shell hero-fish">
        <span className="hero-pill enter" style={delay(0)}>
          <strong>Try free</strong>
          <span>Browser voice</span>
        </span>

        <h1 className="hero-title enter" style={delay(60)}>
          Dictation practice that goes quiet while you write.
        </h1>

        <p className="hero-sub enter" style={delay(120)}>
          Load your notes. It speaks one short batch, then waits while you write it down.
        </p>

        <div className="hero-actions enter" style={delay(180)}>
          <button type="button" className="btn btn-primary btn-lg" onClick={onStartFree}>
            Start free
            <ArrowRight size={17} className="btn-arrow" />
          </button>
          <button
            type="button"
            className="btn btn-lg"
            onClick={() => play(sampleText)}
            aria-pressed={playing}
          >
            {playing ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            {playing ? 'Stop the sample' : 'Hear a sample'}
          </button>
        </div>

        <div className="stage enter" style={delay(240)}>
          <BatchStrip
            words={SAMPLE_WORDS}
            activeWord={activeWord}
            batchIndex={3}
            batchCount={18}
            playing={playing}
            onPlay={() => play(sampleText)}
            onNext={onStartFree}
            nextLabel="Next"
            advanceLabel="Manual advance"
            advanceValue="when ready"
          />
        </div>
      </div>
    </section>
  );
}
