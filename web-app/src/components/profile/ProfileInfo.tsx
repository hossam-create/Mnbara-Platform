/**
 * ProfileInfo Component
 * Displays detailed profile information
 */

import React from 'react';
import type { UserProfile } from '../../types/profile';
import './ProfileInfo.css';

interface ProfileInfoProps {
  profile: UserProfile;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile }) => {
  return (
    <div className="mnbara-profile-info">
      <div className="mnbara-profile-info__section">
        <h3 className="mnbara-profile-info__section-title">Contact Information</h3>
        <div className="mnbara-profile-info__grid">
          <div className="mnbara-profile-info__item">
            <span className="mnbara-profile-info__label">Email</span>
            <span className="mnbara-profile-info__value">{profile.email}</span>
          </div>
          
          {profile.phoneNumber && (
            <div className="mnbara-profile-info__item">
              <span className="mnbara-profile-info__label">Phone</span>
              <span className="mnbara-profile-info__value">{profile.phoneNumber}</span>
            </div>
          )}
          
          <div className="mnbara-profile-info__item">
            <span className="mnbara-profile-info__label">Country</span>
            <span className="mnbara-profile-info__value">{profile.country}</span>
          </div>
        </div>
      </div>

      <div className="mnbara-profile-info__section">
        <h3 className="mnbara-profile-info__section-title">Preferences</h3>
        <div className="mnbara-profile-info__grid">
          <div className="mnbara-profile-info__item">
            <span className="mnbara-profile-info__label">Language</span>
            <span className="mnbara-profile-info__value">{profile.language.toUpperCase()}</span>
          </div>
          
          <div className="mnbara-profile-info__item">
            <span className="mnbara-profile-info__label">Timezone</span>
            <span className="mnbara-profile-info__value">{profile.timezone}</span>
          </div>
        </div>
      </div>

      {profile.verifiedAccounts && profile.verifiedAccounts.length > 0 && (
        <div className="mnbara-profile-info__section">
          <h3 className="mnbara-profile-info__section-title">Verified Accounts</h3>
          <div className="mnbara-profile-info__verified-list">
            {profile.verifiedAccounts.map((account, index) => (
              <div key={index} className="mnbara-profile-info__verified-item">
                <span className="mnbara-profile-info__verified-icon">
                  {account.provider === 'google' && '🔵'}
                  {account.provider === 'facebook' && '🔵'}
                  {account.provider === 'twitter' && '🐦'}
                  {account.provider === 'apple' && '⚫'}
                  {account.provider === 'phone' && '📱'}
                </span>
                <span className="mnbara-profile-info__verified-text">
                  {account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}
                  {account.email && ` (${account.email})`}
                  {account.phoneNumber && ` (${account.phoneNumber})`}
                </span>
                <span className="mnbara-profile-info__verified-badge">Verified</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInfo;
