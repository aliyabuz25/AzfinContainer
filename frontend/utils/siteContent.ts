import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import siteContentDefaults from '../siteContentDefaults.json';

export type SiteContent = typeof siteContentDefaults;

export const DEFAULT_SITE_CONTENT: SiteContent = siteContentDefaults;

const FIXED_SITE_SETTINGS_ID = 1;

export const fetchSiteSettings = async () => {
  if (!supabase) {
    console.warn('Skipping Supabase fetch for site settings; using defaults.');
    return {
      id: FIXED_SITE_SETTINGS_ID,
      content: {},
    };
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('id, content')
      .eq('id', FIXED_SITE_SETTINGS_ID)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch site settings', error);
      throw error;
    }

    return {
      id: data?.id ?? FIXED_SITE_SETTINGS_ID,
      content: data?.content ?? {},
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
  if (!supabase) {
    const error = new Error('Supabase is not configured');
    console.warn('Unable to save site settings; Supabase credentials are missing.');
    return { data: null, error };
  }

  const payload = {
    id: id || FIXED_SITE_SETTINGS_ID,
    content,
  };

  const { data, error } = await supabase.from('site_settings').upsert(payload, { onConflict: 'id' }).select('id, content');
  return { data, error };
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
        // Optional: remove old numeric keys? Better keep them for safety or just use the new list
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

  return useMemo(
    () => ({
      content,
      loading,
      refresh,
      settingsId,
    }),
    [content, loading, settingsId]
  );
};

export const mergeSiteContent = (override) => mergeContent(DEFAULT_SITE_CONTENT, override);
