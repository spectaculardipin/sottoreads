import { useState } from 'react';
import { Check } from 'lucide-react';

const VOICES = [
  { id: 'mara', name: 'Mara', provider: 'ElevenLabs', duration: '0:04' },
  { id: 'kai', name: 'Kai', provider: 'Fish Audio', duration: '0:05' },
  { id: 'browser', name: 'Browser', provider: 'Free plan', duration: '0:03' },
];

const VOICE_WAVE = [4, 10, 16, 8, 18, 12, 20, 6, 14, 10, 17, 7, 12, 19, 9, 15];

export function Pro() {
  const [selected, setSelected] = useState('mara');
  const [handsFree, setHandsFree] = useState(true);

  return (
    <section className="section" id="pro">
      <div className="shell section-grid">
        <div className="rail" aria-hidden="true">
          05
        </div>
        <div className="section-body">
          <div className="pro-grid">
            <div className="pro-copy">
              <h2 className="section-title">Studio voices, when you want them.</h2>
              <p className="section-lede">
                Pro adds cloud voices from Fish Audio and ElevenLabs, hands-free advance, and an AI
                support chat inside the session. It is for the days when the browser voice is not
                enough.
              </p>

              <ul className="pro-list">
                <li>
                  <Check size={15} />
                  <span>
                    <strong>Fish Audio and ElevenLabs voices.</strong> Pick a voice for the
                    session, then keep it.
                  </span>
                </li>
                <li>
                  <Check size={15} />
                  <span>
                    <strong>Hands-free advance.</strong> Cloud transcription listens for the end of
                    your batch so you can keep writing.
                  </span>
                </li>
                <li>
                  <Check size={15} />
                  <span>
                    <strong>AI support chat.</strong> Ask about pace, batches, or a stuck session
                    without leaving the page.
                  </span>
                </li>
              </ul>
            </div>

            <div className="pro-panel">
              <div className="pro-panel-head">
                <span>Voice library</span>
                <span className="chip chip-pro">Pro</span>
              </div>

              <div className="voice-list" role="group" aria-label="Pro voice selection">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    type="button"
                    className={`voice-row${selected === voice.id ? ' is-active' : ''}`}
                    aria-pressed={selected === voice.id}
                    onClick={() => setSelected(voice.id)}
                  >
                    <span className="voice-avatar" aria-hidden="true">
                      {voice.name.slice(0, 1)}
                    </span>
                    <span>
                      <span className="voice-name">{voice.name}</span>
                      <span className="voice-provider">{voice.provider}</span>
                    </span>
                    <span className="voice-wave" aria-hidden="true">
                      {VOICE_WAVE.map((height, index) => (
                        <span key={index} style={{ height: `${height}px` }} />
                      ))}
                    </span>
                    <span className="voice-duration">{voice.duration}</span>
                  </button>
                ))}
              </div>

              <div className="pro-extras">
                <div className="pro-extra">
                  <div className="pro-extra-head">
                    <span className="pro-extra-label">Hands-free</span>
                    <button
                      type="button"
                      className="toggle"
                      role="switch"
                      aria-checked={handsFree}
                      aria-label="Hands-free advance"
                      data-on={handsFree}
                      onClick={() => setHandsFree((current) => !current)}
                    />
                  </div>
                  <p>
                    {handsFree
                      ? 'Listening for the end of your batch. The microphone is on only during a session.'
                      : 'Turn on to advance when the transcription hears you finish.'}
                  </p>
                  <div className="mic-level" aria-hidden="true">
                    {VOICE_WAVE.map((height, index) => (
                      <span
                        key={index}
                        className={handsFree && index % 3 !== 0 ? 'is-hot' : undefined}
                        style={{ height: `${Math.max(4, height - 2)}px` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="pro-extra">
                  <div className="pro-extra-head">
                    <span className="pro-extra-label">In-session help</span>
                    <span className="chip">AI chat</span>
                  </div>
                  <p>Ask a question without losing your place in the batch.</p>
                  <div className="chat-demo">
                    <div className="chat-head">
                      <span>Sotto support</span>
                      <span>Online</span>
                    </div>
                    <div className="chat-bubble is-user">
                      <strong>You</strong>
                      How do I slow the pace?
                    </div>
                    <div className="chat-bubble">
                      <strong>Sotto</strong>
                      Smart mode follows your learned pace. After a session, rate the pacing as too
                      fast, or switch to Manual and press Next when you are ready.
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

