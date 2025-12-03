/**
 * SEO Utilities Module
 * وحدة أدوات SEO
 * 
 * Utility functions for SEO implementation
 */

/**
 * Generate JSON-LD structured data for Organization
 * إنشاء بيانات منظمة JSON-LD للمؤسسة
 */
function generateOrganizationSchema() {
    const config = window.SEO_CONFIG || {};
    const org = config.organization || {};
    
    return {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": org.name,
        "alternateName": org.nameEn,
        "description": org.description,
        "url": config.siteUrl,
        "logo": config.siteLogo,
        "foundingDate": org.foundingDate,
        "founder": {
            "@type": "Person",
            "name": org.founder
        },
        "address": {
            "@type": "PostalAddress",
            "streetAddress": org.address?.streetAddress || "",
            "addressLocality": org.address?.addressLocality || "",
            "addressRegion": org.address?.addressRegion || "",
            "addressCountry": org.address?.addressCountry || "",
            "postalCode": org.address?.postalCode || ""
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": org.contact?.telephone || "",
            "email": org.contact?.email || "",
            "contactType": "customer service",
            "availableLanguage": ["Arabic", "English"]
        },
        "sameAs": [
            org.socialMedia?.youtube || "",
            org.socialMedia?.whatsapp || "",
            org.socialMedia?.facebook || "",
            org.socialMedia?.twitter || ""
        ].filter(url => url && url !== '#'),
        "areaServed": {
            "@type": "City",
            "name": org.address?.addressLocality || ""
        },
        "serviceType": org.services || []
    };
}

/**
 * Generate JSON-LD structured data for Website
 * إنشاء بيانات منظمة JSON-LD للموقع
 */
function generateWebsiteSchema() {
    const config = window.SEO_CONFIG || {};
    
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": config.siteName,
        "alternateName": config.siteNameEn,
        "url": config.siteUrl,
        "description": config.siteDescription,
        "inLanguage": ["ar", "en"],
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": config.siteUrl + "/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        }
    };
}

/**
 * Generate BreadcrumbList schema
 * إنشاء مخطط BreadcrumbList
 */
function generateBreadcrumbSchema(items) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
        }))
    };
}

/**
 * Generate Article schema for news/articles
 * إنشاء مخطط Article للأخبار/المقالات
 */
function generateArticleSchema(article) {
    return {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title,
        "description": article.description,
        "image": article.image || "",
        "datePublished": article.datePublished || new Date().toISOString(),
        "dateModified": article.dateModified || new Date().toISOString(),
        "author": {
            "@type": "Organization",
            "name": window.SEO_CONFIG?.organization?.name || ""
        },
        "publisher": {
            "@type": "Organization",
            "name": window.SEO_CONFIG?.organization?.name || "",
            "logo": {
                "@type": "ImageObject",
                "url": window.SEO_CONFIG?.siteLogo || ""
            }
        }
    };
}

/**
 * Generate FAQPage schema
 * إنشاء مخطط FAQPage
 */
function generateFAQSchema(faqs) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };
}

/**
 * Inject JSON-LD script into head
 * إدراج سكريبت JSON-LD في head
 */
function injectJSONLD(schema) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
}

/**
 * Generate meta tags HTML
 * إنشاء HTML لعلامات meta
 */
function generateMetaTags(pageConfig, pagePath) {
    const config = window.SEO_CONFIG || {};
    const defaultMeta = config.defaultMeta || {};
    const page = config.pages?.[pagePath] || {};
    
    const title = page.title || config.siteName;
    const description = page.description || config.siteDescription;
    const keywords = defaultMeta.keywords;
    const url = config.siteUrl + '/' + pagePath;
    const image = config.siteLogo;
    
    return `
        <title>${title}</title>
        <meta name="description" content="${description}">
        <meta name="keywords" content="${keywords}">
        <meta name="author" content="${defaultMeta.author}">
        <meta name="language" content="${defaultMeta.language}">
        <link rel="canonical" href="${url}">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="${url}">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${image}">
        <meta property="og:locale" content="${defaultMeta.locale}">
        <meta property="og:site_name" content="${config.siteName}">
        
        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="${url}">
        <meta name="twitter:title" content="${title}">
        <meta name="twitter:description" content="${description}">
        <meta name="twitter:image" content="${image}">
        
        <!-- Additional SEO -->
        <meta name="robots" content="index, follow">
        <meta name="googlebot" content="index, follow">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    `;
}

/**
 * Add structured data to page
 * إضافة البيانات المنظمة للصفحة
 */
function addStructuredData(pagePath) {
    // Always add Organization and Website schemas
    const orgSchema = generateOrganizationSchema();
    const websiteSchema = generateWebsiteSchema();
    
    injectJSONLD(orgSchema);
    injectJSONLD(websiteSchema);
    
    // Add breadcrumbs if not homepage
    if (pagePath !== 'index.html' && pagePath !== '/') {
        const breadcrumbs = generateBreadcrumbs(pagePath);
        if (breadcrumbs.length > 0) {
            const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
            injectJSONLD(breadcrumbSchema);
        }
    }
}

/**
 * Generate breadcrumb items based on page path
 * إنشاء عناصر breadcrumb بناءً على مسار الصفحة
 */
function generateBreadcrumbs(pagePath) {
    const config = window.SEO_CONFIG || {};
    const baseUrl = config.siteUrl || '';
    
    const breadcrumbs = [
        { name: 'الرئيسية', url: baseUrl + '/' }
    ];
    
    const pageMap = {
        'about.html': { name: 'عن المركز', url: baseUrl + '/about.html' },
        'courses.html': { name: 'المواد التعليمية', url: baseUrl + '/courses.html' },
        'services.html': { name: 'الخدمات والبرامج', url: baseUrl + '/services.html' },
        'achievements.html': { name: 'الإنجازات', url: baseUrl + '/achievements.html' },
        'gallery.html': { name: 'المعرض', url: baseUrl + '/gallery.html' },
        'contact.html': { name: 'التواصل', url: baseUrl + '/contact.html' },
        'faq.html': { name: 'الأسئلة الشائعة', url: baseUrl + '/faq.html' }
    };
    
    if (pageMap[pagePath]) {
        breadcrumbs.push(pageMap[pagePath]);
    }
    
    return breadcrumbs;
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.generateOrganizationSchema = generateOrganizationSchema;
    window.generateWebsiteSchema = generateWebsiteSchema;
    window.generateBreadcrumbSchema = generateBreadcrumbSchema;
    window.generateArticleSchema = generateArticleSchema;
    window.generateFAQSchema = generateFAQSchema;
    window.injectJSONLD = injectJSONLD;
    window.generateMetaTags = generateMetaTags;
    window.addStructuredData = addStructuredData;
    window.generateBreadcrumbs = generateBreadcrumbs;
}

