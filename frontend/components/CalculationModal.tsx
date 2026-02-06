
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Send, ChevronDown } from 'lucide-react';
import { submitForm } from '../utils/formSubmissions';

interface CalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: 'audit' | 'general';
  serviceTitle?: string;
}

const CalculationModal: React.FC<CalculationModalProps> = ({ isOpen, onClose, serviceType, serviceTitle }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessType: '',
    taxType: '',
    clientStatus: '',
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setFormData({
        businessType: '',
        taxType: '',
        clientStatus: '',
        name: '',
        phone: '',
        email: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitForm('audit', { ...formData, serviceTitle, serviceType });
      setSubmitted(true);
    } catch (error) {
      console.error('Calculation submission error:', error);
      alert('Xəta baş verdi. Zəhmət olmasa yenidən yoxlayın.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      <div className={`relative w-full max-w-2xl rounded-sm transition-all duration-500 overflow-hidden ${submitted ? 'bg-transparent shadow-none max-w-sm' : 'bg-white shadow-2xl'}`}>
        {!submitted && (
          <div className="bg-primary p-6 flex justify-between items-center border-b border-accent/30">
            <div>
              <h3 className="text-white font-black text-lg uppercase tracking-widest italic">{serviceType === 'audit' ? 'Audit Qiymət Təklifi' : 'Xidmət Sorğusu'}</h3>
              {serviceTitle && <p className="text-accent text-[10px] font-bold uppercase tracking-widest mt-1">{serviceTitle}</p>}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-accent transition-colors"><X className="h-6 w-6" /></button>
          </div>
        )}
        <div className="relative">
          {submitted ? (
            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
              <div className="bg-white/90 backdrop-blur-xl p-12 rounded-3xl border border-white/20 shadow-2xl text-center w-full">
                <div className="w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h4 className="text-primary font-extrabold text-sm uppercase tracking-[0.2em] mb-3 italic">Təşəkkür edirik!</h4>
                <p className="text-slate-500 font-bold text-[10px] leading-relaxed mb-10 uppercase tracking-widest">Ən qısa zamanda sizinlə əlaqə saxlanılacaq.</p>
                <button onClick={onClose} className="bg-primary text-white px-10 py-3 rounded-full font-bold text-[9px] uppercase tracking-[0.3em] hover:bg-primary-medium transition-all shadow-md">Tamam</button>
              </div>
            </div>
          ) : (
            <div className="p-8 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fəaliyyət növü *</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 p-4 appearance-none focus:outline-none focus:border-accent font-bold text-xs rounded-sm"
                      >
                        <option value="">Seçin</option>
                        <option value="Ticarət">Ticarət</option>
                        <option value="İstehsal">İstehsal</option>
                        <option value="İaşə">İaşə</option>
                        <option value="Xidmət">Xidmət</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {serviceType === 'audit' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vergi növü *</label>
                        <div className="relative">
                          <select
                            required
                            value={formData.taxType}
                            onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 p-4 appearance-none focus:outline-none focus:border-accent font-bold text-xs rounded-sm"
                          >
                            <option value="">Seçin</option>
                            <option value="ƏDV">ƏDV Ödəyicisi</option>
                            <option value="Mənfəət">Mənfəət/Gəlir Vergisi</option>
                            <option value="Sadələşdirilmiş">Sadələşdirilmiş Vergi</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Müştəri statusu *</label>
                        <div className="relative">
                          <select
                            required
                            value={formData.clientStatus}
                            onChange={(e) => setFormData({ ...formData, clientStatus: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 p-4 appearance-none focus:outline-none focus:border-accent font-bold text-xs rounded-sm"
                          >
                            <option value="">Seçin</option>
                            <option value="Hüquqi">Hüquqi Şəxs</option>
                            <option value="Fiziki">Fiziki Şəxs (Sahibkar)</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ad Soyad *</label>
                    <input
                      required
                      type="text"
                      placeholder="Nümunə: Elvin Məmmədov"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs rounded-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Telefon *</label>
                    <input
                      required
                      type="tel"
                      placeholder="+994 50 000 00 00"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs rounded-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email *</label>
                    <input
                      required
                      type="email"
                      placeholder="email@shirkat.az"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs rounded-sm"
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent text-white py-5 rounded-sm font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary-medium transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? 'GÖNDƏRİLİR...' : 'Sorğunu Göndər'} <Send className="h-4 w-4" />
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

export default CalculationModal;
