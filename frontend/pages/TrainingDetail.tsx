
import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { TrainingItem } from '../types';
import { fetchTrainingById } from '../utils/fetchData';
import ApplicationModal from '../components/ApplicationModal';
import ImageWithFallback from '../components/ImageWithFallback';
import { parseBBCode } from '../utils/bbcode';

const TrainingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [training, setTraining] = useState<TrainingItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trainingTitle={training.title}
      />

      {/* Hero / Back Nav Header */}
      <div className="bg-white border-b border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/academy" className="inline-flex items-center gap-2 text-slate-400 hover:text-accent font-bold uppercase tracking-widest text-[10px] transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Akademiyaya qayıt
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight leading-tight uppercase italic max-w-2xl">
              {training.title}
            </h1>
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-widest w-fit">
              <ShieldCheck className="h-4 w-4" /> Peşəkar Sertifikat
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-12">

            {/* Image Section */}
            <div className="rounded-2xl overflow-hidden shadow-2xl h-80 lg:h-96">
              <ImageWithFallback
                src={training.image}
                alt={training.title}
                imgClassName="w-full h-full object-cover"
                placeholderClassName="w-full h-full"
                placeholderText="no-image"
              />
            </div>

            {/* About Section */}
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <h2 className="text-2xl font-black text-primary mb-6 tracking-tight uppercase italic">Təlim Haqqında</h2>
              <div
                className="text-slate-500 leading-relaxed text-lg font-medium"
                dangerouslySetInnerHTML={{ __html: parseBBCode(training.fullContent || training.description) }}
              />
            </div>

            {/* Syllabus Section */}
            {training.syllabus && (
              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <h2 className="text-2xl font-black text-primary mb-8 tracking-tight uppercase italic">Tədris Proqramı</h2>
                <div className="space-y-4">
                  {training.syllabus.map((topic, index) => (
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

          {/* Sidebar Sticky Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 sticky top-32">
              <h3 className="text-lg font-black text-primary mb-8 border-b border-slate-50 pb-4 uppercase tracking-widest italic">Təlim Məlumatları</h3>

              <div className="space-y-6 mb-10">
                <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" /> Müddət
                  </span>
                  <span className="font-black text-primary text-xs uppercase italic">{training.duration}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-accent" /> Başlayır
                  </span>
                  <span className="font-black text-primary text-xs uppercase italic">{training.startDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" /> Status
                  </span>
                  <span className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest ${training.status === 'completed' ? 'bg-slate-100 text-slate-400' :
                      training.status === 'ongoing' ? 'bg-emerald-100 text-emerald-600' : 'bg-accent/10 text-accent'
                    }`}>
                    {training.status === 'upcoming' ? 'Qeydiyyat Aktivdir' :
                      training.status === 'ongoing' ? 'Davam Edir' : 'Başa Çatıb'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-accent text-white font-black py-5 rounded-xl transition-all shadow-xl shadow-accent/20 text-xs uppercase tracking-widest hover:bg-primary-medium flex items-center justify-center gap-3"
              >
                Müraciət Et
              </button>

              <div className="mt-8 p-6 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed italic">
                  Yerlər məhduddur. Müraciət etməklə təlimdə iştirakınızı təsdiqləyin.
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
