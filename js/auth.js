// auth.js (محسّن)
// يعتمد على window.supabase من supabase-config.js

function getSupabase() {
    // Try to get the client from window
    if (window.supabaseClient) {
        return window.supabaseClient;
    }
    if (window.supabase && typeof window.supabase.from === 'function') {
        return window.supabase;
    }
    return null;
}

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

// تحقق من الجلسة الحالية
async function checkAuth() {
    try {
        await ensureSupabaseReady();
        const client = getSupabase();
        const { data } = await client.auth.getSession();
        if (data.session) {
            localStorage.setItem('admin_session', JSON.stringify(data.session));
        }
        return data.session || null;
    } catch (err) {
        console.error('checkAuth error', err);
        return null;
    }
}

/**
 * Verify if user is admin by checking users table
 * التحقق من كون المستخدم مديراً من خلال جدول users
 */
async function verifyAdminRole(userId) {
    try {
        await ensureSupabaseReady();
        const client = getSupabase();
        
        if (!userId) {
            return { isAdmin: false, user: null };
        }
        
        // Check if user exists in users table with role = 'admin'
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('id', userId)
            .eq('role', 'admin')
            .single();
        
        if (error || !data) {
            console.log('User is not admin or not found:', error?.message || 'No data');
            return { isAdmin: false, user: null };
        }
        
        return { isAdmin: true, user: data };
    } catch (err) {
        console.error('verifyAdminRole error:', err);
        return { isAdmin: false, user: null };
    }
}

// تسجيل الدخول بالبريد وكلمة المرور أو Magic Link
async function login(email, password) {
    try {
        await ensureSupabaseReady();
        const client = getSupabase();

        if (!password) {
            return await sendMagicLink(email);
        }

        // Sign in with email and password
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Verify user is admin
        const userId = data.user?.id;
        if (!userId) {
            // Sign out if no user ID
            await client.auth.signOut();
            return { 
                success: false, 
                error: 'ليس لديك صلاحية للوصول إلى لوحة التحكم.' 
            };
        }

        // Check admin role from users table
        const { isAdmin, user } = await verifyAdminRole(userId);
        
        if (!isAdmin) {
            // Sign out non-admin users
            await client.auth.signOut();
            return { 
                success: false, 
                error: 'ليس لديك صلاحية للوصول إلى لوحة التحكم.' 
            };
        }

        // User is admin, proceed
        localStorage.setItem('admin_session', JSON.stringify(data.session));
        return { success: true, data, adminUser: user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// تسجيل الدخول عبر Google OAuth
async function loginWithGoogle() {
    try {
        await ensureSupabaseReady();
        const client = getSupabase();

        const { error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: { 
                redirectTo: window.location.origin + '/admin/login.html?oauth=google'
            }
        });

        if (error) throw error;

    } catch (err) {
        console.error('loginWithGoogle error', err);
        if (typeof showToast !== 'undefined') {
            showToast('حدث خطأ أثناء تسجيل الدخول عبر Google', 'error');
        }
    }
}

// تسجيل الدخول عبر GitHub OAuth
async function loginWithGitHub() {
    try {
        await ensureSupabaseReady();
        const client = getSupabase();

        const { error } = await client.auth.signInWithOAuth({
            provider: 'github',
            options: { 
                redirectTo: window.location.origin + '/admin/login.html?oauth=github'
            }
        });

        if (error) throw error;

    } catch (err) {
        console.error('loginWithGitHub error', err);
        if (typeof showToast !== 'undefined') {
            showToast('حدث خطأ أثناء تسجيل الدخول عبر GitHub', 'error');
        }
    }
}

// Handle OAuth callback and verify admin role
async function handleOAuthCallback() {
    try {
        await ensureSupabaseReady();
        const client = getSupabase();
        
        // Get the session from OAuth callback
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        
        if (sessionError || !session) {
            redirectToLogin();
            return;
        }
        
        const userId = session.user?.id;
        if (!userId) {
            await client.auth.signOut();
            redirectToLogin();
            return;
        }
        
        // Verify admin role
        const { isAdmin, user } = await verifyAdminRole(userId);
        
        if (!isAdmin) {
            // Sign out non-admin users
            await client.auth.signOut();
            localStorage.removeItem('admin_session');
            
            // Show error message
            const errorMsg = 'ليس لديك صلاحية للوصول إلى لوحة التحكم.';
            const errorMessage = document.getElementById('errorMessage');
            if (errorMessage) {
                errorMessage.textContent = errorMsg;
                errorMessage.classList.remove('hidden');
            } else if (typeof showToast !== 'undefined') {
                showToast(errorMsg, 'error');
            }
            
            // Redirect to login with error
            setTimeout(() => {
                window.location.href = 'login.html?error=unauthorized';
            }, 2000);
            return;
        }
        
        // User is admin, redirect to dashboard
        localStorage.setItem('admin_session', JSON.stringify(session));
        window.location.href = 'dashboard.html';
        
    } catch (err) {
        console.error('handleOAuthCallback error:', err);
        redirectToLogin();
    }
}

// إرسال رابط تسجيل الدخول السحري
async function sendMagicLink(email) {
    try {
        await ensureSupabaseReady();
        const client = getSupabase();

        // First, check if user exists in users table with admin role
        // Note: We can't check before sending magic link, so we'll verify after they click the link
        const { data, error } = await client.auth.signInWithOtp({
            email,
            options: { 
                emailRedirectTo: window.location.origin + '/admin/login.html?magiclink=true'
            }
        });

        if (error) throw error;
        return { success: true, data };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Handle magic link callback and verify admin role
async function handleMagicLinkCallback() {
    try {
        await ensureSupabaseReady();
        const client = getSupabase();
        
        // Get the session from magic link
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        
        if (sessionError || !session) {
            redirectToLogin();
            return;
        }
        
        const userId = session.user?.id;
        if (!userId) {
            await client.auth.signOut();
            redirectToLogin();
            return;
        }
        
        // Verify admin role
        const { isAdmin, user } = await verifyAdminRole(userId);
        
        if (!isAdmin) {
            // Sign out non-admin users
            await client.auth.signOut();
            
            // Show error message
            const errorMsg = 'ليس لديك صلاحية للوصول إلى لوحة التحكم.';
            if (typeof showToast !== 'undefined') {
                showToast(errorMsg, 'error');
            } else {
                alert(errorMsg);
            }
            
            // Redirect to login
            setTimeout(() => {
                window.location.href = 'login.html?error=unauthorized';
            }, 2000);
            return;
        }
        
        // User is admin, redirect to dashboard
        localStorage.setItem('admin_session', JSON.stringify(session));
        window.location.href = 'dashboard.html';
        
    } catch (err) {
        console.error('handleMagicLinkCallback error:', err);
        redirectToLogin();
    }
}

// تسجيل الخروج
async function logout() {
    try {
        await ensureSupabaseReady();
        const client = getSupabase();

        const { error } = await client.auth.signOut();
        if (error) throw error;

        localStorage.removeItem('admin_session');
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Logout error:', error);
        showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
}

// حماية الصفحات - التحقق من الجلسة ودور المدير
async function protectAdminPage() {
    try {
        await ensureSupabaseReady();
        const client = getSupabase();
        
        // Get current session from Supabase
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        
        if (sessionError) {
            console.error('Session error:', sessionError);
            redirectToLogin();
            return false;
        }
        
        const session = sessionData?.session;
        
        if (!session) {
            redirectToLogin();
            return false;
        }
        
        // Verify session is still valid by checking user
        const { data: userData, error: userError } = await client.auth.getUser();
        
        if (userError || !userData?.user) {
            console.error('User verification error:', userError);
            redirectToLogin();
            return false;
        }
        
        const userId = userData.user.id;
        
        // Verify user has admin role in users table
        const { isAdmin, user } = await verifyAdminRole(userId);
        
        if (!isAdmin) {
            console.warn('User is not admin, denying access');
            // Sign out non-admin user
            await client.auth.signOut();
            localStorage.removeItem('admin_session');
            
            // Show error message
            const errorMsg = 'ليس لديك صلاحية للوصول إلى لوحة التحكم.';
            if (typeof showToast !== 'undefined') {
                showToast(errorMsg, 'error');
            }
            
            // Redirect to home page or login
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
            return false;
        }
        
        // Store session in localStorage for quick access
        localStorage.setItem('admin_session', JSON.stringify(session));
        
        return true;
    } catch (err) {
        console.error('protectAdminPage error:', err);
        redirectToLogin();
        return false;
    }
}

// Get admin user information from auth
async function getAdminUser() {
    try {
        await ensureSupabaseReady();
        const client = getSupabase();
        
        const { data: userData, error } = await client.auth.getUser();
        
        if (error || !userData?.user) {
            return null;
        }
        
        const user = userData.user;
        
        // Return user info with full name or email
        return {
            id: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.email?.split('@')[0] || 
                     'المدير',
            metadata: user.user_metadata || {}
        };
    } catch (err) {
        console.error('getAdminUser error:', err);
        return null;
    }
}

/**
 * Get current admin profile from users table
 * الحصول على ملف المدير الحالي من جدول users
 * Returns: { id, email, name, role, ... } or null
 */
async function getCurrentAdmin() {
    try {
        await ensureSupabaseReady();
        const client = getSupabase();
        
        // Get authenticated user
        const { data: userData, error: userError } = await client.auth.getUser();
        
        if (userError || !userData?.user) {
            return null;
        }
        
        const userId = userData.user.id;
        
        // Fetch admin profile from users table
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('id', userId)
            .eq('role', 'admin')
            .single();
        
        if (error || !data) {
            console.error('Error fetching admin profile:', error);
            return null;
        }
        
        // Return full admin profile
        return {
            id: data.id,
            email: data.email || userData.user.email,
            name: data.name || data.full_name || userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0] || 'المدير',
            role: data.role,
            ...data // Include all other fields from users table
        };
    } catch (err) {
        console.error('getCurrentAdmin error:', err);
        return null;
    }
}

// Helper function to redirect to login
function redirectToLogin() {
    // Determine correct login path based on current location
    const isInAdmin = window.location.pathname.includes('/admin/');
    const loginPath = isInAdmin ? 'login.html' : '../admin/login.html';
    window.location.href = loginPath;
}
 
// التعامل مع الفورم والأزرار
document.addEventListener('DOMContentLoaded', async function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Handle OAuth and Magic Link callbacks
    const urlParams = new URLSearchParams(window.location.search);
    const oauthProvider = urlParams.get('oauth');
    const magicLink = urlParams.get('magiclink');
    const errorParam = urlParams.get('error');
    
    // Show error if redirected with unauthorized error
    if (errorParam === 'unauthorized' && errorMessage) {
        errorMessage.textContent = 'ليس لديك صلاحية للوصول إلى لوحة التحكم.';
        errorMessage.classList.remove('hidden');
    }
    
    // Handle OAuth callback
    if (oauthProvider) {
        await handleOAuthCallback();
        return;
    }
    
    // Handle Magic Link callback
    if (magicLink === 'true') {
        await handleMagicLinkCallback();
        return;
    }

    // فورم تسجيل الدخول
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            errorMessage.classList.add('hidden');
            successMessage.classList.add('hidden');

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const result = await login(email, password);

            if (result.success) {
                successMessage.textContent = password
                    ? 'تم تسجيل الدخول بنجاح! جاري التوجيه...'
                    : 'تم إرسال رابط تسجيل الدخول إلى بريدك الإلكتروني.';
                successMessage.classList.remove('hidden');

                if (password) {
                    setTimeout(() => window.location.href = 'dashboard.html', 1000);
                }
            } else {
                errorMessage.textContent = result.error || 'حدث خطأ في تسجيل الدخول';
                errorMessage.classList.remove('hidden');
            }
        });
    }

    // زر Google
    const googleBtn = document.getElementById('googleLogin');
    googleBtn?.addEventListener('click', loginWithGoogle);
    
    // زر GitHub (if exists)
    const githubBtn = document.getElementById('githubLogin');
    githubBtn?.addEventListener('click', loginWithGitHub);

    // زر Magic Link
    const magicBtn = document.getElementById('magicLinkLogin');
    magicBtn?.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        if (!email) {
            if (typeof showToast !== 'undefined') {
                showToast('يرجى إدخال البريد الإلكتروني أولاً', 'warning');
            } else if (errorMessage) {
                errorMessage.textContent = 'يرجى إدخال البريد الإلكتروني أولاً';
                errorMessage.classList.remove('hidden');
            }
            return;
        }
 
        const result = await sendMagicLink(email);
        if (result.success) {
            if (typeof showToast !== 'undefined') {
                showToast('تم إرسال رابط تسجيل الدخول إلى بريدك الإلكتروني.', 'success');
            } else if (successMessage) {
                successMessage.textContent = 'تم إرسال رابط تسجيل الدخول إلى بريدك الإلكتروني.';
                successMessage.classList.remove('hidden');
            }
        } else {
            if (typeof showToast !== 'undefined') {
                showToast(result.error || 'حدث خطأ أثناء إرسال الرابط', 'error');
            } else if (errorMessage) {
                errorMessage.textContent = result.error || 'حدث خطأ أثناء إرسال الرابط';
                errorMessage.classList.remove('hidden');
            }
        }
    });

    // إعادة التوجيه إذا كان المستخدم مسجّل الدخول ومصادق عليه كمدير
    const session = await checkAuth();
    if (session && window.location.pathname.includes('login.html')) {
        // Verify admin role before redirecting
        const userId = session.user?.id;
        if (userId) {
            const { isAdmin } = await verifyAdminRole(userId);
            if (isAdmin) {
                window.location.href = 'dashboard.html';
            } else {
                // Clear session if not admin
                await ensureSupabaseReady();
                const client = getSupabase();
                await client.auth.signOut();
            }
        }
    }
});

// تعريف دوال عامة
window.protectAdminPage = protectAdminPage;
window.getAdminUser = getAdminUser;
window.getCurrentAdmin = getCurrentAdmin;
window.verifyAdminRole = verifyAdminRole;
window.logout = logout;
window.login = login;
window.handleOAuthCallback = handleOAuthCallback;
window.handleMagicLinkCallback = handleMagicLinkCallback;
window.loginWithGitHub = loginWithGitHub;
