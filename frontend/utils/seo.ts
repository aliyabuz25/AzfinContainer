const ensureMeta = (selector: string, attrs: Record<string, string>) => {
  if (typeof document === 'undefined') return null;
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    Object.entries(attrs).forEach(([key, value]) => element?.setAttribute(key, value));
    document.head.appendChild(element);
  }
  return element;
};

const setMetaContent = (selector: string, attrs: Record<string, string>, content: string) => {
  const meta = ensureMeta(selector, attrs);
  if (meta) {
    meta.setAttribute('content', content);
  }
};

export const updateSeoMeta = ({
  title,
  description,
  image,
  url,
}: {
  title: string;
  description: string;
  image?: string;
  url?: string;
}) => {
  if (typeof document === 'undefined') return;

  document.title = title;

  setMetaContent('meta[name="description"]', { name: 'description' }, description);
  setMetaContent('meta[property="og:title"]', { property: 'og:title' }, title);
  setMetaContent('meta[property="og:description"]', { property: 'og:description' }, description);
  setMetaContent('meta[property="og:type"]', { property: 'og:type' }, 'article');
  setMetaContent('meta[name="twitter:card"]', { name: 'twitter:card' }, image ? 'summary_large_image' : 'summary');
  setMetaContent('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
  setMetaContent('meta[name="twitter:description"]', { name: 'twitter:description' }, description);

  if (url) {
    setMetaContent('meta[property="og:url"]', { property: 'og:url' }, url);
    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }

  if (image) {
    setMetaContent('meta[property="og:image"]', { property: 'og:image' }, image);
    setMetaContent('meta[name="twitter:image"]', { name: 'twitter:image' }, image);
  }
};
