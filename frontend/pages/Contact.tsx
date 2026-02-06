
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Linkedin, Facebook, Send, CheckCircle2 } from 'lucide-react';
import { useContent } from '../lib/ContentContext';
import { submitForm } from '../utils/formSubmissions';

const Contact: React.FC = () => {
  const { content } = useContent();
  const contact = content.contact;
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: 'Maliyyə Auditi',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitForm('contact', formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', service: 'Maliyyə Auditi', message: '' });
    } catch (error) {
      console.error('Submission error:', error);
      alert('Xəta baş verdi. Zəhmət olmasa yenidən yoxlayın.');
    } finally {
      setLoading(false);
    }
  };

  const infoItems = [
    { icon: MapPin, title: 'Baş Ofis', detail: contact.address },
    { icon: Phone, title: 'Əlaqə nömrəsi', detail: contact.phone },
    { icon: Mail, title: 'E-poçt ünvanı', detail: contact.email },
    { icon: Clock, title: 'İş rejimi', detail: contact.hours },
  ];
  return (
    <div className="flex flex-col bg-white">
      {/* Header */}
      <div className="bg-slate-50 py-24 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 text-accent mb-6 font-bold uppercase tracking-[0.4em] text-[10px]">
              <span className="w-8 h-[1px] bg-accent"></span>
              {contact.contactBadge}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-primary mb-6 tracking-tight uppercase italic">{contact.headerTitle} <br /><span className="text-accent">{contact.headerHighlight}</span> {contact.headerSuffix}</h1>
            <p className="text-base text-slate-500 font-bold leading-relaxed max-xl italic">
              {contact.headerSummary}
            </p>
          </div>
        </div>
      </div>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">

            {/* Information Grid */}
            <div className="lg:col-span-5 space-y-12">
              <div className="grid grid-cols-1 gap-10">
                {infoItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-6 border-l-2 border-slate-100 pl-8 py-2 group hover:border-accent transition-colors">
                    <div className="text-accent mt-1 group-hover:scale-110 transition-transform">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{item.title}</h4>
                      <p className="text-lg font-black text-primary tracking-tight uppercase italic">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-10 border-t border-slate-100">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 italic">Bizi izləyin</h4>
                <div className="flex gap-4">
                  <a href="#" className="w-12 h-12 bg-primary text-white flex items-center justify-center rounded-sm hover:bg-accent transition-colors shadow-lg shadow-primary/10">
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a href="#" className="w-12 h-12 bg-primary text-white flex items-center justify-center rounded-sm hover:bg-accent transition-colors shadow-lg shadow-primary/10">
                    <Facebook className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <div className="bg-slate-50 p-10 md:p-16 rounded-sm border border-slate-100">
                {submitted ? (
                  <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-black text-primary uppercase italic tracking-tight mb-3">Mesajınız göndərildi!</h3>
                    <p className="text-sm text-slate-500 font-bold mb-8 uppercase tracking-widest">Ən qısa zamanda sizinlə əlaqə saxlanılacaq.</p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="bg-primary text-white px-10 py-3 rounded-sm font-bold text-[9px] uppercase tracking-[0.3em] hover:bg-primary-medium transition-all shadow-md"
                    >
                      Yeni mesaj
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{contact.formNameLabel}</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs transition-all rounded-sm"
                          placeholder="..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{contact.formEmailLabel}</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs transition-all rounded-sm"
                          placeholder="..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{contact.formServiceLabel}</label>
                      <select
                        required
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs transition-all cursor-pointer rounded-sm"
                      >
                        <option>Maliyyə Auditi</option>
                        <option>Mühasibat Autsorsinqi</option>
                        <option>Vergi Konsultasiyası</option>
                        <option>Akademiya Təlimləri</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{contact.formMessageLabel}</label>
                      <textarea
                        rows={4}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-4 focus:outline-none focus:border-accent font-bold text-xs transition-all resize-none rounded-sm"
                        placeholder="..."
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-accent text-white py-5 rounded-sm font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary-medium transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {loading ? 'GÖNDƏRİLİR...' : contact.formButtonText} <Send className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
