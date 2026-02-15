import React from 'react';
import { Plugin } from '../../types/plugin.types';
import apiService from '../../services/api.service';
import styles from './PluginInstallModal.module.css';

interface PluginInstallModalProps {
  plugin: Plugin;
  onClose: () => void;
  onSuccess: () => void;
}

export const PluginInstallModal: React.FC<PluginInstallModalProps> = ({
  plugin,
  onClose,
  onSuccess,
}) => {
  const [installing, setInstalling] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleInstall = async () => {
    try {
      setInstalling(true);
      setError(null);
      await apiService.marketplace.installPlugin(plugin.id);
      onSuccess();
    } catch (err) {
      setError('Installation failed. Please try again.');
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Install Plugin</h3>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.pluginInfo}>
            <h4>{plugin.name}</h4>
            <p>Version {plugin.version}</p>
            <p className={styles.description}>{plugin.description}</p>
          </div>

          <div className={styles.permissions}>
            <h5>Permissions Required:</h5>
            <ul>
              {plugin.manifest.MnbaraPlugin?.permissions.map((permission) => (
                <li key={permission}>{permission}</li>
              ))}
            </ul>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={styles.cancelButton}
              onClick={onClose}
              disabled={installing}
            >
              Cancel
            </button>
            <button
              className={styles.installButton}
              onClick={handleInstall}
              disabled={installing}
            >
              {installing ? 'Installing...' : 'Install Plugin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};