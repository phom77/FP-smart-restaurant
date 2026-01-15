import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SuperAdminLayout() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/super-admin/create-admin', label: 'Tạo Chủ Nhà Hàng', icon: 'person_add' },
        { path: '/super-admin/users', label: 'Quản lý Users', icon: 'group' },
        { path: '/super-admin/settings', label: 'Cấu hình Hệ thống', icon: 'settings' },
    ];

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white flex flex-col shadow-xl">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-2xl font-bold text-blue-400">Super Admin</h1>
                    <p className="text-xs text-gray-400 mt-1">System Control Center</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                                location.pathname === item.path
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined mr-3">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">
                            SA
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.full_name || 'Super Admin'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium"
                    >
                        <span className="material-symbols-outlined text-sm mr-2">logout</span>
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                    </h2>
                </header>
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}