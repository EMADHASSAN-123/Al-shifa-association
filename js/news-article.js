/**
 * News Article Page
 * صفحة المقال الإخباري
 */

// let supabase;

// Initialize Supabase
async function initSupabase() {
    if (window.supabaseClient) {
        supabase = window.supabaseClient;
        return true;
    }
    if (window.supabase && typeof window.supabase.from === 'function') {
        supabase = window.supabase;
        return true;
    }
    return false;
}

// Wait for required functions to be available
async function waitForFunctions() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        if (typeof window.getContentById === 'function' && 
            typeof window.getPublicContent === 'function') {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    return false;
}

// Load article on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for Supabase
    let attempts = 0;
    while (!await initSupabase() && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!supabase) {
        showError('حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.');
        return;
    }

    // Wait for required functions to be available
    const functionsReady = await waitForFunctions();
    if (!functionsReady) {
        console.error('Required functions not available: getContentById, getPublicContent');
        showError('حدث خطأ في تحميل المكونات المطلوبة. يرجى تحديث الصفحة.');
        return;
    }

    // Get article ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    console.log('Article ID:', articleId);

    if (!articleId) {
        showError('لم يتم تحديد المقال.');
        return;
    }

    // Load article
    await loadArticle(articleId);
    await loadRelatedPosts(articleId);
    await loadRecentPosts();
});

/**
 * Load article content
 * تحميل محتوى المقال
 */ 
async function loadArticle(articleId) {
    try {
        let result;
        
        // Try to use getContentById if available
        if (typeof window.getContentById === 'function') {
            result = await window.getContentById(articleId);
            console.log('getContentById result:', result);
        } else {
            // Fallback: query Supabase directly
            console.warn('getContentById not available, querying Supabase directly');
            if (!supabase) {
                throw new Error('Supabase client not initialized');
            }
            
            const { data, error } = await supabase
                .from('content')
                .select('*')
                .eq('id', articleId)
                .single();
            
            if (error) throw error;
            result = { success: true, data };
        }

        if (!result.success || !result.data) {
            console.error('Article not found. Result:', result);
            showError('لم يتم العثور على المقال.');
            return;
        }

        const article = result.data;
        console.log('Loaded article:', article);

        // Check if it's a news article
        if (article.type !== 'news') {
            showError('هذا المحتوى ليس مقالاً إخبارياً.');
            return;
        }

        // Hide loading, show article
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('articleContainer').classList.remove('hidden');

        // Set article title
        const titleEl = document.getElementById('articleTitle');
        const titleBreadcrumb = document.getElementById('articleTitleBreadcrumb');
        if (titleEl) titleEl.textContent = article.title;
        if (titleBreadcrumb) titleBreadcrumb.textContent = article.title;

        // Set article date
        const dateEl = document.getElementById('articleDate');
        if (dateEl) {
            const date = new Date(article.created_at);
            dateEl.textContent = date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Set article image
        const imageEl = document.getElementById('articleImage');
        if (imageEl && article.image_url) {
            imageEl.innerHTML = `
                <img src="${article.image_url}" alt="${article.title}" 
                     class="w-full h-96 object-cover rounded-lg shadow-md">
            `;
        } else if (imageEl) {
            imageEl.innerHTML = '';
        }

        // Set article content
        const contentEl = document.getElementById('articleContent');
        if (contentEl) {
            // Format description as article content
            let content = article.description || '';
            
            // Replace line breaks with paragraphs
            content = content.split('\n').filter(line => line.trim()).map(line => {
                return `<p>${line.trim()}</p>`;
            }).join('');

            // If content contains image URLs, render them
            const imageUrlPattern = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
            content = content.replace(imageUrlPattern, (url) => {
                return `</p><img src="${url}" alt="صورة المقال" class="my-8 rounded-lg shadow-md"><p>`;
            });

            contentEl.innerHTML = content || '<p>لا يوجد محتوى متاح.</p>';
        }

        // Update page title
        document.title = `${article.title} - مركز الشفاء`;

        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = article.description ? 
                article.description.substring(0, 160) : 
                'مقال إخباري من مركز الشفاء لتعليم القرآن الكريم';
        }

    } catch (error) {
        console.error('Error loading article:', error);
        showError('حدث خطأ أثناء تحميل المقال.');
    }
}

/**
 * Load related posts
 * تحميل المقالات ذات الصلة
 */
async function loadRelatedPosts(currentArticleId) {
    try {
        // Ensure function is available
        if (typeof window.getPublicContent !== 'function') {
            console.error('getPublicContent function is not available');
            return;
        }

        const result = await window.getPublicContent('news', 3);
        const relatedPostsEl = document.getElementById('relatedPosts');

        if (!relatedPostsEl) return;

        if (result.success && result.data && result.data.length > 0) {
            // Filter out current article
            const related = result.data
                .filter(item => item.id !== currentArticleId)
                .slice(0, 3);

            if (related.length === 0) {
                relatedPostsEl.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <p>لا توجد مقالات ذات صلة</p>
                    </div>
                `;
                return;
            }

            relatedPostsEl.innerHTML = related.map(item => {
                const date = new Date(item.created_at);
                const formattedDate = date.toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                const imageUrl = item.image_url || '';
                const imageDisplay = imageUrl 
                    ? `<img src="${imageUrl}" alt="${item.title}" class="w-full h-48 object-cover rounded-lg mb-4">`
                    : `<div class="bg-amber-200 h-48 flex items-center justify-center rounded-lg mb-4">
                        <i class="fas fa-newspaper text-5xl text-amber-700"></i>
                       </div>`;

                return `
                    <article class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                        ${imageDisplay}
                        <div class="p-6">
                            <span class="text-amber-600 text-sm">${formattedDate}</span>
                            <h3 class="text-xl font-bold text-amber-900 mt-2 mb-3">${item.title}</h3>
                            <p class="text-gray-600 mb-4 line-clamp-2">${item.description ? item.description.substring(0, 120) + '...' : ''}</p>
                            <a href="news-article.html?id=${item.id}" 
                               class="text-amber-700 hover:text-amber-900 font-semibold inline-flex items-center">
                                اقرأ المزيد <i class="fas fa-arrow-left mr-2"></i>
                            </a>
                        </div>
                    </article>
                `;
            }).join('');
        } else {
            relatedPostsEl.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p>لا توجد مقالات ذات صلة</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading related posts:', error);
        const relatedPostsEl = document.getElementById('relatedPosts');
        if (relatedPostsEl) {
            relatedPostsEl.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p>حدث خطأ أثناء تحميل المقالات ذات الصلة</p>
                </div>
            `;
        }
    }
}

/**
 * Load recent posts
 * تحميل آخر الأخبار
 */
async function loadRecentPosts() {
    try {
        // Ensure function is available
        if (typeof window.getPublicContent !== 'function') {
            console.error('getPublicContent function is not available');
            return;
        }

        const result = await window.getPublicContent('news', 5);
        const recentPostsEl = document.getElementById('recentPosts');

        if (!recentPostsEl) return;

        if (result.success && result.data && result.data.length > 0) {
            recentPostsEl.innerHTML = result.data.slice(0, 5).map(item => {
                const date = new Date(item.created_at);
                const formattedDate = date.toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                return `
                    <article class="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                        <a href="news-article.html?id=${item.id}" class="block">
                            <h4 class="text-lg font-bold text-amber-900 mb-2 line-clamp-2">${item.title}</h4>
                            <span class="text-gray-500 text-sm">${formattedDate}</span>
                        </a>
                    </article>
                `;
            }).join('');
        } else {
            recentPostsEl.innerHTML = `
                <div class="text-center py-8 text-gray-500 text-sm">
                    <p>لا توجد أخبار حديثة</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading recent posts:', error);
        const recentPostsEl = document.getElementById('recentPosts');
        if (recentPostsEl) {
            recentPostsEl.innerHTML = `
                <div class="text-center py-8 text-gray-500 text-sm">
                    <p>حدث خطأ أثناء تحميل الأخبار</p>
                </div>
            `;
        }
    }
}

/**
 * Show error state
 * إظهار حالة الخطأ
 */
function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('articleContainer').classList.remove('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    
    const errorMessage = document.querySelector('#errorState p');
    if (errorMessage) {
        errorMessage.textContent = message;
    }
}

