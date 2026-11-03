import { useEffect, useRef, useState } from 'react';
import { Brain, Download, Trash2, Upload } from 'lucide-react';

interface BrainMenuProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onLearn: () => void;
}

export function BrainMenu({ onExport, onImport, onReset, onLearn }: BrainMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="brain-wrap" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Training and data menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="brain-menu"
        onClick={() => setOpen((current) => !current)}
      >
        <Brain size={18} strokeWidth={1.8} />
      </button>

      {open && (
        <div className="brain-menu" id="brain-menu" role="menu" aria-label="Training and data">
          <div className="menu-head">Pace &amp; training</div>

          <button
            type="button"
            role="menuitem"
            className="menu-item"
            onClick={() => choose(onLearn)}
          >
            <Brain size={16} />
            <span>How training works</span>
          </button>

          <div className="menu-rule" />

          <button
            type="button"
            role="menuitem"
            className="menu-item"
            onClick={() => choose(onExport)}
          >
            <Download size={16} />
            <span>Export pace data</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu-item"
            onClick={() => choose(() => importRef.current?.click())}
          >
            <Upload size={16} />
            <span>Import pace data</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu-item is-danger"
            onClick={() => choose(onReset)}
          >
            <Trash2 size={16} />
            <span>Reset training data</span>
          </button>

          <p className="menu-note">Training data stays in this browser. Nothing is uploaded.</p>
        </div>
      )}

      <input
        ref={importRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImport(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}
