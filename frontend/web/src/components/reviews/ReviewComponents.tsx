// ============================================
// ⭐ Reviews Component - Products & Travelers
// ============================================

import { useState } from 'react';

interface ReviewFormProps {
  type: 'product' | 'seller' | 'traveler';
  targetId: string;
  onSubmit: (review: ReviewData) => void;
}

interface ReviewData {
  rating: number;
  title?: string;
  content: string;
  categories?: Record<string, number>;
  pros?: string[];
  cons?: string[];
  images?: File[];
}

export function ReviewForm({ type, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [pros, setPros] = useState<string[]>(['']);
  const [cons, setCons] = useState<string[]>(['']);

  const travelerCategories = [
    { id: 'communication', label: 'Communication', icon: '💬' },
    { id: 'punctuality', label: 'Punctuality', icon: '⏰' },
    { id: 'packaging', label: 'Packaging', icon: '📦' },
    { id: 'professionalism', label: 'Professionalism', icon: '👔' },
  ];

  const sellerCategories = [
    { id: 'productQuality', label: 'Product Quality', icon: '✨' },
    { id: 'shipping', label: 'Shipping', icon: '🚚' },
    { id: 'communication', label: 'Communication', icon: '💬' },
    { id: 'value', label: 'Value for Money', icon: '💰' },
  ];

  const currentCategories = type === 'traveler' ? travelerCategories : type === 'seller' ? sellerCategories : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      rating,
      title,
      content,
      categories: currentCategories.length > 0 ? categories : undefined,
      pros: pros.filter(p => p.trim()),
      cons: cons.filter(c => c.trim()),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Write a Review
      </h3>

      {/* Overall Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="text-4xl transition-transform hover:scale-110"
            >
              {star <= (hoverRating || rating) ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {rating === 0 && 'Click to rate'}
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent'}
        </div>
      </div>

      {/* Category Ratings */}
      {currentCategories.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Rate by Category</label>
          <div className="space-y-3">
            {currentCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-4">
                <div className="w-40 flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="text-sm text-gray-700">{cat.label}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCategories({ ...categories, [cat.id]: star })}
                      className="text-2xl"
                    >
                      {star <= (categories[cat.id] || 0) ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Title */}
      {type === 'product' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-pink-500"
            placeholder="Sum up your experience"
          />
        </div>
      )}

      {/* Content */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 resize-none"
          rows={4}
          placeholder="Share your experience..."
        />
      </div>

      {/* Pros and Cons */}
      {type === 'product' && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-green-600 mb-2">👍 Pros</label>
            {pros.map((pro, i) => (
              <input
                key={i}
                type="text"
                value={pro}
                onChange={(e) => {
                  const newPros = [...pros];
                  newPros[i] = e.target.value;
                  if (i === pros.length - 1 && e.target.value) {
                    newPros.push('');
                  }
                  setPros(newPros);
                }}
                className="w-full px-3 py-2 border border-green-200 rounded-lg mb-2 focus:border-green-500"
                placeholder="Add a pro..."
              />
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-red-600 mb-2">👎 Cons</label>
            {cons.map((con, i) => (
              <input
                key={i}
                type="text"
                value={con}
                onChange={(e) => {
                  const newCons = [...cons];
                  newCons[i] = e.target.value;
                  if (i === cons.length - 1 && e.target.value) {
                    newCons.push('');
                  }
                  setCons(newCons);
                }}
                className="w-full px-3 py-2 border border-red-200 rounded-lg mb-2 focus:border-red-500"
                placeholder="Add a con..."
              />
            ))}
          </div>
        </div>
      )}

      {/* Photo Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos (Optional)</label>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <label
              key={i}
              className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-pink-500 transition-colors"
            >
              <span className="text-2xl text-gray-400">📷</span>
              <input type="file" accept="image/*" className="hidden" />
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={rating === 0 || !content.trim()}
        className="w-full py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
      >
        Submit Review
      </button>
    </form>
  );
}

// Reviews List Component
interface ReviewsListProps {
  reviews: Array<{
    id: string;
    user: { name: string; avatar?: string; isVerifiedBuyer?: boolean };
    rating: number;
    title?: string;
    content: string;
    pros?: string[];
    cons?: string[];
    images?: string[];
    likes: number;
    date: string;
    sellerResponse?: { content: string; respondedAt: string };
  }>;
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white rounded-xl p-6 border border-gray-200">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-white font-bold">
              {review.user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{review.user.name}</span>
                {review.user.isVerifiedBuyer && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    ✓ Verified Buyer
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-gray-500">{review.date}</span>
              </div>
            </div>
          </div>

          {/* Title & Content */}
          {review.title && (
            <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
          )}
          <p className="text-gray-600 mb-4">{review.content}</p>

          {/* Pros/Cons */}
          {(review.pros?.length || review.cons?.length) && (
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {review.pros && review.pros.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm font-semibold text-green-700 mb-2">👍 Pros</div>
                  <ul className="space-y-1">
                    {review.pros.map((pro, i) => (
                      <li key={i} className="text-sm text-green-600">• {pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              {review.cons && review.cons.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-sm font-semibold text-red-700 mb-2">👎 Cons</div>
                  <ul className="space-y-1">
                    {review.cons.map((con, i) => (
                      <li key={i} className="text-sm text-red-600">• {con}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div className="flex gap-2 mb-4">
              {review.images.map((img, i) => (
                <div key={i} className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 text-sm">
            <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
              👍 Helpful ({review.likes})
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              Report
            </button>
          </div>

          {/* Seller Response */}
          {review.sellerResponse && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="text-sm font-semibold text-blue-700 mb-1">Seller Response</div>
              <p className="text-sm text-gray-700">{review.sellerResponse.content}</p>
              <div className="text-xs text-gray-500 mt-1">{review.sellerResponse.respondedAt}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ReviewForm;
