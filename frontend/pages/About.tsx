
import React, { useState } from 'react';
import { Target, Award, Building2, Globe, Users, MessageSquare, ShieldCheck, ChevronRight, UserPlus } from 'lucide-react';
import { useContent } from '../lib/ContentContext';
import { resolveIcon } from '../utils/iconRegistry';

type TabType = 'about' | 'team' | 'testimonials';

const About: React.FC = () => {
  const { content } = useContent();
  const about = content.about;
  const [activeTab, setActiveTab] = useState<string>(about.tabs?.[0]?.name ?? 'about');

  const dynamicTabs = (about.tabs || [])
    .filter(tab => ['about', 'overview', 'team', 'testimonials'].includes(tab.name))
    .map(tab => ({
      id: tab.name === 'overview' ? 'about' : tab.name,
      label: tab.heading,
      icon: resolveIcon(tab.icon || 'building-2')
    }));

  const tabs = dynamicTabs.length > 0 ? dynamicTabs : [
    { id: 'about', label: 'BİZİM HAQQIMIZDA', icon: Building2 },
    { id: 'team', label: 'ƏMƏKDAŞLAR', icon: Users },
    { id: 'testimonials', label: 'MÜŞTƏRİ RƏYLƏRİ', icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col bg-white min-h-screen">
      {/* Header - Consistent with Services/Academy */}
      <div className="bg-slate-50 border-b border-slate-100 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-end justify-between gap-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-accent mb-6 text-[10px] font-bold uppercase tracking-[0.4em]">
                <span className="w-8 h-[1px] bg-accent"></span>
                {about.introBadge || 'AZFİN GROUP MMC'}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight leading-tight uppercase italic">
                {tabs.find(t => t.id === activeTab)?.label.split(' ')[0]} <span className="text-accent">{tabs.find(t => t.id === activeTab)?.label.split(' ').slice(1).join(' ')}</span>
              </h1>
            </div>
            <p className="text-slate-500 font-bold text-xs max-w-xs border-l-2 border-accent pl-6 pb-2 uppercase tracking-widest leading-relaxed">
              {about.introSummary || about.overviewSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

            {/* Left Sidebar Navigation */}
            <div className="lg:col-span-3">
              <div className="sticky top-40 space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between p-5 rounded-sm transition-all group ${activeTab === tab.id
                      ? 'bg-primary text-white shadow-xl translate-x-2'
                      : 'bg-slate-50 text-primary hover:bg-slate-100'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-accent' : 'text-slate-400 group-hover:text-primary'}`} />
                      <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                    </div>
                    <ChevronRight className={`h-3 w-3 transition-transform ${activeTab === tab.id ? 'text-accent rotate-90' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-9 animate-in fade-in slide-in-from-right-4 duration-700">

              {activeTab === 'about' && (
                <div className="space-y-16">
                  <div className="space-y-8">
                    <h2 className="text-3xl font-black text-primary uppercase italic tracking-tight">{about.overviewTitle}</h2>
                    <p className="text-slate-600 text-lg font-bold leading-relaxed border-l-4 border-accent pl-8 italic">
                      {about.overviewSummary}
                    </p>
                    <p className="text-slate-500 leading-relaxed font-medium">
                      {about.serviceSummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-10 border border-slate-100 group hover:border-accent transition-colors">
                      <Target className="h-8 w-8 text-accent mb-6" />
                      <h3 className="text-xl font-black text-primary uppercase italic mb-4">{about.missionTitle}</h3>
                      <p className="text-slate-500 text-sm font-bold leading-relaxed">{about.missionSummary}</p>
                    </div>
                    <div className="bg-slate-50 p-10 border border-slate-100 group hover:border-accent transition-colors">
                      <Globe className="h-8 w-8 text-accent mb-6" />
                      <h3 className="text-xl font-black text-primary uppercase italic mb-4">{about.serviceTitle}</h3>
                      <p className="text-slate-500 text-sm font-bold leading-relaxed">{about.serviceSummary}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-1000 border-[10px] border-slate-50 shadow-2xl">
                    <img
                      src={about.overviewImage || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"}
                      alt="Azfin Office"
                      className="w-full h-80 object-cover"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(about.team || []).map((person: any, idx: number) => (
                      <div key={idx} className="group flex flex-col items-center text-center">
                        <div className="w-full aspect-[4/5] overflow-hidden rounded-sm grayscale group-hover:grayscale-0 transition-all duration-700 shadow-xl mb-6">
                          <img src={person.img} alt={person.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                        </div>
                        <h4 className="text-lg font-black text-primary uppercase italic tracking-tight mb-1 group-hover:text-accent transition-colors">{person.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{person.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'testimonials' && (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(about.testimonials || []).map((review: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-10 border-l-4 border-accent hover:shadow-xl transition-all duration-500 overflow-hidden">
                        <MessageSquare className="h-6 w-6 text-accent mb-6 opacity-20" />
                        <p className="text-slate-600 font-bold italic leading-relaxed mb-8 break-words whitespace-pre-wrap">"{review.text}"</p>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-accent font-black text-xs">
                            {review.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-[11px] font-black text-primary uppercase tracking-widest break-words">{review.name}</h5>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest break-words">{review.company}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col items-center py-12 border-t border-slate-100 text-center">
                    <ShieldCheck className="h-12 w-12 text-accent mb-6" />
                    <h3 className="text-2xl font-black text-primary uppercase italic mb-4">{about.testimonialsTitle}</h3>
                    <p className="text-slate-500 max-w-lg text-sm font-bold uppercase tracking-widest leading-relaxed">
                      {about.testimonialsCTA || 'Bizimlə əməkdaşlıq edən 300-dən çox korporativ müştəri sırasına siz də qoşulun.'}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
