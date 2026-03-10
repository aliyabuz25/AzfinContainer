
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '../lib/apiClient';
import {
  fetchAdminBlogPosts,
  upsertBlogPost,
  deleteBlogPost,
} from '../utils/blogAdmin';
import {
  fetchAdminTrainings,
  upsertTraining,
  deleteTraining,
} from '../utils/trainingAdmin';
import {
  fetchSiteSettings,
  mergeSiteContent,
  mergeContent,
  upsertSiteSettings,
  DEFAULT_SITE_CONTENT,
  SiteContent,
} from '../utils/siteContent';
import { ICON_OPTIONS, resolveIcon } from '../utils/iconRegistry';
import { useContent } from '../lib/ContentContext';
import { ChevronDown, Save, RefreshCcw, Search, Lock } from 'lucide-react';
import { AdminUserItem, BlogItem, TrainingItem, TrainingSyllabusItem } from '../types';
import CDNMonacoEditor from '../components/CDNMonacoEditor';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  DEFAULT_SMTP_SETTINGS,
  SMTPSettings,
  fetchSmtpSettings,
  saveSmtpSettings
} from '../utils/smtpSettings';

// Local Imports
import {
  FIELD_CONFIG,
  DEFAULT_BLOG_FORM,
  DEFAULT_TRAINING_FORM,
  formatFieldLabel,
  getSectionIcon,
  getSectionLabel
} from './AdminConstants';
import SidebarNavigation from './SidebarNavigation';
import BlogManagementView from './BlogManagementView';
import SitemapEditorView from './SitemapEditorView';
import SectionEditorView from './SectionEditorView';
import ClientManagementView from './ClientManagementView';
import FormMessagesView from './FormMessagesView';
import SmtpSettingsView from './SmtpSettingsView';
import AdminAccountsView from './AdminAccountsView';

const TEMP_DRAFT_KEY = 'azfin-site-content-draft';

const readTempDraft = () => {
  if (typeof window === 'undefined') return null;
  try {
    const item = window.localStorage.getItem(TEMP_DRAFT_KEY);
    if (!item) return null;
    return JSON.parse(item) as SiteContent;
  } catch (err) {
    console.warn('Failed to read temporary site content from localStorage', err);
    return null;
  }
};

const persistTempDraft = (value: SiteContent) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TEMP_DRAFT_KEY, JSON.stringify(value));
  } catch (err) {
    console.warn('Failed to persist temporary site content to localStorage', err);
  }
};

const clearTempDraft = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TEMP_DRAFT_KEY);
};

const hasContent = (value: unknown) => {
  if (!value || typeof value !== 'object') return false;
  return Object.keys(value as Record<string, unknown>).length > 0;
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // UUID v4 Polyfill
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const formatStartDate = (rawValue: string) => {
  const digits = rawValue.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}.${digits.slice(2)}`;
};

const normalizeTrainingList = (value: unknown, preserveEmpty = false): string[] => {
  if (Array.isArray(value)) {
    const normalized = value.map((item) => String(item ?? '').trim());
    return preserveEmpty ? normalized : normalized.filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? normalizeTrainingList(parsed, preserveEmpty)
        : [];
    } catch (_) {
      return [];
    }
  }

  return [];
};

const normalizeTrainingSyllabus = (value: unknown, preserveEmpty = false): TrainingSyllabusItem[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          const text = item.trim();
          if (!text && !preserveEmpty) return null;
          return { type: 'text' as const, text };
        }

        if (!item || typeof item !== 'object') return null;

        const type = item.type === 'file' ? 'file' : 'text';
        const text = typeof item.text === 'string' ? item.text.trim() : '';
        const label = typeof item.label === 'string' ? item.label.trim() : '';
        const url = typeof item.url === 'string' ? item.url.trim() : '';

        if (type === 'file') {
          if (!preserveEmpty && !label && !url) return null;
          return { type, label, url };
        }

        if (!preserveEmpty && !text) return null;
        return { type, text };
      })
      .filter((item): item is TrainingSyllabusItem => Boolean(item));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return normalizeTrainingSyllabus(parsed, preserveEmpty);
    } catch (_) {
      return [];
    }
  }

  return [];
};

const normalizeTrainingForm = (value?: Partial<TrainingItem> | null): Omit<TrainingItem, 'id'> => ({
  ...DEFAULT_TRAINING_FORM,
  ...value,
  title: typeof value?.title === 'string' ? value.title : DEFAULT_TRAINING_FORM.title,
  description: typeof value?.description === 'string' ? value.description : DEFAULT_TRAINING_FORM.description,
  fullContent: typeof value?.fullContent === 'string' ? value.fullContent : DEFAULT_TRAINING_FORM.fullContent,
  syllabus: normalizeTrainingSyllabus(value?.syllabus, true),
  targetAudience: normalizeTrainingList(value?.targetAudience, true),
  startDate: typeof value?.startDate === 'string' ? value.startDate : DEFAULT_TRAINING_FORM.startDate,
  duration: typeof value?.duration === 'string' ? value.duration : DEFAULT_TRAINING_FORM.duration,
  level: typeof value?.level === 'string' ? value.level : DEFAULT_TRAINING_FORM.level,
  image: typeof value?.image === 'string' ? value.image : DEFAULT_TRAINING_FORM.image,
  status: value?.status === 'ongoing' || value?.status === 'completed' || value?.status === 'upcoming'
    ? value.status
    : DEFAULT_TRAINING_FORM.status,
  certLabel: typeof value?.certLabel === 'string' ? value.certLabel : '',
  infoTitle: typeof value?.infoTitle === 'string' ? value.infoTitle : '',
  aboutTitle: typeof value?.aboutTitle === 'string' ? value.aboutTitle : DEFAULT_TRAINING_FORM.aboutTitle,
  syllabusTitle: typeof value?.syllabusTitle === 'string' ? value.syllabusTitle : DEFAULT_TRAINING_FORM.syllabusTitle,
  targetAudienceTitle: typeof value?.targetAudienceTitle === 'string' ? value.targetAudienceTitle : DEFAULT_TRAINING_FORM.targetAudienceTitle,
  durationLabel: typeof value?.durationLabel === 'string' ? value.durationLabel : '',
  startLabel: typeof value?.startLabel === 'string' ? value.startLabel : '',
  statusLabel: typeof value?.statusLabel === 'string' ? value.statusLabel : '',
  sidebarNote: typeof value?.sidebarNote === 'string' ? value.sidebarNote : '',
  highlightWord: typeof value?.highlightWord === 'string' ? value.highlightWord : '',
});

// Reusable IconPicker component
const IconPicker: React.FC<{ value?: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const selectedOption = ICON_OPTIONS.find((option) => option.name === value);
  const PreviewIcon = resolveIcon(value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 transition"
      >
        <div className="w-9 h-9 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-primary">
          <PreviewIcon className="h-5 w-5" />
        </div>
        <span className="flex-1 truncate">
          {selectedOption ? selectedOption.name.replace(/-/g, ' ') : 'Icon seçin'}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-full max-h-64 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl">
          {ICON_OPTIONS.map((option) => {
            const OptionIcon = option.Icon;
            return (
              <button
                key={option.name}
                type="button"
                onClick={() => {
                  onChange(option.name);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50 transition"
              >
                <div className="w-8 h-8 rounded-2xl border border-slate-200 flex items-center justify-center text-primary">
                  <OptionIcon className="h-4 w-4" />
                </div>
                {option.name.replace(/-/g, ' ')}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};


const Admin: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [hasAdminAccount, setHasAdminAccount] = useState<boolean>(true);
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountsLoading, setAccountsLoading] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedSession = localStorage.getItem('admin_session');
        if (storedSession) {
          try {
            setSession(JSON.parse(storedSession));
          } catch (e) {
            localStorage.removeItem('admin_session');
          }
        }

        const bootstrap = await apiClient.get('/admin/bootstrap');
        setHasAdminAccount(Boolean(bootstrap?.hasAdmin));
        if (bootstrap?.hasAdmin) {
          const users = await apiClient.get('/admin/users');
          setAdminUsers(Array.isArray(users) ? users : []);
        }
      } catch (err) {
        console.error('Auth bootstrap failed:', err);
        setLoginError('Admin vəziyyəti yoxlanarkən xəta baş verdi.');
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  const { updateContent } = useContent();


  const [adminMode, setAdminMode] = useState<'site' | 'blog' | 'training' | 'sitemap' | 'messages' | 'clients' | 'forms' | 'social' | 'accounts'>('site');
  const [viewMode, setViewMode] = useState<'section' | 'full'>('section');
  const [blogMode, setBlogMode] = useState<'blog' | 'training'>('blog');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [draft, setDraft] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [selectedSection, setSelectedSection] = useState('home');
  const [sectionSearch, setSectionSearch] = useState('');

  const [editorValue, setEditorValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [blogPosts, setBlogPosts] = useState<BlogItem[]>([]);
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);

  const [blogForm, setBlogForm] = useState<Omit<BlogItem, 'id'>>(DEFAULT_BLOG_FORM);
  const [trainingForm, setTrainingForm] = useState<Omit<TrainingItem, 'id'>>(normalizeTrainingForm(DEFAULT_TRAINING_FORM));
  const [blogSaving, setBlogSaving] = useState(false);
  const [trainingSaving, setTrainingSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [smtpSettings, setSmtpSettings] = useState<SMTPSettings>(DEFAULT_SMTP_SETTINGS);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpDirty, setSmtpDirty] = useState(false);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const trainingContentRef = useRef<HTMLTextAreaElement>(null);
  const lastSavedDraftRef = useRef<string>('');

  const supabaseReady = true; // Renamed to keep compatibility with existing logic, but now it's always ready with the new API

  const persistCurrentDraft = useCallback(
    async (payload: SiteContent) => {
      const { error } = await upsertSiteSettings(payload);
      if (error) throw error;
      updateContent?.(payload);
      clearTempDraft();
    },
    [updateContent]
  );

  // Load Initial Data
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const local = readTempDraft();
        let currentDraft = DEFAULT_SITE_CONTENT;
        let canRestoreLocalDraft = false;

        if (supabaseReady) {
          const settings = await fetchSiteSettings();
          const remoteContent = settings?.content || {};
          currentDraft = mergeSiteContent(remoteContent);
          canRestoreLocalDraft = !hasContent(remoteContent);

          const [bp, tr, smtp, users] = await Promise.all([
            fetchAdminBlogPosts(),
            fetchAdminTrainings(),
            fetchSmtpSettings(),
            apiClient.get('/admin/users')
          ]);
          setBlogPosts(bp);
          setTrainings(tr);
          setSmtpSettings(smtp);
          setSmtpDirty(false);
          setAdminUsers(Array.isArray(users) ? users : []);
        }

        const initialDraft = local && canRestoreLocalDraft ? mergeContent(currentDraft, local) : currentDraft;
        setDraft(initialDraft);
        lastSavedDraftRef.current = JSON.stringify(initialDraft);

        if (local && canRestoreLocalDraft) {
          toast.info('Saxlanılmamış dəyişikliklər bərpa edildi.');
        } else if (local && !canRestoreLocalDraft) {
          clearTempDraft();
        }
      } catch (err) {
        console.error('Initial load error:', err);
        toast.error('Məlumatların yüklənməsində xəta baş verdi.');
      } finally {
        setLoading(false);
      }
    };
    if (session) init();
  }, [supabaseReady, session]);

  useEffect(() => {
    if (adminMode === 'forms' && selectedSection !== 'forms') {
      setSelectedSection('forms');
      setViewMode('section');
    }
    if (adminMode === 'social' && selectedSection !== 'social') {
      setSelectedSection('social');
      setViewMode('section');
    }
  }, [adminMode, selectedSection]);

  // Sync editor with draft
  useEffect(() => {
    if (adminMode === 'sitemap') {
      setEditorValue(JSON.stringify(draft.navigation, null, 2));
    } else if (viewMode === 'full') {
      setEditorValue(JSON.stringify(draft, null, 2));
    } else {
      setEditorValue(JSON.stringify(draft[selectedSection] ?? {}, null, 2));
    }
    setJsonError(null);
  }, [adminMode, viewMode, selectedSection, draft]);

  // Sync draft with localStorage
  useEffect(() => {
    if (!loading) persistTempDraft(draft);
  }, [draft, loading]);

  // Auto-save draft changes to backend/file storage with debounce.
  useEffect(() => {
    if (!session || loading || saving) return;

    const serialized = JSON.stringify(draft);
    if (!lastSavedDraftRef.current) {
      lastSavedDraftRef.current = serialized;
      return;
    }
    if (serialized === lastSavedDraftRef.current) return;

    const timeout = window.setTimeout(async () => {
      try {
        setAutoSaving(true);
        await persistCurrentDraft(draft);
        lastSavedDraftRef.current = serialized;
        setStatus('Avtomatik saxlanıldı.');
      } catch (err) {
        console.error('Auto-save error:', err);
        setStatus('Avtomatik saxlamada xəta var.');
        toast.error('Avtomatik yadda saxlama uğursuz oldu.');
      } finally {
        setAutoSaving(false);
      }
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [draft, loading, persistCurrentDraft, saving, session]);

  const contentSections = useMemo(() => {
    let keys = Object.keys(draft).filter((key) => key !== 'forms' && key !== 'social');
    if (keys.includes('settings')) {
      const idx = keys.indexOf('settings');
      keys.splice(idx, 1);
      keys.unshift('settings');
    }
    return keys;
  }, [draft]);

  const filteredSections = useMemo(() => {
    const query = sectionSearch.toLowerCase();
    if (!query) return contentSections;

    return contentSections.filter((sectionKey) => {
      const sectionLabel = getSectionLabel(sectionKey).toLowerCase();
      if (sectionLabel.includes(query)) return true;

      const sectionFields = FIELD_CONFIG.filter(cfg => cfg.section === sectionKey);
      const configMatch = sectionFields.some(cfg =>
        (cfg.label && cfg.label.toLowerCase().includes(query)) ||
        (cfg.field && cfg.field.toLowerCase().includes(query))
      );
      if (configMatch) return true;

      const sectionData = draft[sectionKey as keyof SiteContent];
      if (sectionData) {
        const json = JSON.stringify(sectionData).toLowerCase();
        if (json.includes(query)) return true;
      }

      return false;
    });
  }, [contentSections, sectionSearch, draft]);

  const sectionFormValues = useMemo(() => {
    return (draft[selectedSection] as Record<string, any>) ?? {};
  }, [draft, selectedSection]);

  const sectionValueTypes = useMemo(() => {
    const types: Record<string, string> = {};
    Object.entries(sectionFormValues).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        if (v.length > 0 && typeof v[0] === 'object') types[k] = 'array-object';
        else types[k] = 'array';
      } else if (typeof v === 'object' && v !== null) {
        types[k] = 'object';
      } else {
        types[k] = 'string';
      }
    });
    return types;
  }, [sectionFormValues]);

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const toggleItemExpansion = (key: string) => {
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Handlers
  const handleSectionInputChange = (field: string, value: any) => {
    setDraft((prev) => mergeContent(prev, { [selectedSection]: { [field]: value } }));
  };

  const handleArrayObjectFieldChange = (parentField: string, idx: number, field: string, value: any) => {
    const current = [...(sectionFormValues[parentField] || [])];
    if (current[idx]) {
      current[idx] = { ...current[idx], [field]: value };
      handleSectionInputChange(parentField, current);
    }
  };

  const handleAddArrayObjectElement = (field: string) => {
    const current = [...(sectionFormValues[field] || [])];
    const template = current.length > 0 ? { ...current[0] } : {};
    Object.keys(template).forEach((k) => (template[k] = ''));
    if (template.id !== undefined) template.id = generateId();
    current.push(template);
    handleSectionInputChange(field, current);
    toggleItemExpansion(`${field}-${current.length - 1}`);
  };

  const handleRemoveArrayObjectElement = (field: string, idx: number) => {
    const current = [...(sectionFormValues[field] || [])];
    current.splice(idx, 1);
    handleSectionInputChange(field, current);
  };

  const handleObjectFieldChange = (parentField: string, field: string, value: any) => {
    const current = { ...(sectionFormValues[parentField] || {}) };
    current[field] = value;
    handleSectionInputChange(parentField, current);
  };

  const applySectionJson = () => {
    try {
      const parsed = JSON.parse(editorValue);
      setDraft((prev) => mergeContent(prev, { [selectedSection]: parsed }));
      setJsonError(null);
      toast.success(`${getSectionLabel(selectedSection)} bölməsi yeniləndi.`);
    } catch (err) {
      setJsonError('JSON formatı yalnışdır.');
      toast.error('JSON xətası!');
    }
  };

  const applyFullJson = () => {
    try {
      const parsed = JSON.parse(editorValue);
      if (adminMode === 'sitemap') {
        setDraft((prev) => ({ ...prev, navigation: parsed }));
        toast.success('Naviqasiya strukturu tətbiq edildi.');
      } else {
        setDraft(() => mergeSiteContent(parsed));
        toast.success('Bütün sayt strukturu yeniləndi.');
      }
      setJsonError(null);
    } catch (err) {
      setJsonError('JSON formatı yalnışdır.');
      toast.error('JSON xətası!');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persistCurrentDraft(draft);
      if (smtpDirty) {
        const { data, error } = await saveSmtpSettings(smtpSettings);
        if (error) throw error;
        if (data) {
          setSmtpSettings(data);
        }
        setSmtpDirty(false);
      }
      lastSavedDraftRef.current = JSON.stringify(draft);
      setStatus(smtpDirty ? 'Dəyişikliklər və SMTP ayarları saxlanıldı.' : 'Bütün dəyişikliklər saxlanıldı.');
      toast.success(smtpDirty ? 'Dəyişikliklər və SMTP ayarları yadda saxlanıldı.' : 'Bütün dəyişikliklər yadda saxlanıldı.');
    } catch (err) {
      console.error('Manual save error:', err);
      setStatus('Yadda saxlamada xəta var.');
      toast.error('Yadda saxlayarkən xəta baş verdi.');
    } finally {
      setSaving(false);
    }
  };

  const handleSmtpFieldChange = (field: keyof SMTPSettings, value: string | number | boolean) => {
    setSmtpSettings((prev) => ({ ...prev, [field]: value }));
    setSmtpDirty(true);
  };

  const handleSmtpSave = async () => {
    setSmtpSaving(true);
    try {
      const { data, error } = await saveSmtpSettings(smtpSettings);
      if (error) throw error;
      if (data) {
        setSmtpSettings(data);
      }
      setSmtpDirty(false);
      toast.success('SMTP ayarları saxlanıldı.');
    } catch (err) {
      console.error('SMTP save error:', err);
      toast.error('SMTP ayarları saxlanarkən xəta baş verdi.');
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleRestoreSectionDefaults = () => {
    const defaults = DEFAULT_SITE_CONTENT[selectedSection as keyof SiteContent];
    if (defaults) {
      setDraft((prev) => mergeContent(prev, { [selectedSection]: defaults }));
      toast.warning(`${getSectionLabel(selectedSection)} bölməsi ilkin vəziyyətinə qaytarıldı.`);
    }
  };

  const handlePushSitemap = async () => {
    setSaving(true);
    try {
      const nextDraft = { ...draft, navigation: JSON.parse(editorValue) };
      setDraft(nextDraft);
      await persistCurrentDraft(nextDraft);
      lastSavedDraftRef.current = JSON.stringify(nextDraft);
      setStatus('Sitemap saxlanıldı.');
      toast.success('Sitemap Supabase-a uğurla göndərildi.');
    } catch (err) {
      console.error('Sitemap push error:', err);
      setStatus('Sitemap saxlanarkən xəta var.');
      toast.error('Sitemap göndərilərkən xəta!');
    } finally {
      setSaving(false);
    }
  };

  const handleBlogSelect = (blog: BlogItem) => {
    setSelectedBlogId(blog.id);
    const { id, ...rest } = blog;
    setBlogForm(rest);
  };

  const handleTrainingSelect = (tr: TrainingItem) => {
    setSelectedTrainingId(tr.id);
    const { id, ...rest } = tr;
    setTrainingForm(normalizeTrainingForm(rest));
  };

  const handleBlogChange = (f: string, v: any) => setBlogForm(prev => ({ ...prev, [f]: v }));
  const handleTrainingChange = (f: string, v: any) => {
    const nextValue = f === 'startDate' ? formatStartDate(String(v ?? '')) : v;
    setTrainingForm(prev => normalizeTrainingForm({ ...prev, [f]: nextValue }));
  };

  const handleBlogSave = async (): Promise<boolean> => {
    setBlogSaving(true);
    try {
      const isNew = !selectedBlogId;
      const item = { ...blogForm, id: selectedBlogId || generateId() };
      const { data, error } = await upsertBlogPost(item as BlogItem);

      if (error) throw error;

      const updated = await fetchAdminBlogPosts();
      setBlogPosts(updated);

      // If it was a new post, reset form to allow adding another
      if (isNew) {
        resetBlogForm();
        toast.success('Yeni yazı əlavə edildi.');
      } else {
        setSelectedBlogId(item.id);
        toast.success('Yazı yadda saxlanıldı.');
      }
      return true;
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Xəta baş verdi.');
      return false;
    } finally {
      setBlogSaving(false);
    }
  };

  const handleTrainingSave = async (): Promise<boolean> => {
    if (!trainingForm.title?.trim()) {
      toast.error('Təlim başlığı boş ola bilməz.');
      return false;
    }

    setTrainingSaving(true);
    try {
      const isNew = !selectedTrainingId;
      const item = { ...normalizeTrainingForm(trainingForm), id: selectedTrainingId || generateId() };
      const { data, error } = await upsertTraining(item as TrainingItem);

      if (error) throw error;

      const updated = await fetchAdminTrainings();
      setTrainings(updated);
      const savedTraining = updated.find((training) => training.id === item.id);

      if (isNew) {
        toast.success('Yeni təlim əlavə edildi.');
      } else {
        setSelectedTrainingId(item.id);
        toast.success('Təlim yadda saxlanıldı.');
      }

      setSelectedTrainingId(item.id);
      setTrainingForm(normalizeTrainingForm(savedTraining ?? item));
      return true;
    } catch (err) {
      console.error('Save error:', err);
      const message = err instanceof Error ? err.message : 'Xəta baş verdi.';
      toast.error(message);
      return false;
    } finally {
      setTrainingSaving(false);
    }
  };

  const resetBlogForm = () => {
    setSelectedBlogId(null);
    setBlogForm(DEFAULT_BLOG_FORM);
  };
  const resetTrainingForm = () => {
    setSelectedTrainingId(null);
    setTrainingForm(normalizeTrainingForm(DEFAULT_TRAINING_FORM));
  };

  const handleBlogDelete = async (id: string) => {
    if (!confirm('Bu yazını silmək istədiyinizə əminsiniz?')) return;
    try {
      await deleteBlogPost(id);
      setBlogPosts(prev => prev.filter(b => b.id !== id));
      if (selectedBlogId === id) resetBlogForm();
      toast.info('Yazı silindi.');
    } catch (err) {
      toast.error('Silinmə xətası.');
    }
  };

  const handleTrainingDelete = async (id: string) => {
    if (!confirm('Bu təlimi silmək istədiyinizə əminsiniz?')) return;
    try {
      await deleteTraining(id);
      setTrainings(prev => prev.filter(t => t.id !== id));
      if (selectedTrainingId === id) resetTrainingForm();
      toast.info('Təlim silindi.');
    } catch (err) {
      toast.error('Silinmə xətası.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, callback: (v: string) => void, textRef?: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageLoading(true);
    try {
      const data = await apiClient.upload(file);
      const publicUrl = data.url; // This is the relative path /uploads/filename.ext

      callback(publicUrl);
      toast.success('Şəkil yükləndi.');
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Şəkil yüklənərkən xəta.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const data = await apiClient.post('/login', {
        username: loginUsername,
        password: loginPassword,
      });

      const adminSession = { user: data.user, access_token: data.access_token };
      localStorage.setItem('admin_session', JSON.stringify(adminSession));
      setSession(adminSession);
      const users = await apiClient.get('/admin/users');
      setAdminUsers(Array.isArray(users) ? users : []);
    } catch (err: any) {
      setLoginError(err.message || 'Giriş uğursuz oldu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (registerPassword !== registerPasswordConfirm) {
      setLoginError('Şifrələr üst-üstə düşmür.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.post('/admin/register', {
        username: registerUsername,
        password: registerPassword,
      });

      const adminSession = { user: data.user, access_token: data.access_token };
      localStorage.setItem('admin_session', JSON.stringify(adminSession));
      setSession(adminSession);
      setHasAdminAccount(true);
      const users = await apiClient.get('/admin/users');
      setAdminUsers(Array.isArray(users) ? users : []);
    } catch (err: any) {
      setLoginError(err.message || 'Admin qeydiyyatı uğursuz oldu.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('admin_session');
    setSession(null);
    setAdminUsers([]);
    setAccountUsername('');
    setAccountPassword('');
  };

  const handleCreateAdminUser = async () => {
    setAccountsLoading(true);
    try {
      const response = await apiClient.post('/admin/users', {
        username: accountUsername,
        password: accountPassword,
      });
      setAdminUsers(Array.isArray(response?.users) ? response.users : []);
      setAccountUsername('');
      setAccountPassword('');
      toast.success('Admin hesabı əlavə edildi.');
    } catch (err: any) {
      toast.error(err.message || 'Admin hesabı əlavə edilə bilmədi.');
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleDeleteAdminUser = async (id: number) => {
    if (!confirm('Bu admin hesabını silmək istədiyinizə əminsiniz?')) return;
    setAccountsLoading(true);
    try {
      const response = await apiClient.delete(`/admin/users/${id}`);
      setAdminUsers(Array.isArray(response?.users) ? response.users : []);
      toast.info('Admin hesabı silindi.');
    } catch (err: any) {
      toast.error(err.message || 'Admin hesabı silinə bilmədi.');
    } finally {
      setAccountsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Sistem yoxlanılır...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 md:p-14 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center text-center space-y-6 mb-10">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-2">
              <Lock className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-primary">
                {hasAdminAccount ? 'Admin Girişi' : 'İlk Admin Qeydiyyatı'}
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                {hasAdminAccount
                  ? `Xoş Gəlmisən, ${loginUsername || 'Qonaq'}`
                  : 'İlk admin hesabını yaradın'}
              </p>
            </div>
          </div>

          <form onSubmit={hasAdminAccount ? handleLogin : handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">İstifadəçi adı</label>
              <input
                type="text"
                required
                value={hasAdminAccount ? loginUsername : registerUsername}
                onChange={(e) => hasAdminAccount ? setLoginUsername(e.target.value) : setRegisterUsername(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:ring-4 focus:ring-accent/10 outline-none transition-all placeholder:text-slate-300"
                placeholder="tural"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Şifrə</label>
              <input
                type="password"
                required
                value={hasAdminAccount ? loginPassword : registerPassword}
                onChange={(e) => hasAdminAccount ? setLoginPassword(e.target.value) : setRegisterPassword(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:ring-4 focus:ring-accent/10 outline-none transition-all placeholder:text-slate-300"
                placeholder="••••••••"
              />
            </div>

            {!hasAdminAccount && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Şifrə təkrarı</label>
                <input
                  type="password"
                  required
                  value={registerPasswordConfirm}
                  onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:ring-4 focus:ring-accent/10 outline-none transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>
            )}

            {loginError && (
              <div className="bg-red-50 text-red-500 text-xs font-bold px-4 py-3 rounded-xl border border-red-100">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-accent transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {hasAdminAccount ? 'Giriş edilir...' : 'Qeydiyyat edilir...'}
                </>
              ) : (
                hasAdminAccount ? 'Daxil Ol' : 'İlk Admini Yarat'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Məlumatlar yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-[0.4em] text-primary">ADMIN PANEL</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">SAYT MƏZMUNU VƏ STRUKTUR İDARƏETMƏSİ</p>
            {status && (
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{status}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {autoSaving && !saving && (
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">AUTO SAVE...</span>
            )}
            <button
              onClick={handleLogout}
              className="px-6 py-4 rounded-2xl bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all"
            >
              Çıxış
            </button>
            <button
              disabled={saving}
              onClick={handleSave}
              className="group flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-accent transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'YADDA SAXLANILIR...' : 'QLOBAL YADDA SAXLA'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          <SidebarNavigation
            adminMode={adminMode}
            selectedSection={selectedSection}
            viewMode={viewMode}
            sectionSearch={sectionSearch}
            setSectionSearch={setSectionSearch}
            setAdminMode={setAdminMode}
            setSelectedSection={setSelectedSection}
            setViewMode={setViewMode}
            setBlogMode={setBlogMode}
            filteredSections={filteredSections}
          />

          <main className="min-w-0">
            {adminMode === 'blog' || adminMode === 'training' ? (
              <BlogManagementView
                blogMode={adminMode === 'blog' ? 'blog' : 'training'}
                setBlogMode={setBlogMode}
                blogForm={blogForm}
                trainingForm={trainingForm}
                handleBlogChange={handleBlogChange}
                handleTrainingChange={handleTrainingChange}
                handleBlogSave={handleBlogSave}
                handleTrainingSave={handleTrainingSave}
                resetBlogForm={resetBlogForm}
                resetTrainingForm={resetTrainingForm}
                blogPosts={blogPosts}
                trainings={trainings}
                activeBlogId={selectedBlogId}
                activeTrainingId={selectedTrainingId}
                handleBlogSelect={handleBlogSelect}
                handleTrainingSelect={handleTrainingSelect}
                handleBlogDelete={handleBlogDelete}
                handleTrainingDelete={handleTrainingDelete}
                supabaseReady={supabaseReady}
                handleImageUpload={handleImageUpload}
                blogSaving={blogSaving}
                trainingSaving={trainingSaving}
                imageLoading={imageLoading}
              />
            ) : adminMode === 'sitemap' ? (
              <SitemapEditorView
                editorValue={editorValue}
                setEditorValue={setEditorValue}
                applyFullJson={applyFullJson}
                handlePushSitemap={handlePushSitemap}
                saving={saving}
                setStatus={setStatus}
                CDNMonacoEditor={CDNMonacoEditor}
              />
            ) : adminMode === 'messages' ? (
              <FormMessagesView />
            ) : adminMode === 'forms' ? (
              <div className="space-y-8">
                <SmtpSettingsView
                  settings={smtpSettings}
                  dirty={smtpDirty}
                  saving={smtpSaving}
                  onChange={handleSmtpFieldChange}
                  onSave={handleSmtpSave}
                />
                <SectionEditorView
                  selectedSection={selectedSection}
                  sectionFormValues={sectionFormValues}
                  sectionValueTypes={sectionValueTypes}
                  expandedItems={expandedItems}
                  toggleItemExpansion={toggleItemExpansion}
                  handleSectionInputChange={handleSectionInputChange}
                  handleImageUpload={handleImageUpload}
                  handleArrayObjectFieldChange={handleArrayObjectFieldChange}
                  handleAddArrayObjectElement={handleAddArrayObjectElement}
                  handleRemoveArrayObjectElement={handleRemoveArrayObjectElement}
                  handleObjectFieldChange={handleObjectFieldChange}
                  applySectionJson={applySectionJson}
                  applyFullJson={applyFullJson}
                  setEditorValue={setEditorValue}
                  editorValue={editorValue}
                  draft={draft}
                  setViewMode={setViewMode}
                  viewMode={viewMode}
                  supabaseReady={supabaseReady}
                  CDNMonacoEditor={CDNMonacoEditor}
                  jsonError={jsonError}
                  setJsonError={setJsonError}
                  IconPickerComponent={IconPicker}
                  searchQuery={sectionSearch}
                />
              </div>
            ) : adminMode === 'social' ? (
              <SectionEditorView
                selectedSection={selectedSection}
                sectionFormValues={sectionFormValues}
                sectionValueTypes={sectionValueTypes}
                expandedItems={expandedItems}
                toggleItemExpansion={toggleItemExpansion}
                handleSectionInputChange={handleSectionInputChange}
                handleImageUpload={handleImageUpload}
                handleArrayObjectFieldChange={handleArrayObjectFieldChange}
                handleAddArrayObjectElement={handleAddArrayObjectElement}
                handleRemoveArrayObjectElement={handleRemoveArrayObjectElement}
                handleObjectFieldChange={handleObjectFieldChange}
                applySectionJson={applySectionJson}
                applyFullJson={applyFullJson}
                setEditorValue={setEditorValue}
                editorValue={editorValue}
                draft={draft}
                setViewMode={setViewMode}
                viewMode={viewMode}
                supabaseReady={supabaseReady}
                CDNMonacoEditor={CDNMonacoEditor}
                jsonError={jsonError}
                setJsonError={setJsonError}
                IconPickerComponent={IconPicker}
                searchQuery={sectionSearch}
              />
            ) : adminMode === 'clients' ? (
              <ClientManagementView
                clients={draft.home?.clients || []}
                heading={draft.home?.clientsHeading || ''}
                onClientsChange={(newClients) => {
                  setDraft((prev) => mergeContent(prev, { home: { clients: newClients } }));
                }}
                onHeadingChange={(newHeading) => {
                  setDraft((prev) => mergeContent(prev, { home: { clientsHeading: newHeading } }));
                }}
                handleImageUpload={handleImageUpload}
              />
            ) : adminMode === 'accounts' ? (
              <AdminAccountsView
                users={adminUsers}
                createUsername={accountUsername}
                createPassword={accountPassword}
                setCreateUsername={setAccountUsername}
                setCreatePassword={setAccountPassword}
                onCreate={handleCreateAdminUser}
                onDelete={handleDeleteAdminUser}
                loading={accountsLoading}
              />
            ) : (
              <SectionEditorView
                selectedSection={selectedSection}
                sectionFormValues={sectionFormValues}
                sectionValueTypes={sectionValueTypes}
                expandedItems={expandedItems}
                toggleItemExpansion={toggleItemExpansion}
                handleSectionInputChange={handleSectionInputChange}
                handleImageUpload={handleImageUpload}
                handleArrayObjectFieldChange={handleArrayObjectFieldChange}
                handleAddArrayObjectElement={handleAddArrayObjectElement}
                handleRemoveArrayObjectElement={handleRemoveArrayObjectElement}
                handleObjectFieldChange={handleObjectFieldChange}
                applySectionJson={applySectionJson}
                applyFullJson={applyFullJson}
                setEditorValue={setEditorValue}
                editorValue={editorValue}
                draft={draft}
                setViewMode={setViewMode}
                viewMode={viewMode}
                supabaseReady={supabaseReady}
                CDNMonacoEditor={CDNMonacoEditor}
                jsonError={jsonError}
                setJsonError={setJsonError}
                IconPickerComponent={IconPicker}
                searchQuery={sectionSearch}
              />
            )}
          </main>
        </div>
      </div>

      {/* Sticky Management Bar */}
      {adminMode === 'site' && viewMode === 'section' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.15)] px-10 py-6 rounded-[32px] flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Cari Bölmə</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-xs font-black text-primary uppercase tracking-tight leading-none">{getSectionLabel(selectedSection)}</span>
              </div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="flex items-center gap-3">
              <button
                onClick={handleRestoreSectionDefaults}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all group"
              >
                <RefreshCcw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" /> BƏRPA ET
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-3 bg-primary text-white px-10 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-accent transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'SAXLANILIR...' : 'YADDA SAXLA'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        aria-label="Notifications"
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default Admin;
