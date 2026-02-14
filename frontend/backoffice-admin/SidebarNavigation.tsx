
import React from 'react';
import { Search, FileJson, BookOpen, Search as SearchIcon } from 'lucide-react';
import { getSectionIcon, getSectionLabel } from './AdminConstants';

interface SidebarNavigationProps {
    adminMode: 'site' | 'blog' | 'training' | 'sitemap' | 'messages' | 'clients';
    selectedSection: string;
    viewMode: 'section' | 'full';
    sectionSearch: string;
    setSectionSearch: (val: string) => void;
    setAdminMode: (mode: 'site' | 'blog' | 'training' | 'sitemap' | 'messages' | 'clients') => void;
    setSelectedSection: (section: string) => void;
    setViewMode: (mode: 'section' | 'full') => void;
    setBlogMode: (mode: 'blog' | 'training') => void;
    filteredSections: string[];
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
    adminMode,
    selectedSection,
    viewMode,
    sectionSearch,
    setSectionSearch,
    setAdminMode,
    setSelectedSection,
    setViewMode,
    setBlogMode,
    filteredSections
}) => {
    return (
        <aside className="space-y-6 sticky top-8">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-accent transition-colors" />
                <input
                    value={sectionSearch}
                    onChange={(event) => setSectionSearch(event.target.value)}
                    placeholder="Axtar..."
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-4 text-[11px] font-black uppercase tracking-widest text-primary focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all outline-none"
                />
            </div>

            <div className="bg-slate-50/50 rounded-[32px] border border-slate-100 p-2 max-h-[75vh] overflow-y-auto custom-scrollbar shadow-sm">
                <div className="px-5 py-3 mb-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">DAXİLİ MƏLUMATLAR</span>
                </div>

                <button
                    onClick={() => setAdminMode('messages')}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 ${adminMode === 'messages'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-slate-500 hover:bg-white hover:text-primary group'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <FileJson className={`h-4 w-4 ${adminMode === 'messages' ? 'text-accent' : 'text-slate-300 group-hover:text-primary'}`} />
                        MÜRACİƏTLƏR
                    </div>
                    {adminMode === 'messages' && <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />}
                </button>

                <div className="px-5 py-3 mb-1 border-t border-slate-100 mt-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">MƏZMUN ARXİTEKTURASI</span>
                </div>

                <button
                    onClick={() => {
                        setAdminMode('blog');
                        setBlogMode('blog');
                    }}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 ${adminMode === 'blog'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-slate-500 hover:bg-white hover:text-primary group'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <BookOpen className={`h-4 w-4 ${adminMode === 'blog' ? 'text-accent' : 'text-slate-300 group-hover:text-primary'}`} />
                        BLOG YAZILARI
                    </div>
                    {adminMode === 'blog' && <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />}
                </button>

                <button
                    onClick={() => {
                        setAdminMode('training');
                        setBlogMode('training');
                    }}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 ${adminMode === 'training'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-slate-500 hover:bg-white hover:text-primary group'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <BookOpen className={`h-4 w-4 ${adminMode === 'training' ? 'text-accent' : 'text-slate-300 group-hover:text-primary'}`} />
                        TƏLİMLƏR
                    </div>
                    {adminMode === 'training' && <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />}
                </button>

                <button
                    onClick={() => setAdminMode('clients')}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 ${adminMode === 'clients'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-slate-500 hover:bg-white hover:text-primary group'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <FileJson className={`h-4 w-4 ${adminMode === 'clients' ? 'text-accent' : 'text-slate-300 group-hover:text-primary'}`} />
                        MÜŞTƏRİLƏR
                    </div>
                    {adminMode === 'clients' && <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />}
                </button>

                <button
                    onClick={() => setAdminMode('sitemap')}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-4 ${adminMode === 'sitemap'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-slate-500 hover:bg-white hover:text-primary group'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <SearchIcon className={`h-4 w-4 ${adminMode === 'sitemap' ? 'text-accent' : 'text-slate-300 group-hover:text-primary'}`} />
                        SİTEMAP REDAKTORU
                    </div>
                    {adminMode === 'sitemap' && <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />}
                </button>

                <div className="px-5 py-3 mb-1 border-t border-slate-100 mt-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">SƏHİFƏLƏR</span>
                </div>
                {filteredSections.map((section) => {
                    const Icon = getSectionIcon(section);
                    const isActive = adminMode === 'site' && viewMode === 'section' && selectedSection === section;
                    return (
                        <button
                            key={section}
                            onClick={() => {
                                setAdminMode('site');
                                setViewMode('section');
                                setSelectedSection(section);
                            }}
                            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0 ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-slate-500 hover:bg-white hover:text-primary group'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <Icon
                                    className={`h-4 w-4 ${isActive
                                        ? 'text-accent'
                                        : 'text-slate-300 group-hover:text-primary'
                                        }`}
                                />
                                {getSectionLabel(section)}
                            </div>
                            {isActive && (
                                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};

export default SidebarNavigation;
