/**
 * Dashboard Supabase Integration
 * ربط لوحة التحكم مع Supabase
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for protectAdminPage to be available
    let authCheckAttempts = 0;
    while (typeof window.protectAdminPage === 'undefined' && authCheckAttempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        authCheckAttempts++;
    }
    
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

    // Load dashboard data
    await loadDashboardData();
});

/**
 * Load all dashboard data
 * تحميل جميع بيانات لوحة التحكم
 */
async function loadDashboardData() {
    try {
        // Load statistics
        await loadStatistics();
        
        // Load recent content
        await loadRecentContent();
        
        // Load latest updates
        await loadLatestUpdates();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

/**
 * Load dashboard statistics
 * تحميل إحصائيات لوحة التحكم
 */
async function loadStatistics() {
    try {
        const statsResult = await getDashboardStats();
        
        if (statsResult.success && statsResult.stats) {
            const stats = statsResult.stats;
            
            // Update courses count
            const coursesCountEl = document.getElementById('coursesCount');
            if (coursesCountEl) {
                coursesCountEl.textContent = stats.courses || 0;
            }
            
            // You can add more stats here if needed
            // For example, update total content count, etc.
        } else {
            console.error('Failed to load statistics:', statsResult.error);
            // Set default values
            const coursesCountEl = document.getElementById('coursesCount');
            if (coursesCountEl) {
                coursesCountEl.textContent = '0';
            }
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Set default values on error
        const coursesCountEl = document.getElementById('coursesCount');
        if (coursesCountEl) {
            coursesCountEl.textContent = '0';
        }
    }
}

/**
 * Load recent content table
 * تحميل جدول المحتوى الأخير
 */
async function loadRecentContent() {
    const result = await getAllContent('all');
    const tableBody = document.getElementById('recentContentTable');
    
    if (!tableBody) return;
    
    if (result.success && result.data && result.data.length > 0) {
        // Show only last 5 items
        const recentItems = result.data.slice(0, 5);
        
        tableBody.innerHTML = recentItems.map(item => {
            const date = new Date(item.created_at);
            const formattedDate = date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const typeLabels = {
                'courses': 'دورة',
                'news': 'خبر',
                'files': 'ملف',
                'pages': 'صفحة'
            };
            
            return `
                <tr class="border-b">
                    <td class="p-3">${item.title}</td>
                    <td class="p-3">${typeLabels[item.type] || item.type}</td>
                    <td class="p-3">${formattedDate}</td>
                    <td class="p-3">
                        <button onclick="editContentFromDashboard('${item.id}')" class="text-amber-700 hover:text-amber-900 ml-3">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteContentFromDashboard('${item.id}')" class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } else {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="p-6 text-center text-gray-500">
                    لا يوجد محتوى حتى الآن
                </td>
            </tr>
        `;
    }
}

/**
 * Load latest updates
 * تحميل آخر التحديثات
 */
async function loadLatestUpdates() {
    const result = await getAllContent('all');
    const updatesContainer = document.getElementById('latestUpdates');
    
    if (!updatesContainer) return;
    
    if (result.success && result.data && result.data.length > 0) {
        // Show only last 3 items
        const latestItems = result.data.slice(0, 3);
        
        updatesContainer.innerHTML = latestItems.map(item => {
            const date = new Date(item.created_at);
            const timeAgo = getTimeAgo(date);
            
            const typeLabels = {
                'courses': 'دورة',
                'news': 'خبر',
                'files': 'ملف',
                'pages': 'صفحة'
            };
            
            return `
                <div class="border-r-4 border-amber-700 pr-4">
                    <p class="font-semibold text-gray-800">${item.title}</p>
                    <p class="text-sm text-gray-600">${timeAgo}</p>
                </div>
            `;
        }).join('');
    } else {
        updatesContainer.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <p>لا توجد تحديثات</p>
            </div>
        `;
    }
}

/**
 * Get time ago in Arabic
 * حساب الوقت المنقضي بالعربية
 */
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 60) {
        return `منذ ${minutes} دقيقة`;
    } else if (hours < 24) {
        return `منذ ${hours} ساعة`;
    } else {
        return `منذ ${days} يوم`;
    }
}

/**
 * Edit content from dashboard
 * تعديل المحتوى من لوحة التحكم
 */
function editContentFromDashboard(id) {
    window.location.href = `content-management.html?edit=${id}`;
}

/**
 * Delete content from dashboard
 * حذف المحتوى من لوحة التحكم
 */
async function deleteContentFromDashboard(id) {
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
        await loadRecentContent();
        await loadLatestUpdates();
        await loadStatistics(); // Reload stats after deletion
    } else {
        if (typeof showToast !== 'undefined') {
            showToast('حدث خطأ أثناء الحذف: ' + result.error, 'error');
        } else {
            alert('حدث خطأ أثناء الحذف: ' + result.error);
        }
    }
}

// Make functions available globally
window.editContentFromDashboard = editContentFromDashboard;
window.deleteContentFromDashboard = deleteContentFromDashboard;

