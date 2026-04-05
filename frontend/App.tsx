import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingContact from './components/FloatingContact';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import ServiceDetail from './pages/ServiceDetail';
import Academy from './pages/Academy';
import TrainingDetail from './pages/TrainingDetail';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import Admin from './backoffice-admin/AdminPage';
import { ContentProvider, useContent } from './lib/ContentContext';
import { updateSeoMeta } from './utils/seo';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const HashRouteMigrator = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { hash, pathname, search } = window.location;
    if (!hash.startsWith('#/')) return;
    const nextPath = hash.slice(1);
    window.history.replaceState(null, '', `${nextPath}${search && !nextPath.includes('?') ? search : ''}`);
    if (pathname !== nextPath) {
      window.location.replace(nextPath);
    }
  }, []);

  return null;
};

const joinTitleParts = (...parts: Array<unknown>) =>
  parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildSeoTitle = (pageTitle: string, baseTitle: string) => {
  const normalizedPageTitle = pageTitle.trim();
  const normalizedBaseTitle = baseTitle.trim();

  if (!normalizedPageTitle || normalizedPageTitle === normalizedBaseTitle) {
    return normalizedBaseTitle;
  }

  return `${normalizedPageTitle} | ${normalizedBaseTitle}`;
};

const SeoManager = () => {
  const { pathname } = useLocation();
  const { content } = useContent();

  useEffect(() => {
    const settings = content.settings || {};
    const defaultSeoTitle = settings.seoTitle || settings.siteTitle || 'Azfin - Audit, Mühasibatlıq və Hüquq';
    const defaultDescription = settings.siteDescription || 'Azfin Group audit, maliyyə, vergi və hüquq xidmətləri.';
    const defaultKeywords = settings.seoKeywords || 'audit, vergi, muhasibat, bakı, azerbaycan, konsaltinq';
    const actualUrl = typeof window !== 'undefined' ? `${window.location.origin}${pathname}` : undefined;

    if (pathname.startsWith('/blog/')) {
      return;
    }

    let pageTitle = '';
    let pageDescription = defaultDescription;

    if (pathname === '/') {
      pageTitle = defaultSeoTitle;
      pageDescription = content.home?.heroSummary || defaultDescription;
    } else if (pathname === '/about') {
      pageTitle = buildSeoTitle(
        joinTitleParts(content.about?.headerTitlePrefix || 'Haqqımızda', content.about?.headerTitleHighlight),
        defaultSeoTitle
      );
      pageDescription = content.about?.introSummary || content.about?.overviewSummary || defaultDescription;
    } else if (pathname === '/services') {
      pageTitle = buildSeoTitle(
        joinTitleParts(content.services?.heroTitlePrefix || 'Xidmətlər', content.services?.heroTitleHighlight, content.services?.heroTitleSuffix),
        defaultSeoTitle
      );
      pageDescription = content.services?.heroSummary || defaultDescription;
    } else if (pathname.startsWith('/services/')) {
      pageTitle = buildSeoTitle('Xidmət Detalı', defaultSeoTitle);
      pageDescription = content.servicedetail?.heroSummary || defaultDescription;
    } else if (pathname === '/blog') {
      pageTitle = buildSeoTitle(
        joinTitleParts(content.blog?.heroTitlePrefix || 'Bloq', content.blog?.heroTitleHighlight),
        defaultSeoTitle
      );
      pageDescription = content.blog?.heroSummary || defaultDescription;
    } else if (pathname === '/academy') {
      pageTitle = buildSeoTitle(
        joinTitleParts(content.academy?.heroTitlePrefix || 'Akademiya', content.academy?.heroTitleHighlight),
        defaultSeoTitle
      );
      pageDescription = content.academy?.heroSummary || defaultDescription;
    } else if (pathname.startsWith('/academy/')) {
      pageTitle = buildSeoTitle('Təlim Detalı', defaultSeoTitle);
      pageDescription = content.academy?.heroSummary || defaultDescription;
    } else if (pathname === '/contact') {
      pageTitle = buildSeoTitle(
        joinTitleParts(content.contact?.headerTitle || 'Əlaqə', content.contact?.headerHighlight, content.contact?.headerSuffix),
        defaultSeoTitle
      );
      pageDescription = content.contact?.headerSummary || defaultDescription;
    } else if (pathname === '/admin') {
      pageTitle = buildSeoTitle('Admin Panel', defaultSeoTitle);
    } else {
      pageTitle = defaultSeoTitle;
    }

    updateSeoMeta({
      title: pageTitle || defaultSeoTitle,
      description: pageDescription,
      keywords: defaultKeywords,
      url: actualUrl,
      type: 'website',
    });
  }, [content, pathname]);

  return null;
};

const App: React.FC = () => {
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = Math.round((scrollY / height) * 100);
      console.log(`%c[SCROLL POSITION] %c${scrollY}px (%c${percentage}%%c)`,
        'color: #45B3A2; font-weight: bold;',
        'color: #0F172A; font-weight: 800;',
        'color: #FBBF24; font-weight: 800;',
        'color: #0F172A; font-weight: 400;'
      );
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <ContentProvider>
      <Router>
        <HashRouteMigrator />
        <ScrollToTop />
        <SeoManager />
        <div className="min-h-screen flex flex-col font-sans text-gray-800 antialiased selection:bg-accent selection:text-white">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:id" element={<ServiceDetail />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/academy/:id" element={<TrainingDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <Footer />
          <FloatingContact />
        </div>
      </Router>
    </ContentProvider>
  );
};

export default App;
