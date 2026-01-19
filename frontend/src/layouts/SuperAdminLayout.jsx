import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function SuperAdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

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

    // 👉 Đã xóa mục "Tổng quan", chỉ giữ lại các chức năng chính
    const navItems = [
        { path: '/super-admin/users', label: t('superadmin.sidebar.users'), icon: 'group' },
        { path: '/super-admin/create-admin', label: t('superadmin.sidebar.create_admin'), icon: 'person_add' },
        { path: '/super-admin/settings', label: t('superadmin.sidebar.settings'), icon: 'settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* 1. MOBILE OVERLAY */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* 2. SIDEBAR */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-white text-gray-700 shadow-2xl transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0
                `}
            >
                <div className="h-full flex flex-col">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-[22px] tracking-wide bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{t('common.appName')}</span>
                        </div>
                        {/* Mobile Close Button */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="ml-auto md:hidden text-gray-400 hover:text-gray-600"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
                                    ${isActive
                                        ? 'bg-emerald-50 text-emerald-600 shadow-sm'
                                        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'}
                                `}
                            >
                                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                <span className="text-sm">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer Sidebar */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
                        {/* Language Switcher */}
                        <button
                            onClick={toggleLanguage}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all text-sm font-medium border border-gray-200 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">language</span>
                            {i18n.language === 'vi' ? 'English' : 'Tiếng Việt'}
                        </button>



                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            {t('superadmin.sidebar.logout')}
                        </button>
                    </div>
                </div>
            </aside>

            {/* 3. MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50 md:ml-64">
                {/* Mobile Header */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:hidden shadow-sm sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">menu</span>
                    </button>
                    <span className="ml-4 font-bold text-[22px] tracking-wide bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{t('common.appName')}</span>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}