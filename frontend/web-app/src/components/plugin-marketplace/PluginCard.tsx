import React from 'react';
import { Plugin } from '../../types/plugin.types';
import { useAuth } from '../../hooks/useAuth';
import styles from './PluginCard.module.css';

interface PluginCardProps {
  plugin: Plugin;
  onViewDetails: () => void;
  onInstall: () => void;
  isInstalled?: boolean;
}

export const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  onViewDetails,
  onInstall,
  isInstalled = false,
}) => {
  const { user } = useAuth();

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

  const formatPrice = (price: number) => {
    if (price === 0) {
      return <span className={styles.freePrice}>Free</span>;
    }
    return <span className={styles.price}>${price.toFixed(2)}</span>;
  };

  const formatDownloadCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        {plugin.screenshots && plugin.screenshots.length > 0 ? (
          <img
            src={plugin.screenshots[0]}
            alt={plugin.name}
            className={styles.screenshot}
            onClick={onViewDetails}
          />
        ) : (
          <div className={styles.placeholderImage} onClick={onViewDetails}>
            <div className={styles.placeholderIcon}>🔌</div>
          </div>
        )}
        
        {plugin.isVerified && (
          <div className={styles.verifiedBadge}>
            <span className={styles.checkmark}>✓</span>
            Verified
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.titleSection}>
          <h3 className={styles.name} onClick={onViewDetails}>{plugin.name}</h3>
          <span className={styles.version}>v{plugin.version}</span>
        </div>

        <p className={styles.description}>{plugin.description}</p>

        <div className={styles.meta}>
          <div className={styles.author}>
            <span className={styles.by}>by</span>
            <span className={styles.authorName}>{plugin.author.name}</span>
            {plugin.author.verified && <span className={styles.verified}>✓</span>}
          </div>

          <div className={styles.category}>
            <span className={styles.categoryBadge}>{plugin.category}</span>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.rating}>
            <div className={styles.stars}>{renderStars(plugin.rating)}</div>
            <span className={styles.ratingText}>{plugin.rating.toFixed(1)}</span>
            <span className={styles.reviewCount}>({plugin.reviewCount})</span>
          </div>

          <div className={styles.downloads}>
            <span className={styles.downloadIcon}>⬇</span>
            <span className={styles.downloadCount}>{formatDownloadCount(plugin.downloadCount)}</span>
          </div>
        </div>

        {plugin.tags && plugin.tags.length > 0 && (
          <div className={styles.tags}>
            {plugin.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.priceSection}>
          {formatPrice(plugin.price)}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.viewButton}
            onClick={onViewDetails}
          >
            View Details
          </button>

          {!isInstalled ? (
            <button
              className={styles.installButton}
              onClick={onInstall}
              disabled={!user}
            >
              {user ? 'Install' : 'Login to Install'}
            </button>
          ) : (
            <button
              className={styles.installedButton}
              disabled
            >
              Installed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};