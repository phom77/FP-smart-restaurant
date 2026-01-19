import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ReviewForm from './ReviewForm';

export default function ReviewSection({ menuItemId, avgRating, reviewCount }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [menuItemId, page]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/reviews/item/${menuItemId}`, {
                params: { page, limit: 5 }
            });

            if (response.data.success) {
                setReviews(response.data.data);
                setTotalPages(response.data.pagination.totalPages);
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSuccess = (newReview) => {
        setShowForm(false);
        setReviews([newReview, ...reviews]);
        // Refresh to get updated count
        fetchReviews();
    };

    const renderStars = (rating) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-400 text-lg">
                        {star <= rating ? '⭐' : '☆'}
                    </span>
                ))}
            </div>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Rating Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {t('reviews.title')}
                    </h3>
                    {user && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg"
                        >
                            {showForm ? t('reviews.hide_btn') : t('reviews.write_btn')}
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-5xl font-bold text-emerald-600">
                            {avgRating ? avgRating.toFixed(1) : '0.0'}
                        </div>
                        <div className="mt-2">
                            {renderStars(Math.round(avgRating || 0))}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {reviewCount || 0} {t('reviews.count_suffix')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Review Form */}
            {showForm && user && (
                <ReviewForm
                    menuItemId={menuItemId}
                    onSuccess={handleReviewSuccess}
                />
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white">
                    {t('reviews.customer_reviews')}
                </h4>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-400 mt-4">{t('reviews.loading')}</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                        <div className="text-6xl mb-4">💬</div>
                        <p className="text-gray-600 dark:text-gray-400">
                            {t('reviews.empty')}
                        </p>
                    </div>
                ) : (
                    <>
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white">
                                            {review.user?.full_name || t('reviews.anonymous')}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(review.created_at)}
                                        </p>
                                    </div>
                                    {renderStars(review.rating)}
                                </div>

                                {review.comment && (
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {review.comment}
                                    </p>
                                )}
                            </div>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    ← {t('reviews.prev')}
                                </button>
                                <span className="px-4 py-2 text-gray-700 dark:text-gray-300 font-semibold">
                                    {t('reviews.page')} {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {t('reviews.next')} →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
