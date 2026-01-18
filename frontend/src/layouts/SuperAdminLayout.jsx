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
        logout();
        navigate('/login');
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
            {/* 1. MOBILE OVERLAY (Màn che đen khi mở menu trên mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* 2. SIDEBAR (THANH TASKBAR) */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0 md:static md:inset-auto
                `}
            >
                <div className="h-full flex flex-col">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-800">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg">S</span>
                            <span className="font-bold text-xl tracking-wide">{t('superadmin.sidebar.panel_title')}</span>
                        </div>
                        {/* Nút đóng menu trên mobile */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="ml-auto md:hidden text-gray-400 hover:text-white"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)} // Đóng menu khi click (mobile)
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                                    ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 font-medium'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                                `}
                            >
                                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                <span className="text-sm">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer Sidebar (Language + User Info + Logout) */}
                    <div className="p-4 border-t border-gray-800 space-y-3">
                        {/* Language Switcher */}
                        <button
                            onClick={toggleLanguage}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors text-sm font-medium border border-gray-700"
                        >
                            <span className="material-symbols-outlined text-[20px]">language</span>
                            {i18n.language === 'vi' ? 'English' : 'Tiếng Việt'}
                        </button>

                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                                {user?.full_name?.charAt(0) || 'A'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">{user?.full_name || 'Admin'}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            {t('superadmin.sidebar.logout')}
                        </button>
                    </div>
                </div>
            </aside>

            {/* 3. MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header (Chỉ hiện nút Menu trên màn nhỏ) */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:hidden shadow-sm sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-md hover:bg-gray-100"
                    >
                        <span className="material-symbols-outlined text-2xl">menu</span>
                    </button>
                    <span className="ml-4 font-bold text-gray-800">{t('superadmin.sidebar.panel_title')}</span>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}