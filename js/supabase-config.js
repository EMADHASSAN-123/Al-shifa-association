// supabase-config.js (GLOBAL MODE)
// This file initializes the Supabase client using the global `supabase` from the CDN script:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// إعدادات Supabase - يتم تحميلها من config.js
// Supabase Configuration - Loaded from config.js
// تأكد من تحميل config.js قبل هذا الملف في HTML
// Make sure config.js is loaded before this file in HTML

// استخدام القيم من config.js إذا كانت متوفرة، وإلا استخدام القيم الافتراضية
// Use values from config.js if available, otherwise use default values
window.SUPABASE_URL = window.ENV_CONFIG?.SUPABASE_URL || "YOUR_SUPABASE_URL_HERE";
window.SUPABASE_ANON_KEY = window.ENV_CONFIG?.SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY_HERE";

// التحقق من وجود القيم المطلوبة
// Verify required values are present
if (window.SUPABASE_URL === "YOUR_SUPABASE_URL_HERE" || window.SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY_HERE") {
    console.error(
        "⚠️ تحذير: لم يتم تكوين Supabase بشكل صحيح!\n" +
        "⚠️ Warning: Supabase is not configured properly!\n" +
        "يرجى إنشاء ملف config.js بناءً على config.example.js\n" +
        "Please create config.js based on config.example.js"
    );
}
 
// دالة تهيئة Supabase
function initSupabaseGlobal() {
    try {
        // التأكد من تحميل مكتبة Supabase من CDN
        if (!window.supabase || !window.supabase.createClient) {
            console.error(
                "Supabase CDN not loaded. Make sure you added this script BEFORE this file:\n" +
                '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
            );
            return false;
        }

        // إنشاء عميل Supabase عالمي
        window.supabaseClient = window.supabase.createClient(
            window.SUPABASE_URL,
            window.SUPABASE_ANON_KEY
        );

        // Also set window.supabase to the client for backward compatibility
        // Note: This overwrites the library namespace, but it's needed for existing code
        const supabaseLib = window.supabase;
        window.supabase = window.supabaseClient;
        window.supabaseLib = supabaseLib; // Keep reference to library

        console.log("Supabase initialized successfully (GLOBAL MODE)");
        return true;

    } catch (err) {
        console.error("Failed to initialize Supabase client:", err);
        return false;
    } finally {
        // إعلام بقية السكربتات أن Supabase أصبح جاهزًا
        window.dispatchEvent(new CustomEvent("supabaseReady"));
    }
}

// Helper function to get Supabase client
function getSupabaseClient() {
    if (window.supabaseClient) {
        return window.supabaseClient;
    }
    // Try to initialize if not already done
    if (initSupabaseGlobal()) {
        return window.supabaseClient;
    }
    return null;
}

// Make getSupabaseClient available globally
window.getSupabaseClient = getSupabaseClient;

// تشغيل التهيئة فورًا
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabaseGlobal);
} else {
    initSupabaseGlobal();
}
