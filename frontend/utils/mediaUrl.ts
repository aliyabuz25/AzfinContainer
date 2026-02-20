export const resolveMediaUrl = (rawValue: any): string => {
  if (typeof rawValue !== 'string') return '';
  const value = rawValue.trim().replace(/&amp;/g, '&');
  if (!value) return '';

  if (/^(data:|blob:)/i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;

  if (value.startsWith('/')) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${value}`;
    }
    return value;
  }

  const normalized = `/${value.replace(/^\/+/, '')}`;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalized}`;
  }
  return normalized;
};
