import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export default function RecommendedItems({ menuItemId, onItemClick }) {
    const { t } = useTranslation();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (menuItemId) {
            fetchRecommendations();
        }
    }, [menuItemId]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/menu/items/${menuItemId}/recommendations`, {
                params: { limit: 5 }
            });

            if (response.data.success) {
                setRecommendations(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching recommendations:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="py-8">
                <div className="animate-pulse flex space-x-4 overflow-x-auto">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-shrink-0 w-48 h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-500">lightbulb</span>
                {t('menu.recommendation_title')}
            </h3>

            {/* Horizontal Scroll Carousel */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                {recommendations.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onItemClick && onItemClick(item)}
                        className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-emerald-500 snap-start group"
                    >
                        {/* Image */}
                        <div className="relative h-32 overflow-hidden rounded-t-2xl bg-gray-200 dark:bg-gray-700">
                            {item.image_url ? (
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                                    <span className="material-symbols-outlined text-4xl">restaurant</span>
                                </div>
                            )}

                            {/* Rating Badge */}
                            {item.avg_rating > 0 && (
                                <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md">
                                    ⭐ {item.avg_rating.toFixed(1)}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <h4 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-2 mb-2">
                                {item.name}
                            </h4>

                            <div className="flex justify-between items-center">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                                    {item.price?.toLocaleString('vi-VN')}đ
                                </span>
                            </div>

                            {/* Recommendation Reason */}
                            {item.recommendation_reason && (
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    {item.recommendation_reason === 'frequently_ordered_together' && (
                                        <div className="inline-flex items-start gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg">
                                            <span className="flex-shrink-0">🔥</span>
                                            <span className="leading-snug">{t('menu.frequently_ordered')}</span>
                                        </div>
                                    )}
                                    {item.recommendation_reason === 'same_category' && (
                                        <div className="inline-flex items-start gap-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg">
                                            <span className="material-symbols-outlined text-sm flex-shrink-0">folder</span>
                                            <span className="leading-snug">{t('menu.same_category')}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Scroll Hint */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                ← {t('menu.swipe_hint')} →
            </p>
        </div>
    );
}
