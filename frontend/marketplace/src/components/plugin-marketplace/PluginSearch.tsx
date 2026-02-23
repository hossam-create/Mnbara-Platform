import React from 'react';
import styles from './PluginSearch.module.css';

interface PluginSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const PluginSearch: React.FC<PluginSearchProps> = ({
  value,
  onChange,
  placeholder = "Search plugins..."
}) => {
  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchIcon}>🔍</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.searchInput}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={styles.clearButton}
        >
          ✕
        </button>
      )}
    </div>
  );
};