import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterSite?: string;
  lang?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  twitterCard = 'summary_large_image',
  twitterSite = '@mnbara',
  lang = 'en'
}) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update meta tags
    const updateMetaTag = (name: string, content: string) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };

    const updatePropertyTag = (property: string, content: string) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };

    // Update description
    if (description) {
      updateMetaTag('description', description);
      updatePropertyTag('og:description', description);
      updatePropertyTag('twitter:description', description);
    }

    // Update keywords
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Update Open Graph
    if (ogTitle || title) {
      updatePropertyTag('og:title', ogTitle || title || '');
      updatePropertyTag('twitter:title', ogTitle || title || '');
    }

    if (ogImage) {
      updatePropertyTag('og:image', ogImage);
      updatePropertyTag('twitter:image', ogImage);
    }

    if (ogUrl) {
      updatePropertyTag('og:url', ogUrl);
    }

    // Update Twitter
    updateMetaTag('twitter:card', twitterCard);
    if (twitterSite) {
      updateMetaTag('twitter:site', twitterSite);
    }

    // Update canonical link
    if (canonical) {
      let linkTag = document.querySelector('link[rel="canonical"]');
      if (!linkTag) {
        linkTag = document.createElement('link');
        linkTag.setAttribute('rel', 'canonical');
        document.head.appendChild(linkTag);
      }
      linkTag.setAttribute('href', canonical);
    }

    // Update language
    document.documentElement.lang = lang;

    // Cleanup function to reset meta tags when component unmounts
    return () => {
      // Reset title to default
      document.title = 'MNBARH - Cross-Border Shopping Made Easy';
      
      // Reset description
      updateMetaTag('description', 'Connect with travelers to get products from anywhere in the world');
      
      // Reset other meta tags to default values
      updateMetaTag('keywords', 'cross-border shopping, travelers, delivery, international products');
      updatePropertyTag('og:title', 'MNBARH - Cross-Border Shopping Made Easy');
      updatePropertyTag('og:description', 'Connect with travelers to get products from anywhere in the world');
      updatePropertyTag('og:image', '/og-image.jpg');
      updatePropertyTag('og:url', window.location.origin);
      updateMetaTag('twitter:card', 'summary_large_image');
      updateMetaTag('twitter:site', '@mnbara');
      updatePropertyTag('twitter:title', 'MNBARH - Cross-Border Shopping Made Easy');
      updatePropertyTag('twitter:description', 'Connect with travelers to get products from anywhere in the world');
      updatePropertyTag('twitter:image', '/twitter-image.jpg');
      
      // Reset language
      document.documentElement.lang = 'en';
    };
  }, [title, description, keywords, canonical, ogTitle, ogDescription, ogImage, ogUrl, twitterCard, twitterSite, lang]);

  return null;
};