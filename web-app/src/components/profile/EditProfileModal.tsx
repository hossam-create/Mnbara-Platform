/**
 * EditProfileModal Component
 * Modal for editing user profile information
 */

import React, { useState } from 'react';
import type { UserProfile } from '../../types/profile';
import './EditProfileModal.css';

interface EditProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profile,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    displayName: profile.displayName,
    bio: profile.bio || '',
    phoneNumber: profile.phoneNumber || '',
    country: profile.country,
    language: profile.language,
    timezone: profile.timezone,
    website: profile.socialLinks?.website || '',
    twitter: profile.socialLinks?.twitter || '',
    instagram: profile.socialLinks?.instagram || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    
    if (formData.displayName.length > 50) {
      newErrors.displayName = 'Display name must be 50 characters or less';
    }
    
    if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedProfile: UserProfile = {
      ...profile,
      displayName: formData.displayName,
      bio: formData.bio,
      phoneNumber: formData.phoneNumber,
      country: formData.country,
      language: formData.language,
      timezone: formData.timezone,
      socialLinks: {
        website: formData.website,
        twitter: formData.twitter,
        instagram: formData.instagram,
      },
    };

    onSave(updatedProfile);
    setIsSaving(false);
  };

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'Spain', 'Italy', 'Japan', 'China', 'India', 'Brazil',
    'Mexico', 'Egypt', 'Saudi Arabia', 'UAE', 'Other'
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'Arabic' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'es', name: 'Spanish' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
  ];

  const timezones = [
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Dubai',
    'Africa/Cairo',
    'Australia/Sydney',
  ];

  return (
    <div className="mnbara-edit-profile-modal-overlay" onClick={onClose}>
      <div className="mnbara-edit-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="mnbara-edit-profile-modal__header">
          <h2 className="mnbara-edit-profile-modal__title">Edit Profile</h2>
          <button className="mnbara-edit-profile-modal__close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mnbara-edit-profile-modal__form">
          <div className="mnbara-edit-profile-modal__section">
            <h3 className="mnbara-edit-profile-modal__section-title">Basic Information</h3>
            
            <div className="mnbara-edit-profile-modal__field">
              <label htmlFor="displayName">Display Name *</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className={errors.displayName ? 'error' : ''}
                placeholder="Your display name"
              />
              {errors.displayName && (
                <span className="mnbara-edit-profile-modal__error">{errors.displayName}</span>
              )}
            </div>

            <div className="mnbara-edit-profile-modal__field">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                placeholder="Tell others about yourself..."
              />
              <span className="mnbara-edit-profile-modal__char-count">
                {formData.bio.length}/500
              </span>
            </div>

            <div className="mnbara-edit-profile-modal__field">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="mnbara-edit-profile-modal__section">
            <h3 className="mnbara-edit-profile-modal__section-title">Location & Preferences</h3>
            
            <div className="mnbara-edit-profile-modal__row">
              <div className="mnbara-edit-profile-modal__field">
                <label htmlFor="country">Country</label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                >
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div className="mnbara-edit-profile-modal__field">
                <label htmlFor="language">Language</label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mnbara-edit-profile-modal__field">
              <label htmlFor="timezone">Timezone</label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mnbara-edit-profile-modal__section">
            <h3 className="mnbara-edit-profile-modal__section-title">Social Links</h3>
            
            <div className="mnbara-edit-profile-modal__field">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="mnbara-edit-profile-modal__row">
              <div className="mnbara-edit-profile-modal__field">
                <label htmlFor="twitter">Twitter</label>
                <input
                  type="text"
                  id="twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="username"
                />
              </div>

              <div className="mnbara-edit-profile-modal__field">
                <label htmlFor="instagram">Instagram</label>
                <input
                  type="text"
                  id="instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="username"
                />
              </div>
            </div>
          </div>

          <div className="mnbara-edit-profile-modal__actions">
            <button 
              type="button" 
              className="mnbara-edit-profile-modal__btn mnbara-edit-profile-modal__btn--secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="mnbara-edit-profile-modal__btn mnbara-edit-profile-modal__btn--primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
