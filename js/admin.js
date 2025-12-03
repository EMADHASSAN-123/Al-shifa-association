// Content Management Functions
// These functions are now handled by content-management-supabase.js
// Keeping these as fallback/backward compatibility functions

function openAddModalFallback() {
    const modal = document.getElementById('contentModal');
    if (modal) {
        modal.classList.remove('hidden');
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = 'إضافة محتوى جديد';
        const form = document.getElementById('contentForm');
        if (form) form.reset();
    }
}

function closeModalFallback() {
    const modal = document.getElementById('contentModal');
    if (modal) {
        modal.classList.add('hidden');
        const form = document.getElementById('contentForm');
        if (form) form.reset();
    }
}

// Only define these if they don't already exist (to avoid conflicts)
if (typeof window.openAddModal === 'undefined') {
    window.openAddModal = openAddModalFallback;
}
if (typeof window.closeModal === 'undefined') {
    window.closeModal = closeModalFallback;
}

// Content Type Filter - This is now handled by content-management-supabase.js
// Keeping this as a fallback for client-side filtering if Supabase is not available
document.addEventListener('DOMContentLoaded', function() {
    // Only set up client-side filtering if Supabase functions are not available
    if (typeof window.getAllContent === 'undefined') {
        const contentTabs = document.querySelectorAll('.content-tab');
        const contentCards = document.querySelectorAll('.content-card');

        contentTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const type = this.getAttribute('data-type');

                // Update active tab
                contentTabs.forEach(t => {
                    t.classList.remove('active', 'border-b-2', 'border-amber-700', 'text-amber-900');
                    t.classList.add('text-gray-600');
                });
                this.classList.add('active', 'border-b-2', 'border-amber-700', 'text-amber-900');
                this.classList.remove('text-gray-600');

                // Filter content cards (client-side fallback)
                contentCards.forEach(card => {
                    if (type === 'all' || card.getAttribute('data-type') === type) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }
 
    // Handle content form submission (legacy fallback only)
    // The real handler is in content-management-supabase.js
    const contentForm = document.getElementById('contentForm');
    if (contentForm && typeof window.createContent === 'undefined') {
        contentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('يرجى التأكد من تحميل ملفات Supabase بشكل صحيح');
            if (typeof window.closeModal !== 'undefined') {
                window.closeModal();
            }
        }); 
    }

    // Show/hide file upload based on content type
    // This should work regardless of Supabase
    const contentTypeSelect = document.getElementById('contentType');
    const fileUploadSection = document.getElementById('fileUploadSection');
    
    if (contentTypeSelect && fileUploadSection) {
        contentTypeSelect.addEventListener('change', function() {
            if (this.value === 'files') {
                fileUploadSection.classList.remove('hidden');
            } else {
                fileUploadSection.classList.add('hidden');
            }
        });
    }
});

