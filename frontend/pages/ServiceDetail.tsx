
import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { SERVICES } from '../constants';
import { ArrowLeft, ArrowRight, CheckCircle2, Phone, Mail, FileText, ShieldCheck, Zap, Layers } from 'lucide-react';
import CalculationModal from '../components/CalculationModal';
import { useContent } from '../lib/ContentContext';
import { resolveIcon } from '../utils/iconRegistry';

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { content } = useContent();
  const dynamicServices = content.services?.list ?? SERVICES;
  const service = dynamicServices.find(s => String(s.id) === String(id));
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const formType = id === '3' ? 'audit' : 'general';

  return (
    <div className="flex flex-col bg-white overflow-hidden min-h-screen">
      <CalculationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceType={formType}
        serviceTitle={service.title}
      />

      {/* Header */}
      <section className="relative pt-12 md:pt-20 pb-16 border-b border-slate-50 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute top-0 left-4 sm:left-6 lg:left-8">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-accent font-bold uppercase tracking-widest text-[9px] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> GERİ
            </Link>
          </div>

          <div className="text-center mt-8 md:mt-0">
            {/* Numbered header section removed as requested */}

            <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tighter leading-[1.1] mb-8 max-w-4xl mx-auto uppercase italic">
              {service.title}
            </h1>

            <p className="text-lg text-slate-500 font-bold italic leading-relaxed max-w-2xl mx-auto">
              {service.description}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-32 space-y-10">
                <div className="p-10 bg-slate-50 border-l-4 border-primary">
                  <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">{service.summaryTitle || 'XİDMƏT XÜLASƏSİ'}</h3>
                  <div className="space-y-6">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">{service.standardLabel || 'STANDART'}</span>
                      <span className="text-primary font-black uppercase tracking-tight italic">{service.standardValue || 'IFRS / ISA COMPLİANT'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">{service.durationLabel || 'MÜDDƏT'}</span>
                      <span className="text-primary font-black uppercase tracking-tight italic">{service.durationValue || 'LAYİHƏYƏ GÖRƏ'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-10 w-full inline-flex items-center justify-center gap-3 bg-accent text-white px-8 py-5 text-[10px] font-black uppercase tracking-widest hover:bg-primary-medium transition-all shadow-xl"
                  >
                    TƏKLİF ALIN <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="hidden lg:flex items-center justify-center gap-6 p-6 grayscale opacity-20">
                  <ShieldCheck className="h-10 w-10 text-primary" />
                  <Zap className="h-10 w-10 text-primary" />
                  <Layers className="h-10 w-10 text-primary" />
                </div>
              </div>
            </div>

            {/* Main Narrative */}
            <div className="lg:col-span-8 space-y-20">
              <div className="prose prose-slate max-w-none">
                <h2 className="text-2xl font-black text-primary mb-10 tracking-tight uppercase italic border-b border-slate-50 pb-4">{service.scopeTitle || 'XİDMƏTİN ƏHATƏ DAİRƏSİ'}</h2>
                <p className="text-slate-600 text-lg leading-relaxed mb-12 border-l-2 border-accent/20 pl-10 italic">
                  {service.content}
                </p>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="text-xl font-black text-primary mb-12 tracking-tight uppercase italic">{service.benefitsTitle || 'XİDMƏTƏ DAXİL OLAN İSTİQAMƏTLƏR'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.benefits?.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-6 p-8 bg-slate-50 border border-slate-100 group hover:border-accent transition-colors">
                      <div className="w-10 h-10 flex-shrink-0 bg-primary text-accent flex items-center justify-center rounded-sm group-hover:bg-accent group-hover:text-white transition-all shadow-md">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <span className="text-primary font-bold text-sm tracking-tight uppercase italic">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-32 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-10 tracking-tighter uppercase italic">{service.consultationTitle || 'MƏSLƏHƏT ÜÇÜN MÜRACİƏT EDİN'}</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent text-white px-16 py-6 rounded-sm font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-medium transition-all shadow-2xl mb-16"
          >
            TƏKLİF ALIN
          </button>
          <div className="flex flex-wrap justify-center gap-10">
            <div className="flex flex-col items-center">
              <Phone className="h-5 w-5 text-accent mb-4" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">ZƏNG EDİN</span>
              <span className="text-white font-bold tracking-tight">+994 50 200 00 00</span>
            </div>
            <div className="flex flex-col items-center">
              <Mail className="h-5 w-5 text-accent mb-4" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">E-POÇT</span>
              <span className="text-white font-bold tracking-tight">office@azfin.az</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[120px]"></div>
      </section>
    </div>
  );
};

export default ServiceDetail;
