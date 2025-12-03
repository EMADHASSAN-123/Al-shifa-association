/**
 * SEO Configuration Module
 * وحدة إعدادات SEO
 * 
 * Centralized SEO configuration for the website
 */

const SEO_CONFIG = {
    // Site Information
    siteName: 'مركز الشفاء لتعليم القرآن الكريم',
    siteNameEn: 'Al-Shifa Center for Quran Education',
    siteDescription: 'مركز متخصص في تعليم القرآن الكريم وعلومه - تعليم التلاوة والحفظ والتجويد بأساليب حديثة ومتطورة في جبل حبشي، اليمن',
    siteDescriptionEn: 'Specialized center for teaching the Holy Quran and its sciences - teaching recitation, memorization, and Tajweed with modern methods in Jabal Habashi, Yemen',
    siteUrl: 'https://yourdomain.com', // Update with your actual domain
    siteLogo: 'https://yourdomain.com/images/logo.png', // Update with your actual logo URL
    
    // Organization Information
    organization: {
        name: 'مركز الشفاء لتعليم القرآن الكريم',
        nameEn: 'Al-Shifa Center for Quran Education',
        description: 'مركز تعليمي مجتمعي تأسس في 2 مارس 2018 في مديرية جبل حبشي، اليمن، بهدف غرس حب القرآن في النفوس وتخريج حفظة متقنين. يقدم المركز حلقات تحفيظ، ودورات تدريبية للمعلمين، وتعليم التجويد للصغار والكبار، وبرامج تربوية متخصصة.',
        descriptionEn: 'A community educational center established on March 2, 2018 in Jabal Habashi District, Yemen, with the aim of instilling love for the Quran and graduating proficient memorizers. The center offers memorization circles, teacher training courses, Tajweed teaching for children and adults, and specialized educational programs.',
        foundingDate: '2018-03-02',
        founder: 'شفاء محمد حسان',
        founderEn: 'Shifa Mohammed Hassan',
        address: {
            streetAddress: 'جبل حبشي',
            addressLocality: 'تعز',
            addressRegion: 'اليمن',
            addressCountry: 'YE',
            postalCode: ''
        },
        contact: {
            telephone: '+966553273660',
            email: 'alshifacenter874@gmail.com',
            website: 'https://yourdomain.com'
        },
        socialMedia: {
            youtube: 'https://youtube.com/channel/UC_4oT1OEXRwHF2gooTDH1cA',
            whatsapp: '#',
            // Add more social media links as needed
        },
        services: [
            'تعليم القرآن الكريم',
            'حفظ القرآن',
            'تعليم التجويد',
            'دورات تدريبية للمعلمين',
            'برامج تربوية',
            'حلقات تحفيظ'
        ],
        servicesEn: [
            'Quran Education',
            'Quran Memorization',
            'Tajweed Teaching',
            'Teacher Training Courses',
            'Educational Programs',
            'Memorization Circles'
        ],
        supervisor: 'الشيخ فخر الدين القحطاني',
        supervisorEn: 'Sheikh Fakhruddin Al-Qahtani',
        accreditation: 'مؤسسة هائل سعيد أنعم',
        accreditationEn: 'Hayel Saeed Anam Foundation'
    },
    
    // Default Meta Tags
    defaultMeta: {
        keywords: 'تعليم القرآن, حفظ القرآن, تلاوة القرآن, تجويد, مركز تعليمي, القرآن الكريم, جبل حبشي, اليمن, حلقات تحفيظ, دورات تجويد',
        keywordsEn: 'Quran education, Quran memorization, Quran recitation, Tajweed, educational center, Holy Quran, Jabal Habashi, Yemen, memorization circles, Tajweed courses',
        author: 'مركز الشفاء لتعليم القرآن الكريم',
        language: 'ar',
        locale: 'ar_SA',
        localeEn: 'en_US'
    },
    
    // Page-specific configurations
    pages: {
        'index.html': {
            title: 'مركز الشفاء لتعليم القرآن الكريم - الصفحة الرئيسية',
            titleEn: 'Al-Shifa Center for Quran Education - Home',
            description: 'مركز الشفاء لتعليم القرآن الكريم - تعليم التلاوة والحفظ والتجويد بأساليب حديثة ومتطورة. يخدم أكثر من 800 طالب وطالبة ويُعد الحاضن القرآني الوحيد في جبل حبشي.',
            descriptionEn: 'Al-Shifa Center for Quran Education - Teaching recitation, memorization, and Tajweed with modern methods. Serves over 800 students and is the only Quranic incubator in Jabal Habashi.'
        },
        'about.html': {
            title: 'عن المركز - مركز الشفاء لتعليم القرآن',
            titleEn: 'About Us - Al-Shifa Center for Quran Education',
            description: 'تعرف على مركز الشفاء لتعليم القرآن الكريم - تأسس في 2018 في جبل حبشي، اليمن. يقدم برامج تعليمية متخصصة في القرآن الكريم وعلومه.',
            descriptionEn: 'Learn about Al-Shifa Center for Quran Education - Established in 2018 in Jabal Habashi, Yemen. Offers specialized educational programs in the Holy Quran and its sciences.'
        },
        'courses.html': {
            title: 'المواد التعليمية - مركز الشفاء',
            titleEn: 'Educational Courses - Al-Shifa Center',
            description: 'استكشف المواد التعليمية والدورات المتاحة في مركز الشفاء لتعليم القرآن الكريم - دورات التلاوة، التجويد، والحفظ.',
            descriptionEn: 'Explore educational materials and courses available at Al-Shifa Center for Quran Education - Recitation, Tajweed, and memorization courses.'
        },
        'services.html': {
            title: 'الخدمات والبرامج - مركز الشفاء',
            titleEn: 'Services and Programs - Al-Shifa Center',
            description: 'اكتشف الخدمات والبرامج التعليمية المقدمة في مركز الشفاء - حلقات تحفيظ، دورات تدريبية، وبرامج تربوية متخصصة.',
            descriptionEn: 'Discover educational services and programs offered at Al-Shifa Center - Memorization circles, training courses, and specialized educational programs.'
        },
        'contact.html': {
            title: 'التواصل معنا - مركز الشفاء',
            titleEn: 'Contact Us - Al-Shifa Center',
            description: 'تواصل مع مركز الشفاء لتعليم القرآن الكريم - نحن هنا للإجابة على استفساراتك ومساعدتك.',
            descriptionEn: 'Contact Al-Shifa Center for Quran Education - We are here to answer your inquiries and help you.'
        },
        'gallery.html': {
            title: 'معرض الصور والفيديوهات - مركز الشفاء',
            titleEn: 'Gallery - Al-Shifa Center',
            description: 'تصفح معرض صور وفيديوهات مركز الشفاء - شاهد إنجازاتنا وأنشطتنا التعليمية.',
            descriptionEn: 'Browse Al-Shifa Center gallery - View our achievements and educational activities.'
        },
        'achievements.html': {
            title: 'إنجازاتنا - مركز الشفاء',
            titleEn: 'Our Achievements - Al-Shifa Center',
            description: 'اكتشف إنجازات مركز الشفاء - أكثر من 40 خاتم للقرآن وأكثر من 800 طالب نشط.',
            descriptionEn: 'Discover Al-Shifa Center achievements - Over 40 Quran completers and more than 800 active students.'
        },
        'faq.html': {
            title: 'الأسئلة الشائعة - مركز الشفاء',
            titleEn: 'Frequently Asked Questions - Al-Shifa Center',
            description: 'إجابات على الأسئلة الشائعة حول مركز الشفاء لتعليم القرآن الكريم - معلومات عن التسجيل، البرامج، والخدمات.',
            descriptionEn: 'Answers to frequently asked questions about Al-Shifa Center for Quran Education - Information about registration, programs, and services.'
        }
    }
};

// Make config available globally
if (typeof window !== 'undefined') {
    window.SEO_CONFIG = SEO_CONFIG;
}

