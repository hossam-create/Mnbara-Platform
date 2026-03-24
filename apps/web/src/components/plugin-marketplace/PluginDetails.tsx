import React from 'react';
import { Plugin } from '../../types/plugin.types';
import styles from './PluginDetails.module.css';

interface PluginDetailsProps {
  plugin: Plugin;
  onClose: () => void;
  onInstall: () => void;
}

export const PluginDetails: React.FC<PluginDetailsProps> = ({
  plugin,
  onClose,
  onInstall,
}) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className={styles.starFull}>★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className={styles.starHalf}>☆</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className={styles.starEmpty}>☆</span>);
    }

    return stars;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{plugin.name}</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.mainInfo}>
            <p className={styles.description}>{plugin.description}</p>
            
            <div className={styles.meta}>
              <div className={styles.author}>
                <span>by {plugin.author.name}</span>
                {plugin.author.verified && <span className={styles.verified}>✓</span>}
              </div>
              <span className={styles.category}>{plugin.category}</span>
            </div>

            <div className={styles.stats}>
              <div className={styles.rating}>
                <div className={styles.stars}>{renderStars(plugin.rating)}</div>
                <span>{plugin.rating.toFixed(1)} ({plugin.reviewCount} reviews)</span>
              </div>
              <div className={styles.downloads}>
                ⬇ {plugin.downloadCount.toLocaleString()} downloads
              </div>
            </div>

            {plugin.tags && plugin.tags.length > 0 && (
              <div className={styles.tags}>
                {plugin.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.sidebar}>
            <div className={styles.priceSection}>
              {plugin.price === 0 ? (
                <span className={styles.freePrice}>Free</span>
              ) : (
                <span className={styles.price}>${plugin.price.toFixed(2)}</span>
              )}
            </div>

            <button className={styles.installButton} onClick={onInstall}>
              Install Plugin
            </button>

            {plugin.isVerified && (
              <div className={styles.verificationBadge}>
                <span className={styles.checkmark}>✓</span>
                Verified Plugin
              </div>
            )}

            {plugin.documentation && (
              <div className={styles.documentation}>
                <h4>Documentation</h4>
                <a href={plugin.documentation} target="_blank" rel="noopener noreferrer">
                  View Documentation →
                </a>
              </div>
            )}

            {plugin.supportUrl && (
              <div className={styles.support}>
                <h4>Support</h4>
                <a href={plugin.supportUrl} target="_blank" rel="noopener noreferrer">
                  Get Support →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};