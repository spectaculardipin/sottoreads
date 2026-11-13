import { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';

const SAMPLE_TEXT =
  'The morning light moved slowly across the desk. Small habits, repeated daily, become the quiet architecture of a good life. Read each phrase aloud, then write it down with care.';

function chunkWords(text: string, size: number): string[][] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const batches: string[][] = [];
  for (let index = 0; index < words.length; index += size) {
    batches.push(words.slice(index, index + size));
  }
  return batches;
}

export function Notes() {
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [text, setText] = useState(SAMPLE_TEXT);
  const batches = useMemo(() => chunkWords(text, 3), [text]);
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);

  return (
    <section className="section" id="notes">
      <div className="shell section-grid">
        <div className="rail" aria-hidden="true">
          03
        </div>
        <div className="section-body">
          <div className="notes-head">
            <div>
              <h2 className="section-title">Bring the pages you already have.</h2>
            </div>
            <p className="section-lede">
              Paste text or drop a PDF, DOCX, TXT, or Markdown file. Sotto Reads extracts the text in
              your browser, splits it into batches, and keeps the original file on your device.
            </p>
          </div>

          <div className="notes-workspace">
            <div className="notes-bar">
              <div className="tabs" role="tablist" aria-label="Text source">
                <button
                  type="button"
                  role="tab"
                  className="tab"
                  aria-selected={tab === 'upload'}
                  aria-controls="notes-panel"
                  onClick={() => setTab('upload')}
                >
                  Upload file
                </button>
                <button
                  type="button"
                  role="tab"
                  className="tab"
                  aria-selected={tab === 'paste'}
                  aria-controls="notes-panel"
                  onClick={() => setTab('paste')}
                >
                  Paste text
                </button>
              </div>
              <span className="notes-bar-meta">
                3 words per batch / {batches.length} batches
              </span>
            </div>

            <div className="notes-grid" id="notes-panel" role="tabpanel">
              <div className="notes-source">
                {tab === 'upload' ? (
                  <div className="doc-sheet">
                    <div className="doc-top">
                      <div className="doc-file">
                        <span className="doc-icon">PDF</span>
                        <div>
                          <strong>morning-notes.pdf</strong>
                          <span>Local copy / PDF</span>
                        </div>
                      </div>
                      <span className="chip">2 pages</span>
                    </div>
                    <p className="doc-text">
                      The morning light moved slowly across the desk. Small habits, repeated daily,
                      become the quiet architecture of a good life. Read each phrase aloud, then
                      write it down with care.
                    </p>
                    <div className="doc-foot">
                      <Lock size={13} />
                      Parsed locally. Nothing uploaded.
                    </div>
                  </div>
                ) : (
                  <textarea
                    className="paste-area"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    aria-label="Paste notes to split into batches"
                    spellCheck={false}
                  />
                )}
              </div>

              <div className="batch-pane">
                <div className="batch-pane-head">
                  <span>Batches</span>
                  <span>3 words each</span>
                </div>
                <div className="batch-list">
                  {batches.map((batch, index) => (
                    <div
                      key={`${batch.join(' ')}-${index}`}
                      className={`batch-row${index === 1 ? ' is-active' : ''}`}
                    >
                      <span>Batch {String(index + 1).padStart(2, '0')}</span>
                      <p>{batch.join(' ')}</p>
                      <span>{batch.length}w</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="notes-foot">
              <span>{words} words loaded / parsed in your browser</span>
              <span>Nothing uploaded</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

