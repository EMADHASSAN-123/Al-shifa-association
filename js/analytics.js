/**
 * Analytics Module
 * وحدة الإحصائيات - عرض إحصائيات الزوار
 */

let visitorsChart = null;

/**
 * Initialize analytics page
 * تهيئة صفحة الإحصائيات
 */
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
    
    // Load analytics data
    await loadAnalytics();
});

/**
 * Load all analytics data
 * تحميل جميع بيانات الإحصائيات
 */
async function loadAnalytics() {
    try {
        await ensureSupabaseReady();
        const client = getSupabase();
        
        if (!client) {
            console.error('Supabase client not available');
            showError('حدث خطأ في الاتصال بقاعدة البيانات');
            return;
        }
        
        // Load statistics
        await loadStatistics(client);
        
        // Load chart data
        await loadChartData(client);
        
        // Load recent visitors
        await loadRecentVisitors(client);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        showError('حدث خطأ أثناء تحميل الإحصائيات');
    }
}

/**
 * Load visitor statistics
 * تحميل إحصائيات الزوار
 */
async function loadStatistics(client) {
    try {
        // Get total unique visitors (count distinct fingerprints)
        const { data: totalData, error: totalError } = await client
            .from('visitors')
            .select('fingerprint', { count: 'exact', head: false });
        
        let totalVisitors = 0;
        if (!totalError && totalData) {
            // Count unique fingerprints
            const uniqueFingerprints = new Set(totalData.map(v => v.fingerprint));
            totalVisitors = uniqueFingerprints.size;
        }
        
        // Get today's visitors
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();
        
        const { data: todayData, error: todayError } = await client
            .from('visitors')
            .select('fingerprint')
            .gte('visited_at', todayISO);
        
        let todayVisitors = 0;
        if (!todayError && todayData) {
            const uniqueToday = new Set(todayData.map(v => v.fingerprint));
            todayVisitors = uniqueToday.size;
        }
        
        // Get last 7 days visitors
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const sevenDaysAgoISO = sevenDaysAgo.toISOString();
        
        const { data: last7DaysData, error: last7DaysError } = await client
            .from('visitors')
            .select('fingerprint')
            .gte('visited_at', sevenDaysAgoISO);
        
        let last7DaysVisitors = 0;
        if (!last7DaysError && last7DaysData) {
            const uniqueLast7Days = new Set(last7DaysData.map(v => v.fingerprint));
            last7DaysVisitors = uniqueLast7Days.size;
        }
        
        // Calculate average daily (last 7 days)
        const averageDaily = last7DaysVisitors > 0 ? Math.round(last7DaysVisitors / 7) : 0;
        
        // Update UI
        document.getElementById('totalVisitors').textContent = totalVisitors.toLocaleString('ar-SA');
        document.getElementById('todayVisitors').textContent = todayVisitors.toLocaleString('ar-SA');
        document.getElementById('last7DaysVisitors').textContent = last7DaysVisitors.toLocaleString('ar-SA');
        document.getElementById('averageDaily').textContent = averageDaily.toLocaleString('ar-SA');
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Set default values
        document.getElementById('totalVisitors').textContent = '0';
        document.getElementById('todayVisitors').textContent = '0';
        document.getElementById('last7DaysVisitors').textContent = '0';
        document.getElementById('averageDaily').textContent = '0';
    }
}

/**
 * Load chart data for last 7 days
 * تحميل بيانات الرسم البياني لآخر 7 أيام
 */
async function loadChartData(client) {
    try {
        // Get data for last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const sevenDaysAgoISO = sevenDaysAgo.toISOString();
        
        const { data, error } = await client
            .from('visitors')
            .select('visited_at, fingerprint')
            .gte('visited_at', sevenDaysAgoISO)
            .order('visited_at', { ascending: true });
        
        if (error) {
            console.error('Error loading chart data:', error);
            return;
        }
        
        // Group by date and count unique visitors per day
        const dailyData = {};
        const dates = [];
        
        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const dateKey = date.toISOString().split('T')[0];
            dates.push(dateKey);
            dailyData[dateKey] = new Set();
        }
        
        // Count visitors per day
        if (data && data.length > 0) {
            data.forEach(visitor => {
                const visitDate = new Date(visitor.visited_at);
                visitDate.setHours(0, 0, 0, 0);
                const dateKey = visitDate.toISOString().split('T')[0];
                
                if (dailyData[dateKey]) {
                    dailyData[dateKey].add(visitor.fingerprint);
                }
            });
        }
        
        // Prepare chart data
        const labels = dates.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' });
        });
        
        const visitorCounts = dates.map(date => dailyData[date].size);
        
        // Create or update chart
        const ctx = document.getElementById('visitorsChart');
        if (!ctx) return;
        
        if (visitorsChart) {
            visitorsChart.destroy();
        }
        
        visitorsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'عدد الزوار',
                    data: visitorCounts,
                    borderColor: 'rgb(180, 83, 9)',
                    backgroundColor: 'rgba(180, 83, 9, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                family: 'Cairo',
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `الزوار: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                family: 'Cairo'
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                family: 'Cairo'
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

/**
 * Load recent visitors table
 * تحميل جدول آخر الزوار
 */
async function loadRecentVisitors(client) {
    try {
        const { data, error } = await client
            .from('visitors')
            .select('*')
            .order('visited_at', { ascending: false })
            .limit(20);
        
        const tableBody = document.getElementById('recentVisitorsTable');
        if (!tableBody) return;
        
        if (error) {
            console.error('Error loading recent visitors:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="p-6 text-center text-red-500">
                        حدث خطأ أثناء تحميل البيانات
                    </td>
                </tr>
            `;
            return;
        }
        
        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="p-6 text-center text-gray-500">
                        لا توجد بيانات زوار حتى الآن
                    </td>
                </tr>
            `;
            return;
        }
        
        // Display recent visitors
        tableBody.innerHTML = data.map(visitor => {
            const visitDate = new Date(visitor.visited_at);
            const formattedDate = visitDate.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Get browser name from user agent
            const userAgent = visitor.user_agent || '';
            let browserName = 'غير معروف';
            if (userAgent.includes('Chrome')) browserName = 'Chrome';
            else if (userAgent.includes('Firefox')) browserName = 'Firefox';
            else if (userAgent.includes('Safari')) browserName = 'Safari';
            else if (userAgent.includes('Edge')) browserName = 'Edge';
            
            const referrer = visitor.referrer && visitor.referrer !== 'direct' 
                ? visitor.referrer.substring(0, 50) + '...' 
                : 'مباشر';
            
            return `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-3">${formattedDate}</td>
                    <td class="p-3">${visitor.ip_address || 'غير معروف'}</td>
                    <td class="p-3">${browserName}</td>
                    <td class="p-3">${referrer}</td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading recent visitors:', error);
        const tableBody = document.getElementById('recentVisitorsTable');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="p-6 text-center text-red-500">
                        حدث خطأ أثناء تحميل البيانات
                    </td>
                </tr>
            `;
        }
    }
}

/**
 * Refresh analytics data
 * تحديث بيانات الإحصائيات
 */
async function refreshAnalytics() {
    const refreshBtn = event.target.closest('button');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i');
        if (icon) {
            icon.classList.add('fa-spin');
        }
    }
    
    await loadAnalytics();
    
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i');
        if (icon) {
            setTimeout(() => {
                icon.classList.remove('fa-spin');
            }, 500);
        }
    }
    
    if (typeof showToast !== 'undefined') {
        showToast('تم تحديث الإحصائيات بنجاح', 'success');
    }
}

/**
 * Helper functions
 */
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

function getSupabase() {
    if (window.supabaseClient) {
        return window.supabaseClient;
    }
    if (window.supabase && typeof window.supabase.from === 'function') {
        return window.supabase;
    }
    return null;
}

function showError(message) {
    if (typeof showToast !== 'undefined') {
        showToast(message, 'error');
    } else {
        alert(message);
    }
}

// Make refresh function available globally
window.refreshAnalytics = refreshAnalytics;

