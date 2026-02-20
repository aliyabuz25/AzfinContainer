export type ResolvedNavLink = {
  isExternal: boolean;
  path: string;
  href: string;
};

const ABSOLUTE_HTTP_RE = /^https?:\/\//i;
const EXTERNAL_PROTOCOL_RE = /^(https?:\/\/|mailto:|tel:)/i;
const DOMAIN_LIKE_RE = /^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i;

const normalizeInternalPath = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('#/')) return trimmed.slice(1);
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed.replace(/^\/+/, '')}`;
};

const resolveInternalFromAbsolute = (rawPath: string): string | null => {
  if (!ABSOLUTE_HTTP_RE.test(rawPath)) return null;

  try {
    const url = new URL(rawPath);
    const currentHost = typeof window !== 'undefined' ? window.location.host : '';
    const trustedHosts = new Set(['azfin.az', 'www.azfin.az', 'azfin.octotech.az', currentHost].filter(Boolean));

    if (!trustedHosts.has(url.host)) return null;
    if (url.hash && /^#\//.test(url.hash)) return normalizeInternalPath(url.hash);
    return normalizeInternalPath(`${url.pathname || '/'}${url.search || ''}`);
  } catch (_) {
    return null;
  }
};

export const resolveNavigationLink = (rawPath: any, forceExternal = false): ResolvedNavLink | null => {
  if (typeof rawPath !== 'string') return null;
  const value = rawPath.trim();
  if (!value) return null;

  if (forceExternal) {
    return {
      isExternal: true,
      href: value,
      path: value
    };
  }

  if (value.startsWith('#/') || value.startsWith('/')) {
    const path = normalizeInternalPath(value);
    return { isExternal: false, path, href: path };
  }

  const internalFromAbsolute = resolveInternalFromAbsolute(value);
  if (internalFromAbsolute) {
    return { isExternal: false, path: internalFromAbsolute, href: internalFromAbsolute };
  }

  if (EXTERNAL_PROTOCOL_RE.test(value)) {
    return { isExternal: true, href: value, path: value };
  }

  if (DOMAIN_LIKE_RE.test(value)) {
    const href = `https://${value}`;
    return { isExternal: true, href, path: href };
  }

  const path = normalizeInternalPath(value);
  return { isExternal: false, path, href: path };
};

export const normalizeAdminPathToFullLink = (rawPath: any): string => {
  if (typeof rawPath !== 'string') return '';
  const value = rawPath.trim();
  if (!value) return '';

  if (EXTERNAL_PROTOCOL_RE.test(value)) return value;
  if (typeof window === 'undefined') return value;

  const origin = window.location.origin.replace(/\/$/, '');
  if (value.startsWith('#/')) return `${origin}${value}`;
  if (value.startsWith('/')) return `${origin}#${value}`;
  if (value.startsWith('#')) return `${origin}/${value}`;
  return `${origin}#/${value.replace(/^\/+/, '')}`;
};
