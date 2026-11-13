import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Volume2, X } from 'lucide-react';
import { BatchStrip } from './BatchStrip';
import { Logo } from './Logo';
import { useSampleVoice } from '../hooks/useSampleVoice';

const SAMPLE =
  'The morning light moved slowly across the desk. Small habits, repeated daily, become the quiet architecture. Read each phrase aloud, then write it down with care.';
const BATCHES = SAMPLE.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim());
const TOTAL_WORDS = BATCHES.join(' ').split(/\s+/).filter(Boolean).length;

interface PracticeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PracticeDialog({ open, onClose }: PracticeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const { playing, activeWord, play, stop } = useSampleVoice();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (open) {
      setStarted(false);
      setFinished(false);
      setIndex(0);
      stop();
    }
  }, [open, stop]);

  useEffect(() => {
    if (!open) stop();
  }, [open, stop]);

  const close = () => {
    stop();
    onClose();
  };

  const begin = () => {
    setStarted(true);
    setFinished(false);
    setIndex(0);
    play(BATCHES[0]);
  };

  const next = () => {
    stop();
    if (index >= BATCHES.length - 1) {
      setFinished(true);
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    play(BATCHES[nextIndex]);
  };

  const previous = () => {
    if (index === 0) return;
    stop();
    const nextIndex = index - 1;
    setIndex(nextIndex);
    play(BATCHES[nextIndex]);
  };

  return (
    <dialog
      ref={dialogRef}
      className="sheet practice-sheet"
      aria-labelledby="practice-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="practice-head">
        <Logo />
        <h2 id="practice-title" className="sr-only">
          Practice room
        </h2>
        <span className="mono">Practice room / sample</span>
        <button type="button" className="sheet-close" aria-label="Close practice room" onClick={close}>
          <X size={17} />
        </button>
      </div>

      <div className="practice-body">
        {!started && !finished && (
          <div className="practice-ready">
            <span className="chip">
              <span className="chip-dot" />
              Browser voice
            </span>
            <h2>A three-batch sample.</h2>
            <p>
              This is the real session view. The voice is your browser's built-in voice, and nothing
              is saved. The full app adds file upload, batching modes, and a learned pace.
            </p>
            <div className="practice-facts">
              <div>
                <strong>{BATCHES.length}</strong>
                <span>batches</span>
              </div>
              <div>
                <strong>{TOTAL_WORDS}</strong>
                <span>words</span>
              </div>
              <div>
                <strong>0</strong>
                <span>accounts</span>
              </div>
            </div>
            <button type="button" className="btn btn-primary btn-lg" onClick={begin}>
              <Volume2 size={17} />
              Begin dictation
            </button>
            <p className="practice-fine">One batch is read at a time. Press Next when you finish writing.</p>
          </div>
        )}

        {started && !finished && (
          <div className="practice-session">
            <div className="practice-session-head">
              <span>
                Batch {String(index + 1).padStart(2, '0')} / {String(BATCHES.length).padStart(2, '0')}
              </span>
              <span>{TOTAL_WORDS} words / sample</span>
            </div>
            <BatchStrip
              words={BATCHES[index].split(' ')}
              activeWord={activeWord}
              batchIndex={index}
              batchCount={BATCHES.length}
              playing={playing}
              onPlay={() => play(BATCHES[index])}
              onNext={next}
              onPrevious={index > 0 ? previous : undefined}
              nextLabel={index === BATCHES.length - 1 ? 'Finish' : 'Next'}
              advanceLabel="Manual advance"
              advanceValue="when ready"
            />
            <p className="practice-note">
              Sample session. The full app keeps your place, trains your pace, and can advance for
              you.
            </p>
          </div>
        )}

        {finished && (
          <div className="practice-complete">
            <span className="practice-mark">
              <Check size={26} />
            </span>
            <h2>Session complete.</h2>
            <p>
              You worked through {BATCHES.length} batches and {TOTAL_WORDS} words. The full app
              would show your time and adjust the pace model.
            </p>
            <div className="practice-complete-actions">
              <button type="button" className="btn btn-primary" onClick={begin}>
                Practice again
                <ArrowRight size={16} />
              </button>
              <button type="button" className="btn" onClick={close}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
