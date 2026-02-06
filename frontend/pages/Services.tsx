import React from 'react';
import { SERVICES } from '../constants';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useContent } from '../lib/ContentContext';
import { resolveIcon } from '../utils/iconRegistry';

const Services: React.FC = () => {
  const { content } = useContent();
  const servicesData = content.services || ({} as any);
  const dynamicServicesList = servicesData.list || SERVICES;

  return (
    <div className="flex flex-col bg-white">
      {/* Header */}
      <div className="relative bg-slate-50 border-b border-slate-100 py-24 overflow-hidden">
        {servicesData.heroImage && (
          <div className="absolute inset-0 z-0">
            <img src={servicesData.heroImage} className="w-full h-full object-cover opacity-10" alt="" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent"></div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-accent mb-6 text-[10px] font-bold uppercase tracking-[0.4em]">
                <span className="w-8 h-[1px] bg-accent"></span>
                {servicesData.heroBadge}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight leading-tight uppercase italic">
                {servicesData.heroTitlePrefix} <br />
                <span className="text-accent">{servicesData.heroTitleHighlight} {servicesData.heroTitleSuffix}</span>
              </h1>
            </div>
            <p className="text-slate-500 font-bold text-xs max-w-xs border-l-2 border-slate-200 pl-6 pb-2 uppercase tracking-widest italic">
              {servicesData.heroSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Services List */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto">
          {(servicesData.list || SERVICES).map((service, idx) => {
            const Icon = resolveIcon(service.icon);
            return (
              <Link
                key={service.id}
                to={`/services/${service.id}`}
                className="group relative flex flex-col md:flex-row items-stretch border-b border-slate-50 hover:bg-slate-50 transition-all duration-500"
              >
                <div className="w-full md:w-32 flex items-center justify-center border-r border-slate-50 py-8 md:py-0">
                  <span className="text-4xl font-black text-slate-100 group-hover:text-accent transition-colors duration-500 italic uppercase">
                    0{idx + 1}
                  </span>
                </div>

                <div className="w-full md:w-48 flex items-center justify-center p-8 md:p-0">
                  <div className="w-16 h-16 bg-white text-primary rounded-sm flex items-center justify-center group-hover:bg-primary group-hover:text-accent transition-all duration-500 shadow-sm border border-slate-100">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <div className="flex-grow p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="max-w-lg space-y-4 text-center md:text-left">
                    <h3 className="text-2xl font-black text-primary tracking-tight uppercase italic group-hover:text-accent transition-colors duration-500">
                      {service.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-bold italic">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 border border-slate-200 flex items-center justify-center rounded-full group-hover:bg-primary group-hover:border-primary group-hover:text-accent transition-all duration-500 shadow-lg">
                      <ChevronRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                <div className="absolute left-0 bottom-0 h-[2px] w-0 bg-accent group-hover:w-full transition-all duration-700"></div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Services;
