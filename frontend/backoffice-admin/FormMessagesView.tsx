
import React, { useEffect, useState } from 'react';
import { Mail, Briefcase, GraduationCap, Calendar, Clock, Trash2 } from 'lucide-react';
import { fetchSubmissions, FormSubmission, updateSubmissionStatus } from '../utils/formSubmissions';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabaseClient';

const FormMessagesView: React.FC = () => {
    const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'contact' | 'audit' | 'training'>('all');

    const loadSubmissions = async () => {
        setLoading(true);
        try {
            const data = await fetchSubmissions(activeTab === 'all' ? undefined : activeTab);
            setSubmissions(data);
        } catch (err) {
            toast.error('Müraciətlər yüklənərkən xəta!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubmissions();
    }, [activeTab]);

    const handleDelete = async (id: string) => {
        if (!confirm('Bu müraciəti silmək istədiyinizə əminsiniz?')) return;
        try {
            if (!supabase) return;
            const { error } = await supabase.from('form_submissions').delete().eq('id', id);
            if (error) throw error;
            setSubmissions(prev => prev.filter(s => s.id !== id));
            toast.info('Müraciət silindi.');
        } catch (err) {
            toast.error('Silinmə xətası.');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'contact': return <Mail className="h-4 w-4" />;
            case 'audit': return <Briefcase className="h-4 w-4" />;
            case 'training': return <GraduationCap className="h-4 w-4" />;
            default: return <Mail className="h-4 w-4" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'contact': return 'Təmas Formu';
            case 'audit': return 'Audit/Xidmət Sorğusu';
            case 'training': return 'Akademiya Müraciəti';
            default: return type;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[40px] border border-slate-100 p-2 shadow-sm flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}
                >
                    Hamısı
                </button>
                <button
                    onClick={() => setActiveTab('contact')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'contact' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}
                >
                    <Mail className="h-4 w-4" /> Təmas
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}
                >
                    <Briefcase className="h-4 w-4" /> Audit/Xidmət
                </button>
                <button
                    onClick={() => setActiveTab('training')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'training' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}
                >
                    <GraduationCap className="h-4 w-4" /> Akademiya
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white p-20 flex flex-col items-center justify-center rounded-[40px] border border-slate-100 italic font-bold text-slate-400 uppercase text-xs tracking-widest">
                        <div className="w-10 h-10 border-4 border-slate-50 border-t-accent rounded-full animate-spin mb-4" />
                        Müraciətlər yüklənir...
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="bg-white p-20 text-center rounded-[40px] border border-slate-100 italic font-bold text-slate-300 uppercase text-xs tracking-widest">
                        Hələ ki müraciət yoxdur.
                    </div>
                ) : (
                    submissions.map((item) => (
                        <div key={item.id} className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-grow space-y-6">
                                    <div className="flex items-center flex-wrap gap-4">
                                        <div className="bg-primary text-accent px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                            {getIcon(item.type)} {getTypeLabel(item.type)}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                                            <Clock className="h-3.5 w-3.5 text-accent" /> {new Date(item.created_at || '').toLocaleString('az-AZ')}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                                        {/* Common fields */}
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ad Soyad</span>
                                            <p className="text-sm font-black text-primary uppercase italic">{item.form_data.name}</p>
                                        </div>
                                        {item.form_data.email && (
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">E-poçt</span>
                                                <p className="text-sm font-black text-primary italic underline underline-offset-4 decoration-accent/30">{item.form_data.email}</p>
                                            </div>
                                        )}
                                        {item.form_data.phone && (
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Telefon</span>
                                                <p className="text-sm font-black text-primary italic">{item.form_data.phone}</p>
                                            </div>
                                        )}

                                        {/* Conditional fields based on type */}
                                        {item.type === 'audit' && (
                                            <>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fəaliyyət</span>
                                                    <p className="text-sm font-black text-primary uppercase italic">{item.form_data.businessType}</p>
                                                </div>
                                                {item.form_data.taxType && (
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vergi</span>
                                                        <p className="text-sm font-black text-primary uppercase italic">{item.form_data.taxType}</p>
                                                    </div>
                                                )}
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                                                    <p className="text-sm font-black text-primary uppercase italic">{item.form_data.clientStatus}</p>
                                                </div>
                                            </>
                                        )}

                                        {item.type === 'training' && (
                                            <div className="space-y-1 lg:col-span-2">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Təlim</span>
                                                <p className="text-sm font-black text-accent uppercase italic">{item.form_data.trainingTitle}</p>
                                            </div>
                                        )}

                                        {item.type === 'contact' && item.form_data.service && (
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Xidmət</span>
                                                <p className="text-sm font-black text-primary uppercase italic">{item.form_data.service}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Message/Note block */}
                                    {(item.form_data.message || item.form_data.note) && (
                                        <div className="mt-8 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Mesaj / Qeyd</span>
                                            <p className="text-slate-600 font-bold italic leading-relaxed text-sm">
                                                "{item.form_data.message || item.form_data.note}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex md:flex-col justify-end gap-2">
                                    <button
                                        onClick={() => handleDelete(item.id!)}
                                        className="p-4 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm"
                                        title="Sil"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FormMessagesView;
