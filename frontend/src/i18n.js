import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        debug: false,
        interpolation: {
            escapeValue: false,
        },
        resources: {
            en: {
                translation: {
                    common: {
                        loading: 'Loading data...',
                        failed: 'Failed to fetch data',
                        export: 'Export to Excel',
                        period: 'Period',
                        orders: 'Orders',
                        revenue: 'Total Revenue',
                        no_data: 'No sales data found for this period.',
                    },
                    revenue: {
                        title: 'Revenue Statistics',
                        chart_title: 'Revenue Over Time',
                        top_products: 'Top 5 Products',
                        peak_hours: 'Peak Hours',
                        today: 'Today',
                        week: 'Last 7 Days',
                        month: 'Last 30 Days',
                        year: 'Last 1 Year',
                        all: 'All Time',
                    }
                }
            },
            vi: {
                translation: {
                    common: {
                        loading: 'Đang tải dữ liệu...',
                        failed: 'Tải dữ liệu thất bại',
                        export: 'Xuất Excel',
                        period: 'Thời gian',
                        orders: 'Đơn hàng',
                        revenue: 'Doanh thu',
                        no_data: 'Không có dữ liệu bán hàng trong khoảng thời gian này.',
                    },
                    revenue: {
                        title: 'Thống kê doanh thu',
                        chart_title: 'Doanh thu theo thời gian',
                        top_products: 'Top 5 món bán chạy',
                        peak_hours: 'Giờ cao điểm',
                        today: 'Hôm nay',
                        week: '7 ngày qua',
                        month: '30 ngày qua',
                        year: '1 năm qua',
                        all: 'Tất cả',
                    }
                }
            }
        }
    });

export default i18n;
