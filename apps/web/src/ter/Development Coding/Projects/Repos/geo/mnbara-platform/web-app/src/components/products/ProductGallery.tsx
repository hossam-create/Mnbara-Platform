import React, { useState, useCallback } from 'react';
import type { ProductImage } from '../../types/product';
import './ProductGallery.css';

export interface ProductGalleryProps {
  images: ProductImage[];
  productTitle: string;
  onImageClick?: (image: ProductImage, index: number) => void;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productTitle,
  onImageClick,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  const selectedImage = images[selectedIndex] || images[0];

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }, [isZoomed]);

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) {
    return (
      <div className="mnbara-product-gallery">
        <div className="mnbara-product-gallery__main">
          <div className="mnbara-product-gallery__placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mnbara-product-gallery">
      <div
        className={`mnbara-product-gallery__main ${isZoomed ? 'zoomed' : ''}`}
        onMouseMove={handleMouseMove}
        onClick={() => setIsZoomed(!isZoomed)}
        style={
          isZoomed
            ? {
                backgroundImage: `url(${selectedImage.url})`,
                backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              }
            : {}
        }
      >
        <img
          src={selectedImage.thumbnailUrl || selectedImage.url}
          alt={`${productTitle} - Image ${selectedIndex + 1}`}
          className="mnbara-product-gallery__main-image"
        />

        {images.length > 1 && (
          <>
            <button
              className="mnbara-product-gallery__nav mnbara-product-gallery__nav--prev"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous image"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              className="mnbara-product-gallery__nav mnbara-product-gallery__nav--next"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next image"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        <div className="mnbara-product-gallery__zoom-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
            <path d="M11 8v6M8 11h6" />
          </svg>
          {isZoomed ? 'Click to zoom out' : 'Click to zoom'}
        </div>
      </div>

      {images.length > 1 && (
        <div className="mnbara-product-gallery__thumbnails">
          {images.slice(0, 6).map((image, index) => (
            <button
              key={image.id}
              className={`mnbara-product-gallery__thumbnail ${index === selectedIndex ? 'active' : ''}`}
              onClick={() => handleThumbnailClick(index)}
              aria-label={`View image ${index + 1}`}
            >
              <img src={image.thumbnailUrl} alt={`Thumbnail ${index + 1}`} />
              {index === 5 && images.length > 6 && (
                <div className="mnbara-product-gallery__more">
                  +{images.length - 6}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
