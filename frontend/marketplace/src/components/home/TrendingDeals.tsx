import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Deal {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  category: string;
  location?: string;
  timeLeft?: string;
}

interface TrendingDealsProps {
  deals: Deal[];
  loading?: boolean;
}

export default function TrendingDeals({ deals, loading }: TrendingDealsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-8 w-48 rounded mb-4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2 mb-2"></div>
              <div className="bg-gray-200 h-6 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🔥 Trending Deals</h2>
        <Button variant="outline" asChild>
          <Link to="/deals">View All</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((deal) => (
          <Link key={deal.id} to={`/product/${deal.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="relative">
                <img
                  src={deal.image}
                  alt={deal.title}
                  className="w-full aspect-square object-cover rounded-t-lg group-hover:scale-105 transition-transform"
                />
                {deal.discount && (
                  <Badge className="absolute top-2 left-2 bg-red-500">
                    -{deal.discount}%
                  </Badge>
                )}
                {deal.timeLeft && (
                  <Badge className="absolute top-2 right-2 bg-orange-500">
                    {deal.timeLeft}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {deal.title}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl font-bold text-primary">
                    ${deal.price}
                  </span>
                  {deal.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${deal.originalPrice}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{deal.category}</span>
                  {deal.location && <span>{deal.location}</span>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
