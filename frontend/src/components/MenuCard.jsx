import { useState } from 'react';

export default function MenuCard({ item, onClick }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Get all available images (prioritize images array, fallback to image_url)
    const allImages = item.images && item.images.length > 0
        ? item.images
        : item.image_url
            ? [item.image_url]
            : ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'];

    const hasMultipleImages = allImages.length > 1;



    const handlePrevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    const handleNextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    };

    const handleDotClick = (e, index) => {
        e.stopPropagation();
        setCurrentImageIndex(index);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div
            className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-gray-100"
            onClick={() => onClick(item)}
        >
            <div className="relative w-full h-40 sm:h-48 lg:h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                {/* Image Display */}
                <img
                    src={allImages[currentImageIndex]}
                    alt={`${item.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
                    }}
                />

                {/* Navigation Dots - Only show if multiple images */}
                {hasMultipleImages && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {allImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => handleDotClick(e, index)}
                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${index === currentImageIndex
                                    ? 'bg-white w-4 sm:w-6'
                                    : 'bg-white/50 hover:bg-white/75'
                                    }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Chef's Choice Badge */}
                {item.is_chef_recommendation && (
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold shadow-lg flex items-center gap-1 z-10">
                        <span>👨‍🍳</span>
                        <span className="hidden sm:inline">Chef's Choice</span>
                        <span className="sm:hidden">Chef</span>
                    </div>
                )}
                {!item.is_available && (
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-red-600 text-white px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold shadow-lg z-10">
                        Hết món
                    </div>
                )}
            </div>

            <div className="p-3 sm:p-4 lg:p-5">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 text-gray-900 line-clamp-1">
                    {item.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2 min-h-[32px] sm:min-h-[40px]">
                    {item.description}
                </p>

                <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-gray-100">
                    <span className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                        {formatPrice(item.price)}
                    </span>
                    {item.is_available && (
                        <button className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white flex items-center justify-center text-xl sm:text-2xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95">
                            <span className="mb-0.5">+</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
