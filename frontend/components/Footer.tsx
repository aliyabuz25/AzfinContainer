
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SERVICES } from '../constants';
import { TrainingItem } from '../types';
import { fetchTrainings } from '../utils/fetchData';
import { useContent } from '../lib/ContentContext';
import { Loader2 } from 'lucide-react';
import { resolveNavigationLink } from '../utils/navigationLink';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { resolveIcon } from '../utils/iconRegistry';

type FooterLinkItem = {
  label: string;
  path: string;
  href: string;
  isExternal: boolean;
};

const toText = (value: any, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const toBoolean = (value: any) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
};

const normalizeLinkList = (rawList: any, fallback: FooterLinkItem[] = []): FooterLinkItem[] => {
  if (!Array.isArray(rawList)) return fallback;
  const normalized = rawList
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const label = toText((item as any).label || (item as any).title);
      const resolved = resolveNavigationLink(
        toText((item as any).path || (item as any).url),
        toBoolean((item as any).isExternal)
      );
      if (!label || !resolved) return null;
      return {
        label,
        path: resolved.path,
        href: resolved.href,
        isExternal: resolved.isExternal,
      };
    })
    .filter(Boolean) as FooterLinkItem[];

  return normalized.length > 0 ? normalized : fallback;
};

const isExternalPath = (item: FooterLinkItem) => item.isExternal;

const Footer: React.FC = () => {
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [loadingTrainings, setLoadingTrainings] = useState(true);
  const { content: siteContent, loading: contentLoading } = useContent();
  const footer = siteContent.footer;
  const nav = siteContent.navigation;
  const social = (siteContent as any).social || {};
  const footerLogoSrc = resolveMediaUrl(siteContent.settings?.footerLogo || '');
  const auditTvLink = (nav.items || []).reduce((found: string, item: any) => {
    if (found) return found;
    const resolved = resolveNavigationLink(item?.path, Boolean(item?.isExternal));
    if (!resolved || !resolved.isExternal) return '';
    return /audittv|audit\s*tv/i.test(`${item?.label || ''} ${item?.path || ''}`) ? resolved.href : '';
  }, '') || 'https://www.instagram.com/audittv.az/';

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
  const brandText = toText(footer.brandText, 'AZFIN');
  const fallbackDescription = 'Azərbaycanın ən innovativ audit və konsalting mərkəzi.';
  const footerDescription = toText(footer.description, fallbackDescription);
  const navTitle = toText(footer.navTitle, 'Naviqasiya');
  const servicesTitle = toText(footer.servicesTitle, 'Xidmətlər');
  const academyTitle = toText(footer.academyTitle, 'Akademiya');
  const academyLoadingText = toText(footer.academyLoadingText, 'Təlimlər yüklənir...');
  const academyEmptyText = toText(footer.academyEmptyText, 'Hazır təlim yoxdur.');
  const academyAllLabel = toText(footer.academyAllLabel, 'Bütün Təlimlər');

  const defaultNavLinks: FooterLinkItem[] = [
    { label: 'Ana Səhifə', path: '/', href: '/', isExternal: false },
    { label: 'Haqqımızda', path: '/about', href: '/about', isExternal: false },
    { label: 'Xidmətlər', path: '/services', href: '/services', isExternal: false },
    { label: 'Akademiya', path: '/academy', href: '/academy', isExternal: false },
    { label: 'Bloq və Xəbərlər', path: '/blog', href: '/blog', isExternal: false },
    { label: 'Əlaqə', path: '/contact', href: '/contact', isExternal: false },
    { label: 'AuditTV', path: auditTvLink, href: auditTvLink, isExternal: true },
  ];
  const navLinks = normalizeLinkList(footer.navLinks, defaultNavLinks);

  const defaultServiceLinks: FooterLinkItem[] = (Array.isArray(siteContent.services?.list) ? siteContent.services.list : SERVICES).map((service) => ({
    label: service.title,
    path: `/services/${service.id}`,
    href: `/services/${service.id}`,
    isExternal: false,
  }));
  const serviceLinks = normalizeLinkList(footer.serviceLinks, defaultServiceLinks);

  const customAcademyLinks = normalizeLinkList(footer.academyLinks, []);
  const hasCustomAcademyLinks = customAcademyLinks.length > 0;
  const dynamicAcademyLinks: FooterLinkItem[] = featuredTrainings.map((training) => ({
    label: training.title,
    path: `/academy/${training.id}`,
    href: `/academy/${training.id}`,
    isExternal: false,
  }));
  const socialLinks = Array.isArray(social.links)
    ? social.links
      .map((item: any) => {
        const label = toText(item?.label);
        const resolved = resolveNavigationLink(toText(item?.url), true);
        if (!label || !resolved || item?.enabled === false) return null;
        const Icon = resolveIcon(toText(item?.icon, 'globe'));
        return { label, href: resolved.href, Icon };
      })
      .filter(Boolean)
    : [];

  const renderFooterLink = (item: FooterLinkItem, idx: number) => (
    <li key={`${item.path}-${idx}`}>
      {isExternalPath(item) ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-100 hover:text-white transition-colors text-[15px] font-medium"
        >
          {item.label}
        </a>
      ) : (
        <Link
          to={item.path}
          className="text-slate-100 hover:text-white transition-colors text-[15px] font-medium"
        >
          {item.label}
        </Link>
      )}
    </li>
  );

  return (
    <footer className="bg-[#050b18] text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">

          {/* Logo and Description */}
          <div className="space-y-8">
            <Link to="/" className="inline-block">
              {contentLoading ? (
                <div className="flex items-center justify-center w-12 h-12 md:w-20 md:h-20">
                  <Loader2 className="h-6 w-6 text-[#3b82f6] animate-spin" />
                </div>
              ) : footerLogoSrc ? (
                <img
                  src={footerLogoSrc}
                  alt={siteContent.settings.siteTitle || 'AZFIN'}
                  className="h-12 md:h-20 object-contain"
                />
              ) : (
                <span className="font-black text-4xl tracking-tighter text-white">{brandText}</span>
              )}
            </Link>
            <p className="text-slate-400 leading-relaxed text-[15px] font-medium max-w-xs">
              {footerDescription}
            </p>
          </div>

          {/* Naviqasiya Column */}
          <div>
            <h3 className="text-[#3b82f6] text-[13px] font-black uppercase tracking-[0.2em] mb-10">{navTitle}</h3>
            <ul className="space-y-6">
              {navLinks.map(renderFooterLink)}
            </ul>
          </div>

          {/* Xidmətlər Column */}
          <div>
            <h3 className="text-[#3b82f6] text-[13px] font-black uppercase tracking-[0.2em] mb-10">{servicesTitle}</h3>
            <ul className="space-y-6">
              {serviceLinks.map(renderFooterLink)}
            </ul>
          </div>

          {/* Akademiya Column */}
          <div>
            <h3 className="text-[#3b82f6] text-[13px] font-black uppercase tracking-[0.2em] mb-10">{academyTitle}</h3>
            <ul className="space-y-6">
              {hasCustomAcademyLinks ? (
                customAcademyLinks.map(renderFooterLink)
              ) : (
                <>
                  {loadingTrainings ? (
                    <li className="text-slate-400 text-[14px] font-semibold uppercase tracking-[0.2em]">
                      {academyLoadingText}
                    </li>
                  ) : dynamicAcademyLinks.length === 0 ? (
                    <li className="text-slate-400 text-[14px] font-semibold uppercase tracking-[0.2em]">
                      {academyEmptyText}
                    </li>
                  ) : (
                    dynamicAcademyLinks.map(renderFooterLink)
                  )}
                  <li>
                    <Link to="/academy" className="text-slate-100 hover:text-white transition-colors text-[15px] font-medium">
                      {academyAllLabel}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-[13px] font-medium">
            &copy; {new Date().getFullYear()} Azfin Group. Bütün hüquqlar qorunur.
          </p>

          <div className="flex items-center gap-8">
            {socialLinks.length > 0 ? (
              socialLinks.map((item: any, idx: number) => (
                <a
                  key={`${item.label}-${idx}`}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                >
                  <item.Icon className="h-4 w-4" />
                  {item.label}
                </a>
              ))
            ) : (
              <a href={auditTvLink} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">{footer.socialHint}</a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
