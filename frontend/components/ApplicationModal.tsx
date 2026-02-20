
import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { submitForm } from '../utils/formSubmissions';
import { useContent } from '../lib/ContentContext';

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainingTitle: string;
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({ isOpen, onClose, trainingTitle }) => {
    const { content } = useContent();
    const forms = (content as any).forms || {};
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        note: ''
    });

    useEffect(() => {
        if (!isOpen) return;
        setSubmitted(false);
        setFormData({
            name: '',
            phone: '',
            email: '',
            note: ''
        });
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await submitForm('training', {
                ...formData,
                trainingTitle,
                formName: forms.trainingFormName || 'Təlimə Müraciət'
            });
            if (error) {
                console.error('Supabase error:', error);
                alert('Müraciət göndərilərkən xəta baş verdi: ' + (typeof error === 'string' ? error : (error as any).message || 'Bilinməyən xəta'));
                return;
            }
            setSubmitted(true);
        } catch (error) {
            console.error('Training application error:', error);
            alert('Xəta baş verdi. Zəhmət olmasa yenidən yoxlayın.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSubmitted(false);
        setFormData({ name: '', phone: '', email: '', note: '' });
        onClose();
    };

    const introTemplate = forms.trainingIntroTemplate || 'Siz {trainingTitle} üzrə qeydiyyat formunu doldurursunuz.';
    const hasIntroPlaceholder = introTemplate.includes('{trainingTitle}');
    const introParts = hasIntroPlaceholder ? introTemplate.split('{trainingTitle}') : [introTemplate];
    const introPrefix = introParts[0] || '';
    const introSuffix = introParts.slice(1).join('{trainingTitle}');

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/60 backdrop-blur-md transition-opacity" onClick={handleClose}></div>

            <div className="relative bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="bg-primary px-6 py-5 flex justify-between items-center border-b border-accent/30">
                    <h3 className="text-white font-black text-sm uppercase tracking-[0.2em] italic">
                        {forms.trainingModalTitle || 'Təlimə Müraciət'}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-accent transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-8">
                    {submitted ? (
                        <div className="text-center py-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-accent/10 mb-6">
                                <Check className="h-8 w-8 text-accent" />
                            </div>
                            <h3 className="text-xl font-black text-primary uppercase italic tracking-tight mb-3">{forms.trainingSuccessTitle || 'Müraciətiniz qəbul olundu!'}</h3>
                            <p className="text-sm text-slate-500 font-bold mb-8 uppercase tracking-widest leading-relaxed">
                                {forms.trainingSuccessMessage || 'Qısa zamanda sizinlə əlaqə saxlanılacaq.'}
                            </p>
                            <button
                                onClick={handleClose}
                                className="bg-primary text-white px-10 py-3 rounded-full font-bold text-[9px] uppercase tracking-[0.3em] hover:bg-primary-medium transition-all"
                            >
                                {forms.trainingSuccessButton || 'Bağla'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-l-2 border-accent pl-4">
                                {hasIntroPlaceholder ? (
                                    <>
                                        {introPrefix}<span className="text-primary">{trainingTitle}</span>{introSuffix}
                                    </>
                                ) : (
                                    introTemplate
                                )}
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{forms.trainingNameLabel || 'Ad və Soyad *'}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs rounded-sm"
                                        placeholder={forms.trainingNamePlaceholder || 'Nümunə: Elvin Məmmədov'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{forms.trainingPhoneLabel || 'Telefon nömrəsi *'}</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs rounded-sm"
                                        placeholder={forms.trainingPhonePlaceholder || '+994 50 000 00 00'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{forms.trainingEmailLabel || 'E-poçt ünvanı *'}</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs rounded-sm"
                                        placeholder={forms.trainingEmailPlaceholder || 'email@shirkat.az'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{forms.trainingNoteLabel || 'Qeyd'}</label>
                                    <textarea
                                        rows={3}
                                        value={formData.note}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs rounded-sm resize-none"
                                        placeholder={forms.trainingNotePlaceholder || 'Suallarınız varsa qeyd edə bilərsiniz...'}
                                    ></textarea>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-accent text-white py-5 rounded-sm font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary-medium transition-all shadow-xl disabled:opacity-50"
                                    >
                                        {loading ? (forms.trainingSubmitLoading || 'GÖNDƏRİLİR...') : (forms.trainingSubmitButton || 'Müraciət Et')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplicationModal;
