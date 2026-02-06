
import { NavItem, ServiceItem } from './types';

export const NAV_ITEMS: NavItem[] = [
    { label: 'ANA SƏHİFƏ', path: '/' },
    { label: 'HAQQIMIZDA', path: '/about' },
    {
        label: 'XİDMƏTLƏR',
        path: '/services',
        children: [
            { label: 'Vergi xidmətləri', path: '/services/1' },
            { label: 'Maliyyə xidmətləri', path: '/services/2' },
            { label: 'Audit xidmətləri', path: '/services/3' },
            { label: 'Hüquq xidmətləri', path: '/services/4' },
            { label: 'Kadr uçotu', path: '/services/5' }
        ]
    },
    { label: 'BLOQ VƏ XƏBƏRLƏR', path: '/blog' },
    { label: 'AKADEMİYA', path: '/academy' },
    { label: 'AUDİTTV', path: 'https://audittv.az/', isExternal: true }
];

export const SERVICES: ServiceItem[] = [
    {
        id: '1',
        title: 'Vergi xidmətləri',
        description: 'Vergi risklərinin minimuma endirilməsi və hesabatların dəqiq təqdimatı.',
        content: 'Azfin mütəxəssisləri tərəfindən vergi qanunvericiliyinə tam uyğunluğun təmin edilməsi. Biz müştərilərimizə vergi yükünün optimallaşdırılması və dövlət orqanları ilə münasibətlərin peşəkar tənzimlənməsini təklif edirik.',
        benefits: [
            'Vergi hesabatlarının hazırlanması',
            'Vergi yoxlamalarına hazırlıq',
            'Vergi uçotu üzrə konsultasiya',
            'Vergi planlaması və optimallaşdırma'
        ],
        icon: 'file-text'
    },
    {
        id: '2',
        title: 'Maliyyə xidmətləri',
        description: 'Biznesinizin maliyyə göstəricilərinin analizi və hesabatlılığın qurulması.',
        content: 'Şirkətin maliyyə vəziyyətinin tam şəffaf şəkildə əks olunması üçün beynəlxalq standartlara uyğun uçot xidmətləri. Gündəlik əməliyyatlardan strateji maliyyə analizlərinə qədər tam dəstək.',
        benefits: [
            'Maliyyə hesabatlarının tərtib edilməsi',
            'Mənfəət və zərərin hazırlanması',
            'Gündəlik əməliyyatların həyata keçirilməsi',
            'Maliyyə fəaliyyətinin analitikasından'
        ],
        icon: 'calculator'
    },
    {
        id: '3',
        title: 'Audit xidmətləri',
        description: 'Maliyyə hesabatlarının dürüstlüyünün və daxili nəzarətin təsdiqi.',
        content: 'Beynəlxalq Audit Standartlarına (ISA) uyğun olaraq həyata keçirilən kənar və daxili audit yoxlamaları. Biz riskləri aşkarlayır və biznesin səmərəliliyini artırmaq üçün tövsiyələr veririk.',
        benefits: [
            'Maliyyə hesabatlarının auditi',
            'Daxili audit xidmətləri',
            'Xüsusi məqsədli audit yoxlamaları',
            'Risk menecmenti qiymətləndirilməsi'
        ],
        icon: 'search-check'
    },
    {
        id: '4',
        title: 'Hüquq xidmətləri',
        description: 'Biznes fəaliyyətinin hüquqi cəhətdən tam qorunması və dəstəklənməsi.',
        content: 'Müqavilə münasibətlərindən korporativ məsələlərə qədər peşəkar hüquqi yardım. Biznesinizin qanunvericilik qarşısında hər hansı bir boşluq qalmaması üçün çalışırıq.',
        benefits: [
            'Müqavilələrin hüquqi ekspertizası',
            'Korporativ hüquq xidmətləri',
            'Hüquqi rəylərin hazırlanması',
            'Biznesin qeydiyyatı və ləğvi'
        ],
        icon: 'scale'
    },
    {
        id: '5',
        title: 'Kadr uçotu',
        description: 'Əmək qanunvericiliyinə uyğun sənədləşmə və kadr işinin təşkili.',
        content: 'Kadr kargüzarlığının Azərbaycan Respublikasının Əmək Məcəlləsinə uyğun qurulması və idarə edilməsi. İşçi və işəgötürən arasındakı hüquqi münasibətlərin düzgün rəsmiləşdirilməsi.',
        benefits: [
            'Kadr uçotunun təhlili',
            'Kadr uçotunun aparılması',
            'Əmək müqavilələrinin tərtibatı',
            'Əmrlərin və digər normativ sənədlərin hazırlanması',
            'Maddi məsuliyyət və xidmət müqavilələrinin hazırlanması'
        ],
        icon: 'users'
    }
];
