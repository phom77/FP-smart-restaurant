import { useState } from 'react';
import api from '../services/api';

export default function ReviewForm({ menuItemId, onSuccess }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            setError('Vui lòng chọn số sao');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.post('/api/reviews', {
                menu_item_id: menuItemId,
                rating,
                comment: comment.trim()
            });

            if (response.data.success) {
                // Reset form
                setRating(0);
                setComment('');
                // Notify parent component
                if (onSuccess) {
                    onSuccess(response.data.data);
                }
            }
        } catch (err) {
            console.error('Review submission error:', err);
            setError(err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = () => {
        return [1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-sm sm:text-base transition-all hover:scale-110 focus:outline-none flex-shrink-0"
            >
                {star <= (hoverRating || rating) ? '⭐' : '☆'}
            </button>
        ));
    };

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-800">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                ✍️ Viết đánh giá của bạn
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star Rating */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Đánh giá <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1 sm:gap-2 items-center">
                        {renderStars()}
                    </div>
                    {rating > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {rating === 1 && 'Rất tệ'}
                            {rating === 2 && 'Tệ'}
                            {rating === 3 && 'Bình thường'}
                            {rating === 4 && 'Tốt'}
                            {rating === 5 && 'Xuất sắc'}
                        </p>
                    )}
                </div>

                {/* Comment */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Nhận xét (tùy chọn)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm của bạn về món ăn này..."
                        rows={4}
                        maxLength={500}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                        {comment.length}/500 ký tự
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || rating === 0}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Đang gửi...
                        </>
                    ) : (
                        <>
                            <span>📝</span>
                            Gửi đánh giá
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
