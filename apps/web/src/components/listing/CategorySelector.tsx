/**
 * CategorySelector - منصة منبرة
 * 
 * Hierarchical category selector component
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCategory } from '../../hooks/useCategory';
import type { Category } from '../../types/listing.types';
import LoadingSpinner from '../common/LoadingSpinner';

interface CategorySelectorProps {
  selectedCategoryId: number | null;
  onCategorySelect: (categoryId: number, category: Category) => void;
  error?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryId,
  onCategorySelect,
  error,
}) => {
  const { t, i18n } = useTranslation();
  const { useCategoryTree, useSearchCategories } = useCategory();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumb, setBreadcrumb] = useState<Category[]>([]);
  const [currentLevel, setCurrentLevel] = useState<Category[]>([]);

  // Fetch category tree
  const { data: categoryTree, isLoading } = useCategoryTree();
  
  // Search categories
  const { data: searchResults } = useSearchCategories(searchQuery);

  // Initialize with root categories
  useEffect(() => {
    if (categoryTree && !searchQuery) {
      setCurrentLevel(categoryTree);
    }
  }, [categoryTree, searchQuery]);

  // Update current level when searching
  useEffect(() => {
    if (searchQuery && searchResults) {
      setCurrentLevel(searchResults);
    } else if (!searchQuery && categoryTree) {
      setCurrentLevel(categoryTree);
    }
  }, [searchQuery, searchResults, categoryTree]);

  const handleCategoryClick = (category: Category) => {
    if (category.children && category.children.length > 0) {
      // Has children, navigate deeper
      setBreadcrumb([...breadcrumb, category]);
      setCurrentLevel(category.children);
    } else {
      // Leaf category, select it
      onCategorySelect(category.id, category);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Go back to root
      setBreadcrumb([]);
      setCurrentLevel(categoryTree || []);
    } else {
      // Go back to specific level
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      setBreadcrumb(newBreadcrumb);
      const targetCategory = newBreadcrumb[newBreadcrumb.length - 1];
      setCurrentLevel(targetCategory.children || []);
    }
  };

  const getCategoryName = (category: Category) => {
    return i18n.language === 'ar' ? category.nameAr : category.name;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('listing.category.search')}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && !searchQuery && (
        <div className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="hover:text-blue-600 whitespace-nowrap"
          >
            {t('listing.category.allCategories')}
          </button>
          {breadcrumb.map((cat, index) => (
            <React.Fragment key={cat.id}>
              <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="hover:text-blue-600 whitespace-nowrap"
              >
                {getCategoryName(cat)}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Category List */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {currentLevel.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery
              ? t('listing.category.noResults')
              : t('listing.category.noCategories')}
          </div>
        ) : (
          currentLevel.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className={`
                w-full px-4 py-3 flex items-center justify-between
                hover:bg-gray-50 transition-colors duration-150
                ${selectedCategoryId === category.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                {category.icon && (
                  <span className="text-2xl">{category.icon}</span>
                )}
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    {getCategoryName(category)}
                  </div>
                  {category.description && (
                    <div className="text-sm text-gray-500">
                      {category.description}
                    </div>
                  )}
                </div>
              </div>
              {category.children && category.children.length > 0 && (
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          ))
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Selected Category Info */}
      {selectedCategoryId && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            {t('listing.category.selected')}:{' '}
            <span className="font-medium">
              {currentLevel.find((c) => c.id === selectedCategoryId)
                ? getCategoryName(
                    currentLevel.find((c) => c.id === selectedCategoryId)!
                  )
                : ''}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
