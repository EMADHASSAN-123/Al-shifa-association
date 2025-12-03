/**
 * Content Management with Supabase
 * إدارة المحتوى مع Supabase
 */

let currentEditId = null;
  
// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for protectAdminPage to be available
    let authCheckAttempts = 0;
    while (typeof window.protectAdminPage === 'undefined' && authCheckAttempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        authCheckAttempts++;
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

    // Check if editing
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
        await loadContentForEdit(editId);
    }

    // Load all content
    await loadAllContent();

    // Setup form handlers
    setupFormHandlers();
});

/**
 * Load all content and display in grid
 * تحميل جميع المحتويات وعرضها
 */
async function loadAllContent(type = 'all') {
    const result = await getAllContent(type);
    const contentGrid = document.getElementById('contentGrid');
    
    if (!contentGrid) return;
    
    if (result.success && result.data && result.data.length > 0) {
        contentGrid.innerHTML = result.data.map(item => createContentCard(item)).join('');
    } else {
        contentGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-inbox text-6xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 text-lg">لا يوجد محتوى حتى الآن</p>
                <button onclick="openAddModal()" class="mt-4 bg-amber-700 hover:bg-amber-600 text-white px-6 py-2 rounded-lg">
                    إضافة محتوى جديد
                </button>
            </div>
        `;
    }
}

/**
 * Create content card HTML
 * إنشاء بطاقة محتوى
 */
function createContentCard(item) {
    const typeLabels = {
        'courses': 'دورة',
        'news': 'خبر',
        'files': 'ملف',
        'pages': 'صفحة'
    };
    
    const typeIcons = {
        'courses': 'fa-book',
        'news': 'fa-newspaper',
        'files': 'fa-file-pdf',
        'pages': 'fa-file-alt'
    };
    
    const imageUrl = item.image_url || '';
    const imageDisplay = imageUrl 
        ? `<img src="${imageUrl}" alt="${item.title}" class="w-full h-48 object-cover">`
        : `<div class="bg-amber-200 h-48 flex items-center justify-center">
            <i class="fas ${typeIcons[item.type] || 'fa-file'} text-6xl text-amber-700"></i>
           </div>`;
    
    return `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden content-card" data-type="${item.type}">
            ${imageDisplay}
            <div class="p-6">
                <h3 class="text-xl font-bold text-amber-900 mb-2">${item.title}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${item.description || ''}</p>
                <div class="flex items-center justify-between">
                    <span class="text-amber-700 text-sm">${typeLabels[item.type] || item.type}</span>
                    <div class="space-x-2 space-x-reverse">
                        <button class="text-amber-700 hover:text-amber-900" onclick="editContent('${item.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800" onclick="deleteContent('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${item.published ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-2 inline-block">منشور</span>' : ''}
            </div>
        </div>
    `;
}

/**
 * Setup form handlers
 * إعداد معالجات النموذج
 */
function setupFormHandlers() {
    const contentTypeSelect = document.getElementById('contentType');
    const fileUploadSection = document.getElementById('fileUploadSection');
    const contentImage = document.getElementById('contentImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    // Show/hide file upload based on content type
    if (contentTypeSelect && fileUploadSection) {
        contentTypeSelect.addEventListener('change', function() {
            if (this.value === 'files') {
                fileUploadSection.classList.remove('hidden');
            } else {
                fileUploadSection.classList.add('hidden');
            }
        });
    }
    
    // Image preview
    if (contentImage && imagePreview && previewImg) {
        contentImage.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    imagePreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Form submission
    const contentForm = document.getElementById('contentForm');
    if (contentForm) {
        contentForm.addEventListener('submit', handleFormSubmit);
    }
}

/**
 * Handle form submission
 * معالجة إرسال النموذج
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const contentType = document.getElementById('contentType');
    const contentTitle = document.getElementById('contentTitle');
    const contentDescription = document.getElementById('contentDescription');
    const contentPublished = document.getElementById('contentPublished');
    
    if (!contentType || !contentTitle || !contentDescription) {
        alert('يرجى التأكد من وجود جميع حقول النموذج');
        return;
    }
    
    // Validate required fields
    if (!contentTitle.value.trim()) {
        if (typeof showToast !== 'undefined') {
            showToast('يرجى إدخال العنوان', 'warning');
        } else {
            alert('يرجى إدخال العنوان');
        }
        return;
    }
    
    if (!contentDescription.value.trim()) {
        if (typeof showToast !== 'undefined') {
            showToast('يرجى إدخال الوصف', 'warning');
        } else {
            alert('يرجى إدخال الوصف');
        }
        return;
    }
    
    const formData = {
        type: contentType.value,
        title: contentTitle.value.trim(),
        description: contentDescription.value.trim(),
        published: contentPublished ? contentPublished.checked : false
    };
    
    // Upload image if selected
    const imageInput = document.getElementById('contentImage');
    if (imageInput && imageInput.files[0]) {
        const imageFile = imageInput.files[0];
        if (typeof showToast !== 'undefined') {
            showToast('جاري رفع الصورة...', 'info');
        }
        
        const uploadResult = await uploadFile(imageFile, 'images');
        if (uploadResult.success) {
            formData.image_url = uploadResult.url;
        } else {
            console.warn('Image upload failed:', uploadResult.error);
            // Continue without image if upload fails
        }
    }
    
    // Upload file if selected (for files type)
    const fileInput = document.getElementById('contentFile');
    if (fileInput && fileInput.files[0]) {
        const file = fileInput.files[0];
        if (typeof showToast !== 'undefined') {
            showToast('جاري رفع الملف...', 'info');
        }
        
        const uploadResult = await uploadFile(file, 'files');
        if (uploadResult.success) {
            formData.file_url = uploadResult.url;
            formData.file_name = file.name;
        } else {
            console.warn('File upload failed:', uploadResult.error);
            // Continue without file if upload fails
        }
    }
    
    let result;
    if (currentEditId) {
        // Update existing content
        result = await updateContent(currentEditId, formData);
    } else {
        // Create new content
        result = await createContent(formData);
    }
    
    if (result.success) {
        if (typeof showToast !== 'undefined') {
            showToast('تم حفظ المحتوى بنجاح', 'success');
        } else {
            alert('تم حفظ المحتوى بنجاح');
        }
        closeModal();
        await loadAllContent();
    } else {
        console.error('Content save error:', result.error);
        if (typeof showToast !== 'undefined') {
            showToast('حدث خطأ أثناء حفظ المحتوى: ' + result.error, 'error');
        } else {
            alert('حدث خطأ أثناء حفظ المحتوى: ' + result.error);
        }
    }
}

/**
 * Load content for editing
 * تحميل المحتوى للتعديل
 */
async function loadContentForEdit(id) {
    try {
        const result = await getContentById(id);
        
        if (result.success && result.data) {
            const content = result.data;
            currentEditId = id;
            
            const contentType = document.getElementById('contentType');
            const contentTitle = document.getElementById('contentTitle');
            const contentDescription = document.getElementById('contentDescription');
            const contentPublished = document.getElementById('contentPublished');
            const contentId = document.getElementById('contentId');
            const previewImg = document.getElementById('previewImg');
            const imagePreview = document.getElementById('imagePreview');
            const fileUploadSection = document.getElementById('fileUploadSection');
            const fileInfo = document.getElementById('fileInfo');
            const modalTitle = document.getElementById('modalTitle');
            
            if (contentType) contentType.value = content.type || 'pages';
            if (contentTitle) contentTitle.value = content.title || '';
            if (contentDescription) contentDescription.value = content.description || '';
            if (contentPublished) contentPublished.checked = content.published || false;
            if (contentId) contentId.value = id;
            
            if (content.image_url && previewImg && imagePreview) {
                previewImg.src = content.image_url;
                imagePreview.classList.remove('hidden');
            }
            
            if (content.type === 'files' && fileUploadSection) {
                fileUploadSection.classList.remove('hidden');
                if (content.file_url && fileInfo) {
                    fileInfo.textContent = `الملف الحالي: ${content.file_name || 'ملف'}`;
                }
            }
            
            // Open modal but do not clear the form when loading for edit
            openAddModal(false);
            if (modalTitle) modalTitle.textContent = 'تعديل المحتوى';
        } else {
            if (typeof showToast !== 'undefined') {
                showToast('فشل تحميل المحتوى: ' + (result.error || 'خطأ غير معروف'), 'error');
            } else {
                alert('فشل تحميل المحتوى: ' + (result.error || 'خطأ غير معروف'));
            }
        }
    } catch (error) {
        console.error('Error loading content for edit:', error);
        if (typeof showToast !== 'undefined') {
            showToast('حدث خطأ أثناء تحميل المحتوى', 'error');
        } else {
            alert('حدث خطأ أثناء تحميل المحتوى');
        }
    }
}

/**
 * Edit content
 * تعديل المحتوى
 */
async function editContent(id) {
    await loadContentForEdit(id);
}

/**
 * Delete content
 * حذف المحتوى
 */
async function deleteContent(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المحتوى؟')) {
        return;
    }
    
    const result = await deleteContentFromSupabase(id);
    
    if (result.success) {
        if (typeof showToast !== 'undefined') {
            showToast('تم حذف المحتوى بنجاح', 'success');
        } else {
            alert('تم حذف المحتوى بنجاح');
        }
        await loadAllContent();
    } else {
        if (typeof showToast !== 'undefined') {
            showToast('حدث خطأ أثناء الحذف: ' + result.error, 'error');
        } else {
            alert('حدث خطأ أثناء الحذف: ' + result.error);
        }
    }
}

// Make functions available globally
window.openAddModal = openAddModal;
window.closeModal = closeModal;
window.editContent = editContent;
window.deleteContent = deleteContent;

/**
 * Update openAddModal and closeModal functions
 * تحديث دوال فتح وإغلاق النافذة
 */
function openAddModal(clear = true) {
    const modal = document.getElementById('contentModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('contentForm');
    
    if (!modal || !modalTitle || !form) {
        console.error('Modal elements not found');
        return;
    }
    
    modal.classList.remove('hidden');
    modalTitle.textContent = 'إضافة محتوى جديد';
    
    if (clear) {
        form.reset();
        const imagePreview = document.getElementById('imagePreview');
        const fileUploadSection = document.getElementById('fileUploadSection');
        const fileInfo = document.getElementById('fileInfo');
        const contentId = document.getElementById('contentId');
        
        if (imagePreview) imagePreview.classList.add('hidden');
        if (fileUploadSection) fileUploadSection.classList.add('hidden');
        if (fileInfo) fileInfo.textContent = '';
        if (contentId) contentId.value = '';
        currentEditId = null;
    }
}

function closeModal() {
    const modal = document.getElementById('contentModal');
    const form = document.getElementById('contentForm');
    
    if (!modal || !form) {
        console.error('Modal elements not found');
        return;
    }
    
    modal.classList.add('hidden');
    form.reset();
    
    const imagePreview = document.getElementById('imagePreview');
    const fileUploadSection = document.getElementById('fileUploadSection');
    
    if (imagePreview) imagePreview.classList.add('hidden');
    if (fileUploadSection) fileUploadSection.classList.add('hidden');
    
    currentEditId = null;
    const contentId = document.getElementById('contentId');
    if (contentId) contentId.value = '';
}

// Update content filter tabs - this is already handled in the main DOMContentLoaded
// But we'll add it here as a backup in case the other handler doesn't work
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the page to fully load
    setTimeout(() => {
        const contentTabs = document.querySelectorAll('.content-tab');
        
        contentTabs.forEach(tab => {
            // Remove any existing listeners to avoid duplicates
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
            
            newTab.addEventListener('click', async function() {
                const type = this.getAttribute('data-type');
                
                // Update active tab
                contentTabs.forEach(t => {
                    t.classList.remove('active', 'border-b-2', 'border-amber-700', 'text-amber-900');
                    t.classList.add('text-gray-600');
                });
                this.classList.add('active', 'border-b-2', 'border-amber-700', 'text-amber-900');
                this.classList.remove('text-gray-600');
                
                // Load filtered content
                await loadAllContent(type);
            });
        });
    }, 100);
});

