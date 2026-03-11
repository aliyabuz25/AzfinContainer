import React from 'react';
import { ExternalLink, FileText, Trash2, Upload } from 'lucide-react';
import PdfPreview from '../components/PdfPreview';
import { resolveMediaUrl } from '../utils/mediaUrl';

interface LicensePdfViewProps {
  badgeLabel: string;
  pdfUrl: string;
  uploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

const LicensePdfView: React.FC<LicensePdfViewProps> = ({
  badgeLabel,
  pdfUrl,
  uploading,
  onUpload,
  onRemove,
}) => {
  const resolvedPdfUrl = resolveMediaUrl(pdfUrl);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-accent/5 text-accent rounded-full text-[10px] font-black uppercase tracking-widest">
            <FileText className="h-4 w-4" /> Lisans PDF
          </div>
          <h2 className="text-4xl font-black text-primary tracking-tighter uppercase italic leading-none">
            PDF REDAKTƏSİ
          </h2>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
            Ana səhifədəki lisenziya badge-inə klik ediləndə açılan PDF bu bölmədən idarə olunur.
          </p>
        </div>
        <div className="rounded-[28px] border border-slate-100 bg-slate-50 px-6 py-5">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Badge mətni</div>
          <div className="mt-2 text-sm font-black uppercase tracking-wide text-primary">
            {badgeLabel || 'Lisenziyalı Audit Xidmətləri'}
          </div>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,360px)_1fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                  Mövcud fayl
                </div>
                <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Yalnız PDF yükləməsi qəbul olunur
                </div>
              </div>
              {resolvedPdfUrl ? (
                <a
                  href={resolvedPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary transition-all hover:bg-slate-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  Aç
                </a>
              ) : null}
            </div>

            <div className="mt-6">
              {resolvedPdfUrl ? (
                <PdfPreview title={badgeLabel} url={pdfUrl} />
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 text-center">
                  <FileText className="h-10 w-10 text-slate-300" />
                  <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    PDF faylı seçilməyib
                  </p>
                </div>
              )}
            </div>

            {pdfUrl ? (
              <div className="mt-6 break-all rounded-2xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
                {pdfUrl}
              </div>
            ) : null}
          </div>

          <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex cursor-pointer items-center gap-3 rounded-[20px] bg-primary px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-accent">
                {uploading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Yüklənir...' : 'PDF Yüklə'}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={onUpload}
                />
              </label>

              <button
                type="button"
                onClick={onRemove}
                disabled={!pdfUrl}
                className="inline-flex items-center gap-3 rounded-[20px] bg-red-50 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                PDF Sil
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                Modal önizləmə davranışı
              </div>
              <div className="mt-2 text-xs font-medium text-slate-500">
                Public saytda badge klik ediləndə PDF eyni səhifədə modal içində açılır.
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4 text-sm font-medium leading-relaxed text-slate-500">
            <p>Yüklənən fayl mövcud `multer` upload endpoint-i ilə `/uploads/...` altında saxlanılır.</p>
            <p>PDF seçilməyibsə badge kliklənə bilən görünməyəcək.</p>
            <p>Yeni fayl yüklədikdən sonra dəyişiklik autosave ilə draft kimi saxlanır, istəsəniz yuxarıdakı düymə ilə də dərhal manuel yadda saxlaya bilərsiniz.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicensePdfView;
