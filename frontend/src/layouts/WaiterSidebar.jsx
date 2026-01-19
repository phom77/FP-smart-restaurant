import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const WaiterSidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        if (window.confirm(t('common.logout_confirm'))) {
            logout();
            navigate('/login');
        }
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'vi' ? 'en' : 'vi';
        i18n.changeLanguage(newLang);
    };

    // Close sidebar when route changes on mobile
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="md:hidden bg-white p-4 shadow-sm flex items-center justify-between fixed top-0 left-0 right-0 z-40 h-16">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">menu</span>
                    </button>
                    <h1 className="text-[22px] font-bold tracking-wide bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        {t('common.appName')}
                    </h1>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shadow-xl flex flex-col h-full
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center h-16 md:h-20 bg-white shrink-0">
                    <h1 className="text-[22px] font-bold tracking-wide bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        {t('common.appName')}
                    </h1>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <Link to="/waiter/orders" className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium text-sm ${location.pathname === '/waiter/orders' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                        <span className="material-symbols-outlined mr-3 text-[22px]">list_alt</span> {t('waiter.order_list')}
                    </Link>
                    <Link to="/waiter/map" className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium text-sm ${location.pathname === '/waiter/map' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                        <span className="material-symbols-outlined mr-3 text-[22px]">table_restaurant</span> {t('waiter.table_map')}
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
                    <button
                        onClick={toggleLanguage}
                        className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all text-sm font-medium border border-gray-200 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">language</span>
                        {i18n.language === 'vi' ? 'English' : 'Tiếng Việt'}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">logout</span> {t('admin.logout')}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-gray-50 w-full pt-16 md:pt-0">
                <main className="p-4 md:p-8 md:pb-8 pb-24">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default WaiterSidebar;
