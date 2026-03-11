
import React, { useState, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import BlotFormatter from '@enzedonline/quill-blot-formatter2';
import { Settings, Upload, X, Check, RotateCcw, Bold, Italic, List, Quote, Link as LinkIcon, Image, Trash2, Plus, Edit, BookOpen, GraduationCap, LayoutPanelTop } from 'lucide-react';
import { BlogItem, TrainingItem, TrainingSyllabusItem } from '../types';
import { apiClient } from '../lib/apiClient';

// Register custom sizes and fonts
const Size = Quill.import('attributors/style/size') as any;
Size.whitelist = ['8pt', '10pt', '12pt', '14pt', '18pt', '24pt', '36pt'];
Quill.register(Size, true);

const Font = Quill.import('attributors/style/font') as any;
Font.whitelist = ['inter', 'roboto', 'serif', 'monospace', 'arial', 'georgia'];
Quill.register(Font, true);

Quill.register('modules/blotFormatter', BlotFormatter);

const Align = Quill.import('attributors/style/align') as any;
if (Align) Quill.register(Align, true);

const ImageBlot = Quill.import('formats/image') as any;
class StyledImage extends ImageBlot {
    static formats(domNode: any) {
        const formats = super.formats(domNode);
        if (domNode.style.display) formats.display = domNode.style.display;
        if (domNode.style.margin) formats.margin = domNode.style.margin;
        if (domNode.style.float) formats.float = domNode.style.float;
        return formats;
    }
    format(name: any, value: any) {
        if (['display', 'margin', 'float'].includes(name)) {
            if (value) {
                this.domNode.style[name] = value;
            } else {
                this.domNode.style.removeProperty(name);
            }
        } else {
            super.format(name, value);
        }
    }
}
Quill.register(StyledImage, true);

interface BlogSectionDraft {
    id: string;
    title: string;
    body: string;
}

interface BlogManagementViewProps {
    blogMode: 'blog' | 'training';
    setBlogMode: (mode: 'blog' | 'training') => void;
    blogForm: Omit<BlogItem, 'id'> | any;
    trainingForm: Omit<TrainingItem, 'id'> | any;
    handleBlogChange: (field: string, value: any) => void;
    handleTrainingChange: (field: string, value: any) => void;
    handleBlogSave: () => Promise<boolean>;
    handleTrainingSave: () => Promise<boolean>;
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
    blogSaving: boolean;
    trainingSaving: boolean;
    imageLoading: boolean;
}

const STATUS_OPTIONS = ['draft', 'published', 'upcoming', 'archived'];

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
    blogSaving,
    trainingSaving,
    imageLoading
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [blogSectionDrafts, setBlogSectionDrafts] = useState<BlogSectionDraft[]>([]);
    const [syllabusUploadTarget, setSyllabusUploadTarget] = useState<string | null>(null);
    const isBlogSection = blogMode === 'blog';
    const quillRef = React.useRef<any>(null);
    const blogImageInputRef = React.useRef<HTMLInputElement | null>(null);

    const syllabusItems = Array.isArray(trainingForm.syllabus) ? trainingForm.syllabus as TrainingSyllabusItem[] : [];
    const targetAudienceItems = Array.isArray(trainingForm.targetAudience) ? trainingForm.targetAudience as string[] : [];

    const imageHandler = React.useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            const quill = quillRef.current?.getEditor();
            if (!quill) return;

            // Optional: Insert loading placeholder?
            const range = quill.getSelection(true);

            try {
                const data = await apiClient.upload(file);
                const url = data.url;

                quill.insertEmbed(range.index, 'image', url);
                quill.setSelection(range.index + 1);
            } catch (err) {
                console.error('Editor image upload failed:', err);
            }
        };
    }, []);

    const createBlogSectionDraft = React.useCallback((): BlogSectionDraft => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: '',
        body: ''
    }), []);

    const addBlogSectionDraft = React.useCallback(() => {
        if (!isBlogSection) return;
        setBlogSectionDrafts((prev) => [...prev, createBlogSectionDraft()]);
    }, [createBlogSectionDraft, isBlogSection]);

    const updateBlogSectionDraft = React.useCallback((id: string, field: 'title' | 'body', value: string) => {
        setBlogSectionDrafts((prev) => prev.map((draft) => (
            draft.id === id ? { ...draft, [field]: value } : draft
        )));
    }, []);

    const removeBlogSectionDraft = React.useCallback((id: string) => {
        setBlogSectionDrafts((prev) => prev.filter((draft) => draft.id !== id));
    }, []);

    const insertBlogSectionBlock = React.useCallback((draftId: string) => {
        if (!isBlogSection) return;

        const draft = blogSectionDrafts.find((item) => item.id === draftId);
        if (!draft) return;

        const quill = quillRef.current?.getEditor();
        if (!quill) return;

        const currentRange = quill.getSelection(true);
        const index = currentRange ? currentRange.index : quill.getLength();
        const sectionTitle = draft.title.trim() || 'Yeni Bölmə Başlığı';
        const sectionBody = draft.body.trim() || 'Bölmə mətnini buraya yazın...';
        const prefix = index > 0 ? '\n' : '';
        const insertAt = index + prefix.length;
        const template = `${sectionTitle}\n${sectionBody}\n\n`;

        quill.focus();
        if (prefix) {
            quill.insertText(index, prefix, 'user');
        }
        quill.insertText(insertAt, template, 'user');
        quill.formatLine(insertAt, 1, 'header', 2, 'user');
        quill.setSelection(insertAt + sectionTitle.length + 1, sectionBody.length, 'user');
        setBlogSectionDrafts((prev) => prev.filter((item) => item.id !== draftId));
    }, [blogSectionDrafts, isBlogSection]);

    const triggerBlogImageBlockInsert = React.useCallback(() => {
        if (!isBlogSection || !supabaseReady || imageLoading) return;
        blogImageInputRef.current?.click();
    }, [imageLoading, isBlogSection, supabaseReady]);

    const handleBlogImageBlockInsert = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const quill = quillRef.current?.getEditor();
        if (!quill) {
            e.target.value = '';
            return;
        }

        const currentRange = quill.getSelection(true);
        const index = currentRange ? currentRange.index : quill.getLength();

        try {
            const data = await apiClient.upload(file);
            const url = data.url;
            const prefix = index > 0 ? '\n' : '';
            const insertAt = index + prefix.length;

            if (prefix) {
                quill.insertText(index, prefix, 'user');
            }

            quill.insertEmbed(insertAt, 'image', url, 'user');
            quill.insertText(insertAt + 1, '\n\n', 'user');
            quill.setSelection(insertAt + 3, 0, 'user');
            quill.focus();
        } catch (err) {
            console.error('Editor block image upload failed:', err);
        } finally {
            e.target.value = '';
        }
    }, []);

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'font': ['inter', 'roboto', 'serif', 'monospace', 'arial', 'georgia'] }, { 'size': ['8pt', '10pt', '12pt', '14pt', '18pt', '24pt', '36pt'] }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'script': 'sub' }, { 'script': 'super' }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'align': [] }],
                ['blockquote', 'code-block'],
                ['link', 'image', 'video'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        },
        blotFormatter: {
            // Options can be added here
        },
        clipboard: {
            matchVisual: false,
        }
    }), [imageHandler]);

    const formats = [
        'font', 'size',
        'header',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'script',
        'list', 'bullet', 'indent',
        'align',
        'blockquote', 'code-block',
        'link', 'image', 'video'
    ];

    const openEditor = (item?: BlogItem | TrainingItem) => {
        if (item) {
            isBlogSection ? handleBlogSelect(item as BlogItem) : handleTrainingSelect(item as TrainingItem);
        } else {
            isBlogSection ? resetBlogForm() : resetTrainingForm();
        }
        setBlogSectionDrafts([]);
        setIsModalOpen(true);
    };

    const closeEditor = () => {
        setIsModalOpen(false);
        setBlogSectionDrafts([]);
        // Explicitly clear selection on close to avoid data persistence
        isBlogSection ? resetBlogForm() : resetTrainingForm();
    };

    const handleSaveAndClose = async () => {
        const saved = await (isBlogSection ? handleBlogSave() : handleTrainingSave());
        if (saved) {
            setIsModalOpen(false);
        }
    };

    const updateTrainingTextList = (field: 'targetAudience', index: number, value: string) => {
        const current = Array.isArray(trainingForm[field]) ? [...trainingForm[field]] : [];
        current[index] = value;
        handleTrainingChange(field, current);
    };

    const addTrainingTextListItem = (field: 'targetAudience') => {
        const current = Array.isArray(trainingForm[field]) ? [...trainingForm[field]] : [];
        handleTrainingChange(field, [...current, '']);
    };

    const removeTrainingTextListItem = (field: 'targetAudience', index: number) => {
        const current = Array.isArray(trainingForm[field]) ? [...trainingForm[field]] : [];
        current.splice(index, 1);
        handleTrainingChange(field, current);
    };

    const addTrainingSyllabusItem = () => {
        handleTrainingChange('syllabus', [...syllabusItems, { type: 'text', text: '' }]);
    };

    const updateTrainingSyllabusItem = (index: number, nextValue: Partial<TrainingSyllabusItem>) => {
        const current = [...syllabusItems];
        const existing = current[index] || { type: 'text', text: '' };
        const nextItem = { ...existing, ...nextValue };
        if (nextItem.type === 'text') {
            delete nextItem.label;
            delete nextItem.url;
        } else {
            delete nextItem.text;
        }
        current[index] = nextItem;
        handleTrainingChange('syllabus', current);
    };

    const removeTrainingSyllabusItem = (index: number) => {
        const current = [...syllabusItems];
        current.splice(index, 1);
        handleTrainingChange('syllabus', current);
    };

    const getUploadedFileName = (url?: string) => {
        if (!url) return '';
        const raw = url.split('/').pop() || url;
        try {
            return decodeURIComponent(raw);
        } catch (_) {
            return raw;
        }
    };

    const handleTrainingSyllabusFileUpload = async (index: number, file?: File | null) => {
        if (!file) return;

        setSyllabusUploadTarget(`syllabus-${index}`);
        try {
            const data = await apiClient.upload(file);
            const url = data.url;
            updateTrainingSyllabusItem(index, {
                type: 'file',
                url,
                label: syllabusItems[index]?.label || file.name
            });
        } catch (err) {
            console.error('Training syllabus file upload failed:', err);
        } finally {
            setSyllabusUploadTarget(null);
        }
    };

    return (
        <>
            <style>{`
                .quill {
                    display: flex;
                    flex-direction: column;
                    border: none !important;
                }
                .ql-toolbar.ql-snow {
                    border: none !important;
                    background: #f8fafc;
                    padding: 1rem !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                    border-radius: 32px 32px 0 0 !important;
                }
                .ql-container.ql-snow {
                    border: none !important;
                    flex: 1;
                    font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
                }
                .ql-editor {
                    min-height: 500px;
                    padding: 2.5rem !important;
                    font-size: 1.1875rem !important;
                    line-height: 1.8 !important;
                    color: #334155 !important;
                }
                .ql-editor.ql-blank::before {
                    color: #cbd5e1 !important;
                    font-style: normal !important;
                    padding: 0 2.5rem !important;
                }
                
                /* Picker Labels for Sizes and Fonts */
                .ql-snow .ql-picker.ql-size .ql-picker-label::before,
                .ql-snow .ql-picker.ql-size .ql-picker-item::before {
                    content: attr(data-value) !important;
                }
                .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="12pt"]::before,
                .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="12pt"]::before {
                    content: "12pt" !important;
                }

                .ql-snow .ql-picker.ql-font .ql-picker-label::before,
                .ql-snow .ql-picker.ql-font .ql-picker-item::before {
                    content: attr(data-value) !important;
                    text-transform: capitalize;
                }
                
                .ql-font-inter { font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif; }
                .ql-font-roboto { font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif; }
                .ql-font-arial { font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif; }
                .ql-font-georgia { font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif; }
                
                /* Blot Formatter UI */
                .blot-formatter__toolbar {
                    background: white !important;
                    border: 1px solid #f1f5f9 !important;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
                    border-radius: 12px !important;
                    padding: 4px !important;
                    gap: 4px !important;
                }
                .blot-formatter__toolbar-button {
                    border: none !important;
                    border-radius: 8px !important;
                    width: 32px !important;
                    height: 32px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.2s !important;
                }
                .blot-formatter__toolbar-button:hover {
                    background: #f8fafc !important;
                }
                .blot-formatter__toolbar-button--selected {
                    background: #f1f5f9 !important;
                    filter: none !important;
                    color: #3b82f6 !important;
                }
                .blot-formatter__toolbar-button svg {
                    width: 18px !important;
                    height: 18px !important;
                }
                .blot-formatter__resizer {
                    border: 2px solid #3b82f6 !important;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
                }

                /* Image Alignment within Editor */
                .ql-editor img {
                    max-width: 100%;
                    height: auto;
                    display: inline-block;
                    vertical-align: middle;
                }
                .ql-editor img[style*="display: block"] {
                    display: block !important;
                }
                .ql-editor img[style*="margin: auto"],
                .ql-editor img[style*="margin: 0px auto"] {
                    margin-left: auto !important;
                    margin-right: auto !important;
                    display: block !important;
                }
                .ql-editor img[style*="float: left"] {
                    float: left !important;
                    margin-right: 1.5rem !important;
                    margin-bottom: 1rem !important;
                }
                .ql-editor img[style*="float: right"] {
                    float: right !important;
                    margin-left: 1.5rem !important;
                    margin-bottom: 1rem !important;
                }
            `}</style>
            {/* List View */}
            <div className="space-y-10 animate-in fade-in duration-500">
                <header className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm flex items-end justify-between gap-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {isBlogSection ? <BookOpen className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
                            {isBlogSection ? 'BLOG YAZILARI' : 'TƏLİMLƏR'}
                        </div>
                        <h2 className="text-4xl font-black text-primary tracking-tighter uppercase italic leading-none">
                            {isBlogSection ? 'Blog Məqalələri' : 'Təlim Şablonları'}
                        </h2>
                    </div>
                    <button
                        onClick={() => openEditor()}
                        className="bg-accent text-white px-8 py-4 rounded-[24px] flex items-center gap-3 font-black text-xs tracking-widest hover:bg-primary transition shadow-xl shadow-accent/20 active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        YENİ {isBlogSection ? 'BLOG' : 'TƏLİM'}
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(isBlogSection ? blogPosts : trainings).map((item) => (
                        <div
                            key={item.id}
                            onClick={() => openEditor(item)}
                            className="bg-white rounded-[32px] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all group cursor-pointer relative"
                        >
                            {(item as any).image && (
                                <div className="aspect-video bg-slate-50 overflow-hidden relative">
                                    <img src={(item as any).image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                                </div>
                            )}
                            <div className="p-8 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <h3 className="text-xl font-black text-primary tracking-tight line-clamp-2 leading-tight group-hover:text-accent transition-colors">{item.title || 'Adsız'}</h3>
                                    {isBlogSection ? (
                                        <span className={`shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${(item as any).status === 'published' || (item as any).status === 'completed'
                                            ? 'bg-green-50 text-green-600'
                                            : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            {STATUS_LABELS[(item as any).status] || (item as any).status}
                                        </span>
                                    ) : (
                                        <span className="shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-600">
                                            ŞABLON
                                        </span>
                                    )}
                                </div>
                                {(item as any).excerpt && (
                                    <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{(item as any).excerpt}</p>
                                )}
                                {(item as any).description && (
                                    <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{(item as any).description}</p>
                                )}
                                <div className="flex gap-3 pt-4 border-t border-slate-50">
                                    <div
                                        className="flex-1 bg-slate-50 text-primary py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] tracking-widest group-hover:bg-primary group-hover:text-white transition-all"
                                    >
                                        <Edit className="h-4 w-4" />
                                        REDAKTƏ ET
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            isBlogSection ? handleBlogDelete(item.id) : handleTrainingDelete(item.id);
                                        }}
                                        className="bg-slate-50 text-slate-400 p-4 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fullscreen Modal Editor */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-50 rounded-[48px] w-full max-w-[1600px] h-[95vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="h-full flex flex-col">
                            {/* Modal Header */}
                            <div className="bg-white border-b border-slate-200 px-10 py-6 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-primary tracking-tight uppercase">
                                    {isBlogSection ? 'Blog Redaktoru' : 'Təlim Redaktoru'}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleSaveAndClose}
                                        disabled={isBlogSection ? blogSaving : trainingSaving}
                                        className="bg-accent text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-xs tracking-widest hover:bg-primary transition shadow-lg shadow-accent/20"
                                    >
                                        <Check className="h-5 w-5" />
                                        YADDA SAXLA
                                    </button>
                                    <button
                                        onClick={closeEditor}
                                        className="bg-slate-100 text-slate-600 p-3 rounded-2xl hover:bg-slate-200 transition"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] p-8">
                                    {/* Sidebar */}
                                    <aside className="space-y-6">
                                        <div className="bg-white rounded-[32px] border border-slate-100 p-6 space-y-6">
                                            <div className="flex items-center gap-3 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                                                <Settings className="h-4 w-4" /> {isBlogSection ? 'BLOG AYARLARI' : 'TƏLİM AYARLARI'}
                                            </div>

                                            {isBlogSection && (
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">STATUS</label>
                                                    <select
                                                        value={blogForm.status}
                                                        onChange={(e) => handleBlogChange('status', e.target.value)}
                                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-primary appearance-none focus:ring-2 focus:ring-accent/20 transition"
                                                    >
                                                        {STATUS_OPTIONS.map(opt => (
                                                            <option key={opt} value={opt}>{STATUS_LABELS[opt] || opt.toUpperCase()}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">
                                                    {isBlogSection ? 'BLOG POSTERİ' : 'TƏLİM POSTERİ'}
                                                </label>
                                                <div className="group relative w-full aspect-square rounded-[24px] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 hover:border-accent transition-colors flex items-center justify-center">
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
                                        </div>
                                    </aside>

                                    {/* Content Editor */}
                                    <div className="bg-white rounded-[40px] border border-slate-100 p-10 space-y-10">
                                        <div className="space-y-6">
                                            <input type="text" value={isBlogSection ? blogForm.title : trainingForm.title} onChange={(e) => isBlogSection ? handleBlogChange('title', e.target.value) : handleTrainingChange('title', e.target.value)} placeholder={isBlogSection ? "Blog Başlığı..." : "Təlim Başlığı..."} className="w-full text-4xl font-black text-primary placeholder:text-slate-100 border-none p-0 focus:ring-0 tracking-tighter" />
                                            <textarea rows={3} value={isBlogSection ? blogForm.excerpt : trainingForm.description} onChange={(e) => isBlogSection ? handleBlogChange('excerpt', e.target.value) : handleTrainingChange('description', e.target.value)} className="w-full bg-slate-50 border-none rounded-[24px] p-6 text-base font-medium text-slate-600 focus:ring-2 focus:ring-accent/10 transition leading-relaxed" placeholder="Qısa məzmun yazın..." />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 block">TAM MƏZMUN</label>
                                            {isBlogSection && (
                                                <div className="space-y-4">
                                                    <div className="flex flex-wrap gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={addBlogSectionDraft}
                                                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary transition hover:border-accent hover:bg-accent/5"
                                                        >
                                                            <LayoutPanelTop className="h-4 w-4 text-accent" />
                                                            BÖLMƏ ƏLAVƏ ET
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={triggerBlogImageBlockInsert}
                                                            disabled={!supabaseReady || imageLoading}
                                                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary transition hover:border-accent hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <Image className="h-4 w-4 text-accent" />
                                                            ŞƏKİL ƏLAVƏ ET
                                                        </button>
                                                        <input
                                                            ref={blogImageInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={handleBlogImageBlockInsert}
                                                        />
                                                    </div>

                                                    {blogSectionDrafts.length > 0 && (
                                                        <div className="space-y-4">
                                                            {blogSectionDrafts.map((draft, index) => (
                                                                <div
                                                                    key={draft.id}
                                                                    className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 space-y-4"
                                                                >
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                                            <LayoutPanelTop className="h-4 w-4 text-accent" />
                                                                            Bölmə {index + 1}
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeBlogSectionDraft(draft.id)}
                                                                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-400 transition hover:text-red-500"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>

                                                                    <input
                                                                        type="text"
                                                                        value={draft.title}
                                                                        onChange={(e) => updateBlogSectionDraft(draft.id, 'title', e.target.value)}
                                                                        className="w-full rounded-2xl border-none bg-white p-4 text-sm font-black text-primary"
                                                                        placeholder="Bölmə başlığı"
                                                                    />

                                                                    <textarea
                                                                        rows={4}
                                                                        value={draft.body}
                                                                        onChange={(e) => updateBlogSectionDraft(draft.id, 'body', e.target.value)}
                                                                        className="w-full rounded-[20px] border-none bg-white p-4 text-sm font-medium text-slate-600 leading-relaxed"
                                                                        placeholder="Bölmə mətnini yazın..."
                                                                    />

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => insertBlogSectionBlock(draft.id)}
                                                                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-accent"
                                                                    >
                                                                        <Check className="h-4 w-4" />
                                                                        İÇƏRİYƏ ƏLAVƏ ET
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="border border-slate-100 rounded-[32px] overflow-hidden shadow-sm group focus-within:border-accent/30 transition-all">
                                                <ReactQuill
                                                    // @ts-ignore
                                                    ref={quillRef}
                                                    theme="snow"
                                                    value={isBlogSection ? blogForm.content : trainingForm.fullContent}
                                                    onChange={(val) => isBlogSection ? handleBlogChange('content', val) : handleTrainingChange('fullContent', val)}
                                                    modules={modules}
                                                    formats={formats}
                                                    placeholder="Buraya yazmağa başlayın..."
                                                />
                                            </div>
                                        </div>

                                        {!isBlogSection && (
                                            <div className="grid gap-8">
                                                <div className="bg-slate-50 rounded-[32px] p-8 space-y-6 border border-slate-100">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">TƏLİM HAQQINDA BAŞLIĞI</label>
                                                        <input
                                                            type="text"
                                                            value={trainingForm.aboutTitle || ''}
                                                            onChange={(e) => handleTrainingChange('aboutTitle', e.target.value)}
                                                            className="w-full bg-white border-none rounded-2xl p-4 text-sm font-black text-primary"
                                                            placeholder="Təlim haqqında"
                                                        />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">TƏLİM PROQRAMI BAŞLIĞI</label>
                                                        <input
                                                            type="text"
                                                            value={trainingForm.syllabusTitle || ''}
                                                            onChange={(e) => handleTrainingChange('syllabusTitle', e.target.value)}
                                                            className="w-full bg-white border-none rounded-2xl p-4 text-sm font-black text-primary"
                                                            placeholder="Təlim proqramı"
                                                        />
                                                    </div>

                                                    <div className="space-y-3">
                                                        {syllabusItems.map((item: TrainingSyllabusItem, index: number) => (
                                                            <div key={`syllabus-${index}`} className="flex flex-col gap-3 rounded-[24px] bg-white p-4 md:flex-row md:items-center">
                                                                <select
                                                                    value={item.type || 'text'}
                                                                    onChange={(e) => updateTrainingSyllabusItem(index, e.target.value === 'file'
                                                                        ? { type: 'file', label: item.label || '', url: item.url || '' }
                                                                        : { type: 'text', text: item.text || '' })}
                                                                    className="rounded-2xl border-none bg-slate-50 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-primary md:w-[140px]"
                                                                >
                                                                    <option value="text">Yazı</option>
                                                                    <option value="file">Dosya</option>
                                                                </select>

                                                                {item.type === 'file' ? (
                                                                    <>
                                                                        <input
                                                                            type="text"
                                                                            value={item.label || ''}
                                                                            onChange={(e) => updateTrainingSyllabusItem(index, { label: e.target.value })}
                                                                            className="min-w-0 flex-1 rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-primary"
                                                                            placeholder={`Dosya başlığı ${index + 1}`}
                                                                        />
                                                                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-50 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-primary transition hover:bg-accent/10">
                                                                            <Upload className="h-4 w-4 text-accent" />
                                                                            {syllabusUploadTarget === `syllabus-${index}` ? 'Yüklənir...' : 'Dosya yüklə'}
                                                                            <input
                                                                                type="file"
                                                                                className="hidden"
                                                                                onChange={(e) => handleTrainingSyllabusFileUpload(index, e.target.files?.[0])}
                                                                            />
                                                                        </label>
                                                                        <a
                                                                            href={item.url || '#'}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className={`truncate rounded-2xl bg-slate-50 px-4 py-4 text-xs font-bold text-slate-500 ${item.url ? 'hover:text-accent' : 'pointer-events-none opacity-50'}`}
                                                                            title={item.url || ''}
                                                                        >
                                                                            {item.label || getUploadedFileName(item.url) || 'Dosya seçilməyib'}
                                                                        </a>
                                                                    </>
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        value={item.text || ''}
                                                                        onChange={(e) => updateTrainingSyllabusItem(index, { text: e.target.value })}
                                                                        className="min-w-0 flex-1 rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-primary"
                                                                        placeholder={`Maddə ${index + 1}`}
                                                                    />
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeTrainingSyllabusItem(index)}
                                                                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-all hover:text-red-500"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={addTrainingSyllabusItem}
                                                            className="w-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Plus className="h-4 w-4" /> Maddə Əlavə Et
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 rounded-[32px] p-8 space-y-6 border border-slate-100">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">AUDİENSİYA BAŞLIĞI</label>
                                                        <input
                                                            type="text"
                                                            value={trainingForm.targetAudienceTitle || ''}
                                                            onChange={(e) => handleTrainingChange('targetAudienceTitle', e.target.value)}
                                                            className="w-full bg-white border-none rounded-2xl p-4 text-sm font-black text-primary"
                                                            placeholder="Bu kurs kimlər üçündür?"
                                                        />
                                                    </div>

                                                    <div className="space-y-3">
                                                        {targetAudienceItems.map((item: string, index: number) => (
                                                            <div key={`target-audience-${index}`} className="flex items-center gap-3">
                                                                <input
                                                                    type="text"
                                                                    value={item}
                                                                    onChange={(e) => updateTrainingTextList('targetAudience', index, e.target.value)}
                                                                    className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold text-primary"
                                                                    placeholder={`Kimlər üçün ${index + 1}`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeTrainingTextListItem('targetAudience', index)}
                                                                    className="w-12 h-12 rounded-2xl bg-white text-slate-400 hover:text-red-500 transition-all flex items-center justify-center"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => addTrainingTextListItem('targetAudience')}
                                                            className="w-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Plus className="h-4 w-4" /> Maddə Əlavə Et
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BlogManagementView;
