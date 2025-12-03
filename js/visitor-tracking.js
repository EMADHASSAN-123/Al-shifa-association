/**
 * Visitor Tracking Module
 * وحدة تتبع الزوار
 * 
 * Tracks unique visitors on the homepage and stores data in Supabase
 */

/**
 * Get visitor fingerprint (device/session identifier)
 * الحصول على بصمة الزائر (معرف الجهاز/الجلسة)
 */
function getVisitorFingerprint() {
    try {
        // Create a unique identifier based on browser characteristics
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Visitor fingerprint', 2, 2);
        
        const fingerprint = {
            canvas: canvas.toDataURL(),
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            userAgent: navigator.userAgent.substring(0, 50) // First 50 chars only
        };
        
        // Create hash from fingerprint
        const fingerprintString = JSON.stringify(fingerprint);
        let hash = 0;
        for (let i = 0; i < fingerprintString.length; i++) {
            const char = fingerprintString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return Math.abs(hash).toString(36);
    } catch (error) {
        console.error('Error generating fingerprint:', error);
        // Fallback to a simple identifier
        return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Get visitor IP address (using a free service)
 * الحصول على عنوان IP الزائر
 */
async function getVisitorIP() {
    try {
        // Try multiple IP services for reliability
        const services = [
            'https://api.ipify.org?format=json',
            'https://ipapi.co/json/',
            'https://api.ip.sb/ip'
        ];
        
        for (const service of services) {
            try {
                const response = await fetch(service, { 
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return data.ip || data.query || data;
                }
            } catch (err) {
                continue; // Try next service
            }
        }
        
        return 'unknown';
    } catch (error) {
        console.error('Error getting IP:', error);
        return 'unknown';
    }
}

/**
 * Check if visitor was already tracked today
 * التحقق من تتبع الزائر اليوم
 */
function isVisitorTrackedToday(fingerprint) {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const storageKey = `visitor_tracked_${fingerprint}`;
        const trackedDate = localStorage.getItem(storageKey);
        
        if (trackedDate === today) {
            return true; // Already tracked today
        }
        
        // Store today's date
        localStorage.setItem(storageKey, today);
        return false;
    } catch (error) {
        console.error('Error checking visitor tracking:', error);
        return false;
    }
}

/**
 * Track new visitor
 * تتبع زائر جديد
 */
async function trackVisitor() {
    try {
        // Wait for Supabase to be ready
        await ensureSupabaseReady();
        const client = getSupabase();
        
        if (!client) {
            console.error('Supabase client not available');
            return;
        }
        
        // Get visitor fingerprint
        const fingerprint = getVisitorFingerprint();
        
        // Check if already tracked today
        if (isVisitorTrackedToday(fingerprint)) {
            console.log('Visitor already tracked today');
            return;
        }
        
        // Get visitor IP
        const ipAddress = await getVisitorIP();
        
        // Get additional visitor data
        const visitorData = {
            fingerprint: fingerprint,
            ip_address: ipAddress,
            user_agent: navigator.userAgent.substring(0, 200), // Limit length
            referrer: document.referrer || 'direct',
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            visited_at: new Date().toISOString(),
            page_url: window.location.href,
            page_path: window.location.pathname
        };
        
        // Insert visitor record into Supabase
        const { data, error } = await client
            .from('visitors')
            .insert([visitorData])
            .select();
        
        if (error) {
            // If table doesn't exist or other error, log it
            console.error('Error tracking visitor:', error);
            
            // Don't show error to user, just log it
            // The table might need to be created in Supabase
            return;
        }
        
        console.log('Visitor tracked successfully:', data);
        
    } catch (error) {
        console.error('Error in trackVisitor:', error);
        // Silently fail - don't interrupt user experience
    }
}

/**
 * Initialize visitor tracking on homepage
 * تهيئة تتبع الزوار في الصفحة الرئيسية
 */
function initVisitorTracking() {
    // Only track on homepage (index.html)
    if (!window.location.pathname.includes('index.html') && 
        window.location.pathname !== '/' &&
        !window.location.pathname.endsWith('/')) {
        return;
    }
    
    // Wait a bit for page to load, then track
    setTimeout(() => {
        trackVisitor();
    }, 1000); // Track after 1 second
}

// Helper function to ensure Supabase is ready
function ensureSupabaseReady(timeout = 5000) {
    return new Promise((resolve, reject) => {
        const client = getSupabase();
        if (client) return resolve(client);

        const onReady = () => {
            const client = getSupabase();
            if (client) {
                window.removeEventListener('supabaseReady', onReady);
                return resolve(client);
            }
        };

        window.addEventListener('supabaseReady', onReady);

        const start = Date.now();
        const iv = setInterval(() => {
            const client = getSupabase();
            if (client) {
                clearInterval(iv);
                window.removeEventListener('supabaseReady', onReady);
                return resolve(client);
            }
            if (Date.now() - start > timeout) {
                clearInterval(iv);
                window.removeEventListener('supabaseReady', onReady);
                return reject(new Error('Supabase client not available'));
            }
        }, 100);
    });
}

// Helper function to get Supabase client
function getSupabase() {
    if (window.supabaseClient) {
        return window.supabaseClient;
    }
    if (window.supabase && typeof window.supabase.from === 'function') {
        return window.supabase;
    }
    return null;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisitorTracking);
} else {
    initVisitorTracking();
}

// Make functions available globally
window.trackVisitor = trackVisitor;
window.initVisitorTracking = initVisitorTracking;

