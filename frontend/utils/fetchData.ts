import { supabase } from '../lib/supabaseClient';
import { BlogItem, TrainingItem } from '../types';
import { ensureLocalBlogPosts, readLocalBlogPosts } from './localBlogStore';

const mapBlogRow = (row: any): BlogItem => ({
  id: row.id,
  title: row.title,
  excerpt: row.excerpt,
  content: row.content,
  date: row.date,
  author: row.author,
  image: row.image,
  category: row.category,
  status: row.status,
});

const normalizeStatus = (status?: string): TrainingItem['status'] => {
  if (status === 'ongoing') return 'ongoing';
  if (status === 'completed') return 'completed';
  return 'upcoming';
};

const mapTrainingRow = (row: any): TrainingItem => ({
  id: row.id,
  title: row.title,
  description: row.description,
  fullContent: row.fullContent,
  syllabus: Array.isArray(row.syllabus) ? ((row.syllabus as unknown[]) as string[]) : [],
  startDate: row.startDate,
  duration: row.duration,
  level: row.level,
  image: row.image,
  status: normalizeStatus(row.status),
});

export const fetchBlogPosts = async (): Promise<BlogItem[]> => {
  if (!supabase) {
    console.warn('Supabase disabled; returning local blog list.');
    return ensureLocalBlogPosts().filter((post) => post.status === 'published');
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch blog posts', error);
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
