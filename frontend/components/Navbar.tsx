
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BarChart3, ChevronDown, Phone, Mail, Clock, SearchCheck, Calculator, FileText, Scale, Users2, Loader2 } from 'lucide-react';
import { NAV_ITEMS, SERVICES } from '../constants';
import { useContent } from '../lib/ContentContext';
import { resolveIcon } from '../utils/iconRegistry';
import { resolveNavigationLink } from '../utils/navigationLink';
import { resolveMediaUrl } from '../utils/mediaUrl';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { content: siteContent, loading } = useContent();
  const contact = siteContent.contact;
  const nav = siteContent.navigation;

  const dynamicNavItems = Array.isArray(nav.items) ? nav.items : NAV_ITEMS;
  const navbarLogoSrc = resolveMediaUrl(siteContent.settings?.navbarLogo || '');
  const resolvedNavItems = dynamicNavItems
    .map((item: any) => {
      const resolvedLink = resolveNavigationLink(item?.path, Boolean(item?.isExternal));
      return resolvedLink ? { ...item, resolvedLink } : null;
    })
    .filter(Boolean) as Array<any>;
  const dynamicServices = siteContent.services?.list || SERVICES;

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      // Use hysteresis to prevent jittering at the threshold
      if (currentScroll > 120) {
        setIsScrolled(true);
      } else if (currentScroll < 20) {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col w-full sticky top-0 z-50">
      {/* Top Utility Bar */}
      <div className={`bg-primary text-slate-300 px-4 sm:px-6 lg:px-8 hidden md:block border-b border-white/5 transition-all duration-300 overflow-hidden ${isScrolled ? 'h-0 py-0 opacity-0' : 'h-10 py-2 opacity-100'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.15em]">
          <div className="flex gap-10">
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-accent" />
              <span>{contact.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-accent" />
              <span>{contact.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-accent" />
              <span>{contact.hours}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className={`bg-white border-b border-slate-100 transition-all duration-300 ${isScrolled ? 'h-16 md:h-20' : 'h-20 md:h-32'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <Link to="/" className="flex items-center gap-3 flex-shrink-0 group/logo">
              {loading ? (
                <div className={`flex items-center justify-center transition-all ${isScrolled ? 'w-10 h-10' : 'w-12 h-12 md:w-16 md:h-16'}`}>
                  <Loader2 className="h-5 w-5 text-accent animate-spin" />
                </div>
              ) : navbarLogoSrc ? (
                <img
                  src={navbarLogoSrc}
                  alt={siteContent.settings.siteTitle || 'AZFIN'}
                  className={`object-contain transition-all ${isScrolled ? 'h-10' : 'h-12 md:h-16'}`}
                />
              ) : (
                <>
                  <div className={`bg-primary flex items-center justify-center rounded-sm transition-all ${isScrolled ? 'w-8 h-8' : 'w-10 h-10'}`}>
                    <BarChart3 className={`${isScrolled ? 'h-4 w-4' : 'h-5 w-5'} text-accent`} />
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-extrabold text-primary tracking-tighter leading-none transition-all ${isScrolled ? 'text-lg' : 'text-xl'}`}>AZFIN</span>
                    <span className={`text-[8px] font-bold text-slate-400 tracking-[0.25em] uppercase transition-all ${isScrolled ? 'mt-0' : 'mt-1'}`}>Audit & Consulting</span>
                  </div>
                </>
              )}
            </Link>

            <div className="hidden md:flex items-center h-full flex-grow justify-center gap-2">
              {resolvedNavItems.map((item) => (
                <div
                  key={item.label}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => (item.label === 'XİDMƏTLƏR' || item.children) ? setActiveDropdown(item.label) : null}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.label === 'XİDMƏTLƏR' ? (
                    <div className="h-full flex items-center">
                      <Link
                        to={item.resolvedLink.path}
                        className={`${location.pathname.startsWith(item.resolvedLink.path) ? 'text-accent' : 'text-primary hover:text-accent'
                          } px-4 h-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 text-center leading-tight`}
                      >
                        {item.label}
                        <ChevronDown className={`h-3 w-3 opacity-30 transition-transform ${activeDropdown === item.label ? 'rotate-180' : ''}`} />
                      </Link>
                      {activeDropdown === item.label && (
                        <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-[550px] bg-white border border-slate-100 shadow-2xl p-6 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1">
                          {(Array.isArray(dynamicServices) ? dynamicServices : []).map((service) => {
                            const SvgIcon = resolveIcon(service.icon);
                            return (
                              <Link
                                key={service.id}
                                to={`/services/${service.id}`}
                                className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-sm transition-all group"
                              >
                                <div className="w-8 h-8 bg-slate-100 flex items-center justify-center rounded-sm group-hover:bg-accent transition-colors">
                                  <SvgIcon className="h-4 w-4 text-primary group-hover:text-white" />
                                </div>
                                <div className="text-left">
                                  <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{service.title}</div>
                                  <div className="text-[9px] text-slate-400 font-medium leading-tight line-clamp-2">{service.description}</div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    item.resolvedLink.isExternal ? (
                      <a
                        href={item.resolvedLink.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-accent px-4 h-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center text-center leading-tight whitespace-pre-line group relative"
                      >
                        {item.label}
                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                      </a>
                    ) : (
                      <Link
                        to={item.resolvedLink.path}
                        className={`${location.pathname === item.resolvedLink.path || (item.resolvedLink.path !== '/' && location.pathname.startsWith(item.resolvedLink.path)) ? 'text-accent' : 'text-primary hover:text-accent'
                          } px-4 h-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center text-center leading-tight whitespace-pre-line group relative`}
                      >
                        {item.label}
                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                      </Link>
                    )
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center h-full">
              <Link
                to="/contact"
                className={`bg-accent text-white font-bold text-[11px] uppercase tracking-wider hover:bg-[#2d8c73] transition-all shadow-sm text-center flex items-center justify-center ${isScrolled ? 'px-6 py-2 rounded-sm h-10' : 'px-8 py-4 rounded-sm h-16'}`}
              >
                {nav.primaryCTA}
              </Link>
            </div>

            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-primary ml-4">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 fixed inset-0 top-20 z-50 p-6 overflow-y-auto">
            <div className="flex flex-col gap-5">
              {resolvedNavItems.map((item) => (
                <div key={item.label} className="border-b border-slate-50 pb-4">
                  {item.resolvedLink.isExternal ? (
                    <a
                      href={item.resolvedLink.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className="text-base font-bold text-primary uppercase tracking-tight whitespace-pre-line block"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.resolvedLink.path}
                      onClick={() => setIsOpen(false)}
                      className="text-base font-bold text-primary uppercase tracking-tight whitespace-pre-line block"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              <Link
                to="/contact"
                onClick={() => setIsOpen(false)}
                className="mt-4 bg-accent text-white py-4 rounded-sm font-bold text-center text-xs uppercase tracking-widest"
              >
                {nav.primaryCTA || 'ƏLAQƏ'}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
