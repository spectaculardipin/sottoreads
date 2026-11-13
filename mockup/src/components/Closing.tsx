import { ArrowRight } from 'lucide-react';

interface ClosingProps {
  onStartFree: () => void;
}

export function Closing({ onStartFree }: ClosingProps) {
  return (
    <section className="cta">
      <div className="shell cta-inner">
        <div className="cta-copy">
          <span className="cta-kicker">Sotto Reads / free plan</span>
          <h2>Bring your notes. Keep your pace.</h2>
          <p>
            Free practice runs in your browser. Pro adds studio voices, hands-free advance, and
            support inside the session.
          </p>
          <div className="cta-actions">
            <button type="button" className="btn btn-lg" onClick={onStartFree}>
              Start free
              <ArrowRight size={17} className="btn-arrow" />
            </button>
            <span className="cta-note">Free plan. Browser voice.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
