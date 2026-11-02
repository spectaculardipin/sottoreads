export interface ParseProgress {
  label: string;
  progress: number;
}

const MAX_FILE_BYTES = 40 * 1024 * 1024;

export function getFileKind(file: File): 'pdf' | 'docx' | 'text' | 'unknown' {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
  if (
    name.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }
  if (
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.text') ||
    file.type.startsWith('text/')
  ) {
    return 'text';
  }
  return 'unknown';
}

export async function parseFile(
  file: File,
  onProgress?: (progress: ParseProgress) => void,
): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('That file is larger than 40 MB. Try a smaller file.');
  }

  const kind = getFileKind(file);
  onProgress?.({ label: 'Reading file', progress: 0.1 });

  if (kind === 'text') {
    const text = await file.text();
    onProgress?.({ label: 'Done', progress: 1 });
    return text;
  }

  if (kind === 'docx') {
    onProgress?.({ label: 'Opening document', progress: 0.25 });
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    onProgress?.({ label: 'Done', progress: 1 });
    return result.value;
  }

  if (kind === 'pdf') {
    onProgress?.({ label: 'Opening PDF', progress: 0.2 });
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

    const arrayBuffer = await file.arrayBuffer();
    const document = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      onProgress?.({
        label: `Reading page ${pageNumber} of ${document.numPages}`,
        progress: 0.2 + (pageNumber / document.numPages) * 0.7,
      });
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => {
          if ('str' in item) {
            const textItem = item as { str: string; hasEOL?: boolean };
            return textItem.str + (textItem.hasEOL ? '\n' : ' ');
          }
          return '';
        })
        .join('');
      pages.push(pageText);
      page.cleanup();
    }

    await (document as unknown as { destroy: () => Promise<void> }).destroy();
    onProgress?.({ label: 'Done', progress: 1 });
    return pages.join('\n\n');
  }

  throw new Error('Unsupported file type. Use PDF, DOCX, TXT, or Markdown.');
}
