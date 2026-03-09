
import React, { useEffect, useState } from 'react';
import { Calendar, Clock, ShieldCheck } from 'lucide-react';
import { TrainingItem } from '../types';
import { fetchTrainings } from '../utils/fetchData';
import { parseBBCode } from '../utils/bbcode';
import ApplicationModal from '../components/ApplicationModal';
import ImageWithFallback from '../components/ImageWithFallback';
import { useContent } from '../lib/ContentContext';

const Academy: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { content } = useContent();
  const academyContent = content.academy;

  useEffect(() => {
    let isMounted = true;

    fetchTrainings()
      .then((data) => {
        if (isMounted) {
          setTrainings(data);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const primaryTraining = trainings[0] ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trainingTitle={primaryTraining?.title || academyContent.heroTitleHighlight || 'Audit təlimi'}
      />

      {/* Hero Header */}
      <div className="relative bg-slate-50 border-b border-slate-100 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6 text-accent font-black uppercase tracking-[0.4em] text-[10px]">
                <span className="w-8 h-[1px] bg-accent"></span>
                {academyContent.heroBadge}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight leading-tight uppercase italic">
                {academyContent.heroTitlePrefix} <span className="text-accent">{academyContent.heroTitleHighlight}</span>
              </h1>
            </div>
            <p className="text-slate-500 font-bold text-xs max-w-xs border-l-2 border-accent pl-6 pb-2 uppercase tracking-widest leading-relaxed">
              {academyContent.heroSummary}
            </p>
          </div>
        </div>
      </div>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center text-slate-400 font-bold py-12">
              {academyContent.loadingText}
            </div>
          ) : !primaryTraining ? (
            <div className="text-center text-slate-400 font-bold py-12">
              {academyContent.emptyText}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-12">
                <div className="rounded-2xl overflow-hidden shadow-2xl h-80 lg:h-96">
                  <ImageWithFallback
                    src={primaryTraining.image}
                    alt={primaryTraining.title}
                    imgClassName="w-full h-full object-contain bg-slate-50"
                    placeholderClassName="w-full h-full"
                    placeholderText="no-image"
                  />
                </div>

                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <h2 className="text-2xl font-black text-primary mb-6 tracking-tight uppercase italic">
                    {primaryTraining.aboutTitle || 'Təlim Haqqında'}
                  </h2>
                  <div
                    className="text-slate-500 leading-relaxed text-lg font-medium"
                    dangerouslySetInnerHTML={{ __html: parseBBCode(primaryTraining.fullContent || primaryTraining.description) }}
                  />
                </div>

                {primaryTraining.syllabus && primaryTraining.syllabus.length > 0 && (
                  <div className="bg-white rounded-2xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                    <h2 className="text-2xl font-black text-primary mb-8 tracking-tight uppercase italic">
                      {primaryTraining.syllabusTitle || 'Tədris Proqramı'}
                    </h2>
                    <div className="space-y-4">
                      {primaryTraining.syllabus.map((topic, index) => (
                        <div key={index} className="flex items-center gap-6 p-4 rounded-xl hover:bg-slate-50 transition-colors group">
                          <div className="bg-[#EFF6FF] text-[#3B82F6] font-black h-10 w-10 rounded-full flex items-center justify-center text-xs flex-shrink-0 shadow-sm transition-transform group-hover:scale-110">
                            {index + 1}
                          </div>
                          <span className="text-primary font-black text-sm tracking-tight uppercase italic">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 sticky top-32">
                  <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-widest w-fit mb-8">
                    <ShieldCheck className="h-4 w-4" /> {primaryTraining.certLabel || 'Peşəkar Sertifikat'}
                  </div>

                  <h3 className="text-lg font-black text-primary mb-8 border-b border-slate-50 pb-4 uppercase tracking-widest italic">
                    {primaryTraining.infoTitle || 'Təlim Məlumatları'}
                  </h3>

                  <div className="space-y-6 mb-10">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="h-4 w-4 text-accent" /> {primaryTraining.durationLabel || 'Müddət'}
                      </span>
                      <span
                        className="font-black text-primary text-xs uppercase italic whitespace-pre-wrap text-right"
                        dangerouslySetInnerHTML={{ __html: parseBBCode(primaryTraining.duration || '') }}
                      />
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-accent" /> {primaryTraining.startLabel || 'Başlanğıc'}
                      </span>
                      <span
                        className="font-black text-primary text-xs uppercase italic whitespace-pre-wrap text-right"
                        dangerouslySetInnerHTML={{ __html: parseBBCode(primaryTraining.startDate || '') }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Səviyyə
                      </span>
                      <span className="font-black text-primary text-xs uppercase italic text-right">
                        {primaryTraining.level}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-accent text-white font-black py-5 rounded-xl transition-all shadow-xl shadow-accent/20 text-xs uppercase tracking-widest hover:bg-primary-medium flex items-center justify-center gap-3"
                  >
                    {academyContent.cardCTA}
                  </button>

                  <div className="mt-8 p-6 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed italic">
                      {primaryTraining.sidebarNote || academyContent.sidebarNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Academy;
