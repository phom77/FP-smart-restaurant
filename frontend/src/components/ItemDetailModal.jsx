import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';
import ReviewSection from './ReviewSection';
import RecommendedItems from './RecommendedItems';

export default function ItemDetailModal({ item, onClose, isReadOnly }) {
    const { t } = useTranslation();
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedModifiers, setSelectedModifiers] = useState({}); // { groupId: [modId1, modId2] }

    const handleModifierChange = (groupId, modId, isSingle) => {
        setSelectedModifiers(prev => {
            const current = prev[groupId] || [];
            if (isSingle) {
                return { ...prev, [groupId]: [modId] };
            } else {
                if (current.includes(modId)) {
                    return { ...prev, [groupId]: current.filter(id => id !== modId) };
                } else {
                    return { ...prev, [groupId]: [...current, modId] };
                }
            }
        });
    };

    const calculateTotal = () => {
        let total = item.price;
        if (item.modifier_groups) {
            item.modifier_groups.forEach(group => {
                const selected = selectedModifiers[group.id] || [];
                selected.forEach(modId => {
                    const mod = group.modifiers?.find(m => m.id === modId);
                    if (mod) total += Number(mod.price_modifier || 0);
                });
            });
        }
        return total * quantity;
    };

    // Get all available images (prioritize images array, fallback to image_url)
    const allImages = item.images && item.images.length > 0
        ? item.images
        : item.image_url
            ? [item.image_url]
            : [];

    const hasMultipleImages = allImages.length > 1;

    useEffect(() => {
        // Reset image index when item changes
        setCurrentImageIndex(0);
    }, [item]);

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

        addToCart(item, quantity, modifiers, notes);  // ✅ Pass notes to addToCart
        onClose();
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-slideUp"
                onClick={e => e.stopPropagation()}
            >
                <button
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xl sm:text-2xl z-10 transition-all shadow-lg hover:scale-110"
                    onClick={onClose}
                >
                    &times;
                </button>

                {/* Image Carousel */}
                <div className="relative">
                    <div className="w-full h-48 sm:h-64 lg:h-80 overflow-hidden rounded-t-2xl sm:rounded-t-3xl bg-gradient-to-br from-gray-100 to-gray-200">
                        {allImages.length > 0 ? (
                            <img
                                src={allImages[currentImageIndex]}
                                alt={`${item.name} - Image ${currentImageIndex + 1}`}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <div className="text-center text-gray-400">
                                    <svg className="w-20 h-20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-base font-medium">{t('common.no_image')}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Arrows - Only show if multiple images */}
                    {hasMultipleImages && (
                        <>
                            <button
                                onClick={handlePrevImage}
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xl transition-all shadow-lg hover:scale-110 z-10"
                                aria-label="Previous image"
                            >
                                &lt;
                            </button>
                            <button
                                onClick={handleNextImage}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xl transition-all shadow-lg hover:scale-110 z-10"
                                aria-label="Next image"
                            >
                                &gt;
                            </button>
                        </>
                    )}

                    {/* Thumbnail Navigation - Only show if multiple images */}
                    {hasMultipleImages && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90%] overflow-x-auto px-2 py-1 bg-black/40 rounded-lg backdrop-blur-sm z-10">
                            {allImages.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                                        ? 'border-white scale-110 shadow-lg'
                                        : 'border-white/50 hover:border-white/75 opacity-70 hover:opacity-100'
                                        }`}
                                    aria-label={`View image ${index + 1}`}
                                >
                                    <img
                                        src={image}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100';
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>


                <div className="p-4 sm:p-6 lg:p-8">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 text-gray-900">
                        {item.name}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                        {item.description}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent mb-4 sm:mb-6 lg:mb-8">
                        {formatPrice(item.price)}
                    </p>

                    {/* Modifier Groups */}
                    {item.modifier_groups && item.modifier_groups.length > 0 && !isReadOnly && (
                        <div className="space-y-6 mb-8">
                            {item.modifier_groups.map(group => {
                                const isSingle = group.max_selection === 1;
                                return (
                                    <div key={group.id} className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                                                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                                                {group.name}
                                            </h3>
                                            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest bg-white px-2 py-1 rounded shadow-sm">
                                                {isSingle ? t('menu.select_one') : t('menu.select_multiple')}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 sm:gap-3">
                                            {group.modifiers?.map(mod => {
                                                const isSelected = (selectedModifiers[group.id] || []).includes(mod.id);
                                                return (
                                                    <button
                                                        key={mod.id}
                                                        onClick={() => handleModifierChange(group.id, mod.id, isSingle)}
                                                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border-2 active:scale-95 ${isSelected
                                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20 translate-y-[-2px]'
                                                            : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-200'
                                                            }`}
                                                    >
                                                        {mod.name}
                                                        {mod.price_modifier > 0 && (
                                                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs ${isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                +{formatPrice(mod.price_modifier)}
                                                            </span>
                                                        )}
                                                        {isSelected && <span className="text-[10px] sm:text-xs">✓</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Notes */}
                    {!isReadOnly && (
                        <div className="mb-6 sm:mb-8">
                            <label htmlFor="notes" className="block font-bold mb-2 sm:mb-3 text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                                <span className="material-symbols-outlined text-gray-500">edit_note</span> {t('menu.notes')}
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder={t('menu.example_notes')}
                                rows="3"
                                className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl resize-vertical focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-sm sm:text-base"
                            />
                        </div>
                    )}

                    {/* Quantity and Add to Cart */}
                    {!isReadOnly && (
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                            <div className="flex items-center justify-center gap-4 border-2 border-gray-200 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 bg-gray-50">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="text-xl sm:text-2xl text-emerald-600 w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all font-bold active:scale-95"
                                >
                                    −
                                </button>
                                <span className="text-lg sm:text-xl font-bold min-w-8 text-center text-gray-900">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="text-xl sm:text-2xl text-emerald-600 w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all font-bold active:scale-95"
                                >
                                    +
                                </button>
                            </div>
                            <button
                                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl text-base sm:text-lg font-bold transition-all shadow-lg transform active:scale-95 ${item.status === 'sold_out'
                                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white hover:shadow-xl hover:scale-105'
                                    }`}
                                onClick={item.status === 'available' ? handleAddToCart : undefined}
                                disabled={item.status !== 'available'}
                            >
                                {item.status === 'sold_out' ? t('menu.status_sold_out') : `🛒 ${t('menu.add_to_cart')} - ${formatPrice(calculateTotal())}`}
                            </button>
                        </div>
                    )}

                    {/* Recommended Items */}
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <RecommendedItems
                            menuItemId={item.id}
                            onItemClick={(newItem) => {
                                console.log('Clicked recommended item:', newItem);
                            }}
                        />
                    </div>

                    {/* Reviews Section */}
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <ReviewSection
                            menuItemId={item.id}
                            avgRating={item.avg_rating || 0}
                            reviewCount={item.review_count || 0}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
