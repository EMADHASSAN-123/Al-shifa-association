/**
 * Supabase Content Management Module
 * إدارة المحتوى مع Supabase
 */

// Use Supabase from `window.supabaseClient` (set by `supabase-config.js`).
// This file is intended to be loaded as a normal script (not an ES module)
// so its functions are available globally to other non-module scripts.

let supabase = null;

function initContentSupabase() {
    // Try to get the client from window
    if (window.supabaseClient) {
        supabase = window.supabaseClient;
        return true;
    }
    if (window.supabase && typeof window.supabase.from === 'function') {
        supabase = window.supabase;
        return true;
    }
    // Wait for initialization
    return false;
}

// Initialize immediately or wait for event
async function ensureSupabaseReady() {
    if (initContentSupabase()) {
        return true;
    }
    
    // Wait for supabaseReady event or check periodically
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        const checkSupabase = () => {
            if (initContentSupabase()) {
                resolve(true);
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkSupabase, 100);
            } else {
                console.error('Failed to initialize Supabase after max attempts');
                resolve(false);
            }
        };
        
        const onReady = () => {
            if (initContentSupabase()) {
                window.removeEventListener('supabaseReady', onReady);
                resolve(true);
            }
        };
        
        window.addEventListener('supabaseReady', onReady);
        checkSupabase();
    });
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ensureSupabaseReady();
    });
} else {
    ensureSupabaseReady();
}
 
/**
 * Get all content from Supabase
 * جلب جميع المحتويات من Supabase
 */
async function getAllContent(type = 'all') {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        let query = supabase
            .from('content')
            .select('*')
            .order('created_at', { ascending: false });

        if (type !== 'all') {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error fetching content:', error);
        return { success: false, error: error.message, data: [] };
    }
}
window.getAllContent = getAllContent;

/**
 * Get single content by ID
 * جلب محتوى واحد بالمعرف
 */
async function getContentById(id) {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const { data, error } = await supabase
            .from('content')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching content:', error);
        return { success: false, error: error.message };
    }
}
window.getContentById = getContentById;

/**
 * Create new content
 * إنشاء مح توى جديد  
 */ 
async function createContent(contentData) {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const { data, error } = await supabase
            .from('content')
            .insert([contentData])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error creating content:', error);
        return { success: false, error: error.message };
    }
}
window.createContent = createContent;
/**
 * Update content
 * تحديث المحتوى
 */
async function updateContent(id, contentData) {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const { data, error } = await supabase
            .from('content')
            .update(contentData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error updating content:', error);
        return { success: false, error: error.message };
    }
}
window.updateContent = updateContent;

/**
 * Delete content
 * حذف المحتوى
 */
async function deleteContentFromSupabase(id) {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const { error } = await supabase
            .from('content')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting content:', error);
        return { success: false, error: error.message };
    }
}
window.deleteContentFromSupabase = deleteContentFromSupabase;

/**
 * Upload file to Supabase Storage
 * رفع ملف إلى Supabase Storage
 */
async function uploadFile(file, folder = 'content') {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('media')
            .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);

        return { success: true, url: urlData.publicUrl, path: filePath };
    } catch (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message };
    }
}
window.uploadFile = uploadFile;

/**
 * Delete file from Supabase Storage
 * حذف ملف من Supabase Storage
 */
async function deleteFile(filePath) {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const { error } = await supabase.storage
            .from('media')
            .remove([filePath]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting file:', error);
        return { success: false, error: error.message };
    }
}
window.deleteFile = deleteFile;

/**
 * Get content by type for public pages
 * جلب المحتوى حسب النوع للصفحات العامة
 */
async function getPublicContent(type, limit = null) {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        let query = supabase
            .from('content')
            .select('*')
            .eq('type', type)
            .eq('published', true)
            .order('created_at', { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error fetching public content:', error);
        return { success: false, error: error.message, data: [] };
    }
}
window.getPublicContent = getPublicContent;

/**
 * Get dashboard statistics
 * جلب إحصائيات لوحة التحكم
 */
async function getDashboardStats() {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        // Get counts for each content type
        const [courses, news, files, pages, allContent] = await Promise.all([
            supabase.from('content').select('*', { count: 'exact', head: true }).eq('type', 'courses'),
            supabase.from('content').select('*', { count: 'exact', head: true }).eq('type', 'news'),
            supabase.from('content').select('*', { count: 'exact', head: true }).eq('type', 'files'),
            supabase.from('content').select('*', { count: 'exact', head: true }).eq('type', 'pages'),
            supabase.from('content').select('*', { count: 'exact', head: true })
        ]);

        return {
            success: true,
            stats: {
                totalContent: allContent.count || 0,
                courses: courses.count || 0,
                news: news.count || 0,
                files: files.count || 0,
                pages: pages.count || 0
            }
        };
    } catch (error) {
        console.error('Error fetching stats:', error);
        return { 
            success: false, 
            error: error.message,
            stats: {
                totalContent: 0,
                courses: 0,
                news: 0,
                files: 0,
                pages: 0
            }
        };
    }
}
window.getDashboardStats = getDashboardStats;

/**
 * Media Management Functions
 * دوال إدارة الوسائط
 */

/**
 * Get all media items
 * جلب جميع الوسائط
 */
async function getAllMedia(type = 'all', page = 1, pageSize = 20) {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        let query = supabase
            .from('media')
            .select('*')
            .order('created_at', { ascending: false });

        if (type !== 'all') {
            query = query.eq('type', type);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        // Get total count for pagination
        let countQuery = supabase
            .from('media')
            .select('*', { count: 'exact', head: true });
        
        if (type !== 'all') {
            countQuery = countQuery.eq('type', type);
        }

        const { count: totalCount } = await countQuery;

        return { 
            success: true, 
            data: data || [], 
            pagination: {
                page,
                pageSize,
                total: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / pageSize)
            }
        };
    } catch (error) {
        console.error('Error fetching media:', error);
        return { success: false, error: error.message, data: [] };
    }
}
window.getAllMedia = getAllMedia;

/**
 * Get single media item by ID
 * جلب وسيط واحد بالمعرف
 */
async function getMediaById(id) {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const { data, error } = await supabase
            .from('media')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching media:', error);
        return { success: false, error: error.message };
    }
}
window.getMediaById = getMediaById;

/**
 * Create new media item
 * إنشاء وسيط جديد
 */
async function createMedia(mediaData) {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const { data, error } = await supabase
            .from('media')
            .insert([mediaData])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error creating media:', error);
        return { success: false, error: error.message };
    }
}
window.createMedia = createMedia;

/**
 * Update media item
 * تحديث وسيط
 */
async function updateMedia(id, mediaData) {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const { data, error } = await supabase
            .from('media')
            .update(mediaData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error updating media:', error);
        return { success: false, error: error.message };
    }
}
window.updateMedia = updateMedia;

/**
 * Delete media item
 * حذف وسيط
 */
async function deleteMedia(id) {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        // First get the media item to get file path
        const mediaResult = await getMediaById(id);
        if (!mediaResult.success || !mediaResult.data) {
            throw new Error('Media item not found');
        }

        const mediaItem = mediaResult.data;

        // Delete from database
        const { error: dbError } = await supabase
            .from('media')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        // Delete file from storage if it exists
        if (mediaItem.file_path && mediaItem.type !== 'video') {
            const { error: storageError } = await supabase.storage
                .from('media')
                .remove([mediaItem.file_path]);

            // Log storage error but don't fail if file doesn't exist
            if (storageError) {
                console.warn('Error deleting file from storage:', storageError);
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting media:', error);
        return { success: false, error: error.message };
    }
}
window.deleteMedia = deleteMedia;

/**
 * Upload media file to Supabase Storage
 * رفع ملف وسائط إلى Supabase Storage
 */
async function uploadMediaFile(file, type) {
    try {
        await ensureSupabaseReady();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        // Determine folder based on type
        let folder = 'images';
        if (type === 'audio') folder = 'audio';
        else if (type === 'video') folder = 'videos';

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('media')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);

        return { success: true, url: urlData.publicUrl, path: filePath };
    } catch (error) {
        console.error('Error uploading media file:', error);
        return { success: false, error: error.message };
    }
}
window.uploadMediaFile = uploadMediaFile;

/**
 * Extract YouTube video ID from URL
 * استخراج معرف فيديو YouTube من الرابط
 */
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Validate YouTube URL
 * التحقق من صحة رابط YouTube
 */
function validateYouTubeUrl(url) {
    const videoId = extractYouTubeId(url);
    return videoId !== null;
}
window.validateYouTubeUrl = validateYouTubeUrl;
window.extractYouTubeId = extractYouTubeId;

