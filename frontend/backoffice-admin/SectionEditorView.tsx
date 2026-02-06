
import React from 'react';
import { Layers, Code, ChevronDown, Trash2, Plus, Image, Upload, Save, RotateCcw, X, Bold, Settings } from 'lucide-react';
import { getSectionLabel, formatFieldLabel, FIELD_CONFIG } from './AdminConstants';

interface SectionEditorViewProps {
    selectedSection: string;
    sectionFormValues: Record<string, any>;
    sectionValueTypes: Record<string, string>;
    expandedItems: Record<string, boolean>;
    toggleItemExpansion: (key: string) => void;
    handleSectionInputChange: (key: string, value: any) => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, field: string, callback: (url: string) => void) => void;
    handleArrayObjectFieldChange: (key: string, idx: number, field: string, value: any) => void;
    handleAddArrayObjectElement: (key: string) => void;
    handleRemoveArrayObjectElement: (key: string, idx: number) => void;
    handleObjectFieldChange: (key: string, field: string, value: any) => void;
    applySectionJson: () => void;
    applyFullJson: () => void;
    setEditorValue: (val: string) => void;
    editorValue: string;
    draft: any;
    setViewMode: (mode: 'section' | 'full') => void;
    viewMode: 'section' | 'full';
    supabaseReady: boolean;
    CDNMonacoEditor: any;
    jsonError: string | null;
    setJsonError: (err: string | null) => void;
    IconPickerComponent: React.FC<{ value?: string; onChange: (value: string) => void }>;
    searchQuery?: string;
}

const safeParseArray = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        try {
            const p = JSON.parse(val);
            return Array.isArray(p) ? p : [];
        } catch {
            return [];
        }
    }
    return [];
};

const safeParseObject = (val: any) => {
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) return val;
    if (typeof val === 'string') {
        try {
            const p = JSON.parse(val);
            return (typeof p === 'object' && p !== null) ? p : {};
        } catch {
            return {};
        }
    }
    return {};
};

const SectionEditorView: React.FC<SectionEditorViewProps> = ({
    selectedSection,
    sectionFormValues,
    sectionValueTypes,
    expandedItems,
    toggleItemExpansion,
    handleSectionInputChange,
    handleImageUpload,
    handleArrayObjectFieldChange,
    handleAddArrayObjectElement,
    handleRemoveArrayObjectElement,
    handleObjectFieldChange,
    applySectionJson,
    applyFullJson,
    setEditorValue,
    editorValue,
    draft,
    setViewMode,
    viewMode,
    supabaseReady,
    CDNMonacoEditor,
    jsonError,
    setJsonError,
    IconPickerComponent: IconPicker,
    searchQuery
}) => {
    if (viewMode === 'full') {
        return (
            <div className="bg-white rounded-[48px] p-8 md:p-12 shadow-2xl border border-slate-100 space-y-10 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-50 pb-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-accent uppercase tracking-[0.3em] text-[10px] font-black">
                            <Code className="h-4 w-4" /> TAM SAYT STRUKTURU
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tight uppercase italic leading-none">MƏZMUN ARXİTEKTURASI</h2>
                    </div>
                    <button onClick={() => setViewMode('section')} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-200 transition-all">
                        <Layers className="h-3.5 w-3.5" /> Bölmə Görünüşünə Qayıt
                    </button>
                </div>
                <div className="rounded-[40px] border border-slate-100 overflow-hidden shadow-2xl">
                    <CDNMonacoEditor value={editorValue} onChange={setEditorValue} height={700} />
                </div>
                <div className="flex justify-end gap-4">
                    <button onClick={applyFullJson} className="flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-accent transition-all">
                        <Save className="h-4 w-4" /> Dəyişiklikləri Tətbiq Et
                    </button>
                </div>
            </div>
        );
    }

    let configs = FIELD_CONFIG.filter((c) => c.section === selectedSection);

    // Apply Search Filter inside the section
    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        configs = configs.filter(c =>
            (c.label && c.label.toLowerCase().includes(lowerQuery)) ||
            (c.field && c.field.toLowerCase().includes(lowerQuery))
        );
    }

    const categories = [...new Set(configs.map((c) => c.category || 'Ümumi'))];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm flex items-end justify-between gap-10">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-accent/5 text-accent rounded-full text-[10px] font-black uppercase tracking-widest">
                        <Layers className="h-4 w-4" /> {getSectionLabel(selectedSection)}
                    </div>
                    <h2 className="text-4xl font-black text-primary tracking-tighter uppercase italic leading-none">BÖLMƏ REDAKTƏSİ</h2>
                </div>
                <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
                    <button onClick={() => setViewMode('full')} className="flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all">
                        <Code className="h-3.5 w-3.5" /> Tam JSON
                    </button>
                </div>
            </header>

            <div className="space-y-12">
                {configs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
                        <Layers className="h-16 w-16 text-slate-100 mb-6" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">BU BÖLMƏ ÜÇÜN HEÇ BİR SAHƏ TANIMLANMAYIB</p>
                    </div>
                ) : (
                    categories.map((category) => (
                        <div key={category} className="space-y-8">
                            <div className="flex items-center gap-4 px-2">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">{category}</h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
                            </div>
                            <div className="grid gap-8">
                                {configs
                                    .filter((c) => (c.category || 'Ümumi') === category)
                                    .map((config) => {
                                        const key = config.field;
                                        // Hide image fields if they don't exist in the data (user request)
                                        if (config.type === 'image' && sectionFormValues[key] === undefined) {
                                            return null;
                                        }
                                        const val = sectionFormValues[key] ?? '';
                                        const type = config.type || sectionValueTypes[key] || 'string';
                                        const fieldLabel = config.label || formatFieldLabel(key);

                                        if (type === 'array-object') {
                                            const entries = safeParseArray(val) ?? [];
                                            const isExpanded = expandedItems[key] ?? false;
                                            return (
                                                <div key={key} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                                                    <div
                                                        onClick={() => toggleItemExpansion(key)}
                                                        className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between cursor-pointer group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-white rotate-180 shadow-lg' : 'bg-white text-slate-300 group-hover:bg-slate-100'
                                                                    }`}
                                                            >
                                                                <ChevronDown className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-black uppercase tracking-[0.1em] text-primary">{fieldLabel}</div>
                                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{entries.length} ELEMENT</div>
                                                            </div>
                                                        </div>
                                                        <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">DİNAMİK SİYAHI</span>
                                                    </div>
                                                    {isExpanded && (
                                                        <div className="p-8 space-y-6 bg-slate-50/20">
                                                            {entries.map((entry: any, entryIdx: number) => {
                                                                const itemKey = `${key}-${entryIdx}`;
                                                                const isItemExpanded = expandedItems[itemKey] ?? false;
                                                                const itemTitle = entry.title || entry.label || entry.heading || `Element #${entryIdx + 1}`;
                                                                return (
                                                                    <div key={itemKey} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                                                        <div
                                                                            onClick={() => toggleItemExpansion(itemKey)}
                                                                            className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div
                                                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isItemExpanded ? 'bg-accent text-white rotate-180' : 'bg-slate-100 text-slate-300'
                                                                                        }`}
                                                                                >
                                                                                    <ChevronDown className="h-3 w-3" />
                                                                                </div>
                                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                                                    {typeof itemTitle === 'string' ? itemTitle : `Element ${entryIdx + 1}`}
                                                                                </span>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleRemoveArrayObjectElement(key, entryIdx);
                                                                                }}
                                                                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </button>
                                                                        </div>
                                                                        {isItemExpanded && (
                                                                            <div className="p-8 space-y-6 border-t border-slate-50">
                                                                                {Object.entries(entry).map(([f, fv]) => {
                                                                                    const isBB = f === 'content' || f === 'description';
                                                                                    return (
                                                                                        <div key={f} className={`space-y-2 ${isBB ? 'md:col-span-2 lg:col-span-3' : ''}`}>
                                                                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1">{formatFieldLabel(f)}</label>
                                                                                            {f === 'icon' ? (
                                                                                                <IconPicker value={String(fv)} onChange={(v) => handleArrayObjectFieldChange(key, entryIdx, f, v)} />
                                                                                            ) : Array.isArray(fv) ? (
                                                                                                <div className="space-y-0 border border-slate-100 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-accent/5 transition-all">
                                                                                                    <div className="bg-slate-50/50 p-2 border-b border-slate-100 flex gap-1">
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={() => {
                                                                                                                const trid = `textarea-array-${key}-${entryIdx}-${f}`;
                                                                                                                const tr = document.getElementById(trid) as HTMLTextAreaElement;
                                                                                                                if (tr) {
                                                                                                                    const s = tr.selectionStart;
                                                                                                                    const e = tr.selectionEnd;
                                                                                                                    const t = tr.value;
                                                                                                                    const sel = t.substring(s, e);
                                                                                                                    const nv = t.substring(0, s) + '[b]' + sel + '[/b]' + t.substring(e);
                                                                                                                    handleArrayObjectFieldChange(key, entryIdx, f, nv.split('\n'));
                                                                                                                }
                                                                                                            }}
                                                                                                            className="p-2 hover:bg-white rounded-lg transition-colors border border-slate-200 bg-white"
                                                                                                        >
                                                                                                            <Bold className="h-3.5 w-3.5" />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                    <textarea
                                                                                                        id={`textarea-array-${key}-${entryIdx}-${f}`}
                                                                                                        rows={4}
                                                                                                        value={fv.join('\n')}
                                                                                                        onChange={(e) => handleArrayObjectFieldChange(key, entryIdx, f, e.target.value.split('\n'))}
                                                                                                        className="w-full p-6 text-sm font-medium text-slate-600 bg-white border-none focus:ring-0 leading-relaxed resize-none custom-scrollbar"
                                                                                                        placeholder="Hər sətirə bir dənə..."
                                                                                                    />
                                                                                                </div>
                                                                                            ) : isBB ? (
                                                                                                <div className="space-y-0 border border-slate-100 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-accent/5 transition-all">
                                                                                                    <div className="bg-slate-50/50 p-2 border-b border-slate-100 flex gap-1">
                                                                                                        <button
                                                                                                            onClick={() => {
                                                                                                                const trid = `textarea-${key}-${entryIdx}-${f}`;
                                                                                                                const tr = document.getElementById(trid) as HTMLTextAreaElement;
                                                                                                                if (tr) {
                                                                                                                    const s = tr.selectionStart;
                                                                                                                    const e = tr.selectionEnd;
                                                                                                                    const t = tr.value;
                                                                                                                    const sel = t.substring(s, e);
                                                                                                                    const nv = t.substring(0, s) + '[b]' + sel + '[/b]' + t.substring(e);
                                                                                                                    handleArrayObjectFieldChange(key, entryIdx, f, nv);
                                                                                                                }
                                                                                                            }}
                                                                                                            className="p-2 hover:bg-white rounded-lg transition-colors border border-slate-200 bg-white"
                                                                                                        >
                                                                                                            <Bold className="h-3.5 w-3.5" />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                    <textarea
                                                                                                        id={`textarea-${key}-${entryIdx}-${f}`}
                                                                                                        rows={6}
                                                                                                        value={String(fv)}
                                                                                                        onChange={(e) => handleArrayObjectFieldChange(key, entryIdx, f, e.target.value)}
                                                                                                        className="w-full p-6 text-sm font-medium text-slate-600 bg-white border-none focus:ring-0 leading-relaxed resize-none"
                                                                                                    />
                                                                                                </div>
                                                                                            ) : (f === 'img' || f === 'image' || f === 'logo') ? (
                                                                                                <div className="space-y-4">
                                                                                                    {fv && (String(fv).startsWith('http') || String(fv).startsWith('/')) && (
                                                                                                        <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                                                                                            <img src={String(fv)} alt="Preview" className="w-full h-full object-cover" />
                                                                                                            <button onClick={() => handleArrayObjectFieldChange(key, entryIdx, f, '')} className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur shadow-md rounded-lg text-red-500 hover:text-red-700 transition-all">
                                                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    )}
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        <div className="flex-1 relative">
                                                                                                            <input
                                                                                                                type="text"
                                                                                                                value={String(fv)}
                                                                                                                onChange={(e) => handleArrayObjectFieldChange(key, entryIdx, f, e.target.value)}
                                                                                                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-primary focus:ring-4 focus:ring-accent/5 outline-none pr-10"
                                                                                                                placeholder="URL..."
                                                                                                            />
                                                                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"><Image className="h-4 w-4" /></div>
                                                                                                        </div>
                                                                                                        {supabaseReady && (
                                                                                                            <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all cursor-pointer text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                                                                                                                <Upload className="h-3.5 w-3.5" /> Yüklə
                                                                                                                <input
                                                                                                                    type="file"
                                                                                                                    accept="image/*"
                                                                                                                    className="hidden"
                                                                                                                    onChange={(e) => handleImageUpload(e, key, (url) => handleArrayObjectFieldChange(key, entryIdx, f, url))}
                                                                                                                />
                                                                                                            </label>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ) : (Array.isArray(fv) && fv.length > 0 && typeof fv[0] === 'object') ? (
                                                                                                <div className="space-y-4 border-l-2 border-slate-100 pl-6 py-2">
                                                                                                    {fv.map((subEntry: any, subIdx: number) => (
                                                                                                        <div key={subIdx} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-4">
                                                                                                            <div className="flex items-center justify-between">
                                                                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Element #{subIdx + 1}</span>
                                                                                                                <button
                                                                                                                    onClick={() => {
                                                                                                                        const newFv = [...fv];
                                                                                                                        newFv.splice(subIdx, 1);
                                                                                                                        handleArrayObjectFieldChange(key, entryIdx, f, newFv);
                                                                                                                    }}
                                                                                                                    className="text-red-400 hover:text-red-500"
                                                                                                                >
                                                                                                                    <Trash2 className="h-3 w-3" />
                                                                                                                </button>
                                                                                                            </div>
                                                                                                            <div className="space-y-4">
                                                                                                                {Object.entries(subEntry).map(([sf, sfv]) => (
                                                                                                                    <div key={sf} className="space-y-1">
                                                                                                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">{formatFieldLabel(sf)}</label>
                                                                                                                        {sf === 'icon' ? (
                                                                                                                            <IconPicker
                                                                                                                                value={String(sfv)}
                                                                                                                                onChange={(v) => {
                                                                                                                                    const newFv = [...fv];
                                                                                                                                    newFv[subIdx] = { ...newFv[subIdx], [sf]: v };
                                                                                                                                    handleArrayObjectFieldChange(key, entryIdx, f, newFv);
                                                                                                                                }}
                                                                                                                            />
                                                                                                                        ) : (
                                                                                                                            <input
                                                                                                                                type="text"
                                                                                                                                value={String(sfv)}
                                                                                                                                onChange={(e) => {
                                                                                                                                    const newFv = [...fv];
                                                                                                                                    newFv[subIdx] = { ...newFv[subIdx], [sf]: e.target.value };
                                                                                                                                    handleArrayObjectFieldChange(key, entryIdx, f, newFv);
                                                                                                                                }}
                                                                                                                                className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs font-bold text-primary focus:ring-4 focus:ring-accent/5"
                                                                                                                            />
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                ))}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                    <button
                                                                                                        onClick={() => {
                                                                                                            const template = fv.length > 0 ? { ...fv[0] } : { icon: 'CheckCircle2', text: '' };
                                                                                                            Object.keys(template).forEach(k => template[k] = (k === 'icon' ? 'CheckCircle2' : ''));
                                                                                                            const newFv = [...fv, template];
                                                                                                            handleArrayObjectFieldChange(key, entryIdx, f, newFv);
                                                                                                        }}
                                                                                                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                                                                                                    >
                                                                                                        <Plus className="h-3 w-3" /> Element Əlavə Et
                                                                                                    </button>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <textarea
                                                                                                    rows={String(fv).includes('\n') ? 4 : 1}
                                                                                                    value={String(fv)}
                                                                                                    onChange={(e) => handleArrayObjectFieldChange(key, entryIdx, f, e.target.value)}
                                                                                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold text-primary focus:ring-4 focus:ring-accent/5 outline-none resize-none custom-scrollbar"
                                                                                                />
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddArrayObjectElement(key)}
                                                                className="w-full flex items-center justify-center gap-4 py-8 rounded-[40px] border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary hover:text-primary hover:bg-white transition-all group"
                                                            >
                                                                <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform" />
                                                                <span className="text-xs font-black uppercase tracking-widest">Yeni Element Əlavə Et</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        if (type === 'object') {
                                            const entry = safeParseObject(val);
                                            return (
                                                <div key={key} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden border-t-4 border-t-amber-400">
                                                    <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                                                                <Settings className="h-4 w-4" />
                                                            </div>
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                                                                {fieldLabel}
                                                            </span>
                                                        </div>
                                                        <span className="bg-white px-3 py-1 rounded-full border border-slate-100 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                                            OBYEKT
                                                        </span>
                                                    </div>
                                                    <div className="p-8 space-y-6">
                                                        {Object.entries(entry).map(([f, fv]) => (
                                                            <div key={f} className="space-y-2">
                                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1">{formatFieldLabel(f)}</label>
                                                                {f === 'icon' ? (
                                                                    <IconPicker value={String(fv)} onChange={(v) => handleObjectFieldChange(key, f, v)} />
                                                                ) : (
                                                                    <textarea
                                                                        rows={String(fv).includes('\n') ? 3 : 1}
                                                                        value={String(fv)}
                                                                        onChange={(e) => handleObjectFieldChange(key, f, e.target.value)}
                                                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold text-primary focus:ring-4 focus:ring-accent/5 outline-none resize-none custom-scrollbar"
                                                                    />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const isMultiline = config.multiline || type === 'array' || (typeof val === 'string' && val.includes('\n'));

                                        return (
                                            <div key={key} className="bg-white rounded-[32px] border border-slate-100 p-8 space-y-4 hover:border-primary/20 transition-all hover:shadow-xl hover:shadow-slate-100 group">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">{fieldLabel}</label>
                                                    {type === 'image' && <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">ŞƏKİL</span>}
                                                    {type === 'array' && <span className="text-[9px] font-black text-accent uppercase tracking-widest bg-accent/5 px-3 py-1 rounded-full">SİYAHI (MƏTN)</span>}
                                                </div>

                                                {type === 'image' ? (
                                                    <div className="space-y-4">
                                                        {val && (
                                                            <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                                                                <img src={val} alt="Preview" className="w-full h-full object-cover" />
                                                                <button onClick={() => handleSectionInputChange(key, '')} className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur shadow-lg rounded-xl text-red-500 hover:text-red-700 transition-all">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex-1 relative">
                                                                <input type="text" value={val} onChange={(e) => handleSectionInputChange(key, e.target.value)} className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 text-sm font-medium text-primary focus:ring-4 focus:ring-primary/5 outline-none pr-12" placeholder="Şəkil URL-i daxil edin və ya yükləyin..." />
                                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"><Image className="h-5 w-5" /></div>
                                                            </div>
                                                            {supabaseReady && (
                                                                <label className="flex items-center gap-2 px-6 py-4 rounded-[20px] bg-primary text-white hover:bg-primary-hover transition-all cursor-pointer text-[10px] font-black uppercase tracking-widest">
                                                                    <Upload className="h-4 w-4" /> YÜKLƏ
                                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, key, (url) => handleSectionInputChange(key, url))} />
                                                                </label>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : isMultiline ? (
                                                    <textarea
                                                        rows={type === 'array' ? 4 : 6}
                                                        value={Array.isArray(val) ? val.join('\n') : val}
                                                        onChange={(e) => {
                                                            const newValue = type === 'array' ? e.target.value.split('\n') : e.target.value;
                                                            handleSectionInputChange(key, newValue);
                                                        }}
                                                        className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-medium text-slate-600 focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-slate-200 leading-relaxed custom-scrollbar"
                                                        placeholder={type === 'array' ? "Hər sətirə bir element yazın..." : "Səliqəli şəkildə daxil edin..."}
                                                    />
                                                ) : (
                                                    <input type="text" value={val} onChange={(e) => handleSectionInputChange(key, e.target.value)} className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 text-sm font-medium text-primary focus:ring-4 focus:ring-primary/5 outline-none" />
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    ))
                )}

                <div className="flex flex-wrap items-center justify-end gap-4 pt-10 border-t border-slate-50 px-2 pb-24">
                    <button onClick={() => setEditorValue(JSON.stringify(draft[selectedSection] ?? {}, null, 2))} className="flex items-center gap-3 bg-slate-100 text-slate-500 px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all active:scale-95">
                        <RotateCcw className="h-4 w-4" /> Sıfırla
                    </button>
                    <button onClick={applySectionJson} className="flex items-center gap-3 bg-accent text-white px-12 py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-primary transition-all shadow-xl shadow-accent/20 active:scale-95">
                        <Save className="h-4 w-4" /> Bölməni Tətbiq Et
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SectionEditorView;
