/**
 * Enhanced Media Management with Supabase
 * نظام إدارة الوسائط المحسّن مع Supabase
 */

// let supabase;
let currentPage = 1;
let currentType = 'all';
const pageSize = 5;

// Initialize Supabase
function initMediaSupabase() {
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
    while (!initMediaSupabase() && supabaseAttempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        supabaseAttempts++;
    }
    
    if (!supabase) {
        console.error('Supabase not initialized');
        showError('حدث خطأ في الاتصال. يرجى تحديث الصفحة.');
        return;
    }
    
    // Wait for required functions
    let functionAttempts = 0;
    while ((typeof window.getAllMedia === 'undefined' || 
            typeof window.createMedia === 'undefined') && 
           functionAttempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        functionAttempts++;
    }
    
    // Check authentication
    if (typeof window.protectAdminPage !== 'undefined') {
        const isAuthenticated = await window.protectAdminPage();
        if (!isAuthenticated) return;
    } else {
        console.error('protectAdminPage not found. Make sure auth.js is loaded.');
        return;
    }
    
    // Initialize admin header (display admin name)
    if (typeof window.initAdminHeader !== 'undefined') {
        await window.initAdminHeader();
    }
    
    // Load media files
    await loadMediaFiles();
    
    // Setup forms and handlers
    setupUploadForm();
    setupEditForm();
    setupFilterTabs();
});

/**
 * Load media files with pagination
 * تحميل الوسائط مع التصفح
 */
async function loadMediaFiles(type = 'all', page = 1) {
    try {
        const mediaGrid = document.getElementById('mediaGrid');
        if (!mediaGrid) return;

        mediaGrid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-spinner fa-spin text-4xl text-amber-700 mb-4"></i>
                <p class="text-gray-600">جاري تحميل الوسائط...</p>
            </div>
        `;

        const result = await window.getAllMedia(type, page, pageSize);
        
        if (!result.success) {
            throw new Error(result.error || 'فشل تحميل الوسائط');
        }

        const mediaItems = result.data || [];
        const pagination = result.pagination || {};

        if (mediaItems.length > 0) {
            mediaGrid.innerHTML = mediaItems.map(item => createMediaCard(item)).join('');
            renderPagination(pagination);
        } else {
            mediaGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-inbox text-6xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600 text-lg">لا توجد وسائط حتى الآن</p>
                    <button onclick="openUploadModal()" class="mt-4 bg-amber-700 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition">
                        <i class="fas fa-plus ml-2"></i> إضافة وسيط جديد
                    </button>
                </div>
            `;
            document.getElementById('paginationContainer').innerHTML = '';
        }

        currentPage = page;
        currentType = type;
    } catch (error) {
        console.error('Error loading media:', error);
        document.getElementById('mediaGrid').innerHTML = `
            <div class="col-span-full text-center py-8 text-red-600">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p>حدث خطأ أثناء تحميل الوسائط: ${error.message}</p>
                <button onclick="loadMediaFiles()" class="mt-4 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg">
                    إعادة المحاولة
                </button>
            </div>
        `;
    }
}

/**
 * Create media card with lazy loading
 * إنشاء بطاقة وسائط مع التحميل البطيء
 */
function createMediaCard(item) {
    let mediaContent = '';
    let thumbnail = '';

    if (item.type === 'image') {
        thumbnail = `
            <img data-src="${item.url || item.file_url}" 
                 alt="${item.title || 'صورة'}" 
                 class="lazy-load w-full h-32 object-cover bg-gray-200"
                 loading="lazy">
        `;
    } else if (item.type === 'video') {
        const videoId = window.extractYouTubeId ? window.extractYouTubeId(item.url || item.video_url) : null;
        if (videoId) {
            thumbnail = `
                <div class="relative w-full h-32 bg-gray-900 flex items-center justify-center">
                    <img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" 
                         alt="${item.title || 'فيديو'}" 
                         class="w-full h-32 object-cover">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <i class="fas fa-play-circle text-4xl text-white opacity-80"></i>
                    </div>
                </div>
            `;
        } else {
            thumbnail = `
                <div class="w-full h-32 bg-amber-200 flex items-center justify-center">
                    <i class="fas fa-video text-4xl text-amber-700"></i>
                </div>
            `;
        }
    } else if (item.type === 'audio') {
        thumbnail = `
            <div class="w-full h-32 bg-amber-200 flex items-center justify-center">
                <i class="fas fa-headphones text-4xl text-amber-700"></i>
            </div>
        `;
    }

    return `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden media-item hover:shadow-xl transition" data-type="${item.type}" data-id="${item.id}">
            <div class="relative">
                ${thumbnail}
                <div class="absolute top-2 left-2">
                    <span class="bg-amber-700 text-white text-xs px-2 py-1 rounded">
                        ${getTypeLabel(item.type)}
                    </span>
                </div>
            </div>
            <div class="p-3">
                <h4 class="text-sm font-semibold text-gray-800 truncate mb-1" title="${item.title || 'بدون عنوان'}">
                    ${item.title || 'بدون عنوان'}
                </h4>
                ${item.description ? `<p class="text-xs text-gray-600 line-clamp-2 mb-2">${item.description}</p>` : ''}
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">
                        ${formatDate(item.created_at)}
                    </span>
                    <div class="flex space-x-2 space-x-reverse">
                        <button onclick="editMedia('${item.id}')" 
                                class="text-blue-600 hover:text-blue-800 transition" 
                                title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteMediaItem('${item.id}')" 
                                class="text-red-600 hover:text-red-800 transition" 
                                title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Get type label in Arabic
 * الحصول على تسمية النوع بالعربية
 */
function getTypeLabel(type) {
    const labels = {
        'image': 'صورة',
        'video': 'فيديو',
        'audio': 'صوت'
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
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Render pagination
 * عرض التصفح
 */
function renderPagination(pagination) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    if (pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="flex items-center space-x-2 space-x-reverse">';
    
    // Previous button
    if (pagination.page > 1) {
        html += `
            <button onclick="loadMediaFiles('${currentType}', ${pagination.page - 1})" 
                    class="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg transition">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    // Page numbers
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);

    if (startPage > 1) {
        html += `<button onclick="loadMediaFiles('${currentType}', 1)" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">1</button>`;
        if (startPage > 2) html += `<span class="px-2">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button onclick="loadMediaFiles('${currentType}', ${i})" 
                    class="px-4 py-2 ${i === pagination.page ? 'bg-amber-700 text-white' : 'border border-gray-300 hover:bg-gray-50'} rounded-lg transition">
                ${i}
            </button>
        `;
    }

    if (endPage < pagination.totalPages) {
        if (endPage < pagination.totalPages - 1) html += `<span class="px-2">...</span>`;
        html += `<button onclick="loadMediaFiles('${currentType}', ${pagination.totalPages})" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">${pagination.totalPages}</button>`;
    }

    // Next button
    if (pagination.page < pagination.totalPages) {
        html += `
            <button onclick="loadMediaFiles('${currentType}', ${pagination.page + 1})" 
                    class="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg transition">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
    }

    html += `<span class="text-gray-600 mr-4">صفحة ${pagination.page} من ${pagination.totalPages}</span>`;
    html += '</div>';

    container.innerHTML = html;
}

/**
 * Setup upload form
 * إعداد نموذج الرفع
 */
function setupUploadForm() {
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleMediaUpload);
    }
}

/**
 * Handle media type change
 * معالجة تغيير نوع الوسيط
 */
function handleMediaTypeChange() {
    const mediaType = document.getElementById('mediaType').value;
    const imageSection = document.getElementById('imageUploadSection');
    const videoSection = document.getElementById('videoUrlSection');
    const audioSection = document.getElementById('audioUploadSection');

    // Hide all sections
    imageSection.classList.add('hidden');
    videoSection.classList.add('hidden');
    audioSection.classList.add('hidden');

    // Show relevant section
    if (mediaType === 'image') {
        imageSection.classList.remove('hidden');
        document.getElementById('fileInput').required = true;
        document.getElementById('videoUrl').required = false;
        document.getElementById('audioInput').required = false;
    } else if (mediaType === 'video') {
        videoSection.classList.remove('hidden');
        document.getElementById('fileInput').required = false;
        document.getElementById('videoUrl').required = true;
        document.getElementById('audioInput').required = false;
    } else if (mediaType === 'audio') {
        audioSection.classList.remove('hidden');
        document.getElementById('fileInput').required = false;
        document.getElementById('videoUrl').required = false;
        document.getElementById('audioInput').required = true;
    }
}

/**
 * Handle image preview
 * معالجة معاينة الصورة
 */
function handleImagePreview(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            const img = document.getElementById('previewImage');
            img.src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Handle video preview
 * معالجة معاينة الفيديو
 */
function handleVideoPreview(event) {
    const url = event.target.value;
    if (url && window.validateYouTubeUrl && window.validateYouTubeUrl(url)) {
        const videoId = window.extractYouTubeId(url);
        if (videoId) {
            const preview = document.getElementById('videoPreview');
            const container = document.getElementById('previewVideo');
            container.innerHTML = `
                <iframe width="100%" height="100%" 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        class="rounded-lg">
                </iframe>
            `;
            preview.classList.remove('hidden');
        }
    } else if (url) {
        showMessage('الرجاء إدخال رابط YouTube صحيح', 'error');
    }
}

/**
 * Handle audio preview
 * معالجة معاينة الصوت
 */
function handleAudioPreview(event) {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        const preview = document.getElementById('audioPreview');
        const audio = document.getElementById('previewAudio');
        audio.src = url;
        preview.classList.remove('hidden');
    }
}

/**
 * Handle media upload
 * معالجة رفع الوسائط
 */
async function handleMediaUpload(e) {
    e.preventDefault();
    
    const mediaType = document.getElementById('mediaType').value;
    const title = document.getElementById('mediaTitle').value.trim();
    const description = document.getElementById('mediaDescription').value.trim();
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const submitBtn = document.getElementById('submitBtn');
    
    if (!title) {
        showMessage('الرجاء إدخال عنوان للوسيط', 'error');
        return;
    }

    submitBtn.disabled = true;
    uploadProgress.classList.remove('hidden');
    progressBar.style.width = '10%';

    try {
        let mediaData = {
            type: mediaType,
            title: title,
            description: description || null
        };

        progressBar.style.width = '30%';

        if (mediaType === 'image') {
            const fileInput = document.getElementById('fileInput');
            if (!fileInput.files[0]) {
                throw new Error('الرجاء اختيار صورة');
            }

            progressBar.style.width = '50%';
            const uploadResult = await window.uploadMediaFile(fileInput.files[0], 'image');
            
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'فشل رفع الصورة');
            }

            mediaData.url = uploadResult.url;
            mediaData.file_path = uploadResult.path;

        } else if (mediaType === 'video') {
            const videoUrl = document.getElementById('videoUrl').value.trim();
            if (!videoUrl) {
                throw new Error('الرجاء إدخال رابط YouTube');
            }

            if (!window.validateYouTubeUrl || !window.validateYouTubeUrl(videoUrl)) {
                throw new Error('الرجاء إدخال رابط YouTube صحيح');
            }

            mediaData.url = videoUrl;
            mediaData.video_url = videoUrl;

        } else if (mediaType === 'audio') {
            const audioInput = document.getElementById('audioInput');
            if (!audioInput.files[0]) {
                throw new Error('الرجاء اختيار ملف صوتي');
            }

            progressBar.style.width = '50%';
            const uploadResult = await window.uploadMediaFile(audioInput.files[0], 'audio');
            
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'فشل رفع الملف الصوتي');
            }

            mediaData.url = uploadResult.url;
            mediaData.file_path = uploadResult.path;
        }

        progressBar.style.width = '70%';

        // Save to database
        const result = await window.createMedia(mediaData);
        
        if (!result.success) {
            throw new Error(result.error || 'فشل حفظ الوسيط');
        }

        progressBar.style.width = '100%';
        
        setTimeout(() => {
            showMessage('تم إضافة الوسيط بنجاح!', 'success');
            closeUploadModal();
            loadMediaFiles(currentType, currentPage);
        }, 500);

    } catch (error) {
        console.error('Upload error:', error);
        showMessage(`حدث خطأ: ${error.message}`, 'error');
        uploadProgress.classList.add('hidden');
    } finally {
        submitBtn.disabled = false;
    }
}

/**
 * Setup edit form
 * إعداد نموذج التعديل
 */
function setupEditForm() {
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleMediaUpdate);
    }
}

/**
 * Edit media item
 * تعديل وسيط
 */
async function editMedia(id) {
    try {
        const result = await window.getMediaById(id);
        
        if (!result.success || !result.data) {
            showMessage('لم يتم العثور على الوسيط', 'error');
            return;
        }

        const item = result.data;
        document.getElementById('editMediaId').value = id;
        document.getElementById('editMediaTitle').value = item.title || '';
        document.getElementById('editMediaDescription').value = item.description || '';

        const contentDiv = document.getElementById('editMediaContent');
        contentDiv.innerHTML = '';

        if (item.type === 'image') {
            contentDiv.innerHTML = `
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">الصورة الحالية</label>
                    <img src="${item.url || item.file_url}" alt="${item.title}" class="max-w-full h-48 object-contain rounded-lg border border-gray-300 mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">استبدال الصورة (اختياري)</label>
                    <input type="file" id="editFileInput" accept="image/*" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
            `;
        } else if (item.type === 'video') {
            const videoId = window.extractYouTubeId ? window.extractYouTubeId(item.url || item.video_url) : null;
            contentDiv.innerHTML = `
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">الفيديو الحالي</label>
                    ${videoId ? `
                        <div class="mb-4">
                            <iframe width="100%" height="315" 
                                    src="https://www.youtube.com/embed/${videoId}" 
                                    frameborder="0" allowfullscreen class="rounded-lg">
                            </iframe>
                        </div>
                    ` : ''}
                    <label class="block text-gray-700 font-semibold mb-2">تغيير رابط YouTube</label>
                    <input type="url" id="editVideoUrl" value="${item.url || item.video_url || ''}" 
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                           placeholder="https://www.youtube.com/watch?v=...">
                </div>
            `;
        } else if (item.type === 'audio') {
            contentDiv.innerHTML = `
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">الملف الصوتي الحالي</label>
                    <audio src="${item.url || item.file_url}" controls class="w-full mb-4 rounded-lg"></audio>
                    <label class="block text-gray-700 font-semibold mb-2">استبدال الملف (اختياري)</label>
                    <input type="file" id="editAudioInput" accept="audio/*" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
            `;
        }

        document.getElementById('editModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading media for edit:', error);
        showMessage('حدث خطأ أثناء تحميل الوسيط', 'error');
    }
}

/**
 * Handle media update
 * معالجة تحديث الوسيط
 */
async function handleMediaUpdate(e) {
    e.preventDefault();
    
    const id = document.getElementById('editMediaId').value;
    const title = document.getElementById('editMediaTitle').value.trim();
    const description = document.getElementById('editMediaDescription').value.trim();

    if (!title) {
        showMessage('الرجاء إدخال عنوان', 'error');
        return;
    }

    try {
        const currentResult = await window.getMediaById(id);
        if (!currentResult.success || !currentResult.data) {
            throw new Error('لم يتم العثور على الوسيط');
        }

        const currentItem = currentResult.data;
        const updateData = {
            title: title,
            description: description || null
        };

        // Handle file replacement
        if (currentItem.type === 'image') {
            const fileInput = document.getElementById('editFileInput');
            if (fileInput && fileInput.files[0]) {
                const uploadResult = await window.uploadMediaFile(fileInput.files[0], 'image');
                if (uploadResult.success) {
                    updateData.url = uploadResult.url;
                    updateData.file_path = uploadResult.path;
                }
            }
        } else if (currentItem.type === 'video') {
            const videoUrl = document.getElementById('editVideoUrl').value.trim();
            if (videoUrl) {
                if (!window.validateYouTubeUrl || !window.validateYouTubeUrl(videoUrl)) {
                    throw new Error('الرجاء إدخال رابط YouTube صحيح');
                }
                updateData.url = videoUrl;
                updateData.video_url = videoUrl;
            }
        } else if (currentItem.type === 'audio') {
            const audioInput = document.getElementById('editAudioInput');
            if (audioInput && audioInput.files[0]) {
                const uploadResult = await window.uploadMediaFile(audioInput.files[0], 'audio');
                if (uploadResult.success) {
                    updateData.url = uploadResult.url;
                    updateData.file_path = uploadResult.path;
                }
            }
        }

        const result = await window.updateMedia(id, updateData);
        
        if (!result.success) {
            throw new Error(result.error || 'فشل تحديث الوسيط');
        }

        showMessage('تم تحديث الوسيط بنجاح!', 'success');
        closeEditModal();
        loadMediaFiles(currentType, currentPage);

    } catch (error) {
        console.error('Update error:', error);
        showMessage(`حدث خطأ: ${error.message}`, 'error');
    }
}

/**
 * Delete media item
 * حذف وسيط
 */
async function deleteMediaItem(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الوسيط؟')) {
        return;
    }
    
    try {
        const result = await window.deleteMedia(id);
        
        if (!result.success) {
            throw new Error(result.error || 'فشل حذف الوسيط');
        }

        showMessage('تم حذف الوسيط بنجاح!', 'success');
        loadMediaFiles(currentType, currentPage);
    } catch (error) {
        console.error('Delete error:', error);
        showMessage(`حدث خطأ: ${error.message}`, 'error');
    }
}

/**
 * Setup filter tabs
 * إعداد علامات التبويب للفلترة
 */
function setupFilterTabs() {
    const mediaTabs = document.querySelectorAll('.media-tab');
    
    mediaTabs.forEach(tab => {
        tab.addEventListener('click', async function() {
            const type = this.getAttribute('data-type');
            
            // Update active tab
            mediaTabs.forEach(t => {
                t.classList.remove('active', 'border-b-2', 'border-amber-700', 'text-amber-900');
                t.classList.add('text-gray-600');
            });
            this.classList.add('active', 'border-b-2', 'border-amber-700', 'text-amber-900');
            this.classList.remove('text-gray-600');
            
            // Load filtered media
            await loadMediaFiles(type, 1);
        });
    });
}

/**
 * Open upload modal
 * فتح نافذة الرفع
 */
function openUploadModal() {
    document.getElementById('uploadModal').classList.remove('hidden');
    handleMediaTypeChange(); // Initialize form
}

/**
 * Close upload modal
 * إغلاق نافذة الرفع
 */
function closeUploadModal() {
    document.getElementById('uploadModal').classList.add('hidden');
    document.getElementById('uploadForm').reset();
    document.getElementById('uploadProgress').classList.add('hidden');
    document.getElementById('uploadMessage').classList.add('hidden');
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('videoPreview').classList.add('hidden');
    document.getElementById('audioPreview').classList.add('hidden');
}

/**
 * Close edit modal
 * إغلاق نافذة التعديل
 */
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editForm').reset();
}

/**
 * Show message
 * عرض رسالة
 */
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('uploadMessage');
    if (!messageDiv) return;

    const colors = {
        success: 'bg-green-100 text-green-700 border-green-400',
        error: 'bg-red-100 text-red-700 border-red-400',
        info: 'bg-blue-100 text-blue-700 border-blue-400'
    };

    messageDiv.className = `p-4 rounded-lg border ${colors[type] || colors.info}`;
    messageDiv.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.classList.add('hidden')" class="mr-2">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    messageDiv.classList.remove('hidden');

    // Auto hide after 5 seconds for success/info
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 5000);
    }
}

/**
 * Show error
 * عرض خطأ
 */
function showError(message) {
    showMessage(message, 'error');
}

// Initialize lazy loading for images
document.addEventListener('DOMContentLoaded', function() {
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
        });

        // Observe all lazy-load images
        const lazyImages = document.querySelectorAll('.lazy-load');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
});
