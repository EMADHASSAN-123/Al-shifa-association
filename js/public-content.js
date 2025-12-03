/**
 * Public Content Display
 * عرض المحتوى في الصفحات العامة
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Load content based on current page
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        await loadHomePageContent();
    } else if (path.includes('courses.html')) {
        await loadCoursesPage();
    } else if (path.includes('achievements.html')) {
        await loadAchievementsPage();
    } else if (path.includes('gallery.html')) {
        await loadGalleryPage();
    }
});

/**
 * Load home page content
 * تحميل محتوى الصفحة الرئيسية
 */
async function loadHomePageContent() {
    // Load news
    await loadNews();
    
    // Load courses
    await loadCourses();
    
    // Load achievements preview
    await loadAchievementsPreview();
}

/**
 * Load news section
 * تحميل قسم الأخبار
 */
async function loadNews() {
    const result = await getPublicContent('news', 3);
    const newsSection = document.getElementById('newsSection');
    
    if (!newsSection) return;
    
    if (result.success && result.data && result.data.length > 0) {
        newsSection.innerHTML = result.data.map(item => {
            const date = new Date(item.created_at);
            const formattedDate = date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const imageUrl = item.image_url || '';
            const imageDisplay = imageUrl 
                ? `<img src="${imageUrl}" alt="${item.title}" class="w-full h-48 object-cover">`
                : `<div class="bg-amber-200 h-48 flex items-center justify-center">
                    <i class="fas fa-newspaper text-5xl text-amber-700"></i>
                   </div>`;
            
            return `
                <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                    ${imageDisplay}
                    <div class="p-6">
                        <span class="text-amber-600 text-sm">${formattedDate}</span>
                        <h3 class="text-xl font-bold text-amber-900 mt-2 mb-3">${item.title}</h3>
                        <p class="text-gray-600 mb-4">${item.description ? item.description.substring(0, 100) + '...' : ''}</p>
                        <a href="news-article.html?id=${item.id}" class="text-amber-700 hover:text-amber-900 font-semibold">اقرأ المزيد <i class="fas fa-arrow-left"></i></a>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        newsSection.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-gray-600">لا توجد أخبار حالياً</p>
            </div>
        `;
    }
}

/**
 * Load courses section
 * تحميل قسم الدورات
 */
async function loadCourses() {
    const result = await getPublicContent('courses', 3);
    const coursesSection = document.querySelector('#coursesSection, .courses-container');
    
    if (!coursesSection) return;
    
    if (result.success && result.data && result.data.length > 0) {
        // Update courses section if exists
        // This will be implemented based on the actual HTML structure
    }
}

/**
 * Load achievements preview
 * تحميل معاينة الإنجازات
 */
async function loadAchievementsPreview() {
    const result = await getPublicContent('news', 3); // Using news type for achievements
    // Implementation based on page structure
}

/**
 * Load courses page
 * تحميل صفحة الدورات
 */
async function loadCoursesPage() {
    const result = await getPublicContent('courses');
    // Implementation for courses page
}

/**
 * Load achievements page
 * تحميل صفحة الإنجازات
 */
async function loadAchievementsPage() {
    const result = await getPublicContent('news');
    // Implementation for achievements page
}

/**
 * Load gallery page
 * تحميل صفحة المعرض
 */
async function loadGalleryPage() {
    // Load images from Supabase Storage
    // Implementation for gallery
}

