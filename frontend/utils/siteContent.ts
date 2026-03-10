import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/apiClient';
import siteContentDefaults from '../siteContentDefaults.json';

export type SiteContent = typeof siteContentDefaults;

export const DEFAULT_SITE_CONTENT: SiteContent = siteContentDefaults;

const FIXED_SITE_SETTINGS_ID = 1;

export const fetchSiteSettings = async () => {
  try {
    const content = await apiClient.get('/settings');
    return {
      id: FIXED_SITE_SETTINGS_ID,
      content: content || {},
    };
  } catch (err) {
    console.error('Error in fetchSiteSettings:', err);
    return {
      id: FIXED_SITE_SETTINGS_ID,
      content: {},
    };
  }
};

export const upsertSiteSettings = async (content, id = FIXED_SITE_SETTINGS_ID) => {
  try {
    await apiClient.post('/settings', content);
    return { data: { id, content }, error: null };
  } catch (error) {
    console.error('Error in upsertSiteSettings:', error);
    return { data: null, error };
  }
};

export const mergeContent = (base, override) => {
  const result = { ...base };
  if (!override) {
    return result;
  }

  Object.entries(override).forEach(([key, value]) => {
    // Migration: if services is object with numeric keys, convert to list array
    if (key === 'services' && value && typeof value === 'object' && !Array.isArray(value) && !('list' in value)) {
      const servicesArray: any[] = [];
      Object.entries(value).forEach(([sKey, sVal]) => {
        if (/^\d+$/.test(sKey) && typeof sVal === 'object') {
          servicesArray.push({ ...sVal });
        }
      });
      if (servicesArray.length > 0) {
        (value as any).list = servicesArray;
      }
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeContent(base[key] || {}, value);
    } else {
      result[key] = value ?? base[key];
    }
  });

  return result;
};

export const useSiteContent = () => {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<number | null>(FIXED_SITE_SETTINGS_ID);

  const refresh = async () => {
    const { id, content: remote } = await fetchSiteSettings();
    setSettingsId(id);
    setContent(mergeContent(DEFAULT_SITE_CONTENT, remote));
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const { id, content: remote } = await fetchSiteSettings();
      if (!isMounted) return;
      setSettingsId(id);
      setContent(mergeContent(DEFAULT_SITE_CONTENT, remote));
      setLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateContent = (nextContent) => {
    setContent(mergeSiteContent(nextContent || {}));
    setLoading(false);
  };

  return useMemo(
    () => ({
      content,
      loading,
      refresh,
      updateContent,
      settingsId,
    }),
    [content, loading, settingsId]
  );
};

export const mergeSiteContent = (override) => mergeContent(DEFAULT_SITE_CONTENT, override);
