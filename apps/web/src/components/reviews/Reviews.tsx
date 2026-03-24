import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Filter } from 'lucide-react';

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  helpful: number;
  verified: boolean;
}

interface ReviewsProps {
  productId?: string;
  sellerId?: string;
  reviews?: Review[];
  showWriteReview?: boolean;
}

const Reviews: React.FC<ReviewsProps> = ({ productId, sellerId, reviews: initialReviews, showWriteReview = true }) => {
  const [reviews] = useState<Review[]>(initialReviews || [
    {
      id: '1',
      author: 'John Doe',
      rating: 5,
      date: '2024-02-15',
      title: 'Excellent product!',
      comment: 'Exactly as described. Fast shipping and great quality.',
      helpful: 12,
      verified: true
    },
    {
      id: '2',
      author: 'Jane Smith',
      rating: 4,
      date: '2024-02-10',
      title: 'Good value for money',
      comment: 'Product works well. Minor cosmetic issues but nothing major.',
      helpful: 8,
      verified: true
    },
    {
      id: '3',
      author: 'Mike Johnson',
      rating: 5,
      date: '2024-02-05',
      title: 'Highly recommended',
      comment: 'Best purchase I\'ve made. Will definitely buy again.',
      helpful: 15,
      verified: true
    }
  ]);

  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
      : 0
  }));

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(r => r.rating === parseInt(filter));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Reviews & Ratings</h2>
        {showWriteReview && (
          <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors">
            Write a Review
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">{averageRating.toFixed(1)}</div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600">{reviews.length} reviews</div>
          </div>
        </div>

        <div className="md:col-span-2 bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-600">{rating}</span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 w-12 text-right">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Filter by:</span>
        </div>
        <div className="flex gap-2">
          {['all', '5', '4', '3', '2', '1'].map((rating) => (
            <button
              key={rating}
              onClick={() => setFilter(rating as any)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                filter === rating
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {rating === 'all' ? 'All' : `${rating}★`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{review.author}</span>
                  {review.verified && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Verified Purchase</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>

            <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
            <p className="text-gray-700 mb-3">{review.comment}</p>

            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <ThumbsUp className="w-4 h-4" />
                Helpful ({review.helpful})
              </button>
              <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <MessageSquare className="w-4 h-4" />
                Reply
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { Reviews };
