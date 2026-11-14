import { useRef } from 'react';
import { ArrowRight, FileUp, Loader2, Square, Upload } from 'lucide-react';

interface SourceCardProps {
  text: string;
  onTextChange: (value: string) => void;
  words: number;
  batchCount: number;
  active: boolean;
  startDisabled: boolean;
  fileLabel: string | null;
  fileProgress: string | null;
  fileError: string | null;
  onFile: (file: File | null) => void;
  onUseSample: () => void;
  onStart: () => void;
  onEnd: () => void;
}

export function SourceCard({
  text,
  onTextChange,
  words,
  batchCount,
  active,
  startDisabled,
  fileLabel,
  fileProgress,
  fileError,
  onFile,
  onUseSample,
  onStart,
  onEnd,
}: SourceCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <section className="app-card source-card">
      <div className="app-card-head">
        <div>
          <span className="app-card-kicker">Source</span>
          <h2>Paste or upload</h2>
        </div>
        <span className="app-count">
          {words} words · {batchCount} {batchCount === 1 ? 'batch' : 'batches'}
        </span>
      </div>

      <textarea
        id="app-textarea"
        className="app-textarea"
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder="Paste a lecture note, a paragraph, or a page from a book…"
        spellCheck={false}
        aria-label="Text to read aloud"
      />

      <div className="source-tools">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,text/plain,application/pdf"
          className="sr-only"
          id="app-file"
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
        <button type="button" className="file-button" onClick={() => fileRef.current?.click()}>
          <Upload size={14} />
          Upload
        </button>
        <button type="button" className="text-link" onClick={onUseSample}>
          Sample
        </button>
        <span className="source-file-note">
          {fileProgress ? (
            <>
              <Loader2 size={12} className="spin" />
              {fileProgress}
            </>
          ) : fileLabel ? (
            <>
              <FileUp size={12} />
              {fileLabel}
            </>
          ) : (
            'PDF, DOCX, TXT, MD'
          )}
        </span>
      </div>

      {fileError ? (
        <p className="form-error" role="alert">
          {fileError}
        </p>
      ) : null}

      <div className="source-actions">
        <button
          type="button"
          className="btn btn-primary btn-lg source-start"
          onClick={onStart}
          disabled={startDisabled}
        >
          {active ? 'Start a new session' : 'Start session'}
          <ArrowRight size={17} className="btn-arrow" />
        </button>
        {active ? (
          <button type="button" className="btn source-end" onClick={onEnd}>
            <Square size={12} fill="currentColor" />
            End
          </button>
        ) : null}
      </div>
    </section>
  );
}
