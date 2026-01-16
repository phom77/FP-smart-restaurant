export default function MenuCard({ item, onClick }) {
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div
            className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-gray-100"
            onClick={() => onClick(item)}
        >
            <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
                    }}
                />
                {/* Chef's Choice Badge */}
                {item.is_chef_recommendation && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <span>👨‍🍳</span>
                        <span>Chef's Choice</span>
                    </div>
                )}
                {!item.is_available && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        Hết món
                    </div>
                )}
            </div>

            <div className="p-5">
                <h3 className="text-xl font-bold mb-2 text-gray-900 line-clamp-1">
                    {item.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                    {item.description}
                </p>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                        {formatPrice(item.price)}
                    </span>
                    {item.is_available && (
                        <button className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white flex items-center justify-center text-2xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg transform hover:scale-110">
                            <span className="mb-0.5">+</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
