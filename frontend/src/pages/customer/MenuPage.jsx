import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import MenuCard from '../../components/MenuCard';
import ItemDetailModal from '../../components/ItemDetailModal';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import CustomerSidebar from '../../layouts/CustomerSidebar';

export default function MenuPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t, i18n } = useTranslation();
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
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showChefRecommendation, setShowChefRecommendation] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [qrError, setQrError] = useState(null); // { title: string, desc: string, params: object } or null
    const [isVerifying, setIsVerifying] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const observer = useRef();
    const { getCartCount } = useCart();

    // Verify QR Code and Store Table ID
    useEffect(() => {
        const tableId = searchParams.get('table');
        const token = searchParams.get('token');

        const verifyQRCode = async () => {
            try {
                setIsVerifying(true);
                const response = await api.get('/api/menu', {
                    params: { table: tableId, token: token }
                });

                if (response.data.success) {
                    localStorage.setItem('qr_table_id', tableId);
                    localStorage.setItem('qr_token', token);
                    localStorage.setItem('qr_table_number', response.data.table.number);
                    setQrError(null);
                    setIsReadOnly(false);
                }
            } catch (error) {
                console.error('QR Verification Failed:', error);
                const errorData = error.response?.data;
                setQrError({
                    title: 'customer.qr.invalid_title',
                    desc: errorData?.error || 'customer.qr.invalid_desc',
                    params: errorData?.params || { tableNumber: tableId }
                });
                setIsReadOnly(true);
                localStorage.removeItem('qr_table_id');
                localStorage.removeItem('qr_token');
            } finally {
                setIsVerifying(false);
            }
        };

        if (tableId && token) {
            verifyQRCode();
        } else {
            // No QR code in URL, check storage
            const storedTable = localStorage.getItem('qr_table_id');
            const storedToken = localStorage.getItem('qr_token');
            if (!storedTable || !storedToken) {
                setIsReadOnly(true);
                setQrError({
                    title: 'customer.qr.missing_title',
                    desc: 'customer.qr.missing_desc'
                });
            } else {
                setIsReadOnly(false);
                setQrError(null);
            }
        }
    }, [searchParams]);

    // Intersection Observer callback for infinite scroll
    const lastItemRef = useCallback(node => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !debouncedSearch) {
                setPage(prevPage => prevPage + 1);
            }
        });

        if (node) observer.current.observe(node);
    }, [loadingMore, hasMore, debouncedSearch]);

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
            // Only show full loading on initial load or filter change (page 1)
            if (page === 1) {
                setLoading(true);
            }
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
                    } else if (sortBy === 'popularity') {
                        results.sort((a, b) => (b.order_count || 0) - (a.order_count || 0));
                    } else if (sortBy === 'name') {
                        results.sort((a, b) => a.name.localeCompare(b.name));
                    }

                    setMenuItems(results);
                } else {
                    // Standard menu fetch without search with pagination
                    if (page > 1) {
                        setLoadingMore(true);
                    }
                    const params = {
                        page: page,
                        limit: 20
                    };

                    if (selectedCategory !== 'all') {
                        params.category_id = selectedCategory;
                    }

                    if (sortBy === 'price_asc') {
                        params.sort_by = 'price_asc';
                    } else if (sortBy === 'price_desc') {
                        params.sort_by = 'price_desc';
                    } else if (sortBy === 'popularity') {
                        params.sort_by = 'popularity';
                    } else if (sortBy === 'newest') {
                        params.sort_by = 'newest';
                    }

                    if (showChefRecommendation) {
                        params.chef_recommendation = 'true';
                    }


                    const response = await api.get('/api/menu/items', { params });

                    // Append items for infinite scroll
                    if (page === 1) {
                        setMenuItems(response.data.data || []);
                    } else {
                        setMenuItems(prev => [...prev, ...(response.data.data || [])]);
                    }

                    // Update hasMore flag
                    setHasMore(response.data.pagination?.hasMore || false);
                    setLoadingMore(false);
                }
            } catch (error) {
                console.error('Error fetching menu items:', error);
                setMenuItems([]);
                setLoadingMore(false);
            } finally {
                setLoading(false);
                setSearchLoading(false);
            }
        };

        fetchMenuItems();
    }, [selectedCategory, debouncedSearch, sortBy, page, showChefRecommendation]);

    // Reset page when filters change (but not when page itself changes)
    useEffect(() => {
        setPage(1);
        setMenuItems([]);
        setHasMore(true);
    }, [selectedCategory, sortBy, debouncedSearch, showChefRecommendation]);

    const handleItemClick = async (item) => {
        try {
            // Fetch full item details with modifiers
            const response = await api.get(`/api/menu/items/${item.id}`);
            setSelectedItem(response.data.data);
        } catch (error) {
            console.error('Error fetching item details:', error);
        }
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'vi' ? 'en' : 'vi';
        i18n.changeLanguage(newLang);
    };

    // State for sidebar is now handled in CustomerSidebar component

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-lg text-gray-600 font-medium">{t('common.processing') || 'Verifying your table...'}</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <CustomerSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen w-full pt-16 md:pt-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Page Title (Desktop/Mobile) */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                {t('customer.menu.title')}
                            </h1>
                            <p className="text-gray-500 mt-1 text-sm">{t('customer.menu.subtitle')}</p>
                        </div>

                        {/* Desktop Cart Button */}
                        <button
                            onClick={() => navigate('/cart')}
                            className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:text-emerald-600 hover:border-emerald-200 rounded-xl shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="relative">
                                <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">shopping_cart</span>
                                {getCartCount() > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                                        {getCartCount()}
                                    </span>
                                )}
                            </div>
                            <span className="font-bold text-sm">{t('customer.cart.title')}</span>
                        </button>
                    </div>

                    {/* Read-Only Mode Banner */}
                    {isReadOnly && (
                        <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-6 shadow-lg text-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-full">
                                    <span className="material-symbols-outlined text-white text-3xl">info</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">
                                        {qrError ? t(qrError.title) : t('customer.qr.missing_title')}
                                    </h3>
                                    <p className="opacity-90 text-sm">
                                        {qrError ? t(qrError.desc, qrError.params) : t('customer.qr.readonly_banner')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* QR Code Reminder - Show if no table selected AND not adding to existing order (Old UI, hidden if ReadOnly banner shown) */}
                    {!isReadOnly && !searchParams.get('table') && !localStorage.getItem('qr_table_id') && !localStorage.getItem('addToOrderId') && (
                        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                                    <span className="material-symbols-outlined">qr_code_scanner</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800 mb-1">
                                        {t('customer.menu.scan_qr_title')}
                                    </p>
                                    <p className="text-gray-600 text-sm">
                                        {t('customer.menu.scan_qr_desc')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="mb-4 sm:mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('customer.menu.search_placeholder')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 sm:pr-6 py-3 sm:py-4 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all shadow-md"
                            />
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto p-1 scrollbar-hide">
                        <button
                            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-md ${selectedCategory === 'all'
                                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg scale-105'
                                : 'bg-white text-gray-700 hover:shadow-lg hover:scale-105'
                                }`}
                            onClick={() => setSelectedCategory('all')}
                        >
                            <span className="material-symbols-outlined text-sm">auto_awesome</span> {t('customer.menu.all')}
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-md ${selectedCategory === cat.id
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-8 bg-white rounded-xl sm:rounded-2xl shadow-md p-3 sm:p-4">
                        <label className="font-semibold text-gray-700 flex items-center gap-2 text-sm sm:text-base">
                            <span className="material-symbols-outlined">sort</span> {t('customer.menu.sort')}:
                        </label>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium cursor-pointer focus:outline-none focus:border-emerald-500 transition-all w-full sm:w-auto"
                        >
                            <option value="name">{t('customer.menu.sort_name')}</option>
                            <option value="newest">{t('customer.menu.sort_newest')}</option>
                            <option value="popularity">{t('customer.menu.sort_popularity')}</option>
                            <option value="price_asc">{t('customer.menu.sort_price_asc')}</option>
                            <option value="price_desc">{t('customer.menu.sort_price_desc')}</option>
                        </select>

                        {/* Chef's Choice Filter */}
                        <button
                            onClick={() => setShowChefRecommendation(!showChefRecommendation)}
                            className={`w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105 text-xs sm:text-sm ${showChefRecommendation
                                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <span className="material-symbols-outlined text-sm">restaurant_menu</span>
                            <span>{t('customer.menu.chefs_choice')}</span>
                            {showChefRecommendation && <span className="text-xs">✓</span>}
                        </button>
                    </div>

                    {/* Menu Items Grid */}
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                            <p className="mt-4 text-lg text-gray-600 font-medium">{t('customer.menu.loading')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {menuItems.length === 0 ? (
                                <div className="col-span-full text-center py-20 bg-white rounded-2xl shadow-lg">
                                    <div className="mb-4 text-gray-400">
                                        <span className="material-symbols-outlined text-6xl">search_off</span>
                                    </div>
                                    <p className="text-xl text-gray-600 font-medium">{t('customer.menu.no_results')}</p>
                                    <p className="text-gray-500 mt-2">{t('customer.menu.try_search_again')}</p>
                                </div>
                            ) : (
                                menuItems.map((item, index) => {
                                    // Attach ref to last item for infinite scroll
                                    if (menuItems.length === index + 1) {
                                        return (
                                            <div ref={lastItemRef} key={item.id}>
                                                <MenuCard
                                                    item={item}
                                                    onClick={handleItemClick}
                                                    isReadOnly={isReadOnly}
                                                />
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <MenuCard
                                                key={item.id}
                                                item={item}
                                                onClick={handleItemClick}
                                                isReadOnly={isReadOnly}
                                            />
                                        );
                                    }
                                })
                            )}
                        </div>
                    )}

                    {/* Loading More Indicator */}
                    {loadingMore && !loading && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600">{t('customer.menu.loading_more')}</p>
                        </div>
                    )}

                    {/* No More Items */}
                    {!hasMore && menuItems.length > 0 && !debouncedSearch && (
                        <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined text-2xl animate-bounce">check_circle</span>
                            <p className="text-lg">{t('customer.menu.all_loaded')}</p>
                        </div>
                    )}

                    {/* Item Detail Modal */}
                    {selectedItem && (
                        <ItemDetailModal
                            item={selectedItem}
                            onClose={() => setSelectedItem(null)}
                            isReadOnly={isReadOnly}
                        />
                    )}

                    {/* Guest/Customer Selection Modal */}
                    {showGuestModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
                                <div className="text-center mb-6">
                                    <div className="mb-4 text-gray-800">
                                        <span className="material-symbols-outlined text-6xl">waving_hand</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('customer.menu.welcome')}</h2>
                                    <p className="text-gray-600">{t('customer.menu.welcome_desc')}</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Customer Button */}
                                    <button
                                        onClick={handleGoToLogin}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-3"
                                    >
                                        <span className="material-symbols-outlined text-3xl">person</span>
                                        <div className="text-left">
                                            <div className="font-bold">{t('customer.menu.i_am_customer')}</div>
                                            <div className="text-sm opacity-90">{t('customer.menu.login_desc')}</div>
                                        </div>
                                    </button>

                                    {/* Guest Button */}
                                    <button
                                        onClick={handleContinueAsGuest}
                                        className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center gap-3"
                                    >
                                        <span className="material-symbols-outlined text-3xl">restaurant</span>
                                        <div className="text-left">
                                            <div className="font-bold">{t('customer.menu.continue_guest')}</div>
                                            <div className="text-sm opacity-75">{t('customer.menu.guest_desc')}</div>
                                        </div>
                                    </button>
                                </div>

                                <p className="text-xs text-gray-500 text-center mt-6">
                                    {t('customer.menu.login_later_hint')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
