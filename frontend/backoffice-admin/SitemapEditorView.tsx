
import React from 'react';
import { Search, Copy, Check, Save } from 'lucide-react';

// Use any for simplicity since we're using CDN Monaco
declare const monaco: any;

interface SitemapEditorViewProps {
    editorValue: string;
    setEditorValue: (val: string) => void;
    applyFullJson: () => void;
    handlePushSitemap: () => void;
    saving: boolean;
    setStatus: (msg: string) => void;
    CDNMonacoEditor: any;
}

const SitemapEditorView: React.FC<SitemapEditorViewProps> = ({
    editorValue,
    setEditorValue,
    applyFullJson,
    handlePushSitemap,
    saving,
    setStatus,
    CDNMonacoEditor
}) => {
    return (
        <section className="bg-white rounded-[48px] p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-50 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-500 uppercase tracking-[0.3em] text-[10px] font-black">
                        <Search className="h-4 w-4" /> SİTEMAP İDARƏETMƏSİ (JSON)
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tight uppercase italic leading-none">
                        STRUKTUR VƏ NAVİQASİYA
                    </h2>
                    <p className="text-xs text-slate-500 max-w-2xl font-bold uppercase tracking-widest leading-relaxed">
                        SAYTIN NAVİQASİYA ELEMENTLƏRİNİ, PEYC STRUKTURUNU VƏ STATİK MƏTNLƏRİ BURADAN İDARƏ EDİN.
                    </p>
                </div>
            </div>

            <div className="space-y-6 animate-in zoom-in-95 duration-500">
                <div className="flex justify-end -mb-4 relative z-10 pr-6">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(editorValue);
                            setStatus('Sitemap kodu buferə kopyalandı.');
                        }}
                        className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-accent shadow-sm transition-all"
                    >
                        <Copy className="h-3.5 w-3.5" /> Kopyala
                    </button>
                </div>
                <div className="rounded-[40px] border border-slate-100 overflow-hidden shadow-2xl">
                    <CDNMonacoEditor
                        value={editorValue}
                        onChange={setEditorValue}
                        height={600}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-10 border-t border-slate-50">
                <button
                    onClick={applyFullJson}
                    className="flex items-center gap-3 bg-accent text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary transition-all shadow-xl shadow-accent/20 active:scale-95"
                >
                    <Check className="h-4 w-4" /> Kodu Yenilə
                </button>
                <button
                    onClick={handlePushSitemap}
                    disabled={saving}
                    className="flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-accent transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
                >
                    <Save className="h-4 w-4" /> {saving ? 'Yüklənir...' : 'Supabase-a Göndər'}
                </button>
            </div>
        </section>
    );
};

export default SitemapEditorView;
