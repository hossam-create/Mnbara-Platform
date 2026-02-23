import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  productCount?: number;
}

interface CategoriesGridProps {
  categories: Category[];
  loading?: boolean;
}

export default function CategoriesGrid({ categories, loading }: CategoriesGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-20 rounded-lg mb-2"></div>
            <div className="bg-gray-200 h-4 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {categories.map((category) => (
        <Link key={category.id} to={`/category/${category.slug}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              {category.icon && (
                <div className="text-2xl mb-2">{category.icon}</div>
              )}
              <h3 className="font-medium text-sm truncate">{category.name}</h3>
              {category.productCount && (
                <p className="text-xs text-muted-foreground mt-1">
                  {category.productCount} items
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
