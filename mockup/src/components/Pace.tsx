import { useState } from 'react';
import type { CSSProperties } from 'react';

const PACE_BARS = [32, 46, 40, 56, 50, 64, 58, 72, 66, 82, 74];
const RATINGS = ['Too slow', 'A little slow', 'Okay', 'A little fast', 'Too fast'];

export function Pace() {
  const [mode, setMode] = useState<'manual' | 'smart'>('smart');
  const [rating, setRating] = useState('Okay');

  return (
    <section className="section pace-section" id="pace">
      <div className="shell section-grid">
        <div className="rail" aria-hidden="true">
          02
        </div>
        <div className="section-body">
          <div className="pace-grid">
            <div className="pace-copy">
              <h2 className="section-title">It times your handwriting.</h2>
              <p className="section-lede">
                A short training session measures how long each batch takes and turns it into one
                number. Smart mode uses it to decide when to advance.
              </p>
            </div>

            <div className="pace-panel">
              <div className="pace-panel-head">
                <span>Pace model</span>
                <span className="chip">Sample</span>
              </div>

              <div className="pace-panel-body">
                <div className="pace-number">
                  <strong>420</strong>
                  <span>
                    ms per
                    <br />
                    character
                  </span>
                </div>

                <div className="pace-bars" aria-hidden="true">
                  {PACE_BARS.map((height, index) => (
                    <span
                      key={index}
                      className={`pace-bar${index === PACE_BARS.length - 1 ? ' is-last' : ''}`}
                      style={{ height: `${height}%` } as CSSProperties}
                    />
                  ))}
                </div>
                <div className="pace-axis">
                  <span>Batch 01</span>
                  <span>Batch 11</span>
                </div>

                <div className="pace-controls">
                  <div className="pace-control-row">
                    <span className="pace-control-label">Advance</span>
                    <div className="segmented" role="group" aria-label="Advance mode">
                      <button
                        type="button"
                        aria-pressed={mode === 'manual'}
                        onClick={() => setMode('manual')}
                      >
                        Manual
                      </button>
                      <button
                        type="button"
                        aria-pressed={mode === 'smart'}
                        onClick={() => setMode('smart')}
                      >
                        Smart
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="pace-control-label">After a session</span>
                    <div className="rating-row" role="group" aria-label="Pacing feedback">
                      {RATINGS.map((label) => (
                        <button
                          key={label}
                          type="button"
                          className="rating"
                          data-active={rating === label}
                          aria-pressed={rating === label}
                          onClick={() => setRating(label)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

