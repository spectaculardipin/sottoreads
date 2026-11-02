import { useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { FileUp } from 'lucide-react';

interface FileDropProps {
  accept: string;
  onFile: (file: File) => void;
  isParsing?: boolean;
  progressLabel?: string;
  progress?: number;
}

export function FileDrop({
  accept,
  onFile,
  isParsing = false,
  progressLabel,
  progress = 0,
}: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = () => {
    if (isParsing) return;
    inputRef.current?.click();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isParsing) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <>
      <div
        className={`dropzone${isDragging ? ' is-dragging' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Upload a PDF, DOCX, TXT, or Markdown file"
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <div>
          <div className="dropzone-icon">
            <FileUp size={22} strokeWidth={1.8} />
          </div>
          <strong>{isParsing ? 'Reading your file' : 'Drop a file here'}</strong>
          <span>{isParsing ? 'This stays in your browser.' : 'or click to choose from your device'}</span>
          <div className="file-types">
            <span className="file-type">PDF</span>
            <span className="file-type">DOCX</span>
            <span className="file-type">TXT</span>
            <span className="file-type">MD</span>
          </div>
        </div>
      </div>

      {isParsing && (
        <div className="file-progress" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <span>{progressLabel ?? 'Reading file'}</span>
          <span className="word-count">{Math.round(progress * 100)}%</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
        tabIndex={-1}
      />
    </>
  );
}
