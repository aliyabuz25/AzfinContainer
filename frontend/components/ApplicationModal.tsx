
import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainingTitle: string;
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({ isOpen, onClose, trainingTitle }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    note: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
        setSubmitted(true);
    }, 500);
  };

  const handleClose = () => {
    setSubmitted(false);
    setFormData({ name: '', phone: '', note: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-md transition-opacity" onClick={handleClose}></div>
      
      <div className="relative bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
          
          {/* Header */}
          <div className="bg-primary px-6 py-5 flex justify-between items-center border-b border-accent/30">
              <h3 className="text-white font-black text-sm uppercase tracking-[0.2em] italic">
                  Təlimə Müraciət
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
                    <h3 className="text-xl font-black text-primary uppercase italic tracking-tight mb-3">Müraciətiniz qəbul olundu!</h3>
                    <p className="text-sm text-slate-500 font-bold mb-8 uppercase tracking-widest leading-relaxed">
                        Qısa zamanda sizinlə əlaqə saxlanılacaq.
                    </p>
                    <button 
                        onClick={handleClose}
                        className="bg-primary text-white px-10 py-3 rounded-full font-bold text-[9px] uppercase tracking-[0.3em] hover:bg-primary-medium transition-all"
                    >
                        Bağla
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-l-2 border-accent pl-4">
                      Siz <span className="text-primary">{trainingTitle}</span> üzrə qeydiyyat formunu doldurursunuz.
                    </p>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ad və Soyad *</label>
                            <input 
                                type="text" 
                                required
                                className="w-full bg-slate-50 border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs rounded-sm"
                                placeholder="Nümunə: Elvin Məmmədov"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Telefon nömrəsi *</label>
                            <input 
                                type="tel" 
                                required
                                className="w-full bg-slate-50 border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs rounded-sm"
                                placeholder="+994 50 000 00 00"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Qeyd</label>
                            <textarea 
                                rows={3}
                                className="w-full bg-slate-50 border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs rounded-sm resize-none"
                                placeholder="Suallarınız varsa qeyd edə bilərsiniz..."
                                value={formData.note}
                                onChange={(e) => setFormData({...formData, note: e.target.value})}
                            ></textarea>
                        </div>
                        
                        <div className="pt-4">
                            <button 
                                type="submit"
                                className="w-full bg-accent text-white py-5 rounded-sm font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary-medium transition-all shadow-xl"
                            >
                                Müraciət Et
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
