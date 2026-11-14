import { ArrowRight } from 'lucide-react';

const BARS = [10, 18, 26, 14, 30, 20, 34, 16, 24, 12, 28, 38, 18, 32, 22, 14, 26, 20, 36, 16, 24, 30, 12, 22, 28, 18, 32, 14];

export function Loop() {
  return (
    <section className="section loop-section" id="how">
      <div className="shell">
        <div className="section-head-center">
          <h2 className="section-title">One batch at a time.</h2>
          <p className="section-lede">
            No timer races you. The next batch waits until you are done.
          </p>
        </div>

        <div className="loop-fish">
          <article className="step">
            <div className="step-visual">
              <div className="wave-demo" aria-hidden="true">
                {BARS.map((height, index) => (
                  <span
                    key={index}
                    className={index < 16 ? 'is-hot' : undefined}
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </div>
            <h3>A short batch, read once.</h3>
            <p>A few seconds of listening.</p>
          </article>

          <article className="step">
            <div className="step-visual">
              <div className="write-demo" aria-hidden="true">
                <span className="write-text">Small habits, repeated daily</span>
                <span className="write-caret" />
              </div>
            </div>
            <h3>Then you write it down.</h3>
            <p>The batch stays on screen while you work.</p>
          </article>

          <article className="step">
            <div className="step-visual">
              <div className="advance-pill is-dark" aria-hidden="true">
                <span className="advance-copy">
                  Smart advance in <strong>0:03</strong>
                </span>
                <span className="advance-next">
                  Next
                  <ArrowRight size={17} />
                </span>
              </div>
            </div>
            <h3>Next, when you're ready.</h3>
            <p>Press it yourself, or let your pace decide.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
