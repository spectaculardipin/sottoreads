import { Check } from 'lucide-react';

interface PricingProps {
  onStartFree: () => void;
  onStartPro: () => void;
}

const FREE = [
  'Browser voice on every session',
  'PDF, DOCX, TXT, and Markdown',
  'Sentence, phrase, and word batches',
  'Word-by-word highlight on the page',
  'Smart advance that learns your pace',
];

const PRO = [
  'Everything in Free',
  'Fish Audio S2.1 cloud voice',
  'Four upcoming batches prepared ahead',
  'Warm audio start with no clipped first word',
  'Exact or estimated word-by-word timing',
];

export function Pricing({ onStartFree, onStartPro }: PricingProps) {
  return (
    <section className="section" id="pricing">
      <div className="shell">
        <div className="pricing-head">
          <h2 className="section-title">Start free, then add studio voices on Pro.</h2>
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
            <p className="plan-desc">For cloud voices and a faster start.</p>
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
              Subscribe
            </button>
            <p className="plan-note">Preview build: opens the Pro studio directly. No payment yet.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
