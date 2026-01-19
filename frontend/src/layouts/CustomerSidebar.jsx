import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';

const CustomerSidebar = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { t, i18n } = useTranslation();
    const { getCartCount } = useCart();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'vi' ? 'en' : 'vi';
        i18n.changeLanguage(newLang);
    };

    const handleLogout = () => {
        if (window.confirm(t('common.logout_confirm'))) {
            logout();
            navigate('/menu');
        }
    };

    // Close sidebar when route changes on mobile
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    return (
        <>
            {/* Mobile Header (Only visible on mobile) */}
            <div className="md:hidden bg-white p-4 shadow-sm flex items-center justify-between fixed top-0 left-0 right-0 z-40 h-16">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">menu</span>
                    </button>
                    <span className="font-bold text-[22px] tracking-wide bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{t('common.appName')}</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="ml-auto md:hidden text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Mobile Overlay */}
            {
                isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )
            }

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shadow-xl flex flex-col h-screen
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-[22px] tracking-wide bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{t('common.appName')}</span>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all font-medium mb-4 border border-blue-100 bg-blue-50"
                        >
                            <span className="material-symbols-outlined text-blue-600">dashboard</span>
                            <span className="text-blue-700">{t('customer.menu.back_to_admin')}</span>
                        </button>
                    )}

                    <Link to="/menu" className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium ${location.pathname === '/menu' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                        <span className="material-symbols-outlined mr-3 text-[22px]">restaurant_menu</span>
                        <span className="text-sm">{t('customer.menu.title')}</span>
                    </Link>



                    {user && (
                        <>
                            <Link to="/my-orders" className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium ${location.pathname === '/my-orders' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                                <span className="material-symbols-outlined mr-3 text-[22px]">receipt_long</span>
                                <span className="text-sm">{t('customer.menu.my_orders')}</span>
                            </Link>

                            <Link to="/profile" className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium ${location.pathname === '/profile' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                                <span className="material-symbols-outlined mr-3 text-[22px]">person</span>
                                <span className="text-sm">{t('customer.menu.profile')}</span>
                            </Link>
                        </>
                    )}
                </nav>

                {/* Footer Sidebar */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3 shrink-0">
                    <button
                        onClick={toggleLanguage}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all text-sm font-medium border border-gray-200 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">language</span>
                        {i18n.language === 'vi' ? 'English' : 'Tiếng Việt'}
                    </button>

                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            {t('customer.menu.logout')}
                        </button>
                    ) : (
                        <Link
                            to="/login"
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-colors text-sm font-medium shadow-md shadow-emerald-200"
                        >
                            <span className="material-symbols-outlined text-[20px]">login</span>
                            {t('customer.menu.login')}
                        </Link>
                    )}
                </div>
            </div >
        </>
    );
};

export default CustomerSidebar;
