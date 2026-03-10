import React, { useEffect, useState } from 'react';
import { Navigate, Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { TrainingItem } from '../types';
import { fetchTrainingById } from '../utils/fetchData';
import { parseBBCode } from '../utils/bbcode';
import ApplicationModal from '../components/ApplicationModal';
import ImageWithFallback from '../components/ImageWithFallback';
import { useContent } from '../lib/ContentContext';

const TrainingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [training, setTraining] = useState<TrainingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { content } = useContent();
  const academyContent = content.academy;

  useEffect(() => {
    let isMounted = true;

    if (!id) {
      setLoading(false);
      return;
    }

    fetchTrainingById(id)
      .then((data) => {
        if (isMounted) {
          setTraining(data);
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
  }, [id]);

  if (!loading && !training) {
    return <Navigate to="/academy" replace />;
  }

  if (loading || !training) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-600 font-bold">Təlim məlumatları yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trainingTitle={training.title || academyContent.heroTitleHighlight || 'Audit təlimi'}
      />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="mb-12">
          <Link to="/academy" className="inline-flex items-center gap-2 text-slate-400 hover:text-accent font-bold uppercase tracking-widest text-[10px] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Təlimlərə qayıt
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 space-y-6">
              <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight uppercase italic leading-tight">
                {training.title || academyContent.heroTitleHighlight || 'Audit Təlimi'}
              </h1>
              {training.description && (
                <p className="text-slate-500 leading-relaxed text-base md:text-lg font-medium">
                  {training.description}
                </p>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden shadow-2xl h-80 lg:h-96">
              <ImageWithFallback
                src={training.image}
                alt={training.title}
                imgClassName="w-full h-full object-contain bg-slate-50"
                placeholderClassName="w-full h-full"
                placeholderText="no-image"
              />
            </div>

            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <h2 className="text-2xl font-black text-primary mb-6 tracking-tight uppercase italic">
                {training.aboutTitle || 'Təlim Haqqında'}
              </h2>
              <div
                className="prose prose-slate prose-lg max-w-none font-medium prose-headings:text-primary prose-strong:text-primary prose-p:text-slate-600 prose-li:text-slate-600 prose-ol:my-6 prose-ul:my-6 prose-blockquote:border-accent prose-blockquote:text-slate-600 [&_p]:min-h-[1.75rem] [&_p]:leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ol]:pl-6 [&_ul]:pl-6 [&_li]:my-2 [&_img]:rounded-2xl [&_img]:shadow-lg"
                dangerouslySetInnerHTML={{ __html: parseBBCode(training.fullContent || training.description) }}
              />
            </div>

            {training.syllabus && training.syllabus.length > 0 && (
              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <h2 className="text-2xl font-black text-primary mb-8 tracking-tight uppercase italic">
                  {training.syllabusTitle || 'Təlim proqramı'}
                </h2>
                <div className="space-y-4">
                  {training.syllabus.map((topic, index) => (
                    <div key={index} className="flex items-center gap-6 p-4 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="bg-[#EFF6FF] text-[#3B82F6] font-black h-10 w-10 rounded-full flex items-center justify-center text-xs flex-shrink-0 shadow-sm transition-transform group-hover:scale-110">
                        {index + 1}
                      </div>
                      <span className="min-w-0 flex-1 truncate text-primary font-black text-sm tracking-tight uppercase italic leading-none" title={topic}>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {training.targetAudience && training.targetAudience.length > 0 && (
              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <h2 className="text-2xl font-black text-primary mb-8 tracking-tight uppercase italic">
                  {training.targetAudienceTitle || 'Bu kurs kimlər üçündür?'}
                </h2>
                <div className="space-y-4">
                  {training.targetAudience.map((item, index) => (
                    <div key={index} className="flex items-center gap-6 p-4 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="bg-emerald-50 text-emerald-600 font-black h-10 w-10 rounded-full flex items-center justify-center text-xs flex-shrink-0 shadow-sm transition-transform group-hover:scale-110">
                        {index + 1}
                      </div>
                      <span className="min-w-0 flex-1 truncate text-primary font-black text-sm tracking-tight uppercase italic leading-none" title={item}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 sticky top-32">
              <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-widest w-fit mb-8">
                <ShieldCheck className="h-4 w-4" /> {training.certLabel || 'Peşəkar Sertifikat'}
              </div>

              <h3 className="text-lg font-black text-primary mb-8 border-b border-slate-50 pb-4 uppercase tracking-widest italic">
                {training.infoTitle || 'Təlim Məlumatları'}
              </h3>

              <div className="space-y-6 mb-10">
                <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" /> {training.durationLabel || 'Müddət'}
                  </span>
                  <span
                    className="font-black text-primary text-xs uppercase italic whitespace-pre-wrap text-right"
                    dangerouslySetInnerHTML={{ __html: parseBBCode(training.duration || '') }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Səviyyə
                  </span>
                  <span className="font-black text-primary text-xs uppercase italic text-right">
                    {training.level}
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
                  {training.sidebarNote || academyContent.sidebarNote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingDetail;
