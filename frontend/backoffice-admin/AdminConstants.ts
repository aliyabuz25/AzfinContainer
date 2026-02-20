
import {
    Home, Info, Briefcase, Layers, BookOpen, GraduationCap, Phone, Menu, Layout, FileJson, Search, Settings, MessageSquare, Share2
} from 'lucide-react';
import { BlogItem, TrainingItem } from '../types';

export const FIELD_CONFIG = [
    // Settings
    { section: 'settings', category: 'Brendinq', field: 'navbarLogo', label: 'Top Navbar Logosu', type: 'image' },
    { section: 'settings', category: 'Brendinq', field: 'footerLogo', label: 'Footer Logosu', type: 'image' },
    { section: 'settings', category: 'Brendinq', field: 'siteTitle', label: 'Saytın Adı (Title)' },
    { section: 'settings', category: 'SEO və Meta', field: 'siteDescription', label: 'Sayt Təsviri (Description)', multiline: true },
    { section: 'settings', category: 'SEO və Meta', field: 'seoKeywords', label: 'Açar Sözlər (Keywords)' },
    { section: 'settings', category: 'Əlaqə Məlumatları', field: 'contactEmail', label: 'Əsas E-poçt' },
    { section: 'settings', category: 'Əlaqə Məlumatları', field: 'contactPhone', label: 'Əsas Əlaqə Nömrəsi' },

    // Home
    { section: 'home', category: 'Giriş (Hero)', field: 'heroBadge', label: 'Hero - Kiçik Başlıq (Badge)' },
    { section: 'home', category: 'Giriş (Hero)', field: 'heroTitlePrefix', label: 'Hero - Başlıq (Ön hissə)' },
    { section: 'home', category: 'Giriş (Hero)', field: 'heroTitleHighlight', label: 'Hero - Başlıq (Vurğulanan)' },
    { section: 'home', category: 'Giriş (Hero)', field: 'heroTitleSuffix', label: 'Hero - Başlıq (Son hissə)' },
    { section: 'home', category: 'Giriş (Hero)', field: 'heroSummary', label: 'Hero - Qısa Məlumat', multiline: true },
    { section: 'home', category: 'Giriş (Hero)', field: 'heroPrimaryAction', label: 'Hero - Əsas Düymə' },
    { section: 'home', category: 'Giriş (Hero)', field: 'heroPrimaryActionUrl', label: 'Hero - Əsas Düymə URL', hideInMainLoop: true },
    { section: 'home', category: 'Giriş (Hero)', field: 'heroSecondaryAction', label: 'Hero - İkinci Düymə' },
    { section: 'home', category: 'Giriş (Hero)', field: 'heroSecondaryActionUrl', label: 'Hero - İkinci Düymə URL', hideInMainLoop: true },
    { section: 'home', category: 'Giriş (Hero)', field: 'heroImage', label: 'Hero - Arxa Fon Şəkli', type: 'image' },
    { section: 'home', category: 'Giriş (Hero)', field: 'heroExperienceLabel', label: 'Hero - Təcrübə Etiketi' },
    { section: 'home', category: 'Giriş (Hero)', field: 'heroExperienceValue', label: 'Hero - Təcrübə Dəyəri' },
    { section: 'home', category: 'Giriş (Hero)', field: 'heroExperienceSublabel', label: 'Hero - Təcrübə Alt Etiketi' },

    { section: 'home', category: 'Statistika', field: 'statsHeading', label: 'Statistika Bölməsi - Başlıq' },
    { section: 'home', category: 'Statistika', field: 'statsSummary', label: 'Statistika Bölməsi - Təsvir', multiline: true },
    { section: 'home', category: 'Statistika', field: 'stats', label: 'Statistika Maddələri', type: 'array-object' },

    { section: 'home', category: 'Xidmətlər', field: 'servicesHeading', label: 'Xidmətlər Bölməsi - Başlıq' },
    { section: 'home', category: 'Xidmətlər', field: 'servicesSubtitle', label: 'Xidmətlər Bölməsi - Alt Başlıq' },
    { section: 'home', category: 'Xidmətlər', field: 'servicesSummary', label: 'Xidmətlər Bölməsi - Təsvir', multiline: true },

    { section: 'home', category: 'Sektorlar', field: 'sectorsHeading', label: 'Sektorlar Bölməsi - Başlıq', multiline: true },
    { section: 'home', category: 'Sektorlar', field: 'sectors', label: 'Sektorlar Siyahısı', type: 'array-object' },

    { section: 'home', category: 'Proses', field: 'processHeading', label: 'Proses Bölməsi - Başlıq' },
    { section: 'home', category: 'Proses', field: 'processSummary', label: 'Proses Bölməsi - Təsvir', multiline: true },
    { section: 'home', category: 'Proses', field: 'process', label: 'İş Prosesi Maddələri', type: 'array-object' },

    { section: 'home', category: 'Digər', field: 'clientsHeading', label: 'Müştərilər Bölməsi - Başlıq' },
    { section: 'home', category: 'Digər', field: 'clients', label: 'Müştərilər / Tərəfdaşlar', type: 'array-object' },
    { section: 'home', category: 'Digər', field: 'ctaHeading', label: 'Alt CTA - Başlıq' },
    { section: 'home', category: 'Digər', field: 'ctaButtonText', label: 'Alt CTA - Düymə Mətni' },
    { section: 'home', category: 'Digər', field: 'ctaButtonUrl', label: 'Alt CTA - Düymə URL', hideInMainLoop: true },
    { section: 'home', category: 'Digər', field: 'sections', label: 'Ana Səhifə Bölmə Meta Siyahısı', type: 'array-object' },

    // About
    { section: 'about', category: 'Giriş', field: 'introBadge', label: 'Haqqımızda - Nişan (Badge)' },
    { section: 'about', category: 'Giriş', field: 'introSummary', label: 'Haqqımızda - Ümumi Giriş', multiline: true },
    { section: 'about', category: 'Giriş', field: 'headerTitlePrefix', label: 'Haqqımızda - Başlıq (Ön hissə)' },
    { section: 'about', category: 'Giriş', field: 'headerTitleHighlight', label: 'Haqqımızda - Başlıq (Vurğulanan)' },
    { section: 'about', category: 'İcmal', field: 'overviewTitle', label: 'İcmal - Başlıq' },
    { section: 'about', category: 'İcmal', field: 'overviewSummary', label: 'İcmal - Təsvir', multiline: true },
    { section: 'about', category: 'İcmal', field: 'overviewImage', label: 'İcmal - Şəkil', type: 'image' },
    { section: 'about', category: 'Missiya', field: 'missionTitle', label: 'Missiya - Başlıq' },
    { section: 'about', category: 'Missiya', field: 'missionSummary', label: 'Missiya - Təsvir', multiline: true },
    { section: 'about', category: 'Missiya', field: 'missionImage', label: 'Missiya - Şəkil', type: 'image' },
    { section: 'about', category: 'Xidmət Sahələri', field: 'serviceTitle', label: 'Xidmət Sahələri - Başlıq' },
    { section: 'about', category: 'Xidmət Sahələri', field: 'serviceSummary', label: 'Xidmət Sahələri - Təsvir', multiline: true },
    { section: 'about', category: 'Komanda', field: 'team', label: 'Komanda Üzvləri', type: 'array-object' },
    { section: 'about', category: 'Digər', field: 'testimonials', label: 'Müştəri Rəyləri Siyahısı', type: 'array-object' },
    { section: 'about', category: 'Digər', field: 'testimonialsTitle', label: 'Rəylər Bölməsi - Başlıq' },
    { section: 'about', category: 'Digər', field: 'testimonialsCTA', label: 'Rəylər Bölməsi - Alt CTA', multiline: true },
    { section: 'about', category: 'Naviqasiya', field: 'tabs', label: 'Yan Panel Tabları', type: 'array-object' },

    // Services Page
    { section: 'services', category: 'Giriş (Hero)', field: 'heroBadge', label: 'Səhifə Nişanı (Badge)' },
    { section: 'services', category: 'Giriş (Hero)', field: 'heroTitlePrefix', label: 'Başlıq (Ön hissə)' },
    { section: 'services', category: 'Giriş (Hero)', field: 'heroTitleHighlight', label: 'Başlıq (Vurğulanan)' },
    { section: 'services', category: 'Giriş (Hero)', field: 'heroTitleSuffix', label: 'Başlıq (Son hissə)' },
    { section: 'services', category: 'Giriş (Hero)', field: 'heroSummary', label: 'Qısa Məlumat', multiline: true },
    { section: 'services', category: 'Giriş (Hero)', field: 'heroImage', label: 'Arxa Fon Şəkli', type: 'image' },
    { section: 'services', category: 'Siyahı', field: 'list', label: 'Xidmətlər', type: 'array-object' },

    // Service Detail (servicedetail section)
    { section: 'servicedetail', category: 'Giriş', field: 'heroBadge', label: 'Xidmət Detalı - Nişan (Badge)' },
    { section: 'servicedetail', category: 'Giriş', field: 'heroSummary', label: 'Xidmət Detalı - Hero Təsvir', multiline: true },
    { section: 'servicedetail', category: 'Parametrlər', field: 'summaryStandard', label: 'Xidmət Standartı Prefix', multiline: true },
    { section: 'servicedetail', category: 'Parametrlər', field: 'summaryDuration', label: 'Xidmət Müddəti Prefix', multiline: true },
    { section: 'servicedetail', category: 'Parametrlər', field: 'summaryCTA', label: 'Düymə Yazısı (CTA)' },
    { section: 'servicedetail', category: 'Məzmun', field: 'content', label: 'Geniş Məlumat (Alt hissə)', multiline: true },
    { section: 'servicedetail', category: 'Məzmun', field: 'benefits', label: 'Xidmətə Daxil Olanlar (List)', type: 'array' },
    { section: 'servicedetail', category: 'Başlıqlar', field: 'scopeTitle', label: 'Əhatə Dairəsi Başlığı', multiline: true },
    { section: 'servicedetail', category: 'Başlıqlar', field: 'summaryTitle', label: 'Xülasə Bölməsi Başlığı', multiline: true },
    { section: 'servicedetail', category: 'Başlıqlar', field: 'benefitsTitle', label: 'İstiqamətlər Bölməsi Başlığı', multiline: true },
    { section: 'servicedetail', category: 'Başlıqlar', field: 'durationLabel', label: 'Müddət Etiketi', multiline: true },
    { section: 'servicedetail', category: 'Başlıqlar', field: 'standardLabel', label: 'Standart Etiketi', multiline: true },
    { section: 'servicedetail', category: 'Başlıqlar', field: 'consultationTitle', label: 'Məsləhət Başlığı', multiline: true },

    // Blog Page
    { section: 'blog', category: 'Giriş (Hero)', field: 'heroTitlePrefix', label: 'Başlıq (Ön hissə)' },
    { section: 'blog', category: 'Giriş (Hero)', field: 'heroTitleHighlight', label: 'Başlıq (Vurğulanan)' },
    { section: 'blog', category: 'Giriş (Hero)', field: 'heroSummary', label: 'Qısa Məlumat', multiline: true },
    { section: 'blog', category: 'Giriş (Hero)', field: 'heroImage', label: 'Arxa Fon Şəkli', type: 'image' },
    { section: 'blog', category: 'Parametrlər', field: 'blogBadge', label: 'Bloq Nişanı (Badge)' },
    { section: 'blog', category: 'Parametrlər', field: 'readMoreText', label: 'Daha çox oxu düyməsi' },
    { section: 'blog', category: 'Sistem Mesajları', field: 'loadingText', label: 'Yüklənmə mətni' },
    { section: 'blog', category: 'Sistem Mesajları', field: 'emptyText', label: 'Boş olduqda görünən mətn' },

    // Academy Page
    { section: 'academy', category: 'Giriş (Hero)', field: 'heroBadge', label: 'Akademiya Nişanı (Badge)' },
    { section: 'academy', category: 'Giriş (Hero)', field: 'heroTitlePrefix', label: 'Başlıq (Ön hissə)' },
    { section: 'academy', category: 'Giriş (Hero)', field: 'heroTitleHighlight', label: 'Başlıq (Vurğulanan)' },
    { section: 'academy', category: 'Giriş (Hero)', field: 'heroSummary', label: 'Qısa Məlumat', multiline: true },
    { section: 'academy', category: 'Giriş (Hero)', field: 'heroImage', label: 'Arxa Fon Şəkli', type: 'image' },
    { section: 'academy', category: 'Parametrlər', field: 'cardCTA', label: 'Kurs Düyməsi (Müraciət)' },
    { section: 'academy', category: 'Parametrlər', field: 'sidebarNote', label: 'Yan Panel Qeydi', multiline: true },
    { section: 'academy', category: 'Sistem Mesajları', field: 'loadingText', label: 'Yüklənmə mətni' },
    { section: 'academy', category: 'Sistem Mesajları', field: 'emptyText', label: 'Boş olduqda görünən mətn' },

    // Contact
    { section: 'contact', category: 'Giriş (Hero)', field: 'headerTitle', label: 'Başlıq (Ön hissə)' },
    { section: 'contact', category: 'Giriş (Hero)', field: 'headerHighlight', label: 'Başlıq (Vurğulanan)' },
    { section: 'contact', category: 'Giriş (Hero)', field: 'headerSuffix', label: 'Başlıq (Son hissə)' },
    { section: 'contact', category: 'Giriş (Hero)', field: 'headerSummary', label: 'Qısa Məlumat', multiline: true },
    { section: 'contact', category: 'Giriş (Hero)', field: 'contactBadge', label: 'Əlaqə Nişanı (Badge)' },

    { section: 'contact', category: 'Ünvan və Əlaqə', field: 'address', label: 'Ofis Ünvanı' },
    { section: 'contact', category: 'Ünvan və Əlaqə', field: 'phone', label: 'Telefon Nömrəsi' },
    { section: 'contact', category: 'Ünvan və Əlaqə', field: 'email', label: 'E-poçt Ünvanı' },
    { section: 'contact', category: 'Ünvan və Əlaqə', field: 'hours', label: 'İş Saatları' },

    { section: 'contact', category: 'Əlaqə Forması', field: 'formTitle', label: 'Form Başlığı' },
    { section: 'contact', category: 'Əlaqə Forması', field: 'formSubtitle', label: 'Form Alt Başlığı', multiline: true },
    { section: 'contact', category: 'Əlaqə Forması', field: 'formNameLabel', label: 'Ad Sahəsi Etiketi' },
    { section: 'contact', category: 'Əlaqə Forması', field: 'formEmailLabel', label: 'E-poçt Sahəsi Etiketi' },
    { section: 'contact', category: 'Əlaqə Forması', field: 'formServiceLabel', label: 'Xidmət Seçimi Etiketi' },
    { section: 'contact', category: 'Əlaqə Forması', field: 'formMessageLabel', label: 'Mesaj Sahəsi Etiketi' },
    { section: 'contact', category: 'Əlaqə Forması', field: 'formButtonText', label: 'Form Düymə Mətni' },
    { section: 'contact', category: 'Digər', field: 'socialTitle', label: 'Sosial Media Başlığı' },

    // Social
    { section: 'social', category: 'Sosial Media', field: 'title', label: 'Sosial Başlıq' },
    { section: 'social', category: 'Sosial Media', field: 'links', label: 'Sosial Linklər', type: 'array-object' },

    // Forms
    { section: 'forms', category: 'Audit Formu', field: 'auditFormName', label: 'Audit Formu - Daxili Ad' },
    { section: 'forms', category: 'Audit Formu', field: 'auditModalTitle', label: 'Audit Formu - Başlıq' },
    { section: 'forms', category: 'Audit Formu', field: 'generalModalTitle', label: 'Ümumi Xidmət Formu - Başlıq' },
    { section: 'forms', category: 'Audit Formu', field: 'auditSelectedServiceLabel', label: 'Audit Formu - Seçilən Xidmət Etiketi' },
    { section: 'forms', category: 'Audit Formu', field: 'auditBusinessTypeLabel', label: 'Audit Formu - Fəaliyyət Etiketi' },
    { section: 'forms', category: 'Audit Formu', field: 'auditTaxTypeLabel', label: 'Audit Formu - Vergi Etiketi' },
    { section: 'forms', category: 'Audit Formu', field: 'auditClientStatusLabel', label: 'Audit Formu - Status Etiketi' },
    { section: 'forms', category: 'Audit Formu', field: 'auditNameLabel', label: 'Audit Formu - Ad Soyad Etiketi' },
    { section: 'forms', category: 'Audit Formu', field: 'auditPhoneLabel', label: 'Audit Formu - Telefon Etiketi' },
    { section: 'forms', category: 'Audit Formu', field: 'auditEmailLabel', label: 'Audit Formu - Email Etiketi' },
    { section: 'forms', category: 'Audit Formu', field: 'auditSelectPlaceholder', label: 'Audit Formu - Seçim Placeholder' },
    { section: 'forms', category: 'Audit Formu', field: 'auditBusinessTypeOptions', label: 'Audit Formu - Fəaliyyət Seçimləri', type: 'array' },
    { section: 'forms', category: 'Audit Formu', field: 'auditTaxTypeOptions', label: 'Audit Formu - Vergi Seçimləri', type: 'array' },
    { section: 'forms', category: 'Audit Formu', field: 'auditClientStatusOptions', label: 'Audit Formu - Status Seçimləri', type: 'array' },
    { section: 'forms', category: 'Audit Formu', field: 'auditNamePlaceholder', label: 'Audit Formu - Ad Placeholder' },
    { section: 'forms', category: 'Audit Formu', field: 'auditPhonePlaceholder', label: 'Audit Formu - Telefon Placeholder' },
    { section: 'forms', category: 'Audit Formu', field: 'auditEmailPlaceholder', label: 'Audit Formu - Email Placeholder' },
    { section: 'forms', category: 'Audit Formu', field: 'auditSubmitButton', label: 'Audit Formu - Göndər Düyməsi' },
    { section: 'forms', category: 'Audit Formu', field: 'auditSubmitLoading', label: 'Audit Formu - Göndərilir Mətni' },
    { section: 'forms', category: 'Audit Formu', field: 'auditSuccessTitle', label: 'Audit Formu - Uğur Başlığı' },
    { section: 'forms', category: 'Audit Formu', field: 'auditSuccessMessage', label: 'Audit Formu - Uğur Mesajı', multiline: true },
    { section: 'forms', category: 'Audit Formu', field: 'auditSuccessButton', label: 'Audit Formu - Uğur Düyməsi' },

    { section: 'forms', category: 'Təlim Formu', field: 'trainingFormName', label: 'Təlim Formu - Daxili Ad' },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingModalTitle', label: 'Təlim Formu - Başlıq' },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingIntroTemplate', label: 'Təlim Formu - Giriş Mətni ({trainingTitle})', multiline: true },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingNameLabel', label: 'Təlim Formu - Ad Etiketi' },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingPhoneLabel', label: 'Təlim Formu - Telefon Etiketi' },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingEmailLabel', label: 'Təlim Formu - Email Etiketi' },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingNoteLabel', label: 'Təlim Formu - Qeyd Etiketi' },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingNamePlaceholder', label: 'Təlim Formu - Ad Placeholder' },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingPhonePlaceholder', label: 'Təlim Formu - Telefon Placeholder' },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingEmailPlaceholder', label: 'Təlim Formu - Email Placeholder' },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingNotePlaceholder', label: 'Təlim Formu - Qeyd Placeholder' },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingSubmitButton', label: 'Təlim Formu - Göndər Düyməsi' },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingSubmitLoading', label: 'Təlim Formu - Göndərilir Mətni' },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingSuccessTitle', label: 'Təlim Formu - Uğur Başlığı' },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingSuccessMessage', label: 'Təlim Formu - Uğur Mesajı', multiline: true },
    { section: 'forms', category: 'Təlim Formu', field: 'trainingSuccessButton', label: 'Təlim Formu - Uğur Düyməsi' },

    { section: 'forms', category: 'Əlaqə Formu', field: 'contactFormName', label: 'Əlaqə Formu - Daxili Ad' },
    { section: 'forms', category: 'Əlaqə Formu', field: 'contactPhoneLabel', label: 'Əlaqə Formu - Telefon Etiketi' },
    { section: 'forms', category: 'Əlaqə Formu', field: 'contactServiceOptions', label: 'Əlaqə Formu - Xidmət Seçimləri', type: 'array' },
    { section: 'forms', category: 'Əlaqə Formu', field: 'contactSubmitLoading', label: 'Əlaqə Formu - Göndərilir Mətni' },
    { section: 'forms', category: 'Əlaqə Formu', field: 'contactSuccessTitle', label: 'Əlaqə Formu - Uğur Başlığı' },
    { section: 'forms', category: 'Əlaqə Formu', field: 'contactSuccessMessage', label: 'Əlaqə Formu - Uğur Mesajı', multiline: true },
    { section: 'forms', category: 'Əlaqə Formu', field: 'contactSuccessButton', label: 'Əlaqə Formu - Uğur Düyməsi' },

    // Navigation
    { section: 'navigation', category: 'Parametrlər', field: 'primaryCTA', label: 'Əsas Menyu Düyməsi (Əlaqə)' },
    { section: 'navigation', category: 'Menyu', field: 'items', label: 'Menyu Maddələri', type: 'array-object' },

    // Footer
    { section: 'footer', category: 'Brendinq', field: 'brandText', label: 'Logo mətni (logo yoxdursa)' },
    { section: 'footer', category: 'Məzmun', field: 'description', label: 'Footer Təsviri', multiline: true },
    { section: 'footer', category: 'Naviqasiya', field: 'navTitle', label: 'Naviqasiya Sütunu Başlığı' },
    { section: 'footer', category: 'Naviqasiya', field: 'navLinks', label: 'Naviqasiya Linkləri', type: 'array-object' },
    { section: 'footer', category: 'Xidmətlər', field: 'servicesTitle', label: 'Xidmətlər Sütunu Başlığı' },
    { section: 'footer', category: 'Xidmətlər', field: 'serviceLinks', label: 'Xidmət Linkləri', type: 'array-object' },
    { section: 'footer', category: 'Akademiya', field: 'academyTitle', label: 'Akademiya Sütunu Başlığı' },
    { section: 'footer', category: 'Akademiya', field: 'academyLinks', label: 'Akademiya Linkləri (Manual)', type: 'array-object' },
    { section: 'footer', category: 'Akademiya', field: 'academyAllLabel', label: 'Bütün Təlimlər Mətni' },
    { section: 'footer', category: 'Akademiya', field: 'academyLoadingText', label: 'Akademiya yüklənmə mətni' },
    { section: 'footer', category: 'Akademiya', field: 'academyEmptyText', label: 'Akademiya boş mətni' },
    { section: 'footer', category: 'Digər', field: 'socialHint', label: 'Sosial Media İpucu (Bizi izləyin)' },
];

export const DEFAULT_BLOG_FORM: Omit<BlogItem, 'id'> = {
    title: '',
    excerpt: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    author: 'Azfin Ekspert',
    image: '',
    category: '',
    status: 'draft',
};

export const DEFAULT_TRAINING_FORM: Omit<TrainingItem, 'id'> = {
    title: '',
    description: '',
    fullContent: '',
    startDate: '',
    duration: '',
    level: '',
    image: '',
    status: 'upcoming',
};

export const FIELD_LABEL_OVERRIDES: Record<string, string> = {
    heroBadge: 'Hero badge',
    heroTitlePrefix: 'Hero title (prefix)',
    heroTitleHighlight: 'Hero title (highlight)',
    heroTitleSuffix: 'Hero title (suffix)',
    heroPrimaryAction: 'Hero primary CTA',
    heroSecondaryAction: 'Hero secondary CTA',
    statsHeading: 'Stats heading',
    statsSummary: 'Stats summary',
    servicesHeading: 'Services heading',
    servicesSubtitle: 'Services subtitle',
    sectorsHeading: 'Sectors heading',
    processHeading: 'Process heading',
    processSummary: 'Process summary',
    clientsHeading: 'Clients heading',
    ctaHeading: 'CTA heading',
    ctaButtonText: 'CTA button',
    overviewTitle: 'Overview title',
    overviewSummary: 'Overview summary',
    missionTitle: 'Mission title',
    missionSummary: 'Mission summary',
    serviceTitle: 'Service title',
    serviceSummary: 'Service summary',
    testimonialsTitle: 'Testimonials heading',
    introBadge: 'Intro badge',
    introSummary: 'Intro summary',
    loadingText: 'Loading text',
    emptyText: 'Empty text',
    heroSummary: 'Hero summary',
    summaryStandard: 'Xidmət Standartı',
    summaryDuration: 'Xidmət Müddəti',
    summaryCTA: 'Düymə Yazısı (CTA)',
    content: 'Xidmət Haqqında Geniş Məlumat',
    benefits: 'Xidmətə Daxil Olan İstiqamətlər',
    scopeTitle: 'Əhatə Dairəsi Başlığı',
    summaryTitle: 'Xülasə Bölməsi Başlığı',
    benefitsTitle: 'İstiqamətlər Bölməsi Başlığı',
    durationLabel: 'Müddət Etiketi',
    durationValue: 'Müddət Dəyəri',
    standardLabel: 'Standart Etiketi',
    standardValue: 'Standart Dəyəri',
    consultationTitle: 'Məsləhət Başlığı',
};

export const ACRONYMS = new Set(['CTA', 'URL', 'API', 'ID', 'SEO']);

export const formatFieldLabel = (key: string) => {
    if (!key) return '';
    if (FIELD_LABEL_OVERRIDES[key]) return FIELD_LABEL_OVERRIDES[key];

    if (/^\d+$/.test(key)) {
        return `Məlumat ${parseInt(key, 10) + 1}`;
    }

    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .split(' ')
        .map((word) => (ACRONYMS.has(word.toUpperCase()) ? word.toUpperCase() : word))
        .join(' ');
};

export const getSectionIcon = (key: string) => {
    switch (key.toLowerCase()) {
        case 'home': return Home;
        case 'about': return Info;
        case 'services': return Briefcase;
        case 'servicedetail': return Layers;
        case 'blog': return BookOpen;
        case 'academy': return GraduationCap;
        case 'contact': return Phone;
        case 'navigation': return Menu;
        case 'footer': return Layout;
        case 'settings': return Settings;
        case 'forms': return MessageSquare;
        case 'social': return Share2;
        case 'mode_site': return FileJson;
        case 'mode_blog': return BookOpen;
        case 'mode_sitemap': return Search;
        default: return Layers;
    }
};

export const getSectionLabel = (key: string) => {
    switch (key.toLowerCase()) {
        case 'home': return 'Ana Səhifə';
        case 'about': return 'Haqqımızda';
        case 'services': return 'Xidmətlər';
        case 'servicedetail': return 'Xidmət Detalı';
        case 'blog': return 'Bloq Səhifəsi';
        case 'academy': return 'Akademiya';
        case 'contact': return 'Əlaqə';
        case 'navigation': return 'Naviqasiya';
        case 'footer': return 'Footer';
        case 'settings': return 'Site Tənzimləmələri';
        case 'forms': return 'Formlar';
        case 'social': return 'Sosial';
        default: return key.charAt(0).toUpperCase() + key.slice(1);
    }
};
