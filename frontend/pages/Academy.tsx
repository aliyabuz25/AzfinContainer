
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { TrainingItem } from '../types';
import { fetchTrainings } from '../utils/fetchData';
import ApplicationModal from '../components/ApplicationModal';
import ImageWithFallback from '../components/ImageWithFallback';
import { useContent } from '../lib/ContentContext';

const Academy: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState('');
  const navigate = useNavigate();
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

  const handleApplyClick = (e: React.MouseEvent, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTraining(title);
    setIsModalOpen(true);
  };

  const handleCardClick = (id: string) => {
    navigate(`/academy/${id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trainingTitle={selectedTraining}
      />

      {/* Hero Header */}
      <div className="relative bg-slate-50 border-b border-slate-100 py-20 overflow-hidden">
        {academyContent.heroImage && (
          <div className="absolute inset-0 z-0">
            <img src={academyContent.heroImage} className="w-full h-full object-cover opacity-10" alt="" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent"></div>
          </div>
        )}
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

      {/* Courses Grid - Adjusted for 3 items per row */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {loading ? (
              <div className="col-span-full text-center text-slate-400 font-bold py-12">
                {academyContent.loadingText}
              </div>
            ) : trainings.length === 0 ? (
              <div className="col-span-full text-center text-slate-400 font-bold py-12">
                {academyContent.emptyText}
              </div>
            ) : (
              trainings.map((training) => (
                <div
                  key={training.id}
                  onClick={() => handleCardClick(training.id)}
                  className="bg-white rounded-xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-slate-100 group flex flex-col transition-all duration-500 hover:shadow-[0_15px_40px_rgb(0,0,0,0.1)] cursor-pointer"
                >
                  {/* Card Image with Badge - Height reduced for smaller cards */}
                  <div className="relative h-48 overflow-hidden">
                    <ImageWithFallback
                      src={training.image}
                      alt={training.title}
                      imgClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      placeholderClassName="w-full h-full"
                      placeholderText="no-image"
                    />
                    {training.status === 'upcoming' && (
                      <div className="absolute top-3 right-3 bg-[#FBBF24] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                        Aktivdir
                      </div>
                    )}
                  </div>

                  {/* Card Body - Padding reduced for a more compact look */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-lg font-black text-primary mb-4 group-hover:text-accent transition-colors leading-tight uppercase italic">
                      {training.title}
                    </h3>

                    {/* Info Pills - Smaller gaps and size */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <div className="flex items-center gap-1.5 bg-[#EFF6FF] text-[#3B82F6] px-3 py-1.5 rounded-lg">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{training.startDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#EFF6FF] text-[#3B82F6] px-3 py-1.5 rounded-lg">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{training.duration}</span>
                      </div>
                    </div>

                    <div
                      className="text-slate-500 mb-8 flex-grow leading-relaxed font-medium text-xs line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: training.description }}
                    />

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                      <div className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                        <span className="text-primary">{training.level}</span>
                      </div>
                      <button
                        onClick={(e) => handleApplyClick(e, training.title)}
                        className="bg-primary text-white px-5 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-primary-medium transition-all shadow-md flex items-center gap-2"
                      >
                        {academyContent.cardCTA} <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Academy;
