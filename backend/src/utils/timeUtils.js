/**
 * Helper utilities for Vietnam Time (UTC+7) using Intl
 */

// Helper to get 00:00:00 VN Time of Today (as UTC Date object)
const getTodayStartVN = () => {
    // get 'YYYY-MM-DD' in VN Timezone
    const vnDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    // Parse as ISO string with offset to get correct UTC timestamp
    return new Date(`${vnDateStr}T00:00:00+07:00`);
};

const getStartOfPeriod = (range) => {
    const startTime = getTodayStartVN();

    switch (range) {
        case 'week':
            startTime.setDate(startTime.getDate() - 7);
            break;
        case 'month':
            startTime.setDate(startTime.getDate() - 30);
            break;
        case 'year':
            startTime.setFullYear(startTime.getFullYear() - 1);
            break;
        case 'today':
        default:
            // Already 00:00 today
            break;
    }
    return startTime;
};

const getEndOfPeriod = () => {
    const vnDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    return new Date(`${vnDateStr}T23:59:59.999+07:00`);
};

// Deprecated or rarely used directly, but kept for compatibility if needed.
// Returns a Date object that "looks like" VN time when printed in local env, 
// strictly for logging/display if needed, not for DB queries.
const getVietnamDate = () => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
};

module.exports = {
    getVietnamDate,
    getStartOfPeriod,
    getEndOfPeriod
};
