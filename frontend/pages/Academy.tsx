import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { TrainingItem } from '../types';
import { fetchTrainings } from '../utils/fetchData';
import ImageWithFallback from '../components/ImageWithFallback';
import { useContent } from '../lib/ContentContext';

const Academy: React.FC = () => {
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

  return (
    <div className="flex flex-col min-h-screen bg-white">
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
          ) : trainings.length === 0 ? (
            <div className="text-center text-slate-400 font-bold py-12">
              {academyContent.emptyText}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trainings.map((training, index) => (
                <article
                  key={training.id}
                  className="bg-white rounded-lg overflow-hidden border border-slate-100 group transition-all duration-500 hover:shadow-xl"
                >
                  <Link to={`/academy/${training.id}`}>
                    <div className="relative h-56 overflow-hidden bg-slate-100">
                      <ImageWithFallback
                        src={training.image}
                        alt={training.title || `Təlim ${index + 1}`}
                        imgClassName="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                        placeholderClassName="w-full h-full"
                        placeholderText="no-image"
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <span className="bg-accent text-white px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest shadow-lg">
                          {training.level || `Təlim ${index + 1}`}
                        </span>
                        {training.duration && (
                          <span className="bg-white/90 text-primary px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest shadow-lg">
                            {training.duration}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-4 text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-accent" /> {training.durationLabel || 'Müddət'}
                        </div>
                      </div>
                      <h2 className="text-xl font-black mb-4 leading-tight transition-colors italic uppercase tracking-tight text-primary group-hover:text-accent">
                        {training.title || `Təlim ${index + 1}`}
                      </h2>
                      {training.description && (
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed line-clamp-2 font-medium">
                          {training.description}
                        </p>
                      )}
                      <div className="inline-flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest group-hover:text-accent transition-colors">
                        Ətraflı bax <ArrowRight className="h-3 w-3 text-accent" />
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Academy;
