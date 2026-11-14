import { Check } from 'lucide-react';

interface PricingProps {
  onStartFree: () => void;
  onStartPro: () => void;
}

const FREE = [
  'Browser voice on every session',
  'PDF, DOCX, TXT, and Markdown',
  'Words, sentence, and phrase batches',
  'Manual and learned-pace advance',
];

const PRO = [
  'Everything in Free',
  'Fish Audio and ElevenLabs voices',
  'Hands-free advance',
  'AI support chat',
];

export function Pricing({ onStartFree, onStartPro }: PricingProps) {
  return (
    <section className="section" id="pricing">
      <div className="shell section-grid">
        <div className="rail" aria-hidden="true">
          06
        </div>
        <div className="section-body">
          <div className="pricing-head">
            <div>
              <h2 className="section-title">Start free, then add studio voices on Pro.</h2>
            </div>
          </div>

          <div className="plans">
            <div className="plan">
              <div className="plan-top">
                <span className="plan-name">Free</span>
                <span className="chip">No account</span>
              </div>
              <p className="plan-desc">For daily practice.</p>
              <div className="plan-price">
                <sup>$</sup>0<span>/ free</span>
              </div>
              <ul className="plan-list">
                {FREE.map((item) => (
                  <li key={item}>
                    <Check size={14} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn-primary" onClick={onStartFree}>
                Start free
              </button>
              <p className="plan-note">Runs in your browser.</p>
            </div>

            <div className="plan plan-pro">
              <div className="plan-top">
                <span className="plan-name">Pro</span>
                <span className="chip chip-pro">Studio</span>
              </div>
              <p className="plan-desc">For studio voices and hands-free sessions.</p>
              <div className="plan-price">
                <sup>$</sup>8<span>/ month</span>
              </div>
              <ul className="plan-list">
                {PRO.map((item) => (
                  <li key={item}>
                    <Check size={14} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn-primary" onClick={onStartPro}>
                Start Pro
              </button>
              <p className="plan-note">Billed monthly.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

