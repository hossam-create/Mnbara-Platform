/**
 * Profile Page - Main user profile view
 * Displays profile information, stats, and trust score
 */

import React, { useState } from 'react';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileInfo } from '../../components/profile/ProfileInfo';
import { ProfileStats } from '../../components/profile/ProfileStats';
import { TrustScoreCard } from '../../components/profile/TrustScoreCard';
import { KYCCard } from '../../components/profile/KYCCard';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { UploadAvatarModal } from '../../components/profile/UploadAvatarModal';
import type { UserProfile, TrustScore } from '../../types/profile';
import './ProfilePage.css';

const mockProfile: UserProfile = {
  id: 'user-1',
  email: 'john.doe@example.com',
  username: 'johndoe',
  displayName: 'John Doe',
  bio: 'Passionate collector and verified seller of vintage items. Specializing in rare coins, stamps, and antique furniture. Fast shipping worldwide!',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
  coverImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
  phoneNumber: '+1234567890',
  dateOfBirth: '1990-05-15',
  country: 'United States',
  language: 'en',
  timezone: 'America/New_York',
  memberSince: '2022-03-15T00:00:00Z',
  lastActiveAt: new Date().toISOString(),
  role: 'both',
  status: 'active',
  kycStatus: 'verified',
  trustScore: {
    overall: 92,
    grade: 'A',
    maxScore: 100,
    breakdown: {
      transactionCompletion: { score: 95, weight: 0.25, value: 95, maxValue: 100 },
      communication: { score: 90, weight: 0.15, value: 90, maxValue: 100 },
      deliveryPerformance: { score: 88, weight: 0.20, value: 88, maxValue: 100 },
      disputeResolution: { score: 100, weight: 0.15, value: 100, maxValue: 100 },
      reviewsRating: { score: 94, weight: 0.15, value: 94, maxValue: 100 },
      accountAge: { score: 85, weight: 0.10, value: 85, maxValue: 100 },
    },
    history: [
      { date: '2024-12-01', score: 90, grade: 'A', change: 2, reason: 'Positive review received' },
      { date: '2024-11-01', score: 88, grade: 'B+', change: 1, reason: 'On-time delivery' },
      { date: '2024-10-01', score: 87, grade: 'B+', change: -1, reason: 'Late response to inquiry' },
      { date: '2024-09-01', score: 88, grade: 'B+', change: 3, reason: 'Successful transaction completion' },
    ],
    lastCalculatedAt: new Date().toISOString(),
    nextCalculationAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  stats: {
    totalPurchases: 47,
    totalSales: 156,
    totalListings: 23,
    totalReviews: 203,
    averageRating: 4.7,
    responseRate: 98,
    deliveryRate: 95,
    disputeRate: 2,
    memberDurationMonths: 34,
    totalDisputes: 3,
    resolvedDisputes: 3,
  },
  socialLinks: {
    website: 'https://johndoe-vintage.com',
    twitter: 'johndoe_vintage',
    instagram: 'johndoe_vintage',
  },
  verifiedAccounts: [
    { provider: 'google', verifiedAt: '2022-03-15T00:00:00Z', email: 'john.doe@gmail.com' },
    { provider: 'phone', verifiedAt: '2022-03-16T00:00:00Z', phoneNumber: '+1234567890' },
  ],
};

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'reviews' | 'activity'>('overview');

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    setIsEditModalOpen(false);
  };

  const handleAvatarUpdate = (avatarUrl: string) => {
    setProfile({ ...profile, avatarUrl });
    setIsAvatarModalOpen(false);
  };

  return (
    <div className="mnbara-profile-page">
      <div className="mnbara-profile-page__container">
        <ProfileHeader
          profile={profile}
          onEditProfile={() => setIsEditModalOpen(true)}
          onUploadAvatar={() => setIsAvatarModalOpen(true)}
        />

        <div className="mnbara-profile-page__content">
          <div className="mnbara-profile-page__main">
            <ProfileInfo profile={profile} />
            
            <div className="mnbara-profile-page__tabs">
              <button
                className={`mnbara-profile-page__tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`mnbara-profile-page__tab ${activeTab === 'listings' ? 'active' : ''}`}
                onClick={() => setActiveTab('listings')}
              >
                Listings ({profile.stats.totalListings})
              </button>
              <button
                className={`mnbara-profile-page__tab ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({profile.stats.totalReviews})
              </button>
              <button
                className={`mnbara-profile-page__tab ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                Activity
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="mnbara-profile-page__overview">
                <div className="mnbara-profile-page__section">
                  <h3 className="mnbara-profile-page__section-title">About</h3>
                  <p className="mnbara-profile-page__bio">{profile.bio}</p>
                </div>
                
                {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
                  <div className="mnbara-profile-page__section">
                    <h3 className="mnbara-profile-page__section-title">Social Links</h3>
                    <div className="mnbara-profile-page__social-links">
                      {profile.socialLinks.website && (
                        <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="mnbara-profile-page__social-link">
                          🌐 Website
                        </a>
                      )}
                      {profile.socialLinks.twitter && (
                        <a href={`https://twitter.com/${profile.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="mnbara-profile-page__social-link">
                          🐦 Twitter
                        </a>
                      )}
                      {profile.socialLinks.instagram && (
                        <a href={`https://instagram.com/${profile.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="mnbara-profile-page__social-link">
                          📷 Instagram
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mnbara-profile-page__sidebar">
            <TrustScoreCard trustScore={profile.trustScore} />
            <KYCCard kycStatus={profile.kycStatus} />
            <ProfileStats stats={profile.stats} />
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleProfileUpdate}
        />
      )}

      {isAvatarModalOpen && (
        <UploadAvatarModal
          currentAvatarUrl={profile.avatarUrl}
          onClose={() => setIsAvatarModalOpen(false)}
          onUpload={handleAvatarUpdate}
        />
      )}
    </div>
  );
};

export default ProfilePage;
