import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  mode: 'signin' | 'pro';
  onClose: () => void;
}

export function AuthDialog({ open, mode, onClose }: AuthDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
    }
  }, [open]);

  const title = mode === 'pro' ? 'Start Pro' : 'Log in';
  const sub =
    mode === 'pro'
      ? 'Pro is $8 per month. Free practice does not need an account.'
      : 'Use the email you want on your Pro account.';

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby="auth-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sheet-pad">
        <div className="sheet-head">
          <div>
            <h2 className="sheet-title" id="auth-title">
              {title}
            </h2>
            <p className="sheet-sub">{sub}</p>
          </div>
          <button type="button" className="sheet-close" aria-label="Close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        {submitted ? (
          <div className="sheet-success" role="status">
            <Check size={20} color="var(--accent-strong)" />
            <strong>Check your inbox</strong>
            <p>A sign-in link is on its way to {email}.</p>
            <button type="button" className="btn btn-sm" onClick={() => setSubmitted(false)}>
              Use a different email
            </button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className="field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="sheet-actions">
              <button type="submit" className="btn btn-primary">
                Continue with email
                <ArrowRight size={16} />
              </button>
            </div>

            <p className="sheet-note">
              Demo only. No email is sent. Free practice does not need an account.
            </p>
          </form>
        )}
      </div>
    </dialog>
  );
}
