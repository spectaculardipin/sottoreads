import { ArrowRight, Play } from 'lucide-react';

const MINI_WAVE = [9, 14, 22, 12, 26, 18, 30, 16, 24, 11, 20, 28, 15, 23, 10, 19, 27, 13, 21, 17, 25, 12];

export function Loop() {
  return (
    <section className="section" id="how">
      <div className="shell section-grid">
        <div className="rail" aria-hidden="true">
          01
        </div>
        <div className="section-body">
          <div className="loop-head">
            <div>
              <h2 className="section-title">One batch. Then another.</h2>
            </div>
            <p className="section-lede">
              Short enough to hold in your head. Long enough to be worth writing. Sotto Reads keeps
              the next step obvious, so the session stays quiet.
            </p>
          </div>

          <div className="loop-steps">
            <article className="loop-step">
              <div className="loop-num">
                <span>Listen</span>
              </div>
              <div className="loop-visual" aria-hidden="true">
                <div className="mini-play">
                  <span className="mini-play-btn">
                    <Play size={15} fill="currentColor" />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="mini-wave">
                      {MINI_WAVE.map((height, index) => (
                        <span
                          key={index}
                          className={index < 11 ? 'is-hot' : undefined}
                          style={{ height: `${height}px` }}
                        />
                      ))}
                    </div>
                    <div className="mini-time">0:04 / batch 01</div>
                  </div>
                </div>
              </div>
              <h3>Listen once.</h3>
              <p>Choose a voice and a speed. The batch is read one time, straight through.</p>
            </article>

            <article className="loop-step">
              <div className="loop-num">
                <span>Write</span>
              </div>
              <div className="loop-visual" aria-hidden="true">
                <div className="write-sheet">
                  <div className="write-copy">
                    Small habits, repeated daily
                    <span className="write-caret" />
                  </div>
                  <div className="write-line" />
                  <div className="write-line" />
                  <div className="write-line" />
                </div>
              </div>
              <h3>Write it down.</h3>
              <p>The batch stays on screen while you work. The clock starts with the first word.</p>
            </article>

            <article className="loop-step">
              <div className="loop-num">
                <span>Advance</span>
              </div>
              <div className="loop-visual" aria-hidden="true">
                <div className="mini-advance">
                  <div className="mini-advance-row">
                    <span>Your turn</span>
                    <strong>Smart 00:07</strong>
                  </div>
                  <div className="strip-track">
                    <div className="strip-fill" style={{ width: '64%' }} />
                  </div>
                  <div className="mini-next">
                    Next
                    <ArrowRight size={13} />
                  </div>
                </div>
              </div>
              <h3>Move when you are done.</h3>
              <p>Click Next, or let Smart mode move at the pace it learned from your writing.</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}


