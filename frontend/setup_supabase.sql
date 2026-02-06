-- Create table for site settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to handle timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for site_settings
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Public Read Access" ON public.site_settings;
CREATE POLICY "Public Read Access" ON public.site_settings
    FOR SELECT USING (true);

-- Allow authenticated update access (for admin)
-- Replace with proper auth check if needed, for now allowing all for setup
DROP POLICY IF EXISTS "Admin Update Access" ON public.site_settings;
CREATE POLICY "Admin Update Access" ON public.site_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Create table for sitemap
CREATE TABLE IF NOT EXISTS public.sitemaps (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for sitemap
DROP TRIGGER IF EXISTS update_sitemaps_updated_at ON public.sitemaps;
CREATE TRIGGER update_sitemaps_updated_at
    BEFORE UPDATE ON public.sitemaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for sitemap
ALTER TABLE public.sitemaps ENABLE ROW LEVEL SECURITY;

-- Allow public read access for sitemap
DROP POLICY IF EXISTS "Public Sitemap Read Access" ON public.sitemaps;
CREATE POLICY "Public Sitemap Read Access" ON public.sitemaps
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Sitemap Access" ON public.sitemaps;
CREATE POLICY "Admin Sitemap Access" ON public.sitemaps
    FOR ALL USING (true) WITH CHECK (true);
