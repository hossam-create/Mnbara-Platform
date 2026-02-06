/**
 * ProfileHeader Component
 * Displays profile cover image, avatar, and basic info with action buttons
 */

import React from 'react';
import type { UserProfile } from '../../types/profile';
import './ProfileHeader.css';

interface ProfileHeaderProps {
  profile: UserProfile;
  onEditProfile: () => void;
  onUploadAvatar: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onEditProfile,
  onUploadAvatar,
}) => {
  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      active: 'status-badge--active',
      inactive: 'status-badge--inactive',
      suspended: 'status-badge--suspended',
      banned: 'status-badge--banned',
    };
    return statusMap[status] || '';
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, string> = {
      buyer: 'role-badge--buyer',
      seller: 'role-badge--seller',
      both: 'role-badge--both',
      admin: 'role-badge--admin',
      moderator: 'role-badge--moderator',
    };
    return roleMap[role] || '';
  };

  return (
    <div className="mnbara-profile-header">
      <div 
        className="mnbara-profile-header__cover"
        style={{ backgroundImage: `url(${profile.coverImageUrl})` }}
      >
        <div className="mnbara-profile-header__cover-overlay" />
      </div>
      
      <div className="mnbara-profile-header__info">
        <div className="mnbara-profile-header__avatar-container">
          <img 
            src={profile.avatarUrl} 
            alt={profile.displayName}
            className="mnbara-profile-header__avatar"
          />
          <button 
            className="mnbara-profile-header__avatar-edit"
            onClick={onUploadAvatar}
            title="Change profile picture"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>
        
        <div className="mnbara-profile-header__details">
          <div className="mnbara-profile-header__name-row">
            <h1 className="mnbara-profile-header__name">{profile.displayName}</h1>
            <div className="mnbara-profile-header__badges">
              <span className={`mnbara-profile-header__status-badge ${getStatusBadge(profile.status)}`}>
                {profile.status}
              </span>
              <span className={`mnbara-profile-header__role-badge ${getRoleBadge(profile.role)}`}>
                {profile.role}
              </span>
            </div>
          </div>
          
          <p className="mnbara-profile-header__username">@{profile.username}</p>
          
          <div className="mnbara-profile-header__meta">
            <span className="mnbara-profile-header__meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Member since {formatMemberSince(profile.memberSince)}
            </span>
            
            {profile.verifiedAccounts && profile.verifiedAccounts.length > 0 && (
              <span className="mnbara-profile-header__meta-item mnbara-profile-header__meta-item--verified">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Verified
              </span>
            )}
            
            <span className="mnbara-profile-header__meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {profile.country}
            </span>
          </div>
        </div>
        
        <div className="mnbara-profile-header__actions">
          <button 
            className="mnbara-profile-header__edit-btn"
            onClick={onEditProfile}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
