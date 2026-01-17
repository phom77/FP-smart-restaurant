import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function WaiterBillPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/api/orders/${orderId}`);
                setOrder(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    const handleCloseTable = async () => {
        if (!window.confirm("Xác nhận đóng bàn và hoàn tất đơn hàng?")) return;
        try {
            await api.put(`/api/orders/${orderId}/status`, { status: 'completed' });
            navigate('/waiter/map');
        } catch (err) {
            alert("Lỗi đóng bàn");
        }
    };

    if (loading || !order) return <div className="p-8">Loading...</div>;

    // Giả lập tính thuế phí (Backend nên trả về cái này)
    const subtotal = order.total_amount;
    const serviceCharge = subtotal * 0.05; // 5%
    const tax = subtotal * 0.08; // 8%
    const finalTotal = subtotal + serviceCharge + tax;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Bill - Table ${order.table?.table_number}</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .title { font-size: 24px; font-weight: bold; }
                        .info { font-size: 14px; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                        .item { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px; }
                        .total-section { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
                        .row { display: flex; justify-content: space-between; font-size: 14px; }
                        .grand-total { font-weight: bold; font-size: 18px; margin-top: 10px; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">SMART RESTAURANT</div>
                        <div>123 Food Street, Culinary City</div>
                    </div>
                    <div class="info">
                        <div>Table: ${order.table?.table_number}</div>
                        <div>Date: ${new Date().toLocaleString()}</div>
                        <div>Order #: ${order.id}</div>
                    </div>
                    <div class="items">
                        ${order.items.map(item => `
                            <div class="item">
                                <span>${item.quantity}x ${item.menu_item?.name}</span>
                                <span>${(item.unit_price * item.quantity).toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="total-section">
                        <div class="row">
                            <span>Subtotal</span>
                            <span>${subtotal.toLocaleString()}</span>
                        </div>
                        <div class="row">
                            <span>Service (5%)</span>
                            <span>${serviceCharge.toLocaleString()}</span>
                        </div>
                        <div class="row">
                            <span>Tax (8%)</span>
                            <span>${tax.toLocaleString()}</span>
                        </div>
                        <div class="row grand-total">
                            <span>TOTAL</span>
                            <span>${finalTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Thank you for dining with us!</p>
                        <p>See you again soon.</p>
                    </div>
                    <script>
                        window.print();
                        window.onafterprint = function() { window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-32 font-sans">
            {/* Header */}
            <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-bold text-gray-900">Table {order.table?.table_number}</h1>
                    <p className="text-xs text-emerald-600 font-medium">Main Hall</p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full relative">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
            </header>

            {/* Status Bar */}
            <div className="bg-white px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <span className="material-symbols-outlined text-lg">schedule</span>
                    <span>1h 20m seated</span>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    PAYMENT REQUESTED
                </div>
            </div>

            <main className="p-4 space-y-4">
                {/* Payment Method Card */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-600">credit_card</span>
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">Visa •••• 4242</p>
                            <p className="text-xs text-emerald-600 font-medium">Authorized & Ready</p>
                        </div>
                    </div>
                    <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        View Details
                    </button>
                </div>

                {/* Bill Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50">
                        <h3 className="font-bold text-gray-900">Bill Summary</h3>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="p-4 flex justify-between items-center">
                                <div className="flex gap-3 items-center">
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                                        {item.quantity}x
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{item.menu_item?.name}</p>
                                        <p className="text-xs text-gray-400">Standard</p>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900">
                                    {(item.unit_price * item.quantity).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="bg-gray-50 p-4 space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span className="font-medium text-gray-900">{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Service Charge (5%)</span>
                            <span className="font-medium text-gray-900">{serviceCharge.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Tax (8%)</span>
                            <span className="font-medium text-gray-900">{tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-end pt-3 mt-2 border-t border-gray-200">
                            <span className="font-bold text-gray-900 text-lg">Total</span>
                            <span className="font-extrabold text-gray-900 text-2xl">{finalTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => handlePrint()}
                        className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center gap-2 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                    >
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-white">
                            <span className="material-symbols-outlined text-gray-600 group-hover:text-emerald-600">print</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Print Bill</span>
                    </button>
                    <button className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center gap-2 hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-white">
                            <span className="material-symbols-outlined text-gray-600 group-hover:text-emerald-600">call_split</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Split Bill</span>
                    </button>
                    <button className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center gap-2 hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-white">
                            <span className="material-symbols-outlined text-gray-600 group-hover:text-emerald-600">percent</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Discount</span>
                    </button>
                </div>
            </main>


            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button className="w-full py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50">
                    <span className="material-symbols-outlined">send</span>
                    Notify Customer
                </button>
                <button
                    onClick={handleCloseTable}
                    className="w-full py-3.5 rounded-xl bg-gray-200 text-gray-800 font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-white transition-colors group"
                >
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">check_circle</span>
                    Close Table
                </button>
                <p className="text-center text-[10px] text-gray-400 font-bold tracking-widest uppercase">Hold to confirm</p>
            </div>
        </div>
    );
}