/**
 * Admin Header Module
 * وحدة رأس لوحة التحكم - عرض اسم المدير
 */

/**
 * Initialize admin header with user name
 * تهيئة رأس لوحة التحكم مع اسم المستخدم
 */
async function initAdminHeader() {
    try {
        // Wait for getCurrentAdmin to be available (preferred) or getAdminUser (fallback)
        let attempts = 0;
        while ((typeof window.getCurrentAdmin === 'undefined' && 
                typeof window.getAdminUser === 'undefined') && 
               attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // Try to get admin from users table first (getCurrentAdmin)
        let adminUser = null;
        if (typeof window.getCurrentAdmin !== 'undefined') {
            adminUser = await window.getCurrentAdmin();
        }
        
        // Fallback to getAdminUser if getCurrentAdmin returns null
        if (!adminUser && typeof window.getAdminUser !== 'undefined') {
            adminUser = await window.getAdminUser();
        }
        
        if (!adminUser) {
            console.warn('No admin user found');
            return;
        }
        
        // Get display name (prefer name from users table, then fallback to email)
        const displayName = adminUser.name || 
                           adminUser.fullName || 
                           adminUser.email || 
                           'المدير';
        
        // Find all admin name placeholders in the page
        const adminNameElements = document.querySelectorAll('[data-admin-name]');
        
        adminNameElements.forEach(element => {
            element.textContent = displayName;
        });
        
        // Also update any hardcoded "مرحباً، المدير" text
        const welcomeTexts = document.querySelectorAll('.admin-welcome-text');
        welcomeTexts.forEach(element => {
            element.textContent = `مرحباً، ${displayName}`;
        });
        
    } catch (error) {
        console.error('Error initializing admin header:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminHeader);
} else {
    initAdminHeader();
}

// Make function available globally
window.initAdminHeader = initAdminHeader;

