import { supabase } from '../lib/supabaseClient';
import { BlogItem, TrainingItem } from '../types';
import { ensureLocalBlogPosts, readLocalBlogPosts } from './localBlogStore';

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
  // Ongoing variations
  if (s === 'ongoing' || s === 'davam edir' || s.includes('davam') || s === 'aktiv') return 'ongoing';
  // Completed variations
  if (s === 'completed' || s === 'başa çatıb' || s === 'başa çatib' || s.includes('başa') || s === 'bitib' || s === 'yekun') return 'completed';
  // Upcoming variations (default)
  if (s === 'upcoming' || s === 'tezliklə' || s === 'tezlikle' || s === 'yaxında' || s.includes('tez') || s.includes('yaxın')) return 'upcoming';

  return 'upcoming';
};

const mapTrainingRow = (row: any): TrainingItem => ({
  id: row.id,
  title: row.title || '',
  description: row.description || row.summary || '',
  fullContent: row.fullContent || row.full_content || row.content || '',
  syllabus: Array.isArray(row.syllabus) ? row.syllabus : (typeof row.syllabus === 'string' ? row.syllabus.split('\n').filter(Boolean) : []),
  startDate: row.startDate || row.start_date || row.date || '',
  duration: row.duration || '',
  level: row.level || 'Bütün səviyyələr',
  image: row.image || row.image_url || '',
  status: normalizeStatus(row.status),
});

export const fetchBlogPosts = async (): Promise<BlogItem[]> => {
  if (!supabase) {
    console.warn('Supabase disabled; returning local blog list.');
    return ensureLocalBlogPosts();
  }

  // Fetching all posts as requested "her blog görünmeli"
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch blog posts from Supabase:', error);
    return [];
  }

  return (data ?? []).map(mapBlogRow);
};

export const fetchBlogPostById = async (id: string): Promise<BlogItem | null> => {
  if (!supabase) {
    console.warn('Supabase disabled; checking local blog cache.');
    const posts = readLocalBlogPosts();
    return posts.find((post) => post.id === id) ?? null;
  }

  const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).single();

  if (error) {
    console.error('Failed to fetch blog post', error);
    return null;
  }

  if (!data) return null;

  return mapBlogRow(data);
};

export const fetchTrainings = async (): Promise<TrainingItem[]> => {
  if (!supabase) {
    console.warn('Supabase disabled; returning empty training list.');
    return [];
  }

  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch trainings', error);
    return [];
  }

  return (data ?? []).map(mapTrainingRow);
};

export const fetchTrainingById = async (id: string): Promise<TrainingItem | null> => {
  if (!supabase) {
    console.warn('Supabase disabled; cannot fetch training.');
    return null;
  }

  const { data, error } = await supabase.from('trainings').select('*').eq('id', id).single();

  if (error) {
    console.error('Failed to fetch training', error);
    return null;
  }

  if (!data) return null;

  return mapTrainingRow(data);
};
