import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  Download,
  PenLine,
  RotateCcw,
  Upload,
  Volume2,
  X,
} from 'lucide-react';

interface TrainingGuideProps {
  onClose: () => void;
  onStart: () => void;
  canStart: boolean;
}

interface Slide {
  kicker: string;
  title: string;
  body: string;
  visual: ReactNode;
}

const SLIDES: Slide[] = [
  {
    kicker: 'Step one of three',
    title: 'Smart mode needs your pace',
    body: 'Training is one short session that teaches the app how quickly you write. It records how long each batch takes and turns that into a single number: your milliseconds per character. Smart mode uses that number to decide when to move on.',
    visual: (
      <div className="guide-pace" aria-hidden="true">
        <div className="guide-pace-grid">
          <div>
            <span>Batch</span>
            <strong>24</strong>
            <em>characters</em>
          </div>
          <div>
            <span>Your time</span>
            <strong>3.1</strong>
            <em>seconds</em>
          </div>
          <div>
            <span>Learned pace</span>
            <strong>129</strong>
            <em>ms per character</em>
          </div>
        </div>
        <div className="guide-pace-note">
          <Brain size={15} />
          Smart advance = characters × your pace
        </div>
      </div>
    ),
  },
  {
    kicker: 'Step two of three',
    title: 'Write now, press Next the moment you finish',
    body: 'Each batch is read aloud once. Start writing as you hear it — the clock starts with the first word. When you finish writing the batch, press Next immediately. Accuracy matters: finishing early or late teaches the app the wrong pace, and only that press is recorded.',
    visual: (
      <ol className="guide-steps" aria-hidden="true">
        <li>
          <span className="guide-step-num">1</span>
          <Volume2 size={18} />
          <strong>Listen</strong>
          <em>The batch is read once.</em>
        </li>
        <li>
          <span className="guide-step-num">2</span>
          <PenLine size={18} />
          <strong>Write it down</strong>
          <em>Write while it is read.</em>
        </li>
        <li>
          <span className="guide-step-num">3</span>
          <Check size={18} />
          <strong>Press Next</strong>
          <em>Right when you finish.</em>
        </li>
      </ol>
    ),
  },
  {
    kicker: 'Step three of three',
    title: 'Keep your pace, or train again',
    body: 'Training data lives in this browser. Export it as a small JSON file to keep a backup or move it to another device, and import it to restore Smart mode without retraining. Reset clears the model and locks Smart mode until you train again.',
    visual: (
      <div className="guide-data" aria-hidden="true">
        <div>
          <Download size={17} />
          <span>
            <strong>Export</strong>
            Save a backup of your pace data.
          </span>
        </div>
        <div>
          <Upload size={17} />
          <span>
            <strong>Import</strong>
            Restore your pace on another browser.
          </span>
        </div>
        <div>
          <RotateCcw size={17} />
          <span>
            <strong>Reset</strong>
            Delete the model and train again.
          </span>
        </div>
      </div>
    ),
  },
];

export function TrainingGuide({ onClose, onStart, canStart }: TrainingGuideProps) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close guide" autoFocus>
          <X size={17} />
        </button>

        <span className="guide-kicker">{slide.kicker}</span>
        <h2 id="guide-title">{slide.title}</h2>
        <p>{slide.body}</p>

        {slide.visual}

        <div className="guide-foot">
          <div className="guide-dots" role="group" aria-label="Guide slides">
            {SLIDES.map((item, dotIndex) => (
              <button
                key={item.title}
                type="button"
                className={dotIndex === index ? 'is-active' : ''}
                aria-label={`Go to slide ${dotIndex + 1}`}
                aria-current={dotIndex === index}
                onClick={() => setIndex(dotIndex)}
              />
            ))}
          </div>

          <div className="guide-actions">
            {index > 0 && (
              <button type="button" className="btn btn-ghost" onClick={() => setIndex(index - 1)}>
                <ArrowLeft size={15} />
                Back
              </button>
            )}
            {last ? (
              canStart ? (
                <button type="button" className="btn btn-primary" onClick={onStart}>
                  Start training
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={onClose}>
                  Done
                </button>
              )
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => setIndex(index + 1)}>
                Next
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
