import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdminSidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { t, i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'vi' ? 'en' : 'vi';
        i18n.changeLanguage(newLang);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
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
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        {t('admin.panel')}
                    </h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                    title="Logout"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
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
                fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shadow-xl flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        {t('admin.panel')}
                    </h1>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <Link to="/admin/dashboard" className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium ${location.pathname === '/admin/dashboard' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                        <span className="mr-3">📊</span> {t('admin.dashboard')}
                    </Link>
                    
                    <Link 
                        to="/admin/coupons" 
                        className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium ${
                            location.pathname.includes('/admin/coupons') 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                        }`}
                    >
                        <span className="mr-3">🎁</span> Quản lý Voucher
                    </Link>

                    <Link to="/admin/categories" className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium ${location.pathname === '/admin/categories' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                        <span className="mr-3">📂</span> {t('admin.categories')}
                    </Link>
                    <Link to="/admin/menu" className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium ${location.pathname === '/admin/menu' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                        <span className="mr-3">🍔</span> {t('admin.menu')}
                    </Link>

                    <Link to="/admin/tables" className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium ${location.pathname === '/admin/tables' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                        <span className="mr-3">🪑</span> {t('admin.tables')}
                    </Link>
                    <Link to="/admin/staff" className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium ${location.pathname === '/admin/staff' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                        <span className="mr-3">👥</span> {t('admin.staff')}
                    </Link>

                    <div className="my-4 border-t border-gray-100"></div>

                    <Link to="/menu" className="flex items-center px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all font-medium">
                        <span className="mr-3">👀</span> {t('admin.public_menu')}
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={toggleLanguage}
                        className="w-full mb-3 px-4 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {i18n.language === 'vi' ? '🇺🇸 English' : '🇻🇳 Tiếng Việt'}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        🚪 {t('admin.logout')}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-gray-50 w-full pt-16 md:pt-0">
                <header className="hidden md:block bg-white shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800">{t('admin.operations')}</h2>
                </header>
                <main className="p-4 md:p-8 md:pb-8 pb-24">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminSidebar;