import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { saveGuestOrder } from '../../utils/guestOrders';
import api from '../../services/api';

export default function CartPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [qrTableId, setQrTableId] = useState(null); // Track if table came from QR
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Voucher states
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [voucherDiscount, setVoucherDiscount] = useState(0);
    const [voucherError, setVoucherError] = useState(null);
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [showVoucherList, setShowVoucherList] = useState(false);

    // VAT rate state (default 8% as fallback)
    const [vatRate, setVatRate] = useState(8);

    // Get existing order info from localStorage (set by OrderTrackingPage)
    // Get existing order info from localStorage (set by OrderTrackingPage)
    const [existingOrderId] = useState(() => {
        return localStorage.getItem('addToOrderId');
    });

    const [existingTableId] = useState(() => {
        return localStorage.getItem('addToTableId');
    });

    // Fetch available tables
    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await api.get('/api/admin/tables');
                const tablesData = response.data.data || [];
                setTables(tablesData);

                // If we have qrTableId but no table_number in localStorage, save it now
                const tableId = localStorage.getItem('qr_table_id');
                if (tableId && !localStorage.getItem('qr_table_number')) {
                    const table = tablesData.find(t => t.id === tableId);
                    if (table) {
                        localStorage.setItem('qr_table_number', table.table_number);
                    }
                }
            } catch (err) {
                console.error('Error fetching tables:', err);
            }
        };
        fetchTables();

        // Check for table parameter from QR code scan (from URL or localStorage)
        const tableFromUrl = searchParams.get('table');
        const tableNumberFromUrl = searchParams.get('table_number');
        const tableFromStorage = localStorage.getItem('qr_table_id');

        // Priority: existingTableId > tableFromUrl > tableFromStorage
        if (existingTableId) {
            setSelectedTable(existingTableId);
        } else if (tableFromUrl) {
            setSelectedTable(tableFromUrl);
            setQrTableId(tableFromUrl);
            // Store in localStorage so it persists when navigating from menu to cart
            localStorage.setItem('qr_table_id', tableFromUrl);
            // Store table_number if provided in URL
            if (tableNumberFromUrl) {
                localStorage.setItem('qr_table_number', tableNumberFromUrl);
            }
        } else if (tableFromStorage) {
            setSelectedTable(tableFromStorage);
            setQrTableId(tableFromStorage);
        }
    }, [existingTableId, searchParams]);

    // Fetch available vouchers (filtered by user type)
    useEffect(() => {
        const fetchVouchers = async () => {
            try {
                const response = await api.get('/api/coupons', {
                    params: { userId: user?.id }
                });
                if (response.data.success) {
                    // Sort: usable vouchers first
                    const sorted = (response.data.data || []).sort((a, b) => {
                        if (a.canUse && !b.canUse) return -1;
                        if (!a.canUse && b.canUse) return 1;
                        return 0;
                    });
                    setAvailableVouchers(sorted);
                }
            } catch (err) {
                console.error('Error fetching vouchers:', err);
            }
        };
        fetchVouchers();
    }, [user]);

    // Fetch VAT rate from system settings
    useEffect(() => {
        const fetchVATRate = async () => {
            try {
                const response = await api.get('/api/system/settings');
                if (response.data.success && response.data.data.vat_rate) {
                    const rate = parseFloat(response.data.data.vat_rate);
                    setVatRate(rate);
                    console.log('✅ VAT Rate loaded from system settings:', rate + '%');
                }
            } catch (err) {
                console.warn('⚠️ Could not fetch VAT rate, using default 8%:', err.message);
                // Keep default 8% if API fails
            }
        };
        fetchVATRate();
    }, []);

    // ✅ Validate existing order is still valid (not completed/paid)
    useEffect(() => {
        const validateExistingOrder = async () => {
            if (existingOrderId) {
                try {
                    const response = await api.get(`/api/orders/${existingOrderId}`);
                    const order = response.data.data;

                    // If order is completed or paid, clear localStorage
                    if (order.status === 'completed' ||
                        order.status === 'cancelled' ||
                        order.payment_status === 'paid' ||
                        order.payment_status === 'success') {
                        console.log('⚠️ Order đã hoàn thành/thanh toán, xóa localStorage');
                        localStorage.removeItem('addToOrderId');
                        localStorage.removeItem('addToTableId');
                        // Reload page to reset state
                        window.location.reload();
                    }
                } catch (err) {
                    console.error('Error validating order:', err);
                    // If order not found, clear localStorage
                    localStorage.removeItem('addToOrderId');
                    localStorage.removeItem('addToTableId');
                }
            }
        };
        validateExistingOrder();
    }, [existingOrderId]);

    // Handle voucher application
    const handleApplyVoucher = async () => {
        setVoucherError(null);

        if (!voucherCode.trim()) {
            setVoucherError({ key: 'customer.cart.enter_voucher_error' });
            return;
        }

        try {
            const response = await api.post('/api/coupons/validate', {
                code: voucherCode.toUpperCase(),
                cartTotal: subtotal,
                userId: user?.id  // Pass userId for validation
            });

            if (response.data.success) {
                setAppliedVoucher(response.data.data);
                setVoucherDiscount(response.data.data.discountAmount);
                setVoucherError(null);
                setShowVoucherList(false);
            }
        } catch (err) {
            setVoucherError(err.response?.data?.message
                ? { message: err.response.data.message }
                : { key: 'customer.cart.invalid_voucher' }
            );
            setAppliedVoucher(null);
            setVoucherDiscount(0);
        }
    };

    // Handle voucher removal
    const handleRemoveVoucher = () => {
        setVoucherCode('');
        setAppliedVoucher(null);
        setVoucherDiscount(0);
        setVoucherError(null);
    };

    // Handle voucher selection from list
    const handleSelectVoucher = (voucher) => {
        if (!voucher.canUse) return; // Don't allow selecting unusable vouchers
        setVoucherCode(voucher.code);
        setShowVoucherList(false);
    };

    // Helper function to get target type label
    const getTargetTypeLabel = (targetType) => {
        switch (targetType) {
            case 'all': return `🌐 ${t('customer.cart.all')}`;
            case 'guest': return `👤 ${t('customer.cart.guest')}`;
            case 'customer': return `👥 ${t('customer.cart.member')}`;
            case 'new_user': return `🆕 ${t('customer.cart.new_user')}`;
            default: return '';
        }
    };

    // Handle checkout
    const handleCheckout = async () => {
        setError(null);

        // Validation
        if (cart.length === 0) {
            setError({ key: 'customer.cart.checkout_error_empty' });
            return;
        }

        // If adding to existing order, we already have table info
        // If creating new order, need to have scanned QR code
        if (!existingOrderId && !selectedTable) {
            setError({ key: 'customer.cart.checkout_error_qr' });
            return;
        }

        setLoading(true);

        try {
            // Prepare items data
            const items = cart.map(item => ({
                menu_item_id: item.id,
                quantity: item.quantity,
                notes: item.notes || ''
            }));

            let response;
            let orderId;

            // Check if adding to existing order or creating new one
            if (existingOrderId) {
                // Add items to existing order
                response = await api.post(`/api/orders/${existingOrderId}/items`, {
                    items: items
                });
                orderId = existingOrderId;
            } else {
                // Create new order
                const orderData = {
                    table_id: selectedTable,
                    customer_id: user?.id || null,
                    items: items,
                    coupon_code: appliedVoucher?.code || null
                };

                response = await api.post('/api/orders', orderData);
                orderId = response.data.order_id;

                // Save order ID for guest users (so they can claim it later)
                if (!user) {
                    saveGuestOrder(orderId);
                }
            }

            if (response.data.success) {
                // Clear localStorage flags
                localStorage.removeItem('addToOrderId');
                localStorage.removeItem('addToTableId');
                localStorage.removeItem('qr_table_id'); // Clear QR table ID
                localStorage.removeItem('qr_table_number'); // Clear QR table number

                // Clear cart
                clearCart();

                // Navigate to order tracking
                navigate(`/orders/${orderId}`);
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError(err.response?.data?.message
                ? { message: err.response.data.message }
                : { key: 'customer.cart.toast_checkout_failed' }
            );
        } finally {
            setLoading(false);
        }
    };

    // Calculate subtotal and tax
    const subtotal = getCartTotal();
    const taxAmount = subtotal * (vatRate / 100);
    const totalBeforeDiscount = subtotal + taxAmount;
    const total = totalBeforeDiscount - voucherDiscount;

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
                <div className="text-center bg-white rounded-2xl shadow-lg p-6 sm:p-12 max-w-md w-full">
                    <div className="text-5xl sm:text-6xl mb-4">🛒</div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{t('customer.cart.empty_title')}</h2>
                    <p className="text-sm sm:text-base text-gray-600 mb-6">{t('customer.cart.empty_desc')}</p>
                    <button
                        onClick={() => navigate('/menu')}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
                    >
                        {t('customer.cart.view_menu')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
                {/* Header */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6 bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            {t('customer.cart.title')}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">{cart.length} {t('customer.cart.items_count')}</p>
                    </div>
                    <div className="flex gap-2">
                        {/* Desktop Language Switcher */}

                        <button
                            onClick={() => navigate('/menu')}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm sm:text-base w-full sm:w-auto justify-center h-[40px] sm:h-[44px]"
                        >
                            <span>{t('customer.cart.continue_shopping')}</span>
                        </button>
                    </div>
                </header>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                        {error.key ? t(error.key) : error.message}
                    </div>
                )}


                {/* Info message when table is from QR code */}
                {qrTableId && !existingOrderId && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl">
                        <p className="font-semibold">📱 {t('customer.cart.qr_scanned')}</p>
                        <p className="text-sm mt-1">
                            {t('customer.cart.table_selected', { table: localStorage.getItem('qr_table_number') || tables.find(t => t.id === qrTableId)?.table_number || '...' })}
                        </p>
                    </div>
                )}

                {/* Info message when adding to existing order */}
                {existingOrderId && (
                    <div className="mb-4 sm:mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-3 sm:px-4 py-3 rounded-lg sm:rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex-1">
                            <p className="font-semibold text-sm sm:text-base">📝 {t('customer.cart.adding_to_existing')}</p>
                            <p className="text-xs sm:text-sm mt-1">{t('customer.cart.adding_to_order_id', { id: existingOrderId.slice(0, 8) })}</p>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('addToOrderId');
                                localStorage.removeItem('addToTableId');
                                window.location.reload();
                            }}
                            className="bg-white border border-blue-300 text-blue-700 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-50 shadow-sm transition-all w-full sm:w-auto text-center"
                        >
                            {t('customer.cart.cancel_and_new')}
                        </button>
                    </div>
                )}

                {/* Cart Items */}
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    {cart.map(item => {
                        const itemTotal = item.price * item.quantity;

                        return (
                            <div key={item.cartId} className="bg-white rounded-xl sm:rounded-2xl shadow-md p-3 sm:p-6 hover:shadow-lg transition-shadow">
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    {/* Item Image */}
                                    {item.image_url && (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-lg sm:rounded-xl"
                                        />
                                    )}

                                    {/* Item Details */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <h3 className="text-base sm:text-lg font-bold text-gray-800 leading-tight">{item.name}</h3>
                                                <p className="text-sm sm:text-base text-emerald-600 font-semibold mt-1">{item.price.toLocaleString('vi-VN')}đ</p>
                                            </div>
                                            {/* Mobile: Item Total & Remove */}
                                            <div className="text-right sm:hidden">
                                                <p className="text-lg font-bold text-gray-800">
                                                    {itemTotal.toLocaleString('vi-VN')}đ
                                                </p>
                                                <button
                                                    onClick={() => removeFromCart(item.cartId)}
                                                    className="mt-1 text-red-500 hover:text-red-700 text-xs font-semibold"
                                                >
                                                    {t('customer.cart.remove')}
                                                </button>
                                            </div>
                                        </div>



                                        {/* Notes */}
                                        {item.notes && (
                                            <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                                <p className="text-xs sm:text-sm text-yellow-800 flex items-start gap-1">
                                                    <span className="material-symbols-outlined text-sm">edit_note</span>
                                                    <span className="flex-1">{item.notes}</span>
                                                </p>
                                            </div>
                                        )}

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-3 mt-3 sm:mt-4">
                                            <button
                                                onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                                                className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-200 rounded-lg font-bold hover:bg-gray-300 transition-colors flex items-center justify-center text-lg active:scale-95"
                                                disabled={item.quantity <= 1}
                                            >
                                                −
                                            </button>
                                            <span className="font-semibold text-base sm:text-lg min-w-[2rem] text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                                                className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center text-lg active:scale-95"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Desktop: Item Total & Remove */}
                                    <div className="hidden sm:block text-right">
                                        <p className="text-xl font-bold text-gray-800">
                                            {itemTotal.toLocaleString('vi-VN')}đ
                                        </p>
                                        <button
                                            onClick={() => removeFromCart(item.cartId)}
                                            className="mt-2 text-red-500 hover:text-red-700 text-sm font-semibold"
                                        >
                                            {t('customer.cart.remove')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    {/* Voucher Section - Only show when creating new order */}
                    {!existingOrderId && (
                        <div className="mb-4 pb-4 border-b border-gray-200">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3">🎟️ {t('customer.cart.voucher_title')}</h3>

                            {!appliedVoucher ? (
                                <>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={voucherCode}
                                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                            placeholder={t('customer.cart.voucher_placeholder')}
                                            className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
                                            onKeyPress={(e) => e.key === 'Enter' && handleApplyVoucher()}
                                        />
                                        <button
                                            onClick={handleApplyVoucher}
                                            className="px-4 sm:px-6 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors text-sm sm:text-base whitespace-nowrap"
                                        >
                                            {t('customer.cart.apply')}
                                        </button>
                                    </div>

                                    {voucherError && (
                                        <p className="text-red-500 text-xs sm:text-sm mb-2">
                                            {voucherError.key ? t(voucherError.key) : voucherError.message}
                                        </p>
                                    )}

                                    {/* Available Vouchers */}
                                    {availableVouchers.length > 0 && (
                                        <div>
                                            <button
                                                onClick={() => setShowVoucherList(!showVoucherList)}
                                                className="text-emerald-600 text-xs sm:text-sm font-semibold hover:underline mb-2"
                                            >
                                                {showVoucherList ? '▼' : '▶'} {t('customer.cart.view_vouchers')} ({availableVouchers.length})
                                            </button>

                                            {showVoucherList && (
                                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                                    {availableVouchers.map((voucher) => (
                                                        <div
                                                            key={voucher.id}
                                                            onClick={() => handleSelectVoucher(voucher)}
                                                            className={`p-3 border rounded-lg transition-colors ${voucher.canUse
                                                                ? 'border-emerald-200 cursor-pointer hover:bg-emerald-50 bg-white'
                                                                : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div className="flex-1">
                                                                    {/* Code and Icon */}
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-base">
                                                                            {voucher.canUse ? '✅' : '🔒'}
                                                                        </span>
                                                                        <p className={`font-bold text-sm ${voucher.canUse ? 'text-emerald-600' : 'text-gray-500'
                                                                            }`}>
                                                                            {voucher.code}
                                                                        </p>
                                                                    </div>

                                                                    {/* Title */}
                                                                    <p className="text-xs text-gray-600 mt-1">{voucher.title}</p>

                                                                    {/* Target Type Badge */}
                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                                            {getTargetTypeLabel(voucher.target_type)}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500">
                                                                            {t('customer.cart.min_order')}: {voucher.min_order_value.toLocaleString('vi-VN')}đ
                                                                        </span>
                                                                    </div>

                                                                    {/* Reason if cannot use */}
                                                                    {!voucher.canUse && voucher.reason && (
                                                                        <p className="text-xs text-red-600 mt-2 flex items-start gap-1">
                                                                            <span>⚠️</span>
                                                                            <span>{voucher.reason}</span>
                                                                        </p>
                                                                    )}

                                                                    {/* Remaining uses */}
                                                                    {voucher.canUse && voucher.remainingUses !== null && (
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            {t('customer.cart.remaining')}: {voucher.remainingUses} {t('customer.cart.uses')}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Discount Value */}
                                                                <div className="text-right">
                                                                    <p className={`text-sm font-bold ${voucher.canUse ? 'text-emerald-600' : 'text-gray-500'
                                                                        }`}>
                                                                        {voucher.discount_type === 'fixed'
                                                                            ? `-${voucher.discount_value.toLocaleString('vi-VN')}đ`
                                                                            : `-${voucher.discount_value}%`
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-bold text-emerald-700 text-sm sm:text-base">✓ {appliedVoucher.code}</p>
                                            <p className="text-xs sm:text-sm text-emerald-600 mt-1">{appliedVoucher.title}</p>
                                            <p className="text-xs sm:text-sm text-emerald-700 font-semibold mt-1">
                                                {t('customer.cart.discount_label')}: {voucherDiscount.toLocaleString('vi-VN')}đ
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleRemoveVoucher}
                                            className="text-red-500 hover:text-red-700 font-bold text-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Info message when adding to existing order */}
                    {existingOrderId && (
                        <div className="mb-4 pb-4 border-b border-gray-200">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-700">
                                    ℹ️ {t('customer.cart.voucher_applied_msg')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Price Summary */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm sm:text-base text-gray-600">
                            <span>{t('customer.cart.subtotal')}:</span>
                            <span className="font-semibold">{subtotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between text-sm sm:text-base text-gray-600">
                            <span>{t('customer.cart.vat')} ({vatRate}%):</span>
                            <span className="font-semibold">{taxAmount.toLocaleString('vi-VN')}đ</span>
                        </div>
                        {voucherDiscount > 0 && (
                            <div className="flex justify-between text-sm sm:text-base text-emerald-600">
                                <span>{t('customer.cart.discount')}:</span>
                                <span className="font-semibold">-{voucherDiscount.toLocaleString('vi-VN')}đ</span>
                            </div>
                        )}
                        <div className="border-t border-gray-200 pt-2">
                            <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-900">
                                <span>{t('customer.cart.total')}:</span>
                                <span className="text-emerald-600">{total.toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checkout Button */}
                <button
                    onClick={handleCheckout}
                    disabled={loading || !selectedTable}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-lg font-bold rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            {t('customer.cart.processing')}
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">shopping_cart_checkout</span>
                            {t('customer.cart.checkout')}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
