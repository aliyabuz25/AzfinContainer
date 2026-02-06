import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function pushSitemap() {
  const sitemapPath = path.resolve(__dirname, '../sitemap.json');
  const sitemapContent = JSON.parse(await fs.readFile(sitemapPath, 'utf-8'));

  const { data, error } = await supabase
    .from('sitemaps')
    .upsert({ id: 1, content: sitemapContent }, { onConflict: 'id' });

  if (error) {
    console.error('Error pushing sitemap to Supabase:', error);
  } else {
    console.log('✅ sitemap.json successfully pushed to Supabase sitemaps table.');
  }
}

pushSitemap();
