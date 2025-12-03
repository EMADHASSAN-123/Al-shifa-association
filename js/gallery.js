/**
 * Dynamic Gallery with Supabase
 * معرض ديناميكي مع Supabase
 */

// let supabase;

// Initialize Supabase
function initGallerySupabase() {
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for Supabase
    let supabaseAttempts = 0;
    while (!initGallerySupabase() && supabaseAttempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        supabaseAttempts++;
    }
    
    if (!supabase) {
        console.error('Supabase not initialized');
        showGalleryError('photos', 'حدث خطأ في الاتصال');
        showGalleryError('videos', 'حدث خطأ في الاتصال');
        showGalleryError('audio', 'حدث خطأ في الاتصال');
        return;
    }
    
    // Wait for required functions
    let functionAttempts = 0;
    while (typeof window.getAllMedia === 'undefined' && functionAttempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        functionAttempts++;
    }
    
    // Load initial content
    await loadGalleryContent('photos');
    
    // Setup tab switching
    setupGalleryTabs();
});

/**
 * Setup gallery tabs
 * إعداد علامات التبويب للمعرض
 */
function setupGalleryTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const targetTab = this.getAttribute('data-tab');

            // Update active button
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'border-b-2', 'border-amber-700', 'text-amber-900');
                btn.classList.add('text-gray-600');
            });
            this.classList.add('active', 'border-b-2', 'border-amber-700', 'text-amber-900');
            this.classList.remove('text-gray-600');

            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });

            // Show target tab content
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.remove('hidden');
                
                // Load content if not already loaded
                const gridId = targetTab === 'photos' ? 'photosGrid' : 
                              targetTab === 'videos' ? 'videosGrid' : 'audioGrid';
                const grid = document.getElementById(gridId);
                if (grid && grid.children.length === 1 && grid.querySelector('.fa-spinner')) {
                    await loadGalleryContent(targetTab);
                }
            }
        });
    });
}

/**
 * Load gallery content
 * تحميل محتوى المعرض
 */
async function loadGalleryContent(type) {
    try {
        const gridId = type === 'photos' ? 'photosGrid' : 
                      type === 'videos' ? 'videosGrid' : 'audioGrid';
        const grid = document.getElementById(gridId);
        
        if (!grid) return;

        // Show loading
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-amber-700 mb-4"></i>
                <p class="text-gray-600">جاري التحميل...</p>
            </div>
        `;

        // Map type
        const mediaType = type === 'photos' ? 'image' : 
                         type === 'videos' ? 'video' : 'audio';

        const result = await window.getAllMedia(mediaType, 1, 50);
        
        if (!result.success) {
            throw new Error(result.error || 'فشل تحميل المحتوى');
        }

        const mediaItems = result.data || [];

        if (mediaItems.length > 0) {
            if (type === 'photos') {
                grid.innerHTML = mediaItems.map(item => createPhotoCard(item)).join('');
            } else if (type === 'videos') {
                grid.innerHTML = mediaItems.map(item => createVideoCard(item)).join('');
            } else if (type === 'audio') {
                grid.innerHTML = mediaItems.map(item => createAudioCard(item)).join('');
            }
            
            // Initialize lazy loading
            initLazyLoading();
        } else {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-inbox text-6xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600 text-lg">لا توجد ${getTypeLabel(type)} حتى الآن</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading gallery content:', error);
        showGalleryError(type, `حدث خطأ أثناء التحميل: ${error.message}`);
    }
}

/**
 * Create photo card
 * إنشاء بطاقة صورة
 */
function createPhotoCard(item) {
    return `
        <div class="relative overflow-hidden rounded-lg shadow-lg group cursor-pointer" onclick="openImageModal('${item.url || item.file_url}', '${escapeHtml(item.title || 'صورة')}')">
            <img data-src="${item.url || item.file_url}" 
                 alt="${item.title || 'صورة'}" 
                 class="lazy-load w-full h-64 object-cover bg-gray-200 transition-transform duration-300 group-hover:scale-110"
                 loading="lazy">
            <div class="absolute inset-0 bg-amber-900 bg-opacity-0 group-hover:bg-opacity-70 transition flex items-center justify-center">
                <i class="fas fa-search-plus text-white text-3xl opacity-0 group-hover:opacity-100 transition"></i>
            </div>
            ${item.title ? `
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h3 class="text-white font-semibold truncate">${item.title}</h3>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Create video card
 * إنشاء بطاقة فيديو
 */
function createVideoCard(item) {
    const videoId = window.extractYouTubeId ? window.extractYouTubeId(item.url || item.video_url) : null;
    
    if (!videoId) {
        return `
            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                <div class="bg-amber-200 h-48 flex items-center justify-center">
                    <i class="fas fa-video text-6xl text-amber-700"></i>
                </div>
                <div class="p-4">
                    <h3 class="text-xl font-bold text-amber-900 mb-2">${item.title || 'فيديو'}</h3>
                    ${item.description ? `<p class="text-gray-600 text-sm mb-2">${item.description}</p>` : ''}
                </div>
            </div>
        `;
    }

    return `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
            <div class="relative aspect-video bg-gray-900">
                <iframe width="100%" height="100%" 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        loading="lazy"
                        class="absolute inset-0">
                </iframe>
            </div>
            <div class="p-4">
                <h3 class="text-xl font-bold text-amber-900 mb-2">${item.title || 'فيديو'}</h3>
                ${item.description ? `<p class="text-gray-600 text-sm mb-2">${item.description}</p>` : ''}
                ${item.created_at ? `<p class="text-gray-500 text-xs">${formatDate(item.created_at)}</p>` : ''}
            </div>
        </div>
    `;
}

/**
 * Create audio card
 * إنشاء بطاقة صوت
 */
function createAudioCard(item) {
    return `
        <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div class="mb-4">
                <i class="fas fa-headphones text-3xl text-amber-700 mb-3"></i>
                <h3 class="text-xl font-bold text-amber-900 mb-2">${item.title || 'تلاوة'}</h3>
                ${item.description ? `<p class="text-gray-600 text-sm mb-2">${item.description}</p>` : ''}
                ${item.created_at ? `<p class="text-gray-500 text-xs">${formatDate(item.created_at)}</p>` : ''}
            </div>
            <audio controls class="w-full rounded-lg" preload="metadata">
                <source src="${item.url || item.file_url}" type="audio/mpeg">
                متصفحك لا يدعم مشغل الصوت.
            </audio>
        </div>
    `;
}

/**
 * Open image modal
 * فتح نافذة الصورة
 */
function openImageModal(imageUrl, title) {
    // Create modal if doesn't exist
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 hidden';
        modal.innerHTML = `
            <div class="relative max-w-7xl max-h-full">
                <button onclick="closeImageModal()" class="absolute top-4 left-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2">
                    <i class="fas fa-times text-2xl"></i>
                </button>
                <img id="modalImage" src="" alt="" class="max-w-full max-h-[90vh] object-contain rounded-lg">
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
                    <h3 id="modalTitle" class="text-white font-semibold text-xl"></h3>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('modalImage').src = imageUrl;
    document.getElementById('modalTitle').textContent = title;
    modal.classList.remove('hidden');
    
    // Close on click outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeImageModal();
        }
    });
}

/**
 * Close image modal
 * إغلاق نافذة الصورة
 */
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Show gallery error
 * عرض خطأ في المعرض
 */
function showGalleryError(type, message) {
    const gridId = type === 'photos' ? 'photosGrid' : 
                  type === 'videos' ? 'videosGrid' : 'audioGrid';
    const grid = document.getElementById(gridId);
    if (grid) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-red-600">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

/**
 * Get type label
 * الحصول على تسمية النوع
 */
function getTypeLabel(type) {
    const labels = {
        'photos': 'صور',
        'videos': 'فيديوهات',
        'audio': 'تلاوات'
    };
    return labels[type] || type;
}

/**
 * Format date
 * تنسيق التاريخ
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Escape HTML
 * تهريب HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize lazy loading
 * تهيئة التحميل البطيء
 */
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy-load');
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });

        // Observe all lazy-load images
        const lazyImages = document.querySelectorAll('.lazy-load');
        lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for browsers without IntersectionObserver
        const lazyImages = document.querySelectorAll('.lazy-load');
        lazyImages.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.remove('lazy-load');
            }
        });
    }
}

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeImageModal();
    }
});
