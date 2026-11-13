import { ArrowRight, Cloud, EyeOff, Lock } from 'lucide-react';

export function Privacy() {
  return (
    <section className="section dark" id="privacy">
      <div className="shell section-grid">
        <div className="rail" aria-hidden="true">
          04
        </div>
        <div className="section-body">
          <div className="privacy-grid">
            <div className="privacy-copy">
              <h2 className="section-title">Your notes stay in the room.</h2>
              <p className="section-lede">
                On the free plan, your file is opened and split in your browser, and your device
                voice reads it aloud. There is no account and no microphone. Pro cloud voices are
                opt-in, and they send only the batch text you are hearing.
              </p>

              <div className="privacy-points">
                <div className="privacy-point">
                  <Lock size={16} strokeWidth={1.8} />
                  <span>
                    <strong>Sotto Reads does not upload your file.</strong> Your browser parses it
                    and your device's voice reads it aloud. Some browser voices use a network;
                    check your browser's voice settings.
                  </span>
                </div>
                <div className="privacy-point">
                  <EyeOff size={16} strokeWidth={1.8} />
                  <span>
                    <strong>No account, no analytics.</strong> Your pace data is a JSON file you can
                    export when you want it.
                  </span>
                </div>
                <div className="privacy-point">
                  <Cloud size={16} strokeWidth={1.8} />
                  <span>
                    <strong>On Pro, only batch text is sent.</strong> Your original file stays on
                    your device.
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="data-paths">
                <div className="path-row">
                  <span className="path-label">Free</span>
                  <div className="path-body">
                    <div className="path-nodes">
                      <span className="path-node">Your file</span>
                      <span className="path-arrow">→</span>
                      <span className="path-node is-accent">Your browser</span>
                      <span className="path-arrow">→</span>
                      <span className="path-node">Your speakers</span>
                    </div>
                    <p className="path-note">
                      The file is parsed and split locally. The voice is your browser's own; some
                      browser voices use a network.
                    </p>
                  </div>
                </div>

                <div className="path-row">
                  <span className="path-label">Pro</span>
                  <div className="path-body">
                    <div className="path-nodes">
                      <span className="path-node">Batch text</span>
                      <span className="path-arrow">→</span>
                      <span className="path-node">Sotto proxy</span>
                      <span className="path-arrow">→</span>
                      <span className="path-node is-accent">Voice provider</span>
                      <span className="path-arrow">→</span>
                      <span className="path-node">Audio</span>
                    </div>
                    <p className="path-note">
                      Only the text of the batch you are hearing is sent. The original file stays
                      on your device. Microphone access is requested only if you turn on hands-free
                      advance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="privacy-close">
                <p>Private by default. Cloud when you ask.</p>
                <a className="btn" href="#pricing">
                  See the plans
                  <ArrowRight size={15} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

