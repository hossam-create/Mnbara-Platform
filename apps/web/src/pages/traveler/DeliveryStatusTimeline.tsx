/**
 * Delivery Status Timeline
 * Traveler delivery status visualization (no financial execution)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { travelerService, DeliveryRequest, DeliveryStatus } from '../../services/travelerService';
import styles from './DeliveryStatusTimeline.module.css';

interface DeliveryStatusTimelineProps {
  tripId: string;
}

export default function DeliveryStatusTimeline({ tripId }: DeliveryStatusTimelineProps) {
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDeliveryRequests();
  }, [tripId]);

  const loadDeliveryRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await travelerService.getDeliveryRequests(tripId);
      setRequests(data);
    } catch (err) {
      setError('Failed to load delivery requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: DeliveryStatus) => {
    try {
      await travelerService.updateDeliveryStatus(requestId, status);
      // Reload requests to get updated timeline
      await loadDeliveryRequests();
    } catch (err) {
      setError('Failed to update status');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className={styles.timeline}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading delivery requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.timeline}>
        <div className={styles.error}>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={loadDeliveryRequests} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      <div className={styles.header}>
        <h2>Delivery Status Timeline</h2>
        <div className={styles.readOnlyBadge}>UI ONLY</div>
      </div>

      {requests.length === 0 ? (
        <div className={styles.noRequests}>
          <div className={styles.noRequestsIcon}>📦</div>
          <h3>No Delivery Requests</h3>
          <p>No delivery requests have been accepted for this trip yet.</p>
        </div>
      ) : (
        <div className={styles.requestsList}>
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              className={styles.requestCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Request Header */}
              <div className={styles.requestHeader}>
                <div className={styles.requestInfo}>
                  <h3>Request #{request.id.slice(-6)}</h3>
                  <p>{request.itemDescription}</p>
                  {request.weight && (
                    <span className={styles.weight}>
                      {request.weight}kg
                      {request.volume && ` • ${request.volume}cm³`}
                    </span>
                  )}
                </div>
                <div className={styles.requestStatus}>
                  <div 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getDeliveryStatusColor(request.status) }}
                  >
                    {getDeliveryStatusLabel(request.status)}
                  </div>
                  <span className={styles.urgency}>
                    {request.urgency.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className={styles.timelineContainer}>
                <div className={styles.timelineLine}></div>
                <div className={styles.timelineEvents}>
                  {request.timeline.map((event, eventIndex) => (
                    <div key={event.id} className={styles.timelineEvent}>
                      <div 
                        className={styles.timelineDot}
                        style={{ backgroundColor: getDeliveryStatusColor(event.status) }}
                      ></div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineHeader}>
                          <span className={styles.timelineStatus}>
                            {getDeliveryStatusLabel(event.status)}
                          </span>
                          <span className={styles.timelineTime}>
                            {travelerService.formatDate(event.timestamp)}
                          </span>
                        </div>
                        <p className={styles.timelineDescription}>{event.description}</p>
                        {event.location && (
                          <div className={styles.timelineLocation}>
                            📍 {event.location.city}, {event.location.country}
                          </div>
                        )}
                        {event.notes && (
                          <div className={styles.timelineNotes}>
                            <strong>Notes:</strong> {event.notes}
                          </div>
                        )}
                        <div className={styles.timelineActor}>
                          By: {event.actor === 'traveler' ? 'Traveler' : event.actor === 'requester' ? 'Requester' : 'System'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Actions */}
              <div className={styles.statusActions}>
                <div className={styles.currentStatus}>
                  <strong>Current Status:</strong> {getDeliveryStatusLabel(request.status)}
                </div>
                <div className={styles.actionButtons}>
                  {request.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'ACCEPTED')}
                      className={styles.acceptButton}
                    >
                      Accept Request
                    </button>
                  )}
                  {request.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'PICKED_UP')}
                      className={styles.pickupButton}
                    >
                      Mark as Picked Up
                    </button>
                  )}
                  {request.status === 'PICKED_UP' && (
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'IN_TRANSIT')}
                      className={styles.transitButton}
                    >
                      Mark as In Transit
                    </button>
                  )}
                  {request.status === 'IN_TRANSIT' && (
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'DELIVERED')}
                      className={styles.deliverButton}
                    >
                      Mark as Delivered
                    </button>
                  )}
                  {(request.status === 'PENDING' || request.status === 'ACCEPTED') && (
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'CANCELLED')}
                      className={styles.cancelButton}
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>

              {/* Compensation Display - READ-ONLY */}
              {request.compensation && (
                <div className={styles.compensation}>
                  <div className={styles.compensationHeader}>
                    <h4>Compensation</h4>
                    <div className={styles.readOnlyBadge}>READ-ONLY</div>
                  </div>
                  <div className={styles.compensationAmount}>
                    {travelerService.formatCurrency(request.compensation.amount, request.compensation.currency)}
                  </div>
                  <div className={styles.compensationNote}>
                    Display only - no actual compensation will be paid
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* UI Only Notice */}
      <div className={styles.uiOnlyNotice}>
        <div className={styles.noticeIcon}>👁️</div>
        <div className={styles.noticeContent}>
          <h4>UI Only - No Financial Execution</h4>
          <p>This is a demonstration interface. No actual delivery processing or compensation will occur.</p>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getDeliveryStatusColor(status: DeliveryStatus): string {
  switch (status) {
    case 'DELIVERED':
      return '#10b981';
    case 'ACCEPTED':
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      return '#3b82f6';
    case 'PENDING':
      return '#f59e0b';
    case 'FAILED':
    case 'CANCELLED':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

function getDeliveryStatusLabel(status: DeliveryStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'ACCEPTED':
      return 'Accepted';
    case 'PICKED_UP':
      return 'Picked Up';
    case 'IN_TRANSIT':
      return 'In Transit';
    case 'DELIVERED':
      return 'Delivered';
    case 'FAILED':
      return 'Failed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}
