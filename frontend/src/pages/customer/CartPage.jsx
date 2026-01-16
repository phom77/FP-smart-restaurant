import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { saveGuestOrder } from '../../utils/guestOrders';
import api from '../../services/api';

export default function CartPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [qrTableId, setQrTableId] = useState(null); // Track if table came from QR
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
                setTables(response.data.data || []);
            } catch (err) {
                console.error('Error fetching tables:', err);
            }
        };
        fetchTables();

        // Check for table parameter from QR code scan (from URL or localStorage)
        const tableFromUrl = searchParams.get('table');
        const tableFromStorage = localStorage.getItem('qr_table_id');

        // Priority: existingTableId > tableFromUrl > tableFromStorage
        if (existingTableId) {
            setSelectedTable(existingTableId);
        } else if (tableFromUrl) {
            setSelectedTable(tableFromUrl);
            setQrTableId(tableFromUrl);
            // Store in localStorage so it persists when navigating from menu to cart
            localStorage.setItem('qr_table_id', tableFromUrl);
        } else if (tableFromStorage) {
            setSelectedTable(tableFromStorage);
            setQrTableId(tableFromStorage);
        }
    }, [existingTableId, searchParams]);

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

    // Handle checkout
    const handleCheckout = async () => {
        setError('');

        // Validation
        if (cart.length === 0) {
            setError('Giỏ hàng trống. Vui lòng thêm món ăn.');
            return;
        }

        if (!selectedTable && !existingOrderId) {
            setError('Vui lòng quét mã QR tại bàn để đặt món');
            return;
        }

        setLoading(true);

        try {
            // Prepare items data
            const items = cart.map(item => ({
                menu_item_id: item.id,
                quantity: item.quantity,
                notes: item.notes || '',
                modifiers: item.modifiers?.map(m => m.id) || []
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
                    items: items
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

                // Clear cart
                clearCart();

                // Navigate to order tracking
                navigate(`/orders/${orderId}`);
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError(err.response?.data?.message || 'Đặt món thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Calculate subtotal
    const subtotal = getCartTotal();
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
                <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-md w-full">
                    <div className="text-6xl mb-4">🛒</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Giỏ hàng trống</h2>
                    <p className="text-gray-600 mb-6">Hãy thêm món ăn vào giỏ hàng</p>
                    <button
                        onClick={() => navigate('/menu')}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg"
                    >
                        Xem thực đơn
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <header className="flex justify-between items-center mb-6 bg-white rounded-2xl shadow-lg p-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            Giỏ hàng
                        </h1>
                        <p className="text-gray-600 mt-1">{cart.length} món</p>
                    </div>
                    <button
                        onClick={() => navigate('/menu')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                    >
                        <span>←</span>
                        <span>Tiếp tục chọn món</span>
                    </button>
                </header>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                {/* Message when no QR code scanned - Prompt user to scan */}
                {!existingOrderId && !qrTableId && (
                    <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-md p-6">
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">📱</div>
                            <div className="flex-1">
                                <p className="font-bold text-amber-800 text-lg mb-2">
                                    Vui lòng quét mã QR tại bàn
                                </p>
                                <p className="text-amber-700 text-sm">
                                    Để đặt món, bạn cần quét mã QR được đặt trên bàn. Mã QR sẽ tự động chọn bàn cho bạn.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info message when table is from QR code */}
                {qrTableId && !existingOrderId && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl">
                        <p className="font-semibold">📱 Đã quét mã QR</p>
                        <p className="text-sm mt-1">
                            Bàn {tables.find(t => t.id === qrTableId)?.table_number || qrTableId} đã được chọn tự động
                        </p>
                    </div>
                )}

                {/* Info message when adding to existing order */}
                {existingOrderId && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <p className="font-semibold">📝 Đang thêm món vào đơn hàng hiện tại</p>
                            <p className="text-sm mt-1">Món mới sẽ được thêm vào order #{existingOrderId.slice(0, 8)}</p>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('addToOrderId');
                                localStorage.removeItem('addToTableId');
                                window.location.reload();
                            }}
                            className="bg-white border border-blue-300 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 shadow-sm transition-all whitespace-nowrap"
                        >
                            Hủy & Tạo đơn mới
                        </button>
                    </div>
                )}

                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                    {cart.map(item => {
                        const modifiersTotal = item.modifiers?.reduce((sum, mod) => sum + (mod.price_adjustment || 0), 0) || 0;
                        const itemTotal = (item.price + modifiersTotal) * item.quantity;

                        return (
                            <div key={item.cartId} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="flex gap-4">
                                    {/* Item Image */}
                                    {item.image_url && (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-24 h-24 object-cover rounded-xl"
                                        />
                                    )}

                                    {/* Item Details */}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                                        <p className="text-emerald-600 font-semibold">{item.price.toLocaleString('vi-VN')}đ</p>

                                        {/* Modifiers */}
                                        {item.modifiers && item.modifiers.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-600">Tùy chọn:</p>
                                                {item.modifiers.map((mod, idx) => (
                                                    <p key={idx} className="text-sm text-gray-700">
                                                        • {mod.name} (+{mod.price_adjustment.toLocaleString('vi-VN')}đ)
                                                    </p>
                                                ))}
                                            </div>
                                        )}

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-3 mt-4">
                                            <button
                                                onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                                                className="w-8 h-8 bg-gray-200 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                                                disabled={item.quantity <= 1}
                                            >
                                                −
                                            </button>
                                            <span className="font-semibold text-lg w-8 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                                                className="w-8 h-8 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Item Total & Remove */}
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-800">
                                            {itemTotal.toLocaleString('vi-VN')}đ
                                        </p>
                                        <button
                                            onClick={() => removeFromCart(item.cartId)}
                                            className="mt-2 text-red-500 hover:text-red-700 text-sm font-semibold"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Tổng cộng</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between text-gray-700">
                            <span>Tạm tính:</span>
                            <span className="font-semibold">{subtotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                            <span>Thuế VAT (10%):</span>
                            <span className="font-semibold">{tax.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="border-t-2 border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between text-xl font-bold text-gray-900">
                                <span>Tổng cộng:</span>
                                <span className="text-emerald-600">{total.toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checkout Button */}
                <button
                    onClick={handleCheckout}
                    disabled={loading || !selectedTable}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-lg font-bold rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Đang xử lý...' : 'Đặt món'}
                </button>
            </div>
        </div>
    );
}
