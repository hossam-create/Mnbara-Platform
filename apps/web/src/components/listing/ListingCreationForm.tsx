/**
 * ListingCreationForm - منصة منبرة
 * 
 * Multi-step form for creating new listings
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useListing } from '../../hooks/useListing';
import { CategorySelector } from './CategorySelector';
import { ImageUploadWidget } from './ImageUploadWidget';
import { ListingCondition, ListingType, type CreateListingInput, type Category } from '../../types/listing.types';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

type FormData = CreateListingInput & {
  images: File[];
};

enum FormStep {
  CATEGORY = 0,
  DETAILS = 1,
  IMAGES = 2,
  REVIEW = 3,
}

export const ListingCreationForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createListing, uploadImages, isLoading } = useListing();
  
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.CATEGORY);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [images, setImages] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      currency: 'SAR',
      condition: ListingCondition.NEW,
      type: ListingType.FIXED_PRICE,
      isNegotiable: false,
      quantity: 1,
    },
  });

  const formData = watch();

  const handleCategorySelect = (categoryId: number, category: Category) => {
    setSelectedCategory(category);
    setValue('categoryId', categoryId);
  };

  const nextStep = () => {
    if (currentStep < FormStep.REVIEW) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > FormStep.CATEGORY) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Create listing
      const listing = await createListing({
        title: data.title,
        titleAr: data.titleAr,
        description: data.description,
        descriptionAr: data.descriptionAr,
        price: data.price,
        currency: data.currency,
        condition: data.condition,
        type: data.type,
        categoryId: data.categoryId,
        location: data.location,
        specifications: data.specifications,
        tags: data.tags,
        isNegotiable: data.isNegotiable,
        quantity: data.quantity,
        sku: data.sku,
        brand: data.brand,
        model: data.model,
      });

      // Upload images if any
      if (images.length > 0) {
        await uploadImages(listing.id, images);
      }

      // Navigate to listing page
      navigate(`/seller/listings/${listing.id}`);
    } catch (error) {
      console.error('Failed to create listing:', error);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[
        t('listing.steps.category'),
        t('listing.steps.details'),
        t('listing.steps.images'),
        t('listing.steps.review'),
      ].map((label, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${
                  index === currentStep
                    ? 'bg-blue-600 text-white'
                    : index < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }
              `}
            >
              {index + 1}
            </div>
            <span className="mt-2 text-xs text-gray-600">{label}</span>
          </div>
          {index < 3 && (
            <div
              className={`
                w-16 h-1 mx-2 mt-[-20px]
                ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}
              `}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderCategoryStep = () => (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t('listing.steps.selectCategory')}</h2>
      <CategorySelector
        selectedCategoryId={formData.categoryId || null}
        onCategorySelect={handleCategorySelect}
        error={errors.categoryId?.message}
      />
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('listing.steps.enterDetails')}</h2>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('listing.fields.title')} *
        </label>
        <input
          {...register('title', { required: t('listing.errors.titleRequired') })}
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder={t('listing.placeholders.title')}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Title Arabic */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('listing.fields.titleAr')}
        </label>
        <input
          {...register('titleAr')}
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder={t('listing.placeholders.titleAr')}
          dir="rtl"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('listing.fields.description')} *
        </label>
        <textarea
          {...register('description', {
            required: t('listing.errors.descriptionRequired'),
          })}
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder={t('listing.placeholders.description')}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Price & Condition Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('listing.fields.price')} *
          </label>
          <div className="flex">
            <input
              {...register('price', {
                required: t('listing.errors.priceRequired'),
                min: { value: 0, message: t('listing.errors.priceMin') },
              })}
              type="number"
              step="0.01"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            <select
              {...register('currency')}
              className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50"
            >
              <option value="SAR">SAR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('listing.fields.condition')} *
          </label>
          <select
            {...register('condition')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(ListingCondition).map((condition) => (
              <option key={condition} value={condition}>
                {t(`listing.conditions.${condition.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Type & Negotiable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('listing.fields.type')}
          </label>
          <select
            {...register('type')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(ListingType).map((type) => (
              <option key={type} value={type}>
                {t(`listing.types.${type.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <input
            {...register('isNegotiable')}
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">
            {t('listing.fields.isNegotiable')}
          </label>
        </div>
      </div>

      {/* Brand, Model, Quantity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('listing.fields.brand')}
          </label>
          <input
            {...register('brand')}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('listing.fields.model')}
          </label>
          <input
            {...register('model')}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('listing.fields.quantity')}
          </label>
          <input
            {...register('quantity', { min: 1 })}
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderImagesStep = () => (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t('listing.steps.uploadImages')}</h2>
      <ImageUploadWidget images={images} onImagesChange={setImages} />
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('listing.steps.reviewAndPublish')}</h2>
      
      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-700">{t('listing.fields.title')}</h3>
          <p>{formData.title}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-700">{t('listing.fields.category')}</h3>
          <p>{selectedCategory?.name}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-700">{t('listing.fields.price')}</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formData.price} {formData.currency}
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-700">{t('listing.fields.condition')}</h3>
          <p>{t(`listing.conditions.${formData.condition.toLowerCase()}`)}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-700">{t('listing.fields.images')}</h3>
          <p>{images.length} {t('listing.upload.images')}</p>
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-6">
      {renderStepIndicator()}

      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        {currentStep === FormStep.CATEGORY && renderCategoryStep()}
        {currentStep === FormStep.DETAILS && renderDetailsStep()}
        {currentStep === FormStep.IMAGES && renderImagesStep()}
        {currentStep === FormStep.REVIEW && renderReviewStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          onClick={prevStep}
          disabled={currentStep === FormStep.CATEGORY}
          variant="secondary"
        >
          {t('common.previous')}
        </Button>

        {currentStep < FormStep.REVIEW ? (
          <Button
            type="button"
            onClick={nextStep}
            disabled={
              (currentStep === FormStep.CATEGORY && !formData.categoryId) ||
              (currentStep === FormStep.DETAILS && (!formData.title || !formData.description || !formData.price))
            }
          >
            {t('common.next')}
          </Button>
        ) : (
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="small" /> : t('listing.actions.publish')}
          </Button>
        )}
      </div>
    </form>
  );
};

export default ListingCreationForm;
