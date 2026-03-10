import { apiClient } from '../lib/apiClient';
import { BlogItem, TrainingItem, TrainingSyllabusItem } from '../types';

const mapBlogRow = (row: any): BlogItem => ({
  id: row.id,
  title: row.title || row.header || '',
  excerpt: row.excerpt || row.summary || '',
  content: row.content || row.body || row.full_content || '',
  date: row.date || row.published_at || row.created_at || new Date().toISOString().split('T')[0],
  author: row.author || 'Azfin Ekspert',
  image: row.image || row.image_url || row.cover_image || '',
  category: row.category || 'Ümumi',
  status: row.status || 'published',
});

export const normalizeStatus = (status?: string): TrainingItem['status'] => {
  const s = String(status || '').toLowerCase().trim();
  if (s === 'ongoing' || s === 'davam edir' || s.includes('davam') || s === 'aktiv') return 'ongoing';
  if (s === 'completed' || s === 'başa çatıb' || s === 'başa çatib' || s.includes('başa') || s === 'bitib' || s === 'yekun') return 'completed';
  if (s === 'upcoming' || s === 'tezliklə' || s === 'tezlikle' || s === 'yaxında' || s.includes('tez') || s.includes('yaxın')) return 'upcoming';
  return 'upcoming';
};

export const parseStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.map((item) => String(item ?? '').trim()).filter(Boolean)
        : [];
    } catch (_) {
      return [];
    }
  }

  return [];
};

export const parseTrainingSyllabus = (value: unknown): TrainingSyllabusItem[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          const text = item.trim();
          return text ? { type: 'text' as const, text } : null;
        }

        if (!item || typeof item !== 'object') return null;

        const type = item.type === 'file' ? 'file' : 'text';
        const text = typeof item.text === 'string' ? item.text.trim() : '';
        const label = typeof item.label === 'string' ? item.label.trim() : '';
        const url = typeof item.url === 'string' ? item.url.trim() : '';

        if (type === 'file') {
          if (!url && !label) return null;
          return { type, label, url };
        }

        if (!text) return null;
        return { type, text };
      })
      .filter((item): item is TrainingSyllabusItem => Boolean(item));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parseTrainingSyllabus(parsed);
    } catch (_) {
      return [];
    }
  }

  return [];
};

const mapTrainingRow = (row: any): TrainingItem => ({
  id: row.id,
  title: row.title || '',
  description: row.description || row.summary || '',
  fullContent: row.fullContent || row.full_content || row.content || '',
  syllabus: parseTrainingSyllabus(row.syllabus),
  targetAudience: parseStringList(row.targetAudience),
  startDate: row.startDate || row.start_date || row.date || '',
  duration: row.duration || '',
  level: row.level || 'Bütün səviyyələr',
  image: row.image || row.image_url || '',
  status: normalizeStatus(row.status),
  certLabel: row.certLabel,
  infoTitle: row.infoTitle,
  aboutTitle: row.aboutTitle,
  syllabusTitle: row.syllabusTitle,
  targetAudienceTitle: row.targetAudienceTitle,
  durationLabel: row.durationLabel,
  startLabel: row.startLabel,
  statusLabel: row.statusLabel,
  sidebarNote: row.sidebarNote,
  highlightWord: row.highlightWord,
});

export const fetchBlogPosts = async (): Promise<BlogItem[]> => {
  try {
    const data = await apiClient.get('/blog');
    return (data ?? []).map(mapBlogRow);
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    return [];
  }
};

export const fetchBlogPostById = async (id: string): Promise<BlogItem | null> => {
  try {
    const posts = await fetchBlogPosts();
    return posts.find((post) => post.id === id) ?? null;
  } catch (err) {
    console.error('Error fetching blog post by id:', err);
    return null;
  }
};

export const fetchTrainings = async (): Promise<TrainingItem[]> => {
  try {
    const data = await apiClient.get('/trainings');
    return (data ?? []).map(mapTrainingRow);
  } catch (error) {
    console.error('Failed to fetch trainings:', error);
    return [];
  }
};

export const fetchTrainingById = async (id: string): Promise<TrainingItem | null> => {
  try {
    const trainings = await fetchTrainings();
    return trainings.find((t) => t.id === id) ?? null;
  } catch (err) {
    console.error('Error fetching training by id:', err);
    return null;
  }
};
