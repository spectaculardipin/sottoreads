import type { CSSProperties } from 'react';

const PACE_BARS = [32, 46, 40, 56, 50, 64, 58, 72, 66, 82, 74];
const RATINGS = ['Too slow', 'A little slow', 'Okay', 'A little fast', 'Too fast'];

export function Pace() {
  return (
    <section className="section pace-section" id="pace">
      <div className="shell">
        <div className="pace-grid">
          <div className="pace-copy">
            <h2 className="section-title">It learns your writing pace.</h2>
            <p className="section-lede">
              Smart mode watches how long you take to press Next and turns it into one number:
              milliseconds per character. The next batch waits for that pace, not a fixed timer.
            </p>
          </div>

          <div className="pace-panel" aria-label="Sample pace model">
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
                  <div className="segmented segmented-static" aria-label="Sample advance mode">
                    <span>Manual</span>
                    <span className="is-active">Smart</span>
                  </div>
                </div>

                <div>
                  <span className="pace-control-label">After a session</span>
                  <div className="rating-row" aria-label="Sample pacing feedback">
                    {RATINGS.map((label) => (
                      <span key={label} className="rating" data-active={label === 'Okay'}>
                        {label}
                      </span>
                    ))}
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
