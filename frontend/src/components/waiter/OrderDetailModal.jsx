import React from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const OrderDetailModal = ({ order, onClose }) => {
    const { t } = useTranslation();

    if (!order) return null;

    const handlePrint = () => {
        const printContent = document.getElementById('invoice-preview').innerHTML;

        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // Write content to iframe
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write('<html><head><title>' + t('waiter.print_invoice') + '</title>');
        iframeDoc.write('<style>');
        iframeDoc.write('body { font-family: monospace; padding: 20px; }');
        iframeDoc.write('.text-center { text-align: center; }');
        iframeDoc.write('.text-right { text-align: right; }');
        iframeDoc.write('.font-bold { font-weight: bold; }');
        iframeDoc.write('.uppercase { text-transform: uppercase; }');
        iframeDoc.write('table { width: 100%; border-collapse: collapse; margin: 10px 0; }');
        iframeDoc.write('th, td { padding: 8px; border-bottom: 1px dashed #ccc; text-align: left; }');
        iframeDoc.write('th:last-child, td:last-child { text-align: right; }');
        iframeDoc.write('th:nth-child(2), td:nth-child(2) { text-align: center; }');
        iframeDoc.write('.mb-6 { margin-bottom: 24px; }');
        iframeDoc.write('.mb-4 { margin-bottom: 16px; }');
        iframeDoc.write('.text-sm { font-size: 14px; }');
        iframeDoc.write('.text-xs { font-size: 12px; }');
        iframeDoc.write('.flex { display: flex; }');
        iframeDoc.write('.justify-between { justify-content: space-between; }');
        iframeDoc.write('.items-center { align-items: center; }');
        iframeDoc.write('</style>');
        iframeDoc.write('</head><body>');
        iframeDoc.write(printContent);
        iframeDoc.write('</body></html>');
        iframeDoc.close();

        // Print and remove iframe
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // Give it a moment to render before removing (though print blocks usually)
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    };

    const handleConfirmCash = async () => {
        if (!window.confirm(`Xác nhận đã thu ${parseInt(order.total_amount).toLocaleString()}đ tiền mặt?`)) return;
        try {
            await api.post('/api/payment/confirm-cash', { orderId: order.id });
            onClose(); // Đóng modal
            // Socket sẽ tự refresh danh sách bên dưới
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-extrabold text-gray-800">{t('waiter.order_details')}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Invoice Preview Area */}
                    <div id="invoice-preview" className="border border-gray-100 p-4 rounded-xl bg-gray-50/50">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold uppercase tracking-widest text-gray-800">RESTAURANT</h2>
                            <p className="text-sm text-gray-500">123 Food Street, Tasty City</p>
                            <p className="text-sm text-gray-500">Hotline: 1900-xxxx</p>
                            <hr className="my-4 border-dashed border-gray-300" />
                            <h3 className="text-lg font-bold">{t('waiter.provisional_invoice')}</h3>
                            <p className="text-xs text-gray-500">{t('waiter.order_id')}: #{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-gray-500">{t('waiter.date')}: {new Date(order.created_at).toLocaleString()}</p>
                        </div>

                        <div className="mb-4">
                            <p><strong>{t('waiter.table')}:</strong> {order.table?.table_number || 'N/A'}</p>
                            {order.customer && <p><strong>{t('waiter.customer')}:</strong> {order.customer.full_name}</p>}
                        </div>

                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left font-bold border-b border-gray-300">
                                    <th className="pb-2">{t('waiter.item')}</th>
                                    <th className="pb-2 text-center">{t('waiter.qty')}</th>
                                    <th className="pb-2 text-right">{t('waiter.price')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dashed divide-gray-200">
                                {order.items?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-2">
                                            <div>{item.menu_item?.name}</div>
                                            {item.modifiers?.length > 0 && (
                                                <div className="text-xs text-gray-500 italic">
                                                    + {item.modifiers.map(m => m.modifier_name).join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 text-center align-top">{item.quantity}</td>
                                        <td className="py-2 text-right align-top">{parseInt(item.total_price).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <hr className="my-4 border-dashed border-gray-400" />

                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>{t('waiter.total')}</span>
                            <span>{parseInt(order.total_amount).toLocaleString()}đ</span>
                        </div>

                        <div className="text-center mt-6 text-xs text-gray-500 italic">
                            {t('waiter.thanks')}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t bg-gray-50 flex flex-col gap-3">

                    {/* --- 🟢 HIỂN THỊ NÚT XÁC NHẬN NẾU ĐANG CHỜ THANH TOÁN --- */}
                    {order.payment_status === 'waiting_payment' && (
                        <button
                            onClick={handleConfirmCash}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 animate-pulse"
                        >
                            <span className="material-symbols-outlined">payments</span>
                            Xác nhận đã thu tiền mặt
                        </button>
                    )}
                    {/* ------------------------------------------------------- */}

                    <div className="flex gap-3">
                        <button onClick={handlePrint} className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold shadow hover:bg-gray-900 transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">print</span>
                            {t('waiter.print_invoice')}
                        </button>
                        <button onClick={onClose} className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-all">
                            {t('waiter.close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;
