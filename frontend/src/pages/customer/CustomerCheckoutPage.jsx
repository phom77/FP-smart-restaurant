import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../../services/api';

// Load Stripe Key
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

const CheckoutForm = ({ order, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setError(null);

        if (!stripe || !elements) return;

        try {
            // 1. Lấy Client Secret
            const { data } = await api.post('/api/payment/create-intent', {
                orderId: order.id,
                paymentMethod: 'card'
            });

            // Mock Payment
            if (data.isMock) {
                await api.post('/api/payment/mock', { orderId: order.id });
                onSuccess('card');
                return;
            }

            // 2. Confirm Card Payment với Stripe
            const result = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: { name: 'Customer' },
                }
            });

            if (result.error) {
                setError(result.error.message);
                setProcessing(false);
            } else if (result.paymentIntent.status === 'succeeded') {

                // --- 🟢 THÊM BƯỚC NÀY: Gọi Backend xác nhận ngay ---
                await api.post('/api/payment/confirm', {
                    orderId: order.id,
                    paymentIntentId: result.paymentIntent.id
                });
                // --------------------------------------------------

                onSuccess('card');
            }
        } catch (err) {
            console.error(err);
            setError('Lỗi thanh toán: ' + (err.response?.data?.message || err.message));
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-xl bg-white">
                <CardElement options={{
                    style: { base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } } },
                }} />
            </div>
            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {processing ? (
                    <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        Đang xử lý...
                    </>
                ) : (
                    `Thanh toán ${parseInt(order.total_amount).toLocaleString()}đ`
                )}
            </button>
        </form>
    );
};

export default function CustomerCheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { order } = location.state || {};
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [requestInvoice, setRequestInvoice] = useState(false);

    useEffect(() => {
        if (!order) navigate('/menu');
    }, [order, navigate]);

    if (!order) return null;

    // --- LOGIC ĐIỀU HƯỚNG SAU KHI THÀNH CÔNG ---
    const handleSuccess = (method) => {
        if (method === 'card') {
            alert("✅ Thanh toán thành công! Cảm ơn quý khách.");
        } else {
            alert("🔔 Đã gửi yêu cầu! Nhân viên sẽ đến hỗ trợ thanh toán tiền mặt.");
        }
        // Quay lại trang Tracking để xem trạng thái mới
        navigate(`/orders/${order.id}`);
    };

    const handleCashPayment = async () => {
        try {
            await api.post('/api/payment/create-intent', {
                orderId: order.id,
                paymentMethod: 'cash',
                requestInvoice: requestInvoice
            });
            // Backend đã bắn socket 'payment_request' cho Waiter ở đây
            handleSuccess('cash');
        } catch (err) {
            alert("Lỗi gửi yêu cầu: " + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-md mx-auto p-4">
                <header className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Thanh toán</h1>
                </header>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm text-gray-600">
                            <span className="font-medium">Tạm tính</span>
                            <span className="font-semibold">{(order.subtotal || order.total_amount)?.toLocaleString()}đ</span>
                        </div>
                        {order.tax_amount > 0 && (
                            <div className="flex justify-between items-center text-sm text-gray-600">
                                <span className="font-medium">Thuế VAT</span>
                                <span className="font-semibold">{order.tax_amount?.toLocaleString()}đ</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-gray-500 font-medium">Tổng cộng</span>
                            <span className="text-2xl font-bold text-gray-900">{parseInt(order.total_amount).toLocaleString()}đ</span>
                        </div>
                    </div>
                </div>

                <h3 className="font-bold text-gray-800 mb-3 ml-1">Phương thức thanh toán</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500'
                            }`}
                    >
                        <span className="material-symbols-outlined text-3xl">credit_card</span>
                        <span className="font-bold text-sm">Thẻ Tín Dụng</span>
                    </button>
                    <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500'
                            }`}
                    >
                        <span className="material-symbols-outlined text-3xl">payments</span>
                        <span className="font-bold text-sm">Tiền Mặt</span>
                    </button>
                </div>

                {/* Invoice Request Checkbox */}
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={requestInvoice}
                            onChange={(e) => setRequestInvoice(e.target.checked)}
                            className="w-5 h-5 mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                            <span className="font-semibold text-gray-800 block mb-1">Yêu cầu hóa đơn VAT</span>
                            <span className="text-sm text-gray-500">Nhân viên sẽ xuất hóa đơn VAT cho bạn sau khi thanh toán</span>
                        </div>
                    </label>
                </div>

                {paymentMethod === 'card' ? (
                    stripePromise ? (
                        <Elements stripe={stripePromise}>
                            <CheckoutForm order={order} onSuccess={handleSuccess} />
                        </Elements>
                    ) : (
                        <div className="text-center text-red-500 p-4 bg-red-50 rounded-xl border border-red-100">
                            ⚠️ Lỗi: Chưa cấu hình Stripe Key (VITE_STRIPE_PUBLIC_KEY)
                        </div>
                    )
                ) : (
                    <button
                        onClick={handleCashPayment}
                        className="w-full py-4 bg-gray-800 text-white font-bold rounded-xl shadow-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">room_service</span>
                        Gọi nhân viên thanh toán
                    </button>
                )}
            </div>
        </div>
    );
}