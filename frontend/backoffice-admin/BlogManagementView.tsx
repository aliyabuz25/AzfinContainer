
import React from 'react';
import { Settings, Upload, X, Check, RotateCcw, Bold, Italic, List, Quote, Link as LinkIcon, Image, Trash2 } from 'lucide-react';
import { BlogItem, TrainingItem } from '../types';

interface BlogManagementViewProps {
    blogMode: 'blog' | 'training';
    setBlogMode: (mode: 'blog' | 'training') => void;
    blogForm: Omit<BlogItem, 'id'> | any;
    trainingForm: Omit<TrainingItem, 'id'> | any;
    handleBlogChange: (field: string, value: any) => void;
    handleTrainingChange: (field: string, value: any) => void;
    handleBlogSave: () => void;
    handleTrainingSave: () => void;
    resetBlogForm: () => void;
    resetTrainingForm: () => void;
    blogPosts: BlogItem[];
    trainings: TrainingItem[];
    activeBlogId: string | null;
    activeTrainingId: string | null;
    handleBlogSelect: (blog: BlogItem) => void;
    handleTrainingSelect: (training: TrainingItem) => void;
    handleBlogDelete: (id: string) => void;
    handleTrainingDelete: (id: string) => void;
    supabaseReady: boolean;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, field: string, callback: (url: string) => void, ref?: any) => void;
    insertBBCode: (ref: React.RefObject<HTMLTextAreaElement>, open: string, close: string, callback: (val: string) => void) => void;
    contentRef: React.RefObject<HTMLTextAreaElement>;
    trainingContentRef: React.RefObject<HTMLTextAreaElement>;
    blogSaving: boolean;
    trainingSaving: boolean;
    imageLoading: boolean;
}

const STATUS_OPTIONS = ['draft', 'published', 'upcoming', 'archived'];
const TRAINING_STATUS_OPTIONS = ['upcoming', 'ongoing', 'completed'];

const STATUS_LABELS: Record<string, string> = {
    'draft': 'QARALAMA',
    'published': 'DƏRC EDİLİB',
    'upcoming': 'TEZLİKLƏ',
    'archived': 'ARXİVLƏNİB',
    'ongoing': 'DAVAM EDİR',
    'completed': 'BAŞA ÇATIB'
};

const BlogManagementView: React.FC<BlogManagementViewProps> = ({
    blogMode,
    setBlogMode,
    blogForm,
    trainingForm,
    handleBlogChange,
    handleTrainingChange,
    handleBlogSave,
    handleTrainingSave,
    resetBlogForm,
    resetTrainingForm,
    blogPosts,
    trainings,
    activeBlogId,
    activeTrainingId,
    handleBlogSelect,
    handleTrainingSelect,
    handleBlogDelete,
    handleTrainingDelete,
    supabaseReady,
    handleImageUpload,
    insertBBCode,
    contentRef,
    trainingContentRef,
    blogSaving,
    trainingSaving,
    imageLoading
}) => {
    const isBlogSection = blogMode === 'blog';

    return (
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
            {/* Blog Sidebar */}
            <aside className="space-y-6">
                <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 space-y-8 overflow-hidden">
                    <div className="flex items-center gap-3 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                        <Settings className="h-4 w-4" /> {isBlogSection ? 'BLOG AYARLARI' : 'TƏLİM AYARLARI'}
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">STATUS</label>
                        <select
                            value={isBlogSection ? blogForm.status : trainingForm.status}
                            onChange={(e) => isBlogSection ? handleBlogChange('status', e.target.value) : handleTrainingChange('status', e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-primary appearance-none focus:ring-2 focus:ring-accent/20 transition"
                        >
                            {(isBlogSection ? STATUS_OPTIONS : TRAINING_STATUS_OPTIONS).map(opt => (
                                <option key={opt} value={opt}>{STATUS_LABELS[opt] || opt.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">
                            {isBlogSection ? 'BLOG POSTERİ' : 'TƏLİM POSTERİ'}
                        </label>
                        <div className="group relative w-full aspect-square rounded-[32px] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 hover:border-accent transition-colors flex items-center justify-center">
                            {(isBlogSection ? blogForm.image : trainingForm.image) ? (
                                <>
                                    <img src={isBlogSection ? blogForm.image : trainingForm.image} className="w-full h-full object-cover" alt="Preview" />
                                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <label className="cursor-pointer bg-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                                            <Upload className="h-5 w-5 text-primary" />
                                            <input type="file" className="hidden" accept="image/*" disabled={!supabaseReady} onChange={(e) => handleImageUpload(e, 'image', (v) => isBlogSection ? handleBlogChange('image', v) : handleTrainingChange('image', v))} />
                                        </label>
                                        <button onClick={() => isBlogSection ? handleBlogChange('image', '') : handleTrainingChange('image', '')} className="bg-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform text-red-500">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400">
                                    <Upload className="h-10 w-10" />
                                    <span className="text-[10px] font-black tracking-widest">YÜKLƏ</span>
                                    <input type="file" className="hidden" accept="image/*" disabled={!supabaseReady} onChange={(e) => handleImageUpload(e, 'image', (v) => isBlogSection ? handleBlogChange('image', v) : handleTrainingChange('image', v))} />
                                </label>
                            )}
                        </div>
                    </div>

                    {!isBlogSection && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">BAŞLAMA</label>
                                <input type="text" value={trainingForm.startDate} onChange={e => handleTrainingChange('startDate', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-primary" placeholder="01.01" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">MÜDDƏT</label>
                                <input type="text" value={trainingForm.duration} onChange={e => handleTrainingChange('duration', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-primary" placeholder="2 ay" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{isBlogSection ? 'KATEGORİYA' : 'SƏVİYYƏ'}</label>
                        <input type="text" value={isBlogSection ? blogForm.category : trainingForm.level} onChange={e => isBlogSection ? handleBlogChange('category', e.target.value) : handleTrainingChange('level', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-primary" placeholder="..." />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <button onClick={isBlogSection ? handleBlogSave : handleTrainingSave} disabled={isBlogSection ? blogSaving : trainingSaving} className="flex-1 bg-accent text-white p-5 rounded-[24px] flex items-center justify-center gap-2 font-black text-[10px] tracking-widest hover:bg-primary transition shadow-xl shadow-accent/20">
                            <Check className="h-5 w-5" /> TƏSDİQLƏ
                        </button>
                        <button onClick={isBlogSection ? resetBlogForm : resetTrainingForm} className="flex-1 bg-slate-50 text-slate-400 p-5 rounded-[24px] flex items-center justify-center gap-2 font-black text-[10px] tracking-widest hover:bg-slate-100 transition border border-slate-100">
                            <RotateCcw className="h-5 w-5" /> SIFIRLA
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] border border-slate-100 p-6 space-y-4 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">MÖVCUD YAZILAR</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(isBlogSection ? blogPosts : trainings).map((item) => (
                            <div key={item.id} onClick={() => isBlogSection ? handleBlogSelect(item as BlogItem) : handleTrainingSelect(item as TrainingItem)} className={`group cursor-pointer p-4 rounded-3xl border transition-all ${(isBlogSection ? activeBlogId : activeTrainingId) === item.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-[11px] font-black uppercase tracking-tight">{item.title || item.category || 'Adsız'}</span>
                                    <button onClick={(e) => { e.stopPropagation(); isBlogSection ? handleBlogDelete(item.id) : handleTrainingDelete(item.id); }} className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity ${(isBlogSection ? activeBlogId : activeTrainingId) === item.id ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-red-500'}`}><X className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Blog Content Editor */}
            <div className="bg-white rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-12 space-y-12 min-h-screen">
                <div className="space-y-8">
                    <input type="text" value={isBlogSection ? blogForm.title : trainingForm.title} onChange={(e) => isBlogSection ? handleBlogChange('title', e.target.value) : handleTrainingChange('title', e.target.value)} placeholder={isBlogSection ? "Blog Başlığı..." : "Təlim Başlığı..."} className="w-full text-5xl font-black text-primary placeholder:text-slate-100 border-none p-0 focus:ring-0 tracking-tighter" />
                    <textarea rows={3} value={isBlogSection ? blogForm.excerpt : trainingForm.description} onChange={(e) => isBlogSection ? handleBlogChange('excerpt', e.target.value) : handleTrainingChange('description', e.target.value)} className="w-full bg-slate-50 border-none rounded-[32px] p-8 text-lg font-medium text-slate-600 focus:ring-2 focus:ring-accent/10 transition leading-relaxed" placeholder="Qısa məzmun yazın..." />
                </div>

                <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 block">TAM MƏZMUN</label>
                    <div className="border border-slate-100 rounded-[40px] overflow-hidden shadow-sm group focus-within:border-accent/30 transition-all">
                        <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex flex-wrap gap-2 items-center">
                            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100/50">
                                <button onClick={() => insertBBCode(isBlogSection ? contentRef : trainingContentRef, '[b]', '[/b]', v => isBlogSection ? handleBlogChange('content', v) : handleTrainingChange('fullContent', v))} className="p-2.5 hover:bg-slate-50 rounded-lg transition text-primary"><Bold className="h-4 w-4" /></button>
                                <button onClick={() => insertBBCode(isBlogSection ? contentRef : trainingContentRef, '[i]', '[/i]', v => isBlogSection ? handleBlogChange('content', v) : handleTrainingChange('fullContent', v))} className="p-2.5 hover:bg-slate-50 rounded-lg transition text-primary"><Italic className="h-4 w-4" /></button>
                            </div>
                            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100/50">
                                <button onClick={() => insertBBCode(isBlogSection ? contentRef : trainingContentRef, '[h1]', '[/h1]', v => isBlogSection ? handleBlogChange('content', v) : handleTrainingChange('fullContent', v))} className="p-2.5 hover:bg-slate-50 rounded-lg transition text-primary font-black px-2">H1</button>
                                <button onClick={() => insertBBCode(isBlogSection ? contentRef : trainingContentRef, '[h2]', '[/h2]', v => isBlogSection ? handleBlogChange('content', v) : handleTrainingChange('fullContent', v))} className="p-2.5 hover:bg-slate-50 rounded-lg transition text-primary font-black px-2">H2</button>
                            </div>
                            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100/50">
                                <button onClick={() => insertBBCode(isBlogSection ? contentRef : trainingContentRef, '[list]', '[/list]', v => isBlogSection ? handleBlogChange('content', v) : handleTrainingChange('fullContent', v))} className="p-2.5 hover:bg-slate-50 rounded-lg transition text-primary"><List className="h-4 w-4" /></button>
                                <button onClick={() => insertBBCode(isBlogSection ? contentRef : trainingContentRef, '[quote]', '[/quote]', v => isBlogSection ? handleBlogChange('content', v) : handleTrainingChange('fullContent', v))} className="p-2.5 hover:bg-slate-50 rounded-lg transition text-primary"><Quote className="h-4 w-4" /></button>
                            </div>
                            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100/50">
                                <button onClick={() => insertBBCode(isBlogSection ? contentRef : trainingContentRef, '[url=]', '[/url]', v => isBlogSection ? handleBlogChange('content', v) : handleTrainingChange('fullContent', v))} className="p-2.5 hover:bg-slate-50 rounded-lg transition text-primary"><LinkIcon className="h-4 w-4" /></button>
                                <label className="cursor-pointer p-2.5 hover:bg-slate-50 rounded-lg transition text-primary flex items-center justify-center">
                                    {imageLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" /> : <Image className="h-4 w-4" />}
                                    <input type="file" className="hidden" accept="image/*" disabled={!supabaseReady} onChange={(e) => handleImageUpload(e, 'content', (v) => isBlogSection ? handleBlogChange('content', v) : handleTrainingChange('fullContent', v), isBlogSection ? contentRef : trainingContentRef)} />
                                </label>
                            </div>
                        </div>
                        <textarea ref={isBlogSection ? contentRef : trainingContentRef} rows={30} value={isBlogSection ? blogForm.content : trainingForm.fullContent} onChange={(e) => isBlogSection ? handleBlogChange('content', e.target.value) : handleTrainingChange('fullContent', e.target.value)} className="w-full p-10 text-lg font-medium text-slate-700 bg-white border-none focus:ring-0 leading-relaxed resize-none custom-scrollbar" placeholder="Buraya yazmağa başlayın..." />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogManagementView;
