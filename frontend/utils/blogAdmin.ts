import { apiClient, isRecoverableApiError, retryDbReady } from '../lib/apiClient';
import { BlogItem } from '../types';

export const fetchAdminBlogPosts = async (): Promise<BlogItem[]> => {
  try {
    const data = await retryDbReady(() => apiClient.get('/blog'));
    return (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      date: row.date,
      author: row.author,
      image: row.image,
      category: row.category,
      status: row.status,
    }));
  } catch (error) {
    if (isRecoverableApiError(error)) return [];
    console.error('Failed to fetch blog posts for admin', error);
    return [];
  }
};

export const upsertBlogPost = async (post: BlogItem): Promise<{ data: BlogItem | null; error: any }> => {
  try {
    await apiClient.post('/blog', post);
    return { data: post, error: null };
  } catch (error) {
    console.error('Blog upsert error:', error);
    return { data: null, error };
  }
};

export const deleteBlogPost = async (id: string) => {
  try {
    await apiClient.delete(`/blog/${id}`);
    return null;
  } catch (error) {
    console.error('Blog delete error:', error);
    return error;
  }
};
