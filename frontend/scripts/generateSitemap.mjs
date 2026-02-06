import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { parse } from '@babel/parser';
import * as babelTraverse from '@babel/traverse';
const traverseWrapper = babelTraverse.default ?? babelTraverse;
const traverseFunc = traverseWrapper.default ?? traverseWrapper;
const traverse = traverseFunc;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

const NAV_ITEMS = [
  { label: 'ANA SƏHİFƏ', path: '/' },
  { label: 'HAQQIMIZDA', path: '/about' },
  { label: 'XİDMƏTLƏR', path: '/services', children: ['Vergi xidmətləri', 'Maliyyə xidmətləri', 'Audit xidmətləri', 'Hüquq xidmətləri', 'Kadr uçotu'] },
  { label: 'BLOQ VƏ XƏBƏRLƏR', path: '/blog' },
  { label: 'AKADEMİYA', path: '/academy' },
  { label: 'AUDİTTV', path: 'https://audittv.az/' },
];

const HOME_SECTIONS = [
  {
    name: 'hero',
    heading: 'Biznesiniz üçün Professional Audit',
    summary:
      'Azfin Consulting olaraq şirkətlərin maliyyə hesabatlılığında şəffaflığı təmin edir, vergi risklərini minimuma endirir və strateji inkişaf yollarını müəyyən edirik.',
  },
  {
    name: 'stats',
    heading: 'Əsas rəqəmlərimiz',
    summary: '850+ uğurlu audit, 320+ korporativ müştəri, 15+ illik təcrübə və 25+ peşəkar ekspert ilə əməliyyatları dəstəkləyirik.',
  },
  {
    name: 'services',
    heading: 'Əsas xidmətdə nümunələr',
    summary:
      'Vergi xidmətləri, maliyyə xidmətləri, audit xidmətləri, hüquq xidmətləri və kadr uçotu istiqamətində peşəkar konsaltinq.',
  },
  {
    name: 'sectors',
    heading: 'Hədəf sektorlar',
    summary: 'Logistika, iaşə, təhsil, istehsalat, daşınmaz əmlak və texnologiya sahələrində maliyyə dəstəyi və audit.',
  },
  {
    name: 'process',
    heading: 'İş prosesi',
    summary: 'Diaqnostika → Strategiya → İcraat → Təsdiqləmə mərhələləri ilə hər layihəyə elmi yanaşma.',
  },
  {
    name: 'clients',
    heading: 'Bizi seçənlər',
    summary: 'Filter edilmiş şirkət siyahısında beynəlxalq və yerli korporasiyalar yer alır.',
  },
];

const ABOUT_SECTIONS = [
  {
    name: 'overview',
    heading: 'Azfin Group MMC',
    summary:
      '2017-ci ildən sahibkarlara maliyyə, mühasibatlıq, vergi və konsaltinq dəstəyi verən təşkilat. Auditdən hüquqi xidmətlərə qədər tam spektr.',
  },
  {
    name: 'mission',
    heading: 'Missiya',
    summary: 'Sahibkarların maliyyə və hüquqi məsələlərdə güvənli tərəfdaşı olmaq və onların inkişafı üçün doğru həlləri tətbiq etmək.',
  },
  {
    name: 'service-areas',
    heading: 'Xidmət sahələri',
    summary: 'Mühasibatlıq, audit, vergi, tender sənədləşməsi və hüquqi dəstək üzrə geniş xidmət portfeli.',
  },
  {
    name: 'team',
    heading: 'Komanda və elanlar',
    summary: 'Ekspert auditorlar, baş mühasib, vergi departamenti və hüquqşünaslardan ibarət multidisipliner komanda.',
  },
  {
    name: 'testimonials',
    heading: 'Müştəri rəyləri',
    summary: 'Qlobal logistika, texnologiya və təhsil sektorunda şirkətlər Azfinin peşəkarlığını vurğulayır.',
  },
];

const CONTACT_SECTIONS = [
  {
    name: 'header',
    heading: 'Maliyyə gələcəyinizi birlikdə quraq',
    summary: 'Audit, vergi planlaması və təlimlərlə bağlı suallar üçün komandamız 09:00-18:00 arası cavab verir.',
  },
  {
    name: 'details',
    heading: 'Əlaqə məlumatları',
    summary: 'Bakı, Nizami küçəsi 123; +994 50 200 00 00; office@azfin.az; Bazar ertəsi - Cümə: 09:00 - 18:00.',
  },
  {
    name: 'form',
    heading: 'Əlaqə forması',
    summary: 'Ad, e-poçt, sahə seçimi (Audit, Mühasibat, Vergi, Akademiya) və mesaj bölməsindən istifadə etməklə sorğu göndərin.',
  },
];

const SERVICES_LIST = [
  {
    id: '1',
    title: 'Vergi xidmətləri',
    description:
      'Vergi risklərinin minimuma endirilməsi və hesabatların dəqiq təqdimatı; vergi planlaması, yoxlamalara hazırlıq və uçot konsultasiyası.',
  },
  {
    id: '2',
    title: 'Maliyyə xidmətləri',
    description:
      'Maliyyə göstəricilərinin analizi, hesabatlılığın qurulması, mənfəət zərər hesabatları və analitik dəstək.',
  },
  {
    id: '3',
    title: 'Audit xidmətləri',
    description:
      'ISA uyğun kənar və daxili audit, daxili nəzarət sistemi qiymətləndirilməsi və risklərin idarə edilməsi.',
  },
  {
    id: '4',
    title: 'Hüquq xidmətləri',
    description: 'Müqavilə ekspertizası, korporativ hüquq, hüquqi rəylər, qeydiyyat və ləğv prosesi.',
  },
  {
    id: '5',
    title: 'Kadr uçotu',
    description: 'Əmək qanunvericiliyə uyğun sənədləşmə, kadr uçotunun təşkili və əmrlərin hazırlanması.',
  },
];

const ROUTE_FILES = {
  '/': 'pages/Home.tsx',
  '/about': 'pages/About.tsx',
  '/services': 'pages/Services.tsx',
  '/services/:id': 'pages/ServiceDetail.tsx',
  '/blog': 'pages/Blog.tsx',
  '/blog/:id': 'pages/BlogDetail.tsx',
  '/academy': 'pages/Academy.tsx',
  '/academy/:id': 'pages/TrainingDetail.tsx',
  '/contact': 'pages/Contact.tsx',
  navbar: 'components/Navbar.tsx',
  footer: 'components/Footer.tsx',
};

const SKIP_JSX_ATTRS = new Set([
  'className', 'class', 'style', 'role', 'aria-label', 'href', 'to', 'src', 'alt',
  'width', 'height', 'target', 'rel', 'viewBox', 'id', 'type', 'name', 'placeholder',
]);

const extractStrings = async (relativePath) => {
  const filePath = path.resolve(__dirname, '../', relativePath);
  const content = await fs.readFile(filePath, 'utf-8');
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  const textSet = new Set();

  const record = (value) => {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (normalized) {
      textSet.add(normalized);
    }
  };

  traverse(ast, {
    JSXText(p) {
      record(p.node.value);
    },
    StringLiteral(p) {
      const parentAttr = p.findParent((parent) => parent.isJSXAttribute());
      if (parentAttr) {
        const attrName = parentAttr.node.name?.name;
        if (attrName && SKIP_JSX_ATTRS.has(attrName)) {
          return;
        }
      }
      record(p.node.value);
    },
    TemplateLiteral(p) {
      if (p.node.expressions.length === 0) {
        record(p.node.quasis.map((q) => q.value.cooked).join(''));
      }
    },
  });

  return Array.from(textSet);
};

const buildSitemap = async () => {
  const { data: blogPosts = [], error: blogError } = await supabase
    .from('blog_posts')
    .select('id,title,excerpt,date,author,category')
    .order('created_at', { ascending: false });

  const { data: trainings = [], error: trainingsError } = await supabase
    .from('trainings')
    .select('id,title,description,startDate,duration,level,status')
    .order('created_at', { ascending: false });

  if (blogError) {
    console.warn('Sitemap: failed to fetch blog posts', blogError.message);
  }

  if (trainingsError) {
    console.warn('Sitemap: failed to fetch trainings', trainingsError.message);
  }

  const sitemap = {
    navigation: {
      items: NAV_ITEMS,
    },
    pages: {
      home: {
        url: '/',
        hero: {
          title: HOME_SECTIONS[0].heading,
          summary: HOME_SECTIONS[0].summary,
        },
        sections: HOME_SECTIONS.slice(1),
      },
      about: {
        url: '/about',
        tabs: ABOUT_SECTIONS,
      },
      services: {
        url: '/services',
        sections: SERVICES_LIST,
      },
      blog: {
        url: '/blog',
        posts: blogPosts.map((post) => ({
          title: post.title,
          summary: post.excerpt,
          date: post.date,
          author: post.author,
          category: post.category,
          link: `/blog/${post.id}`,
        })),
      },
      academy: {
        url: '/academy',
        trainings: trainings.map((training) => ({
          title: training.title,
          summary: training.description,
          startDate: training.startDate,
          duration: training.duration,
          level: training.level,
          status: training.status,
          link: `/academy/${training.id}`,
        })),
      },
      contact: {
        url: '/contact',
        sections: CONTACT_SECTIONS,
      },
    },
  };

  const texts = {};
  for (const [route, filePath] of Object.entries(ROUTE_FILES)) {
    try {
      texts[route] = {
        source: filePath,
        strings: await extractStrings(filePath),
      };
    } catch (err) {
      console.warn(`Sitemap: failed to extract strings from ${filePath}`, err.message);
      texts[route] = {
        source: filePath,
        strings: [],
      };
    }
  }

  sitemap.text = texts;

  const outputPath = path.resolve(__dirname, '../sitemap.json');
  await fs.writeFile(outputPath, JSON.stringify(sitemap, null, 2), 'utf-8');
  console.log('🗺️ sitemap.json generated at', outputPath);
};

buildSitemap().catch((error) => {
  console.error('Failed to generate sitemap:', error);
  process.exit(1);
});
