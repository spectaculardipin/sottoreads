interface NotesProps {
  onStartFree: () => void;
}

export function Notes({ onStartFree }: NotesProps) {
  return (
    <section className="section notes-section" id="notes">
      <div className="shell notes-mini">
        <div className="notes-copy">
          <h2 className="section-title">Bring your notes.</h2>
          <p className="section-lede">
            Paste text or drop a PDF, DOCX, TXT, or Markdown file. Sotto Reads splits it into
            batches in your browser.
          </p>
          <div className="file-types">
            <span>PDF</span>
            <span>DOCX</span>
            <span>TXT</span>
            <span>MD</span>
          </div>
        </div>

        <div className="file-card">
          <div className="file-card-top">
            <span className="file-icon">PDF</span>
            <div>
              <strong>lecture-07.pdf</strong>
              <span>2 pages / 842 words</span>
            </div>
          </div>
          <div className="file-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <button type="button" className="btn btn-primary" onClick={onStartFree}>
            Open the practice room
          </button>
          <p className="file-note">Your file stays in your browser.</p>
        </div>
      </div>
    </section>
  );
}
