import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';

export default function ItemDetailModal({ item, onClose }) {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [selectedModifiers, setSelectedModifiers] = useState({});
    const [notes, setNotes] = useState('');

    useEffect(() => {
        // Initialize selected modifiers with defaults
        if (item.modifier_groups) {
            const defaults = {};
            item.modifier_groups.forEach(group => {
                if (group.min_selection > 0 && group.modifiers?.length > 0) {
                    defaults[group.id] = [group.modifiers[0].id];
                }
            });
            setSelectedModifiers(defaults);
        }
    }, [item]);

    const handleModifierChange = (groupId, modifierId, isMultiple) => {
        setSelectedModifiers(prev => {
            if (isMultiple) {
                const current = prev[groupId] || [];
                if (current.includes(modifierId)) {
                    return { ...prev, [groupId]: current.filter(id => id !== modifierId) };
                } else {
                    return { ...prev, [groupId]: [...current, modifierId] };
                }
            } else {
                return { ...prev, [groupId]: [modifierId] };
            }
        });
    };

    const calculateTotal = () => {
        let total = item.price;

        if (item.modifier_groups) {
            item.modifier_groups.forEach(group => {
                const selected = selectedModifiers[group.id] || [];
                selected.forEach(modId => {
                    const modifier = group.modifiers?.find(m => m.id === modId);
                    if (modifier) {
                        total += modifier.price_adjustment || 0;
                    }
                });
            });
        }

        return total * quantity;
    };

    const handleAddToCart = () => {
        const modifiers = [];
        if (item.modifier_groups) {
            item.modifier_groups.forEach(group => {
                const selected = selectedModifiers[group.id] || [];
                selected.forEach(modId => {
                    const modifier = group.modifiers?.find(m => m.id === modId);
                    if (modifier) {
                        modifiers.push(modifier);
                    }
                });
            });
        }

        addToCart(item, quantity, modifiers);
        onClose();
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-slideUp"
                onClick={e => e.stopPropagation()}
            >
                <button
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-2xl z-10 transition-all shadow-lg hover:scale-110"
                    onClick={onClose}
                >
                    &times;
                </button>

                <div className="w-full h-80 overflow-hidden rounded-t-3xl bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
                        }}
                    />
                </div>

                <div className="p-8">
                    <h2 className="text-3xl font-bold mb-3 text-gray-900">
                        {item.name}
                    </h2>
                    <p className="text-base text-gray-600 mb-4 leading-relaxed">
                        {item.description}
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent mb-8">
                        {formatPrice(item.price)}
                    </p>

                    {/* Modifier Groups */}
                    {item.modifier_groups?.map(group => (
                        <div key={group.id} className="mb-8 pb-8 border-b border-gray-200 last:border-0">
                            <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                                <span>🎯</span>
                                {group.name}
                                {group.min_selection > 0 && (
                                    <span className="text-red-600 text-sm">*</span>
                                )}
                            </h3>
                            <div className="flex flex-col gap-3">
                                {group.modifiers?.map(modifier => {
                                    const isMultiple = group.max_selection > 1;
                                    const isSelected = (selectedModifiers[group.id] || []).includes(modifier.id);

                                    return (
                                        <label
                                            key={modifier.id}
                                            className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${isSelected
                                                    ? 'border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]'
                                                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type={isMultiple ? 'checkbox' : 'radio'}
                                                name={group.id}
                                                checked={isSelected}
                                                onChange={() => handleModifierChange(group.id, modifier.id, isMultiple)}
                                                className="w-5 h-5 cursor-pointer accent-emerald-500"
                                            />
                                            <span className="flex-1 font-medium text-gray-800">{modifier.name}</span>
                                            {modifier.price_adjustment > 0 && (
                                                <span className="text-emerald-600 font-bold">
                                                    +{formatPrice(modifier.price_adjustment)}
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Notes */}
                    <div className="mb-8">
                        <label htmlFor="notes" className="block font-bold mb-3 text-gray-900 flex items-center gap-2">
                            <span>📝</span> Ghi chú
                        </label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Ví dụ: Ít cay, không hành..."
                            rows="3"
                            className="w-full p-4 border-2 border-gray-200 rounded-xl resize-vertical focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                        />
                    </div>

                    {/* Quantity and Add to Cart */}
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-4 border-2 border-gray-200 rounded-xl px-6 py-3 bg-gray-50">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="text-2xl text-emerald-600 w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all font-bold"
                            >
                                −
                            </button>
                            <span className="text-xl font-bold min-w-8 text-center text-gray-900">
                                {quantity}
                            </span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="text-2xl text-emerald-600 w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all font-bold"
                            >
                                +
                            </button>
                        </div>
                        <button
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white py-4 px-6 rounded-xl text-lg font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            onClick={handleAddToCart}
                        >
                            🛒 Thêm vào giỏ - {formatPrice(calculateTotal())}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
