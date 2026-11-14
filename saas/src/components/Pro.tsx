import { ArrowRight, Check } from 'lucide-react';

const VOICES = [
  {
    id: 'fish',
    name: 'Fish Audio S2.1',
    provider: 'Cloud voice · exact timing',
    duration: '0:04',
    active: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter free',
    provider: 'Fish S2.1 free · estimated timing',
    duration: '0:04',
    active: false,
  },
  {
    id: 'browser',
    name: 'Browser',
    provider: 'Free plan · instant',
    duration: '0:03',
    active: false,
  },
];

const VOICE_WAVE = [4, 10, 16, 8, 18, 12, 20, 6, 14, 10, 17, 7, 12, 19, 9, 15];

const QUEUE = [
  { index: '01', state: 'Ready', tone: 'ready' },
  { index: '02', state: 'Ready', tone: 'ready' },
  { index: '03', state: 'Generating', tone: 'generating' },
  { index: '04', state: 'Queued', tone: 'queued' },
];

export function Pro() {
  return (
    <section className="section pro-section" id="pro">
      <div className="shell">
        <div className="pro-grid">
          <div className="pro-copy">
            <span className="pro-kicker">Pro studio</span>
            <h2 className="section-title">Studio voices, ready before you press play.</h2>
            <p className="section-lede">
              Fish Audio S2.1 reads each batch while the next four are already generated. The
              audio engine is warmed before the first word, so the opening is never clipped.
            </p>
            <ul className="pro-points">
              <li>
                <Check size={14} />
                Four upcoming batches prepared in the background
              </li>
              <li>
                <Check size={14} />
                Word-by-word highlight while the voice speaks
              </li>
              <li>
                <Check size={14} />
                Smart advance learns your writing speed
              </li>
            </ul>
            <a className="btn btn-pro-cta" href="/app">
              Open the Pro studio
              <ArrowRight size={16} className="btn-arrow" />
            </a>
          </div>

          <div className="pro-panel">
            <div className="pro-panel-head">
              <span>Voice &amp; queue</span>
              <span className="chip chip-pro">Pro</span>
            </div>

            <div className="voice-list" role="group" aria-label="Voices available on Pro">
              {VOICES.map((voice) => (
                <div
                  key={voice.id}
                  className={`voice-row${voice.active ? ' is-active' : ''}`}
                  aria-label={`${voice.name}, ${voice.provider}`}
                >
                  <span className="voice-avatar" aria-hidden="true">
                    {voice.name.slice(0, 1)}
                  </span>
                  <span className="voice-identity">
                    <span className="voice-name">{voice.name}</span>
                    <span className="voice-provider">{voice.provider}</span>
                  </span>
                  <span className="voice-wave" aria-hidden="true">
                    {VOICE_WAVE.map((height, index) => (
                      <span key={index} style={{ height: `${height}px` }} />
                    ))}
                  </span>
                  <span className="voice-duration">{voice.duration}</span>
                </div>
              ))}
            </div>

            <div className="pro-extras">
              <div className="pro-extra">
                <div className="pro-extra-head">
                  <span className="pro-extra-label">Prepared ahead</span>
                  <span className="chip">4 batches</span>
                </div>
                <p>Paste once. The next four batches are generated while you listen and write.</p>
                <div className="prefetch-demo">
                  {QUEUE.map((row) => (
                    <div className="prefetch-row" key={row.index}>
                      <span className="prefetch-index">{row.index}</span>
                      <span className="prefetch-bars" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className={`prefetch-state is-${row.tone}`}>{row.state}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pro-extra">
                <div className="pro-extra-head">
                  <span className="pro-extra-label">Warm start</span>
                  <span className="chip">Automatic</span>
                </div>
                <p>
                  A silent pre-roll and 120 ms of lead-in silence protect the first phoneme. No
                  more clipped openings when the next batch begins.
                </p>
                <div className="warm-demo" aria-hidden="true">
                  <span className="warm-silence" />
                  <span className="warm-wave">
                    {VOICE_WAVE.map((height, index) => (
                      <span key={index} style={{ height: `${height}px` }} />
                    ))}
                  </span>
                  <span className="warm-label">first word intact</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
