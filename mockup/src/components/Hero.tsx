import { ArrowRight, Play, Square } from 'lucide-react';
import { delay } from '../lib/style';
import { BatchStrip } from './BatchStrip';
import { useSampleVoice } from '../hooks/useSampleVoice';

const SAMPLE_WORDS = 'Small habits, repeated daily, become the quiet architecture.'.split(' ');

interface HeroProps {
  onStartFree: () => void;
}

export function Hero({ onStartFree }: HeroProps) {
  const { playing, activeWord, play } = useSampleVoice();
  const sampleText = SAMPLE_WORDS.join(' ');

  return (
    <section className="hero" id="top">
      <div className="shell hero-inner">
        <div className="hero-copy">
          <p className="eyebrow enter" style={delay(0)}>
            Dictation practice for people who write by hand
          </p>

          <h1 className="enter" style={delay(60)}>
            The dictation tool that <span className="accent">waits</span> for you.
          </h1>

          <p className="hero-sub enter" style={delay(130)}>
            Load your notes. Sotto Reads speaks one short batch at a time, then gives you room to
            write it down. Advance when you click, or when your learned pace says you are ready.
          </p>

          <div className="hero-actions enter" style={delay(200)}>
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
              {playing ? <Square size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
              {playing ? 'Stop the sample' : 'Hear a batch'}
            </button>
          </div>

          <p className="hero-note enter" style={delay(250)}>
            Free plan. Browser voice. No account, no upload.
          </p>
        </div>

        <div className="hero-panel enter" style={delay(180)}>
          <BatchStrip
            words={SAMPLE_WORDS}
            activeWord={activeWord}
            batchIndex={3}
            batchCount={18}
            playing={playing}
            onPlay={() => play(sampleText)}
            onNext={onStartFree}
            nextLabel="Next"
          />
        </div>

        <div className="hero-facts enter" style={delay(310)}>
          <div className="hero-fact">
            <span>01</span>
            <strong>PDF, DOCX, TXT, Markdown</strong>
          </div>
          <div className="hero-fact">
            <span>02</span>
            <strong>1 to 20 words per batch</strong>
          </div>
          <div className="hero-fact">
            <span>03</span>
            <strong>Manual or learned pace</strong>
          </div>
          <div className="hero-fact">
            <span>04</span>
            <strong>Export your pace as JSON</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
