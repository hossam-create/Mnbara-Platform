import React, { useState } from 'react';
import { MapPin, Calendar, Star, Package, Edit, Shield, CheckCircle } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

const TravelerProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Ahmed Hassan',
    email: 'ahmed@example.com',
    phone: '+971 50 123 4567',
    location: 'Dubai, UAE',
    bio: 'Frequent traveler between Dubai and London. Love helping people get their packages delivered safely.',
    rating: 4.8,
    totalTrips: 156,
    onTimeDelivery: 98,
    verified: true,
    memberSince: '2024-01-15',
  });

  const stats = [
    { label: 'Total Trips', value: profile.totalTrips, icon: Package },
    { label: 'Rating', value: `${profile.rating.toFixed(1)}`, icon: Star },
    { label: 'On-Time', value: `${profile.onTimeDelivery}%`, icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Traveler Profile</h1>
          <p className="mt-2 text-gray-600">Manage your traveler information and stats</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center mb-6">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-4xl mb-4">
                  {profile.name.charAt(0)}
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
                  {profile.verified && (
                    <Badge variant="success" size="sm">Verified</Badge>
                  )}
                </div>
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </div>
              </div>

              <div className="space-y-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <stat.icon className="w-5 h-5 text-yellow-600" />
                    <div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                      <div className="font-semibold text-gray-900">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {new Date(profile.memberSince).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">About Me</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Email</div>
                    <div className="text-gray-900">{profile.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Phone</div>
                    <div className="text-gray-900">{profile.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Location</div>
                    <div className="text-gray-900">{profile.location}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Bio</div>
                    <div className="text-gray-900">{profile.bio}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">Identity Verified</div>
                    <div className="text-sm text-green-700">Your identity has been verified</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">Background Check Passed</div>
                    <div className="text-sm text-green-700">Clean background record</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelerProfilePage;
