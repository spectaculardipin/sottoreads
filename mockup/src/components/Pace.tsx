import { useState } from 'react';
import type { CSSProperties } from 'react';

const PACE_BARS = [32, 46, 40, 56, 50, 64, 58, 72, 66, 82, 74];
const RATINGS = ['Too slow', 'A little slow', 'Okay', 'A little fast', 'Too fast'];

export function Pace() {
  const [mode, setMode] = useState<'manual' | 'smart'>('smart');
  const [rating, setRating] = useState('Okay');

  return (
    <section className="section" id="pace">
      <div className="shell section-grid">
        <div className="rail" aria-hidden="true">
          02
        </div>
        <div className="section-body">
          <div className="pace-grid">
            <div className="pace-copy">
              <h2 className="section-title">It learns how long you take.</h2>
              <p className="section-lede">
                Smart mode starts with an 11-batch training session. Sotto Reads records how long
                each batch takes, turns that into one number, and uses it to decide when to move
                on. You can press Next sooner, or ask for more time.
              </p>

              <div className="pace-facts">
                <div className="pace-fact">
                  <strong>11</strong>
                  <span>training batches</span>
                </div>
                <div className="pace-fact">
                  <strong>1</strong>
                  <span>pace number</span>
                </div>
                <div className="pace-fact">
                  <strong>Always</strong>
                  <span>your call</span>
                </div>
              </div>
            </div>

            <div className="pace-panel">
              <div className="pace-panel-head">
                <span>Pace model</span>
                <span className="chip">Sample</span>
              </div>

              <div className="pace-panel-body">
                <div className="pace-number">
                  <strong>128</strong>
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

