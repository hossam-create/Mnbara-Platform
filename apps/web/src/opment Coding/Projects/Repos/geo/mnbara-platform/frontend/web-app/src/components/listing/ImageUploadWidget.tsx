/**
 * ImageUploadWidget - منصة منبرة
 * 
 * Drag & drop image upload component for listings
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { XMarkIcon, PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface ImageUploadWidgetProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  maxSizePerImage?: number; // in MB
}

export const ImageUploadWidget: React.FC<ImageUploadWidgetProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  maxSizePerImage = 5,
}) => {
  const { t } = useTranslation();
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Validate file count
      if (images.length + acceptedFiles.length > maxImages) {
        toast.error(t('listing.errors.maxImagesExceeded', { max: maxImages }));
        return;
      }

      // Validate file sizes
      const oversizedFiles = acceptedFiles.filter(
        (file) => file.size > maxSizePerImage * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        toast.error(
          t('listing.errors.imageTooLarge', { max: maxSizePerImage })
        );
        return;
      }

      // Validate file types
      const invalidFiles = acceptedFiles.filter(
        (file) => !file.type.startsWith('image/')
      );
      if (invalidFiles.length > 0) {
        toast.error(t('listing.errors.invalidImageType'));
        return;
      }

      // Add new images
      const newImages = [...images, ...acceptedFiles];
      onImagesChange(newImages);

      // Generate previews
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });

      toast.success(
        t('listing.success.imagesAdded', { count: acceptedFiles.length })
      );
    },
    [images, maxImages, maxSizePerImage, onImagesChange, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: maxImages - images.length,
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onImagesChange(newImages);
    setPreviews(newPreviews);
    toast.success(t('listing.success.imageRemoved'));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const newPreviews = [...previews];
    
    [newImages[fromIndex], newImages[toIndex]] = [
      newImages[toIndex],
      newImages[fromIndex],
    ];
    [newPreviews[fromIndex], newPreviews[toIndex]] = [
      newPreviews[toIndex],
      newPreviews[fromIndex],
    ];

    onImagesChange(newImages);
    setPreviews(newPreviews);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} />
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? t('listing.upload.dropHere')
            : t('listing.upload.dragOrClick')}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {t('listing.upload.supportedFormats')}: PNG, JPG, GIF, WebP
        </p>
        <p className="text-xs text-gray-500">
          {t('listing.upload.maxSize')}: {maxSizePerImage}MB {t('listing.upload.perImage')}
        </p>
        <p className="text-xs text-gray-500">
          {t('listing.upload.maxImages')}: {maxImages}
        </p>
      </div>

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
            >
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200">
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                  title={t('listing.upload.remove')}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>

                {/* Move Buttons */}
                <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index - 1)}
                      className="flex-1 px-2 py-1 bg-white text-gray-700 text-xs rounded hover:bg-gray-100"
                    >
                      ←
                    </button>
                  )}
                  {index < previews.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index + 1)}
                      className="flex-1 px-2 py-1 bg-white text-gray-700 text-xs rounded hover:bg-gray-100"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>

              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                  {t('listing.upload.primary')}
                </div>
              )}

              {/* Image Number */}
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {images.length} / {maxImages} {t('listing.upload.images')}
          </span>
          <span className="text-xs text-gray-500">
            {t('listing.upload.firstImageIsPrimary')}
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageUploadWidget;
