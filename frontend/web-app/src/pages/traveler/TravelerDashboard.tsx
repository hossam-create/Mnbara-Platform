/**
 * Traveler Dashboard
 * Main traveler journey interface (no financial execution)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { travelerService, TravelerDashboard, TripStatus, DeliveryStatus } from '../../services/travelerService';
import styles from './TravelerDashboard.module.css';

export default function TravelerDashboard() {
  const [dashboard, setDashboard] = useState<TravelerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await travelerService.getTravelerDashboard('traveler_001');
      setDashboard(data);
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.error}>
          <h3>Error</h3>
          <p>{error || 'Unable to load dashboard'}</p>
          <button onClick={loadDashboard} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.welcome}>
          <h1>Welcome back, {dashboard.traveler.name}!</h1>
          <p>Manage your trips and delivery requests</p>
        </div>
        <div className={styles.quickActions}>
          <Link to="/traveler/trips/new" className={styles.createTripButton}>
            Create New Trip
          </Link>
          <Link to="/traveler/profile" className={styles.profileButton}>
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        <motion.div
          className={styles.statCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.statIcon}>✈️</div>
          <div className={styles.statContent}>
            <h3>{dashboard.stats.totalTrips}</h3>
            <p>Total Trips</p>
          </div>
        </motion.div>

        <motion.div
          className={styles.statCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3>{dashboard.stats.completedTrips}</h3>
            <p>Completed</p>
          </div>
        </motion.div>

        <motion.div
          className={styles.statCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.statIcon}>⭐</div>
          <div className={styles.statContent}>
            <h3>{dashboard.stats.averageRating.toFixed(1)}</h3>
            <p>Average Rating</p>
          </div>
        </motion.div>

        <motion.div
          className={styles.statCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statContent}>
            <h3>{dashboard.stats.activeRequests}</h3>
            <p>Active Requests</p>
          </div>
        </motion.div>
      </div>

      {/* Earnings Section - READ-ONLY */}
      <div className={styles.earningsSection}>
        <div className={styles.earningsHeader}>
          <h2>Earnings Overview</h2>
          <div className={styles.readOnlyBadge}>READ-ONLY</div>
        </div>
        <div className={styles.earningsGrid}>
          <div className={styles.earningsCard}>
            <div className={styles.earningsIcon}>💰</div>
            <div className={styles.earningsContent}>
              <h3>{travelerService.formatCurrency(dashboard.stats.totalEarnings)}</h3>
              <p>Total Earnings</p>
              <span className={styles.readOnlyNote}>Display only - no actual payouts</span>
            </div>
          </div>
          <div className={styles.earningsCard}>
            <div className={styles.earningsIcon}>⏳</div>
            <div className={styles.earningsContent}>
              <h3>{travelerService.formatCurrency(dashboard.stats.pendingEarnings)}</h3>
              <p>Pending Earnings</p>
              <span className={styles.readOnlyNote}>Display only - no actual payouts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Trips */}
      <div className={styles.activeTripsSection}>
        <div className={styles.sectionHeader}>
          <h2>Active Trips</h2>
          <Link to="/traveler/trips" className={styles.viewAllButton}>
            View All
          </Link>
        </div>
        <div className={styles.tripsGrid}>
          {dashboard.activeTrips.length > 0 ? (
            dashboard.activeTrips.map((trip, index) => (
              <motion.div
                key={trip.id}
                className={styles.tripCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={styles.tripHeader}>
                  <div className={styles.route}>
                    <span className={styles.origin}>{trip.origin.city}</span>
                    <span className={styles.arrow}>→</span>
                    <span className={styles.destination}>{trip.destination.city}</span>
                  </div>
                  <div className={styles.status} style={{ backgroundColor: getTripStatusColor(trip.status) }}>
                    {getTripStatusLabel(trip.status)}
                  </div>
                </div>
                
                <div className={styles.tripDetails}>
                  <div className={styles.tripInfo}>
                    <p><strong>Departure:</strong> {trip.departureDate ? travelerService.formatDate(trip.departureDate) : 'Not set'}</p>
                    <p><strong>Arrival:</strong> {trip.arrivalDate ? travelerService.formatDate(trip.arrivalDate) : 'Not set'}</p>
                    <p><strong>Capacity:</strong> {trip.capacity.weight}kg / {trip.capacity.items} items</p>
                  </div>
                  
                  <div className={styles.tripProgress}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${travelerService.getTripProgress(trip)}%` }}
                      ></div>
                    </div>
                    <span className={styles.progressText}>{travelerService.getTripProgress(trip)}%</span>
                  </div>
                </div>
                
                <div className={styles.tripActions}>
                  <Link to={`/traveler/trips/${trip.id}`} className={styles.viewButton}>
                    View Details
                  </Link>
                  {trip.acceptedRequests.length > 0 && (
                    <span className={styles.requestsBadge}>
                      {trip.acceptedRequests.length} request{trip.acceptedRequests.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className={styles.noTrips}>
              <p>No active trips</p>
              <Link to="/traveler/trips/new" className={styles.createFirstTripButton}>
                Create Your First Trip
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.recentActivitySection}>
        <div className={styles.sectionHeader}>
          <h2>Recent Activity</h2>
        </div>
        <div className={styles.activityList}>
          {dashboard.recentActivity.map((activity, index) => (
            <motion.div
              key={index}
              className={styles.activityItem}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={styles.activityIcon}>
                {getActivityIcon(activity.type)}
              </div>
              <div className={styles.activityContent}>
                <p>{activity.description}</p>
                <span className={styles.activityTime}>
                  {travelerService.formatDate(activity.timestamp)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* UI Only Notice */}
      <div className={styles.uiOnlyNotice}>
        <div className={styles.noticeIcon}>👁️</div>
        <div className={styles.noticeContent}>
          <h4>UI Only - No Financial Execution</h4>
          <p>This is a demonstration interface. No actual payouts, wallet deductions, or financial transactions will be processed.</p>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getTripStatusColor(status: TripStatus): string {
  switch (status) {
    case 'PUBLISHED':
    case 'ACCEPTED':
    case 'IN_PROGRESS':
      return '#10b981';
    case 'DRAFT':
      return '#6b7280';
    case 'COMPLETED':
      return '#3b82f6';
    case 'CANCELLED':
    case 'EXPIRED':
      return '#ef4444';
    default:
      return '#f59e0b';
  }
}

function getTripStatusLabel(status: TripStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'PUBLISHED':
      return 'Published';
    case 'ACCEPTED':
      return 'Accepted';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'EXPIRED':
      return 'Expired';
    default:
      return 'Unknown';
  }
}

function getActivityIcon(type: string): string {
  switch (type) {
    case 'trip_created':
      return '✈️';
    case 'request_accepted':
      return '📦';
    case 'delivery_completed':
      return '✅';
    case 'rating_received':
      return '⭐';
    default:
      return '📋';
  }
}
