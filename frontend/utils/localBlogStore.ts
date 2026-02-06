import { BlogItem } from '../types';

const STORAGE_KEY = 'azfin-local-blog-posts';

const STORAGE = typeof window !== 'undefined' ? window.localStorage : null;

const today = new Date().toISOString().split('T')[0];

const FALLBACK_POSTS: BlogItem[] = [
  {
    id: 'local-post-1',
    title: 'Maliyyə şəffaflığı üçün yeni yanaşmalar',
    excerpt: 'Azfin konsultasiya komandası audit prosesini biznes məqsədlərilə uzlaşdıraraq riskləri azaldır.',
    content:
      'Azfin Consulting komandası aşağı riskli maliyyə infrastrukturu qurmaq üçün [b]yerli və beynəlxalq[/b] təcrübəni birləşdirir. Biz quraşdırılmış [list]\n* audit planları\n* daxili nəzarət mexanizmləri\n* davamlı təkmilləşdirmə[/list] platformaları ilə sizə dəstək oluruq.',
    date: today,
    author: 'Azfin Ekspert',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200',
    category: 'Audit',
    status: 'published',
  },
  {
    id: 'local-post-2',
    title: 'Vergi strategiyasındakı ən son trendlər',
    excerpt: 'Azfin mütəxəssisləri vergi yoxlamalarında uğurun açarını addım-addım bölüşür.',
    content:
      '[h2]6 əsas məqam[/h2]\n[quote]Hədəflənmiş vergi yoxlamasına hazır olmaq hər bazar liderinin prioritetidir.[/quote]\n[list]\n* vergi uçotunun rəqəmsallaşması\n* proseslərin optimallaşdırılması\n* təlim və monitorinq[/list]',
    date: today,
    author: 'Azfin Ekspert',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
    category: 'Vergi',
    status: 'published',
  },
];

const clonePosts = (posts: BlogItem[]): BlogItem[] => posts.map((post) => ({ ...post }));

const parseStoredPosts = (value: string): BlogItem[] => {
  try {
    const data = JSON.parse(value);
    if (Array.isArray(data)) {
      return data;
    }
  } catch (error) {
    console.warn('Failed to parse stored blog posts', error);
  }
  return [];
};

export const readLocalBlogPosts = (): BlogItem[] => {
  if (!STORAGE) {
    return clonePosts(FALLBACK_POSTS);
  }
  const raw = STORAGE.getItem(STORAGE_KEY);
  if (!raw) {
    return clonePosts(FALLBACK_POSTS);
  }
  const parsed = parseStoredPosts(raw);
  if (parsed.length === 0) {
    return clonePosts(FALLBACK_POSTS);
  }
  return parsed;
};

export const persistLocalBlogPosts = (posts: BlogItem[]) => {
  if (!STORAGE) return;
  try {
    STORAGE.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
    console.warn('Failed to persist local blog posts', error);
  }
};

export const ensureLocalBlogPosts = (): BlogItem[] => {
  const existing = readLocalBlogPosts();
  if (existing.length === 0) {
    persistLocalBlogPosts(FALLBACK_POSTS);
    return clonePosts(FALLBACK_POSTS);
  }
  return existing;
};
