import React from 'react';
import Image from 'next/image';

// Marketplace image domains for CDN optimization
export const MARKETPLACE_IMAGE_DOMAINS = [
  'images.unsplash.com',
  'cdn.sanity.io',
  'res.cloudinary.com',
  'ik.imagekit.io',
  'imgix.net',
  'images.prismic.io',
  'assets.vercel.com',
  'localhost',
];

// Marketplace Image component with optimized defaults
interface MarketplaceImageProps extends Omit<React.ComponentProps<typeof Image>, 'src'> {
  src: string;
  alt: string;
  priority?: boolean;
  quality?: number;
  marketplace?: boolean;
  fallbackSrc?: string;
}

export const MarketplaceImage: React.FC<MarketplaceImageProps> = ({
  src,
  alt,
  priority = false,
  quality = 80,
  marketplace = true,
  fallbackSrc = '/images/placeholder-product.jpg',
  className,
  ...props
}) => {
  const [imageSrc, setImageSrc] = React.useState(src);
  const [hasError, setHasError] = React.useState(false);

  // Handle image load error
  const handleError = () => {
    if (!hasError && fallbackSrc !== imageSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    }
  };

  // Marketplace-optimized image settings
  const marketplaceProps = marketplace ? {
    quality,
    sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw',
    placeholder: 'blur' as const,
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z',
  } : {};

  return (
    <Image
      src={imageSrc}
      alt={alt}
      priority={priority}
      onError={handleError}
      className={className}
      {...marketplaceProps}
      {...props}
    />
  );
};

// Product image component with marketplace-specific optimizations
interface ProductImageProps extends Omit<MarketplaceImageProps, 'alt'> {
  product: {
    title: string;
    images?: string[];
    image?: string;
  };
  index?: number;
  size?: 'thumbnail' | 'medium' | 'large';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  product,
  index = 0,
  size = 'medium',
  ...props
}) => {
  const imageUrl = product.images?.[index] || product.image || '/images/placeholder-product.jpg';
  const alt = `${product.title} - Image ${index + 1}`;

  // Size-specific optimizations
  const sizeConfigs = {
    thumbnail: { width: 150, height: 150, quality: 70 },
    medium: { width: 300, height: 300, quality: 80 },
    large: { width: 600, height: 600, quality: 85 },
  };

  return (
    <MarketplaceImage
      src={imageUrl}
      alt={alt}
      width={sizeConfigs[size].width}
      height={sizeConfigs[size].height}
      quality={sizeConfigs[size].quality}
      {...props}
    />
  );
};

// Profile image component
interface ProfileImageProps extends Omit<MarketplaceImageProps, 'alt'> {
  user: {
    name: string;
    avatar?: string;
  };
  size?: 'small' | 'medium' | 'large';
}

export const ProfileImage: React.FC<ProfileImageProps> = ({
  user,
  size = 'medium',
  ...props
}) => {
  const imageUrl = user.avatar || '/images/default-avatar.jpg';
  const alt = `${user.name}'s profile picture`;

  const sizeConfigs = {
    small: { width: 32, height: 32 },
    medium: { width: 64, height: 64 },
    large: { width: 128, height: 128 },
  };

  return (
    <MarketplaceImage
      src={imageUrl}
      alt={alt}
      width={sizeConfigs[size].width}
      height={sizeConfigs[size].height}
      className="rounded-full"
      {...props}
    />
  );
};

// Hero banner image component with priority loading
interface HeroImageProps extends Omit<MarketplaceImageProps, 'priority'> {
  priority?: true; // Always priority for hero images
}

export const HeroImage: React.FC<HeroImageProps> = ({ ...props }) => {
  return (
    <MarketplaceImage
      priority={true}
      quality={90}
      sizes="100vw"
      style={{ width: '100%', height: 'auto' }}
      {...props}
    />
  );
};

// Lazy loaded image gallery component
interface ImageGalleryProps {
  images: string[];
  alt: string;
  maxVisible?: number;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  alt,
  maxVisible = 4,
  className = '',
}) => {
  const visibleImages = images.slice(0, maxVisible);
  const remainingCount = Math.max(0, images.length - maxVisible);

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {visibleImages.map((src, index) => (
        <MarketplaceImage
          key={index}
          src={src}
          alt={`${alt} - Image ${index + 1}`}
          width={150}
          height={150}
          className="rounded-lg object-cover"
          loading={index < 2 ? 'eager' : 'lazy'}
        />
      ))}
      {remainingCount > 0 && (
        <div className="relative bg-gray-100 rounded-lg flex items-center justify-center">
          <MarketplaceImage
            src={images[maxVisible]}
            alt={`${alt} - Image ${maxVisible + 1}`}
            fill
            className="rounded-lg object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold">+{remainingCount}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Image optimization utilities
export const imageUtils = {
  // Generate responsive image URLs
  generateResponsiveUrl: (baseUrl: string, width: number, quality: number = 80): string => {
    // Add query parameters for optimization
    const url = new URL(baseUrl);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('auto', 'format,compress');
    return url.toString();
  },

  // Preload critical images
  preloadCriticalImages: (imageUrls: string[]): void => {
    if (typeof window === 'undefined') return;

    imageUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  },

  // Check if image is from allowed domains
  isAllowedDomain: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return MARKETPLACE_IMAGE_DOMAINS.some(domain =>
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  },
};

export default MarketplaceImage;
