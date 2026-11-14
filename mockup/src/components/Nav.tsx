import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useBodyLock, useScrolled } from '../hooks/useChrome';
import type { Theme } from '../hooks/useTheme';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

interface NavProps {
  theme: Theme;
  onToggleTheme: () => void;
  onSignIn: () => void;
  onStartFree: () => void;
}

const LINKS = [
  { href: '#how', label: 'How it works', index: '01' },
  { href: '#pace', label: 'Pace', index: '02' },
  { href: '#pricing', label: 'Pricing', index: '03' },
  { href: '#faq', label: 'FAQ', index: '04' },
];

export function Nav({ theme, onToggleTheme, onSignIn, onStartFree }: NavProps) {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useBodyLock(open);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !menuRef.current) return;
      const focusable = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    menuButtonRef.current?.focus();
  };

  const startFree = () => {
    setOpen(false);
    onStartFree();
  };

  return (
    <>
      <header className="nav" data-scrolled={scrolled}>
        <div className="shell nav-inner">
          <Logo />

          <nav className="nav-links" aria-label="Main navigation">
            {LINKS.map((link) => (
              <a key={link.href} className="nav-link" href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button type="button" className="nav-signin" onClick={onSignIn}>
              Log in
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={onStartFree}>
              Start free
            </button>
            <button
              ref={menuButtonRef}
              type="button"
              className="icon-btn nav-menu-btn"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(true)}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <div className="mobile-menu-top">
            <Logo />
            <button
              ref={closeButtonRef}
              type="button"
              className="icon-btn"
              aria-label="Close menu"
              onClick={close}
            >
              <X size={18} />
            </button>
          </div>

          <nav className="mobile-links" aria-label="Mobile navigation">
            {LINKS.map((link) => (
              <a key={link.href} className="mobile-link" href={link.href} onClick={close}>
                <span>{link.index}</span>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mobile-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={startFree}>
              Start free
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setOpen(false);
                onSignIn();
              }}
            >
              Log in to Pro
            </button>
          </div>
          <div className="mobile-foot">
            <p>Free practice needs no account. Your notes stay in your browser.</p>
          </div>
        </div>
      )}
    </>
  );
}
