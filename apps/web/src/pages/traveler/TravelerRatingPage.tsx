import React, { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Calendar, Package, MapPin } from 'lucide-react';

const TravelerRatingPage: React.FC = () => {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const reviews = [
    {
      id: '1',
      sender: 'John Doe',
      rating: 5,
      date: '2024-02-15',
      comment: 'Excellent service! Package delivered on time and in perfect condition.',
      route: 'Dubai → London'
    },
    {
      id: '2',
      sender: 'Jane Smith',
      rating: 4,
      date: '2024-02-10',
      comment: 'Great communication and fast delivery. Would use again.',
      route: 'Dubai → Paris'
    },
    {
      id: '3',
      sender: 'Mike Johnson',
      rating: 5,
      date: '2024-02-05',
      comment: 'Professional and reliable. Highly recommended!',
      route: 'Dubai → Istanbul'
    }
  ];

  const stats = {
    averageRating: 4.8,
    totalReviews: 156,
    fiveStar: 142,
    fourStar: 12,
    threeStar: 2,
    twoStar: 0,
    oneStar: 0
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Traveler Ratings & Reviews</h1>
          <p className="mt-2 text-gray-600">View your ratings and feedback from senders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">{stats.averageRating}</div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${star <= Math.round(stats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600">{stats.totalReviews} reviews</div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stars === 5 ? stats.fiveStar : stars === 4 ? stats.fourStar : stars === 3 ? stats.threeStar : stats.twoStar || stats.oneStar;
                const percentage = (count / stats.totalReviews) * 100;
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">{stars}</span>
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-600 w-12 text-right">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900">{review.sender}</div>
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

                  <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {review.route}
                    </div>
                  </div>

                  <p className="text-gray-700">{review.comment}</p>

                  <div className="flex items-center gap-4 mt-3">
                    <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      Helpful
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

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-gray-600">Packages Delivered</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">342</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-gray-600">On-Time Delivery</span>
                </div>
                <div className="text-2xl font-bold text-green-600">98%</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-gray-600">Average Response Time</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">2h</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelerRatingPage;
