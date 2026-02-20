
import React from 'react';
import { Layers, Code, ChevronDown, Trash2, Plus, Minus, Image, Upload, Save, RotateCcw, X, Bold, Settings } from 'lucide-react';
import { getSectionLabel, formatFieldLabel, FIELD_CONFIG } from './AdminConstants';
import { normalizeAdminPathToFullLink } from '../utils/navigationLink';

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

const inferAutoFieldType = (field: string, value: any) => {
    if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
            return 'array-object';
        }
        return 'array';
    }
    if (typeof value === 'object' && value !== null) {
        return 'object';
    }
    if (typeof value === 'string' && /(image|img|logo|banner|background|photo)/i.test(field)) {
        return 'image';
    }
    return undefined;
};

const normalizeImageUrl = (raw: any) => {
    if (typeof raw !== 'string') return '';
    const decoded = raw.trim().replace(/&amp;/g, '&');
    if (!decoded) return '';
    if (/^(https?:)?\/\//i.test(decoded) || decoded.startsWith('data:') || decoded.startsWith('blob:')) {
        return decoded.startsWith('//') ? `https:${decoded}` : decoded;
    }
    if (decoded.startsWith('/')) return decoded;
    if (decoded.startsWith('./')) return `/${decoded.slice(2)}`;
    return `/${decoded.replace(/^\/+/, '')}`;
};

const isAccentHighlightField = (field: string, label?: string) => {
    const f = (field || '').toLowerCase();
    const l = (label || '').toLowerCase();
    return (
        f.includes('highlight') ||
        f.includes('accent') ||
        f.includes('color') ||
        f.includes('rəng') ||
        l.includes('vurğulanan') ||
        l.includes('vurğu') ||
        l.includes('rəng')
    );
};

const isPathLikeField = (field: string) => /^(path|href|url)$/i.test((field || '').trim());

const adjustStatValue = (rawValue: any, delta: number) => {
    const value = String(rawValue ?? '').trim();
    const match = value.match(/^([^\d-]*)(-?\d+(?:[.,]\d+)?)(.*)$/);
    if (!match) {
        if (delta > 0) return '1';
        return '0';
    }

    const [, prefix, numberPart, suffix] = match;
    const precision = (numberPart.split(/[.,]/)[1] || '').length;
    const parsed = Number(numberPart.replace(',', '.'));
    const safeNumber = Number.isFinite(parsed) ? parsed : 0;
    const nextNumber = Math.max(0, safeNumber + delta);
    const formatted = precision > 0 ? nextNumber.toFixed(precision) : String(Math.round(nextNumber));
    return `${prefix}${formatted}${suffix}`;
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

    let configs = FIELD_CONFIG
        .filter((c) => c.section === selectedSection)
        .map((c) => {
            const label = c.label || formatFieldLabel(c.field);
            if (isAccentHighlightField(c.field, label)) {
                return { ...c, category: 'Vurğu Rəngi' };
            }
            return c;
        });
    const configuredFields = new Set(configs.map((c) => c.field));
    const autoConfigs = Object.keys(sectionFormValues)
        .filter((field) => !configuredFields.has(field))
        .map((field) => {
            const autoType = inferAutoFieldType(field, sectionFormValues[field]);
            const label = formatFieldLabel(field);
            const isAccent = isAccentHighlightField(field, label);
            return {
                section: selectedSection,
                category: isAccent ? 'Vurğu Rəngi (Avtomatik)' : 'Digər (Avtomatik)',
                field,
                label,
                ...(autoType ? { type: autoType } : {}),
            };
        });

    configs = [...configs, ...autoConfigs];

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
                                    .filter((c) => (c.category || 'Ümumi') === category && !c.hideInMainLoop)
                                    .map((config) => {
                                        const key = config.field;
                                        // Hide image fields if they don't exist in the data (user request)
                                        if (config.type === 'image' && sectionFormValues[key] === undefined) {
                                            return null;
                                        }
                                        const val = sectionFormValues[key] ?? '';
                                        const type = config.type || sectionValueTypes[key] || 'string';
                                        const fieldLabel = config.label || formatFieldLabel(key);
                                        const isAccentField = (config.category || '').toLowerCase().includes('vurğu rəngi');
                                        const urlFieldConfig = configs.find(c => c.field === `${key}Url`);
                                        const urlVal = urlFieldConfig ? (sectionFormValues[urlFieldConfig.field] ?? '') : null;

                                        if (type === 'array-object') {
                                            const entries = safeParseArray(val) ?? [];
                                            const isExpanded = expandedItems[key] ?? false;
                                            const isStatsEditor = selectedSection === 'home' && key === 'stats';

                                            if (isStatsEditor) {
                                                const statsEntries = entries.map((entry: any) => (entry && typeof entry === 'object' ? entry : {}));
                                                const updateStatEntry = (idx: number, patch: Record<string, any>) => {
                                                    const updated = statsEntries.map((entry: any, entryIdx: number) => (
                                                        entryIdx === idx ? { ...entry, ...patch } : entry
                                                    ));
                                                    handleSectionInputChange(key, updated);
                                                };

                                                const removeStatEntry = (idx: number) => {
                                                    const updated = statsEntries.filter((_: any, entryIdx: number) => entryIdx !== idx);
                                                    handleSectionInputChange(key, updated);
                                                };

                                                const addStatEntry = () => {
                                                    const updated = [...statsEntries, { label: 'Yeni Statistika', value: '0', icon: 'bar-chart-3' }];
                                                    handleSectionInputChange(key, updated);
                                                };

                                                return (
                                                    <div key={key} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                                                        <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                                            <div>
                                                                <div className="text-xs font-black uppercase tracking-[0.1em] text-primary">{fieldLabel}</div>
                                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">İSTİFADƏÇİ DOSTU REDAKTƏ | {statsEntries.length} ELEMENT</div>
                                                            </div>
                                                            <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">STATİSTİKA</span>
                                                        </div>
                                                        <div className="p-8 space-y-6 bg-slate-50/20">
                                                            {statsEntries.map((entry: any, entryIdx: number) => (
                                                                <div key={`${key}-stat-${entryIdx}`} className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-5">
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">STAT #{entryIdx + 1}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeStatEntry(entryIdx)}
                                                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1">Etiket (Label)</label>
                                                                            <input
                                                                                type="text"
                                                                                value={String(entry.label ?? '')}
                                                                                onChange={(e) => updateStatEntry(entryIdx, { label: e.target.value })}
                                                                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold text-primary focus:ring-4 focus:ring-accent/5 outline-none"
                                                                                placeholder="Uğurlu Audit"
                                                                            />
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1">Icon</label>
                                                                            <IconPicker
                                                                                value={String(entry.icon ?? '')}
                                                                                onChange={(value) => updateStatEntry(entryIdx, { icon: value })}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1">Dəyər (Value)</label>
                                                                        <div className="flex items-center gap-3">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => updateStatEntry(entryIdx, { value: adjustStatValue(entry.value, -1) })}
                                                                                className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center"
                                                                                title="Azalt"
                                                                            >
                                                                                <Minus className="h-4 w-4" />
                                                                            </button>
                                                                            <input
                                                                                type="text"
                                                                                value={String(entry.value ?? '')}
                                                                                onChange={(e) => updateStatEntry(entryIdx, { value: e.target.value })}
                                                                                className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold text-primary focus:ring-4 focus:ring-accent/5 outline-none"
                                                                                placeholder="850+"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => updateStatEntry(entryIdx, { value: adjustStatValue(entry.value, 1) })}
                                                                                className="w-11 h-11 rounded-2xl bg-primary text-white hover:bg-accent transition-all flex items-center justify-center"
                                                                                title="Artır"
                                                                            >
                                                                                <Plus className="h-4 w-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            <button
                                                                type="button"
                                                                onClick={addStatEntry}
                                                                className="w-full flex items-center justify-center gap-4 py-6 rounded-[28px] border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary hover:text-primary hover:bg-white transition-all group"
                                                            >
                                                                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                                                                <span className="text-xs font-black uppercase tracking-widest">Yeni Statistika Əlavə Et</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }

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
                                                                                    const isBB = f === 'content' || f === 'description' || f === 'scopeTitle' || f === 'summaryTitle' || f === 'benefitsTitle' || f === 'consultationTitle' || f === 'standardValue' || f === 'durationValue' || f === 'title';
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
                                                                                                    {normalizeImageUrl(fv) && (
                                                                                                        <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                                                                                            <img src={normalizeImageUrl(fv)} alt="Preview" className="w-full h-full object-cover" />
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
                                                                                                isPathLikeField(f) ? (
                                                                                                    <input
                                                                                                        type="text"
                                                                                                        value={String(fv)}
                                                                                                        onChange={(e) => handleArrayObjectFieldChange(key, entryIdx, f, e.target.value)}
                                                                                                        onBlur={(e) => handleArrayObjectFieldChange(key, entryIdx, f, normalizeAdminPathToFullLink(e.target.value))}
                                                                                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold text-primary focus:ring-4 focus:ring-accent/5 outline-none"
                                                                                                        placeholder="https://azfin.az/#/services/1"
                                                                                                    />
                                                                                                ) : (
                                                                                                    <textarea
                                                                                                        rows={String(fv).includes('\n') ? 4 : 1}
                                                                                                        value={String(fv)}
                                                                                                        onChange={(e) => handleArrayObjectFieldChange(key, entryIdx, f, e.target.value)}
                                                                                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold text-primary focus:ring-4 focus:ring-accent/5 outline-none resize-none custom-scrollbar"
                                                                                                    />
                                                                                                )
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
                                                                ) : isPathLikeField(f) ? (
                                                                    <input
                                                                        type="text"
                                                                        value={String(fv)}
                                                                        onChange={(e) => handleObjectFieldChange(key, f, e.target.value)}
                                                                        onBlur={(e) => handleObjectFieldChange(key, f, normalizeAdminPathToFullLink(e.target.value))}
                                                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold text-primary focus:ring-4 focus:ring-accent/5 outline-none"
                                                                        placeholder="https://azfin.az/#/services/1"
                                                                    />
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
                                            <div
                                                key={key}
                                                className={`rounded-[32px] p-8 space-y-4 transition-all group ${isAccentField
                                                    ? 'bg-accent/[0.03] border border-accent/20 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10'
                                                    : 'bg-white border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-slate-100'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <label className={`text-[11px] font-black uppercase tracking-[0.2em] ${isAccentField ? 'text-accent' : 'text-primary'}`}>{fieldLabel}</label>
                                                    {isAccentField && <span className="text-[9px] font-black text-accent uppercase tracking-widest bg-accent/10 px-3 py-1 rounded-full">VURĞU</span>}
                                                    {type === 'image' && <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">ŞƏKİL</span>}
                                                    {type === 'array' && <span className="text-[9px] font-black text-accent uppercase tracking-widest bg-accent/5 px-3 py-1 rounded-full">SİYAHI (MƏTN)</span>}
                                                </div>

                                                {type === 'image' ? (
                                                    <div className="space-y-4">
                                                        {normalizeImageUrl(val) ? (
                                                            <div className="space-y-4 animate-in zoom-in-95 duration-300">
                                                                <div className="relative group/img overflow-hidden rounded-[32px] border border-slate-100 bg-slate-50 aspect-video flex items-center justify-center shadow-inner">
                                                                    <img src={normalizeImageUrl(val)} alt="Preview" className="max-w-[70%] max-h-[70%] object-contain transition-transform group-hover/img:scale-110 duration-700" />
                                                                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-[4px]">
                                                                        {supabaseReady && (
                                                                            <label className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary hover:bg-slate-50 transition-all cursor-pointer text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95">
                                                                                <RotateCcw className="h-4 w-4" /> DƏYİŞDİR
                                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, key, (url) => handleSectionInputChange(key, url))} />
                                                                            </label>
                                                                        )}
                                                                        <button onClick={() => handleSectionInputChange(key, '')} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95">
                                                                            <Trash2 className="h-4 w-4" /> SİL
                                                                        </button>
                                                                    </div>
                                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-white/50 shadow-sm opacity-100 group-hover/img:opacity-0 transition-opacity">
                                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">YÜKLƏNİB</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-300">
                                                                <div className="flex-1 relative">
                                                                    <input type="text" value={val} onChange={(e) => handleSectionInputChange(key, e.target.value)} className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 text-sm font-medium text-primary focus:ring-4 focus:ring-primary/5 outline-none pr-12 transition-all shadow-inner" placeholder="Şəkil URL-i daxil edin və ya yükləyin..." />
                                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-transform group-focus-within/img:scale-110"><Image className="h-5 w-5" /></div>
                                                                </div>
                                                                {supabaseReady && (
                                                                    <label className="flex items-center gap-2 px-8 py-4 rounded-[20px] bg-primary text-white hover:bg-accent transition-all cursor-pointer text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
                                                                        <Upload className="h-4 w-4" /> YÜKLƏ
                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, key, (url) => handleSectionInputChange(key, url))} />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : isMultiline ? (
                                                    <textarea
                                                        rows={type === 'array' ? 4 : 6}
                                                        value={Array.isArray(val) ? val.join('\n') : val}
                                                        onChange={(e) => {
                                                            const newValue = type === 'array' ? e.target.value.split('\n') : e.target.value;
                                                            handleSectionInputChange(key, newValue);
                                                        }}
                                                        className={`w-full border-none rounded-3xl p-6 text-sm font-medium text-slate-600 focus:ring-4 outline-none placeholder:text-slate-200 leading-relaxed custom-scrollbar ${isAccentField ? 'bg-accent/[0.04] focus:ring-accent/20' : 'bg-slate-50 focus:ring-primary/5'}`}
                                                        placeholder={type === 'array' ? "Hər sətirə bir element yazın..." : "Səliqəli şəkildə daxil edin..."}
                                                    />
                                                ) : (
                                                    <div className={urlFieldConfig ? "grid grid-cols-1 md:grid-cols-2 gap-6" : ""}>
                                                        <div className="space-y-2">
                                                            {urlFieldConfig && <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">MƏTN</label>}
                                                            <input type="text" value={val} onChange={(e) => handleSectionInputChange(key, e.target.value)} className={`w-full border-none rounded-[20px] px-6 py-4 text-sm font-medium text-primary focus:ring-4 outline-none ${isAccentField ? 'bg-accent/[0.04] focus:ring-accent/20' : 'bg-slate-50 focus:ring-primary/5'}`} />
                                                        </div>
                                                        {urlFieldConfig && (
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">LİNK (URL)</label>
                                                                <input type="text" value={String(urlVal)} onChange={(e) => handleSectionInputChange(urlFieldConfig.field, e.target.value)} className={`w-full border rounded-[20px] px-6 py-4 text-sm font-medium text-primary focus:ring-4 outline-none ${isAccentField ? 'bg-accent/[0.03] border-accent/20 focus:ring-accent/20' : 'bg-slate-50/50 border-slate-100 focus:ring-primary/5'}`} placeholder="URL və ya #modal..." />
                                                            </div>
                                                        )}
                                                    </div>
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
