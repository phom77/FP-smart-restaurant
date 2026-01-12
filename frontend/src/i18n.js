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
                        top_products: 'Top 10 Products',
                        peak_hours: 'Peak Hours',
                        today: 'Today',
                        week: 'Last Week',
                        month: 'Last Month',
                        year: 'Last Year',
                        all: 'All Time',
                    },
                    admin: {
                        panel: 'Admin Panel',
                        operations: 'Restaurant Operations',
                        dashboard: 'Dashboard',
                        categories: 'Categories',
                        menu: 'Menu Items',
                        revenue: 'Revenue',
                        public_menu: 'View Public Menu',
                        logout: 'Logout',
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
                        top_products: 'Top 10 món bán chạy',
                        peak_hours: 'Giờ cao điểm',
                        today: 'Hôm nay',
                        week: 'Tuần qua',
                        month: 'Tháng qua',
                        year: 'Năm qua',
                        all: 'Tất cả',
                    },
                    admin: {
                        panel: 'Bảng quản trị',
                        operations: 'Hoạt động nhà hàng',
                        dashboard: 'Bảng điều khiển',
                        categories: 'Danh mục',
                        menu: 'Thực đơn',
                        revenue: 'Doanh thu',
                        public_menu: 'Xem Menu công khai',
                        logout: 'Đăng xuất',
                    }
                }
            }
        }
    });

export default i18n;
