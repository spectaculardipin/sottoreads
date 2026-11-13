import type { Theme } from '../hooks/useTheme';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

interface FooterProps {
  theme: Theme;
  onToggleTheme: () => void;
  onSignIn: () => void;
  onStartFree: () => void;
}

export function Footer({ theme, onToggleTheme, onSignIn, onStartFree }: FooterProps) {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo />
            <p>
              A dictation tool for people who write by hand. Free practice runs in your browser.
              Pro adds cloud voices.
            </p>
            <span className="chip" style={{ marginTop: 18 }}>
              <span className="chip-dot" />
              Open source
            </span>
          </div>

          <div className="footer-col">
            <h3>Product</h3>
            <ul>
              <li>
                <a href="#how">How it works</a>
              </li>
              <li>
                <a href="#pace">Smart pace</a>
              </li>
              <li>
                <a href="#privacy">Privacy</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>App</h3>
            <ul>
              <li>
                <button type="button" className="footer-link" onClick={onStartFree}>
                  Start free
                </button>
              </li>
              <li>
                <button type="button" className="footer-link" onClick={onSignIn}>
                  Sign in to Pro
                </button>
              </li>
              <li>
                <a
                  href="https://github.com/spectaculardipin/sottoreads"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>More</h3>
            <ul>
              <li>
                <a href="#privacy">Privacy</a>
              </li>
              <li>
                <a
                  href="https://github.com/spectaculardipin/sottoreads/issues"
                  target="_blank"
                  rel="noreferrer"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/spectaculardipin/sottoreads#readme"
                  target="_blank"
                  rel="noreferrer"
                >
                  Docs
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Sotto Reads. The free app is open source.</span>
          <div className="footer-bottom-right">
            <span>Built for quiet study.</span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
      </div>
    </footer>
  );
}
