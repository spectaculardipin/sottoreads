import { ArrowRight } from 'lucide-react';

interface ClosingProps {
  onStartFree: () => void;
}

export function Closing({ onStartFree }: ClosingProps) {
  return (
    <section className="cta">
      <div className="shell cta-inner">
        <h2>Start with one batch.</h2>
        <p>Free practice runs in your browser. No install.</p>
        <div className="cta-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={onStartFree}>
            Start free
            <ArrowRight size={17} className="btn-arrow" />
          </button>
        </div>
      </div>
    </section>
  );
}
