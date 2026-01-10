import { useState, useEffect } from 'react';
import api from '../../services/api';
import MenuCard from '../../components/MenuCard';
import ItemDetailModal from '../../components/ItemDetailModal';
import { useCart } from '../../contexts/CartContext';

export default function MenuPage() {
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const { getCartCount } = useCart();

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

    // Fetch menu items
    useEffect(() => {
        const fetchMenuItems = async () => {
            setLoading(true);
            try {
                const params = {
                    is_available: 'true'
                };

                if (selectedCategory !== 'all') {
                    params.category_id = selectedCategory;
                }

                if (searchQuery) {
                    params.search = searchQuery;
                }

                if (sortBy === 'price_asc') {
                    params.sort_by = 'price_asc';
                } else if (sortBy === 'price_desc') {
                    params.sort_by = 'price_desc';
                }

                const response = await api.get('/api/menu/items', { params });
                setMenuItems(response.data.data || []);
            } catch (error) {
                console.error('Error fetching menu items:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMenuItems();
    }, [selectedCategory, searchQuery, sortBy]);

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
                    <div className="relative">
                        <button className="relative text-3xl hover:scale-110 transition-transform">
                            🛒
                            {getCartCount() > 0 && (
                                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-6 text-center shadow-lg animate-pulse">
                                    {getCartCount()}
                                </span>
                            )}
                        </button>
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
            </div>
        </div>
    );
}
