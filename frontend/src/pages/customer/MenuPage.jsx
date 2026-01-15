import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import MenuCard from '../../components/MenuCard';
import ItemDetailModal from '../../components/ItemDetailModal';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

export default function MenuPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const { getCartCount } = useCart();

    // Store table ID from QR code scan
    useEffect(() => {
        const tableFromUrl = searchParams.get('table');
        if (tableFromUrl) {
            localStorage.setItem('qr_table_id', tableFromUrl);
        }
    }, [searchParams]);

    // Check if user has seen the modal before
    useEffect(() => {
        const hasSeenModal = localStorage.getItem('hasSeenGuestModal');
        if (!user && !hasSeenModal) {
            setShowGuestModal(true);
        }
    }, [user]);

    const handleContinueAsGuest = () => {
        localStorage.setItem('hasSeenGuestModal', 'true');
        setShowGuestModal(false);
    };

    const handleGoToLogin = () => {
        localStorage.setItem('hasSeenGuestModal', 'true');
        navigate('/login');
    };

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/api/categories');
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    // Debounce search query (300ms delay)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch menu items with fuzzy search
    useEffect(() => {
        const fetchMenuItems = async () => {
            setLoading(true);
            setSearchLoading(true);
            try {
                // Use fuzzy search if there's a search query
                if (debouncedSearch && debouncedSearch.trim().length >= 2) {
                    const response = await api.get('/api/search', {
                        params: {
                            q: debouncedSearch,
                            limit: 50
                        }
                    });

                    let results = response.data.data || [];

                    // Apply category filter if selected
                    if (selectedCategory !== 'all') {
                        results = results.filter(item => item.category_id === selectedCategory);
                    }

                    // Apply sorting
                    if (sortBy === 'price_asc') {
                        results.sort((a, b) => a.price - b.price);
                    } else if (sortBy === 'price_desc') {
                        results.sort((a, b) => b.price - a.price);
                    } else if (sortBy === 'name') {
                        results.sort((a, b) => a.name.localeCompare(b.name));
                    }

                    setMenuItems(results);
                } else {
                    // Standard menu fetch without search
                    const params = {
                        is_available: 'true'
                    };

                    if (selectedCategory !== 'all') {
                        params.category_id = selectedCategory;
                    }

                    if (sortBy === 'price_asc') {
                        params.sort_by = 'price_asc';
                    } else if (sortBy === 'price_desc') {
                        params.sort_by = 'price_desc';
                    }

                    const response = await api.get('/api/menu/items', { params });
                    setMenuItems(response.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching menu items:', error);
                setMenuItems([]);
            } finally {
                setLoading(false);
                setSearchLoading(false);
            }
        };

        fetchMenuItems();
    }, [selectedCategory, debouncedSearch, sortBy]);

    const handleItemClick = async (item) => {
        try {
            // Fetch full item details with modifiers
            const response = await api.get(`/api/menu/items/${item.id}`);
            setSelectedItem(response.data.data);
        } catch (error) {
            console.error('Error fetching item details:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <header className="flex justify-between items-center mb-8 bg-white rounded-2xl shadow-lg p-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            Thực đơn
                        </h1>
                        <p className="text-gray-600 mt-1">Khám phá món ăn ngon</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Admin Back Button - Only show for admin */}
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => navigate('/admin/dashboard')}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                            >
                                <span>←</span>
                                <span>Quay về Admin</span>
                            </button>
                        )}

                        {/* My Orders Button */}
                        {user && (
                            <button
                                onClick={() => navigate('/my-orders')}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                            >
                                <span>📋</span>
                                <span>Đơn của tôi</span>
                            </button>
                        )}

                        {/* Profile Button */}
                        {user && (
                            <button
                                onClick={() => navigate('/profile')}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                            >
                                <span>👤</span>
                                <span>Tài khoản</span>
                            </button>
                        )}

                        {/* Login Button - Only show for guests */}
                        {!user && (
                            <button
                                onClick={() => navigate('/login')}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                            >
                                <span>🔐</span>
                                <span>Đăng nhập</span>
                            </button>
                        )}

                        {/* Cart Icon */}
                        <div className="relative">
                            <button
                                onClick={() => navigate('/cart')}
                                className="relative text-3xl hover:scale-110 transition-transform cursor-pointer"
                            >
                                🛒
                                {getCartCount() > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-6 text-center shadow-lg animate-pulse">
                                        {getCartCount()}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="🔍 Tìm món ăn yêu thích..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl text-base focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all shadow-md"
                        />
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-md ${selectedCategory === 'all'
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg scale-105'
                            : 'bg-white text-gray-700 hover:shadow-lg hover:scale-105'
                            }`}
                        onClick={() => setSelectedCategory('all')}
                    >
                        ✨ Tất cả
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-md ${selectedCategory === cat.id
                                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg scale-105'
                                : 'bg-white text-gray-700 hover:shadow-lg hover:scale-105'
                                }`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-3 mb-8 bg-white rounded-2xl shadow-md p-4">
                    <label className="font-semibold text-gray-700 flex items-center gap-2">
                        <span>📊</span> Sắp xếp:
                    </label>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-medium cursor-pointer focus:outline-none focus:border-emerald-500 transition-all"
                    >
                        <option value="name">Tên (A-Z)</option>
                        <option value="price_asc">Giá tăng dần</option>
                        <option value="price_desc">Giá giảm dần</option>
                    </select>
                </div>

                {/* Menu Items Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                        <p className="mt-4 text-lg text-gray-600 font-medium">Đang tải món ăn...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {menuItems.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-white rounded-2xl shadow-lg">
                                <div className="text-6xl mb-4">🔍</div>
                                <p className="text-xl text-gray-600 font-medium">Không tìm thấy món ăn nào</p>
                                <p className="text-gray-500 mt-2">Thử tìm kiếm với từ khóa khác</p>
                            </div>
                        ) : (
                            menuItems.map(item => (
                                <MenuCard
                                    key={item.id}
                                    item={item}
                                    onClick={handleItemClick}
                                />
                            ))
                        )}
                    </div>
                )}

                {/* Item Detail Modal */}
                {selectedItem && (
                    <ItemDetailModal
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                    />
                )}

                {/* Guest/Customer Selection Modal */}
                {showGuestModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-4">👋</div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Chào mừng đến với nhà hàng!</h2>
                                <p className="text-gray-600">Bạn muốn đặt món như thế nào?</p>
                            </div>

                            <div className="space-y-4">
                                {/* Customer Button */}
                                <button
                                    onClick={handleGoToLogin}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-3"
                                >
                                    <span className="text-2xl">👤</span>
                                    <div className="text-left">
                                        <div className="font-bold">Tôi là khách hàng</div>
                                        <div className="text-sm opacity-90">Đăng nhập để theo dõi đơn hàng</div>
                                    </div>
                                </button>

                                {/* Guest Button */}
                                <button
                                    onClick={handleContinueAsGuest}
                                    className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center gap-3"
                                >
                                    <span className="text-2xl">🍽️</span>
                                    <div className="text-left">
                                        <div className="font-bold">Tiếp tục như khách</div>
                                        <div className="text-sm opacity-75">Đặt món không cần đăng nhập</div>
                                    </div>
                                </button>
                            </div>

                            <p className="text-xs text-gray-500 text-center mt-6">
                                Bạn có thể đăng nhập sau để xem lịch sử đơn hàng
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
