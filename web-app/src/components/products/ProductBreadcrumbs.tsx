import React from 'react';
import type { ProductCategory } from '../../types/product';
import './ProductBreadcrumbs.css';

export interface ProductBreadcrumbsProps {
  categories: ProductCategory[];
  currentCategoryId?: string;
  productTitle?: string;
  productId?: string;
}

export const ProductBreadcrumbs: React.FC<ProductBreadcrumbsProps> = ({
  categories,
  currentCategoryId,
  productTitle,
}) => {
  const getCategoryPath = (categoryId: string): ProductCategory[] => {
    const path: ProductCategory[] = [];
    let current = categories.find(c => c.id === categoryId);
    
    while (current) {
      path.unshift(current);
      if (current.parentId) {
        current = categories.find(c => c.id === current?.parentId);
      } else {
        current = undefined;
      }
    }
    
    return path;
  };

  const categoryPath = currentCategoryId ? getCategoryPath(currentCategoryId) : [];

  return (
    <nav className="mnbara-product-breadcrumbs" aria-label="Breadcrumb">
      <ol className="mnbara-product-breadcrumbs__list">
        <li className="mnbara-product-breadcrumbs__item">
          <a href="/" className="mnbara-product-breadcrumbs__link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home
          </a>
        </li>
        
        <li className="mnbara-product-breadcrumbs__item">
          <a href="/products" className="mnbara-product-breadcrumbs__link">
            All Products
          </a>
        </li>

        {categoryPath.map((category, index) => (
          <li key={category.id} className="mnbara-product-breadcrumbs__item">
            {index === categoryPath.length - 1 ? (
              <span className="mnbara-product-breadcrumbs__current">
                {category.name}
              </span>
            ) : (
              <a
                href={`/products?category=${category.id}`}
                className="mnbara-product-breadcrumbs__link"
              >
                {category.name}
              </a>
            )}
          </li>
        ))}

        {productTitle && (
          <li className="mnbara-product-breadcrumbs__item">
            <span className="mnbara-product-breadcrumbs__current">
              {productTitle.length > 30
                ? `${productTitle.substring(0, 30)}...`
                : productTitle}
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
};

export default ProductBreadcrumbs;
