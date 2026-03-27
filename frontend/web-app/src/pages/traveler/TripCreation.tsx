/**
 * Trip Creation Page
 * Traveler trip creation interface (no financial execution)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { travelerService, CreateTripData } from '../../services/travelerService';
import styles from './TripCreation.module.css';

export default function TripCreation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateTripData>({
    origin: {
      country: '',
      city: '',
      address: ''
    },
    destination: {
      country: '',
      city: '',
      address: ''
    },
    capacity: {
      weight: undefined,
      volume: undefined,
      items: undefined
    },
    departureDate: '',
    arrivalDate: '',
    frequency: 'one-time',
    notes: ''
  });

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof CreateTripData],
        [field]: value
      }
    }));
  };

  const handleCapacityChange = (field: string, value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setFormData(prev => ({
      ...prev,
      capacity: {
        ...prev.capacity,
        [field]: numValue
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.origin.country || !formData.destination.country) {
      setError('Origin and destination countries are required');
      return;
    }

    if (!formData.departureDate || !formData.arrivalDate) {
      setError('Departure and arrival dates are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Create trip (UI only)
      const trip = await travelerService.createTrip('traveler_001', formData);
      
      if (trip) {
        navigate(`/traveler/trips/${trip.id}`);
      } else {
        setError('Failed to create trip');
      }
    } catch (err) {
      setError('Failed to create trip');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.tripCreation}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Create New Trip</h1>
          <p>Plan your journey and accept delivery requests</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Route Information */}
          <motion.div
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2>Route Information</h2>
            <div className={styles.routeGrid}>
              <div className={styles.routeColumn}>
                <h3>Origin</h3>
                <div className={styles.field}>
                  <label>Country *</label>
                  <input
                    type="text"
                    value={formData.origin.country}
                    onChange={(e) => handleInputChange('origin', 'country', e.target.value)}
                    placeholder="e.g., Egypt"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.origin.city}
                    onChange={(e) => handleInputChange('origin', 'city', e.target.value)}
                    placeholder="e.g., Cairo"
                  />
                </div>
                <div className={styles.field}>
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.origin.address}
                    onChange={(e) => handleInputChange('origin', 'address', e.target.value)}
                    placeholder="e.g., Cairo International Airport"
                  />
                </div>
              </div>

              <div className={styles.routeColumn}>
                <h3>Destination</h3>
                <div className={styles.field}>
                  <label>Country *</label>
                  <input
                    type="text"
                    value={formData.destination.country}
                    onChange={(e) => handleInputChange('destination', 'country', e.target.value)}
                    placeholder="e.g., UAE"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.destination.city}
                    onChange={(e) => handleInputChange('destination', 'city', e.target.value)}
                    placeholder="e.g., Dubai"
                  />
                </div>
                <div className={styles.field}>
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.destination.address}
                    onChange={(e) => handleInputChange('destination', 'address', e.target.value)}
                    placeholder="e.g., Dubai International Airport"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Schedule */}
          <motion.div
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2>Schedule</h2>
            <div className={styles.scheduleGrid}>
              <div className={styles.field}>
                <label>Departure Date *</label>
                <input
                  type="datetime-local"
                  value={formData.departureDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Arrival Date *</label>
                <input
                  type="datetime-local"
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, arrivalDate: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                >
                  <option value="one-time">One-time</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Capacity */}
          <motion.div
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2>Capacity</h2>
            <div className={styles.capacityGrid}>
              <div className={styles.field}>
                <label>Weight Capacity (kg)</label>
                <input
                  type="number"
                  value={formData.capacity.weight || ''}
                  onChange={(e) => handleCapacityChange('weight', e.target.value)}
                  placeholder="e.g., 25"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className={styles.field}>
                <label>Volume Capacity (cm³)</label>
                <input
                  type="number"
                  value={formData.capacity.volume || ''}
                  onChange={(e) => handleCapacityChange('volume', e.target.value)}
                  placeholder="e.g., 50000"
                  min="0"
                  step="1000"
                />
              </div>
              <div className={styles.field}>
                <label>Max Items</label>
                <input
                  type="number"
                  value={formData.capacity.items || ''}
                  onChange={(e) => handleCapacityChange('items', e.target.value)}
                  placeholder="e.g., 10"
                  min="1"
                  step="1"
                />
              </div>
            </div>
          </motion.div>

          {/* Additional Information */}
          <motion.div
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2>Additional Information</h2>
            <div className={styles.field}>
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special instructions or notes about your trip..."
                rows={4}
              />
            </div>
          </motion.div>

          {/* Error Display */}
          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          {/* Actions */}
          <motion.div
            className={styles.actions}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              type="button"
              onClick={() => navigate('/traveler/dashboard')}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Trip'}
            </button>
          </motion.div>
        </form>

        {/* UI Only Notice */}
        <div className={styles.uiOnlyNotice}>
          <div className={styles.noticeIcon}>👁️</div>
          <div className={styles.noticeContent}>
            <h4>UI Only - No Financial Execution</h4>
            <p>This is a demonstration interface. No actual trips will be created or processed.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
