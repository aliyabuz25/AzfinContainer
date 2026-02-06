import { supabase } from '../lib/supabaseClient';
import { BlogItem } from '../types';
import { ensureLocalBlogPosts, persistLocalBlogPosts, readLocalBlogPosts } from './localBlogStore';

export const fetchAdminBlogPosts = async (): Promise<BlogItem[]> => {
  if (!supabase) {
    console.warn('Supabase disabled; using local blog cache for admin.');
    return ensureLocalBlogPosts();
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('Failed to fetch blog posts for admin', error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content || row.body,
    date: row.date || row.published_at || row.created_at,
    author: row.author,
    image: row.image || row.image_url || row.cover_image,
    category: row.category,
    status: row.status,
  }));
};

export const upsertBlogPost = async (post: BlogItem): Promise<{ data: BlogItem | null; error: any }> => {
  if (!supabase) {
    const posts = readLocalBlogPosts();
    const updated = [...posts];
    const index = updated.findIndex((item) => item.id === post.id);
    if (index > -1) {
      updated[index] = post;
    } else {
      updated.unshift(post);
    }
    persistLocalBlogPosts(updated);
    return { data: post, error: null };
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .upsert(post, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    console.error('Blog upsert error:', error);
  }

  return { data, error };
};

export const deleteBlogPost = async (id: string) => {
  if (!supabase) {
    const updated = readLocalBlogPosts().filter((item) => item.id !== id);
    persistLocalBlogPosts(updated);
    return null;
  }

  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  return error;
};
