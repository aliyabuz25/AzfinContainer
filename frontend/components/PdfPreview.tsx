import React from 'react';
import { FileText } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { resolveMediaUrl } from '../utils/mediaUrl';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface PdfPreviewProps {
  title: string;
  url: string;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ title, url }) => {
  const [hasError, setHasError] = React.useState(false);
  const resolvedUrl = resolveMediaUrl(url);

  if (!resolvedUrl) return null;

  return (
    <div className="w-full max-w-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <FileText className="h-4 w-4 text-accent" />
        PDF Önizləmə
      </div>
      <div className="flex justify-center bg-white p-3">
        {hasError ? (
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noreferrer"
            className="text-center text-xs font-bold text-accent hover:text-primary"
          >
            {title || 'PDF dosyasını aç'}
          </a>
        ) : (
          <Document
            file={resolvedUrl}
            loading={<div className="py-10 text-xs font-bold uppercase tracking-widest text-slate-400">Yüklənir...</div>}
            onLoadError={() => setHasError(true)}
            onSourceError={() => setHasError(true)}
          >
            <Page
              pageNumber={1}
              width={220}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>
        )}
      </div>
    </div>
  );
};

export default PdfPreview;
