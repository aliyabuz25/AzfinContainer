
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SERVICES } from '../constants';
import { TrainingItem } from '../types';
import { fetchTrainings } from '../utils/fetchData';
import { useContent } from '../lib/ContentContext';

const Footer: React.FC = () => {
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [loadingTrainings, setLoadingTrainings] = useState(true);
  const { content: siteContent } = useContent();
  const footer = siteContent.footer;
  const nav = siteContent.navigation;

  useEffect(() => {
    let isMounted = true;

    fetchTrainings()
      .then((items) => {
        if (isMounted) {
          setTrainings(items);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingTrainings(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredTrainings = trainings.slice(0, 4);

  return (
    <footer className="bg-[#050b18] text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">

          {/* Logo and Description */}
          <div className="space-y-8">
            <Link to="/" className="inline-block">
              <span className="font-black text-4xl tracking-tighter text-white">AZFIN</span>
            </Link>
            <p className="text-slate-400 leading-relaxed text-[15px] font-medium max-w-xs">
              {footer.description}
            </p>
          </div>

          {/* Naviqasiya Column */}
          <div>
            <h3 className="text-[#3b82f6] text-[13px] font-black uppercase tracking-[0.2em] mb-10">Naviqasiya</h3>
            <ul className="space-y-6">
              <li><Link to="/" className="text-slate-100 hover:text-white transition-colors text-[15px] font-medium">Ana Səhifə</Link></li>
              <li><Link to="/about" className="text-slate-100 hover:text-white transition-colors text-[15px] font-medium">Haqqımızda</Link></li>
              <li><Link to="/services" className="text-slate-100 hover:text-white transition-colors text-[15px] font-medium">Xidmətlər</Link></li>
              <li><Link to="/academy" className="text-slate-100 hover:text-white transition-colors text-[15px] font-medium">Akademiya</Link></li>
              <li><Link to="/blog" className="text-slate-100 hover:text-white transition-colors text-[15px] font-medium">Bloq və Xəbərlər</Link></li>
              <li><Link to="/contact" className="text-slate-100 hover:text-white transition-colors text-[15px] font-medium">Əlaqə</Link></li>
              <li><a href="https://audittv.az/" target="_blank" rel="noopener noreferrer" className="text-slate-100 hover:text-white transition-colors text-[15px] font-medium">AuditTV</a></li>
            </ul>
          </div>

          {/* Xidmətlər Column */}
          <div>
            <h3 className="text-[#3b82f6] text-[13px] font-black uppercase tracking-[0.2em] mb-10">Xidmətlər</h3>
            <ul className="space-y-6">
              {(siteContent.services?.list || SERVICES).map((service) => (
                <li key={service.id}>
                  <Link
                    to={`/services/${service.id}`}
                    className="text-slate-100 hover:text-white transition-colors text-[15px] font-medium"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Akademiya Column */}
          <div>
            <h3 className="text-[#3b82f6] text-[13px] font-black uppercase tracking-[0.2em] mb-10">Akademiya</h3>
            <ul className="space-y-6">
              {loadingTrainings ? (
                <li className="text-slate-400 text-[14px] font-semibold uppercase tracking-[0.2em]">
                  Təlimlər yüklənir...
                </li>
              ) : featuredTrainings.length === 0 ? (
                <li className="text-slate-400 text-[14px] font-semibold uppercase tracking-[0.2em]">
                  Hazır təlim yoxdur.
                </li>
              ) : (
                featuredTrainings.map((training) => (
                  <li key={training.id}>
                    <Link
                      to={`/academy/${training.id}`}
                      className="text-slate-100 hover:text-white transition-colors text-[15px] font-medium"
                    >
                      {training.title}
                    </Link>
                  </li>
                ))
              )}
              <li><Link to="/academy" className="text-slate-100 hover:text-white transition-colors text-[15px] font-medium">Bütün Təlimlər</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-[13px] font-medium">
            &copy; {new Date().getFullYear()} Azfin Group. Bütün hüquqlar qorunur.
          </p>

          <div className="flex items-center gap-8">
            <a href="#" className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">{footer.socialHint}</a>
            {/* Additional social links could be mapped here if needed */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
