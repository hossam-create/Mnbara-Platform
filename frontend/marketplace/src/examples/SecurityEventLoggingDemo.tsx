/**
 * Security Event Logging Demo Component
 * SECURITY: Demonstrates comprehensive event logging with strict taxonomy
 */

import React, { useState, useCallback } from 'react';
import {
  useEventLogging,
  useAuthenticationEventLogging,
  usePaymentEventLogging,
  useSecurityEventLogging,
  useEventQuery,
  useEventStatistics
} from '../../hooks/useEventLogging';
import { EventCategory, EventType, EventSeverity, EventStatus } from '../../types/eventLogging.types';
import { EventTaxonomyValidator } from '../../utils/eventValidation.utils';
import styles from './SecurityEventLoggingDemo.module.css';

export const SecurityEventLoggingDemo: React.FC = () => {
  const { logEvent, isLogging, lastEvent, error } = useEventLogging();
  const { logLoginAttempt, logLoginSuccess, logLoginFailure, logLogout } = useAuthenticationEventLogging();
  const { logPaymentIntentCreated, logPaymentStatusCheck, logPaymentFailed } = usePaymentEventLogging();
  const { logSuspiciousActivity, logRateLimitExceeded, logInvalidAccessAttempt } = useSecurityEventLogging();
  const { events, loading: queryLoading, queryEvents, refreshEvents } = useEventQuery();
  const { statistics, loading: statsLoading, refreshStatistics } = useEventStatistics();

  const [demoEmail, setDemoEmail] = useState('demo@example.com');
  const [demoPaymentId, setDemoPaymentId] = useState('pi_demo_123');
  const [demoAmount, setDemoAmount] = useState('100.00');
  const [customEventType, setCustomEventType] = useState(EventType.API_REQUEST);
  const [customSeverity, setCustomSeverity] = useState(EventSeverity.LOW);
  const [customMetadata, setCustomMetadata] = useState('{"endpoint": "/api/demo"}');

  // Demo: Log authentication events
  const handleLoginAttempt = useCallback(async () => {
    await logLoginAttempt(demoEmail, '192.168.1.1');
  }, [logLoginAttempt, demoEmail]);

  const handleLoginSuccess = useCallback(async () => {
    await logLoginSuccess('user_123', demoEmail, '192.168.1.1');
  }, [logLoginSuccess, demoEmail]);

  const handleLoginFailure = useCallback(async () => {
    await logLoginFailure(demoEmail, 'Invalid password', '192.168.1.1');
  }, [logLoginFailure, demoEmail]);

  const handleLogout = useCallback(async () => {
    await logLogout('user_123');
  }, [logLogout]);

  // Demo: Log payment events
  const handlePaymentIntentCreated = useCallback(async () => {
    await logPaymentIntentCreated('user_123', demoPaymentId, parseFloat(demoAmount), 'USD');
  }, [logPaymentIntentCreated, demoPaymentId, demoAmount]);

  const handlePaymentStatusCheck = useCallback(async () => {
    await logPaymentStatusCheck('user_123', demoPaymentId, 'succeeded');
  }, [logPaymentStatusCheck, demoPaymentId]);

  const handlePaymentFailed = useCallback(async () => {
    await logPaymentFailed('user_123', demoPaymentId, 'Card declined');
  }, [logPaymentFailed, demoPaymentId]);

  // Demo: Log security events
  const handleSuspiciousActivity = useCallback(async () => {
    await logSuspiciousActivity('user_123', 'Multiple failed login attempts detected', 'MEDIUM');
  }, [logSuspiciousActivity]);

  const handleRateLimitExceeded = useCallback(async () => {
    await logRateLimitExceeded('user_123', '/api/login', 5);
  }, [logRateLimitExceeded]);

  const handleInvalidAccessAttempt = useCallback(async () => {
    await logInvalidAccessAttempt('user_123', '/admin/dashboard', 'Insufficient permissions');
  }, [logInvalidAccessAttempt]);

  // Demo: Log custom event
  const handleCustomEvent = useCallback(async () => {
    try {
      const metadata = JSON.parse(customMetadata);
      await logEvent({
        event_category: EventCategory.API,
        event_type: customEventType,
        actor_type: 'USER' as any,
        actor_id: 'user_123',
        target_type: 'API' as any,
        severity: customSeverity,
        status: EventStatus.SUCCESS,
        security_level: customSeverity === EventSeverity.CRITICAL ? 'CRITICAL' : 'LOW',
        metadata,
        frontend_timestamp: Date.now(),
        frontend_session_id: 'demo_session_123'
      });
    } catch (err) {
      alert('Invalid JSON metadata');
    }
  }, [logEvent, customEventType, customSeverity, customMetadata]);

  // Demo: Query events
  const handleQueryEvents = useCallback(async () => {
    await queryEvents({
      event_category: EventCategory.AUTHENTICATION,
      limit: 10
    });
  }, [queryEvents]);

  const handleQuerySecurityEvents = useCallback(async () => {
    await queryEvents({
      event_category: EventCategory.SECURITY,
      severity: EventSeverity.HIGH,
      limit: 5
    });
  }, [queryEvents]);

  // Demo: Refresh statistics
  const handleRefreshStats = useCallback(async () => {
    await refreshStatistics();
  }, [refreshStatistics]);

  // Validate custom event
  const validateCustomEvent = useCallback(() => {
    try {
      const metadata = JSON.parse(customMetadata);
      const testEvent = {
        event_category: EventCategory.API,
        event_type: customEventType,
        actor_type: 'USER' as any,
        actor_id: 'user_123',
        target_type: 'API' as any,
        severity: customSeverity,
        status: EventStatus.SUCCESS,
        security_level: 'LOW' as any,
        metadata,
        frontend_timestamp: Date.now(),
        frontend_session_id: 'demo_session_123'
      };
      
      const validation = EventTaxonomyValidator.validateEvent(testEvent);
      return validation;
    } catch (err) {
      return { valid: false, errors: ['Invalid JSON metadata'], warnings: [] };
    }
  }, [customEventType, customSeverity, customMetadata]);

  const validationResult = validateCustomEvent();

  return (
    <div className={styles.securityEventLoggingDemo}>
      <div className={styles.header}>
        <h2>🛡️ Security Event Logging System</h2>
        <p className={styles.description}>
          Demonstrates comprehensive event logging with strict taxonomy validation. 
          All events are validated and logged via backend API.
        </p>
      </div>

      {/* Status Panel */}
      <div className={styles.statusPanel}>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Logging Status:</span>
          <span className={`${styles.statusValue} ${isLogging ? styles.logging : styles.ready}`}>
            {isLogging ? '📊 Logging...' : '✅ Ready'}
          </span>
        </div>
        {error && (
          <div className={styles.error}>
            ❌ Error: {error}
          </div>
        )}
        {lastEvent && (
          <div className={styles.lastEvent}>
            📝 Last Event: {lastEvent.event_type} ({lastEvent.severity})
          </div>
        )}
      </div>

      {/* Authentication Events */}
      <div className={styles.section}>
        <h3>🔐 Authentication Events</h3>
        <div className={styles.inputGroup}>
          <input
            type="email"
            value={demoEmail}
            onChange={(e) => setDemoEmail(e.target.value)}
            placeholder="Demo email"
            className={styles.input}
          />
        </div>
        <div className={styles.buttonGroup}>
          <button onClick={handleLoginAttempt} disabled={isLogging} className={styles.button}>
            Log Login Attempt
          </button>
          <button onClick={handleLoginSuccess} disabled={isLogging} className={styles.button}>
            Log Login Success
          </button>
          <button onClick={handleLoginFailure} disabled={isLogging} className={styles.button}>
            Log Login Failure
          </button>
          <button onClick={handleLogout} disabled={isLogging} className={styles.button}>
            Log Logout
          </button>
        </div>
      </div>

      {/* Payment Events */}
      <div className={styles.section}>
        <h3>💳 Payment Events</h3>
        <div className={styles.inputGroup}>
          <input
            type="text"
            value={demoPaymentId}
            onChange={(e) => setDemoPaymentId(e.target.value)}
            placeholder="Payment Intent ID"
            className={styles.input}
          />
          <input
            type="number"
            value={demoAmount}
            onChange={(e) => setDemoAmount(e.target.value)}
            placeholder="Amount"
            className={styles.input}
            step="0.01"
          />
        </div>
        <div className={styles.buttonGroup}>
          <button onClick={handlePaymentIntentCreated} disabled={isLogging} className={styles.button}>
            Log Payment Created
          </button>
          <button onClick={handlePaymentStatusCheck} disabled={isLogging} className={styles.button}>
            Log Status Check
          </button>
          <button onClick={handlePaymentFailed} disabled={isLogging} className={styles.button}>
            Log Payment Failed
          </button>
        </div>
      </div>

      {/* Security Events */}
      <div className={styles.section}>
        <h3>🚨 Security Events</h3>
        <div className={styles.buttonGroup}>
          <button onClick={handleSuspiciousActivity} disabled={isLogging} className={styles.button}>
            Log Suspicious Activity
          </button>
          <button onClick={handleRateLimitExceeded} disabled={isLogging} className={styles.button}>
            Log Rate Limit Exceeded
          </button>
          <button onClick={handleInvalidAccessAttempt} disabled={isLogging} className={styles.button}>
            Log Invalid Access
          </button>
        </div>
      </div>

      {/* Custom Event */}
      <div className={styles.section}>
        <h3>⚙️ Custom Event</h3>
        <div className={styles.inputGroup}>
          <select
            value={customEventType}
            onChange={(e) => setCustomEventType(e.target.value as EventType)}
            className={styles.select}
          >
            {Object.values(EventType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={customSeverity}
            onChange={(e) => setCustomSeverity(e.target.value as EventSeverity)}
            className={styles.select}
          >
            {Object.values(EventSeverity).map(severity => (
              <option key={severity} value={severity}>{severity}</option>
            ))}
          </select>
        </div>
        <div className={styles.inputGroup}>
          <textarea
            value={customMetadata}
            onChange={(e) => setCustomMetadata(e.target.value)}
            placeholder="Metadata (JSON format)"
            className={styles.textarea}
            rows={3}
          />
        </div>
        <div className={styles.validationResult}>
          <strong>Validation:</strong> 
          {validationResult.valid ? (
            <span className={styles.valid}>✅ Valid</span>
          ) : (
            <span className={styles.invalid}>❌ Invalid</span>
          )}
          {validationResult.warnings.length > 0 && (
            <div className={styles.warnings}>
              ⚠️ Warnings: {validationResult.warnings.join(', ')}
            </div>
          )}
          {validationResult.errors.length > 0 && (
            <div className={styles.errors}>
              ❌ Errors: {validationResult.errors.join(', ')}
            </div>
          )}
        </div>
        <div className={styles.buttonGroup}>
          <button onClick={handleCustomEvent} disabled={isLogging} className={styles.button}>
            Log Custom Event
          </button>
        </div>
      </div>

      {/* Event Queries */}
      <div className={styles.section}>
        <h3>🔍 Event Queries</h3>
        <div className={styles.buttonGroup}>
          <button onClick={handleQueryEvents} disabled={queryLoading} className={styles.button}>
            Query Auth Events
          </button>
          <button onClick={handleQuerySecurityEvents} disabled={queryLoading} className={styles.button}>
            Query Security Events
          </button>
          <button onClick={refreshEvents} disabled={queryLoading} className={styles.button}>
            Refresh Events
          </button>
        </div>
        
        {queryLoading && <div className={styles.loading}>Loading events...</div>}
        
        {events.length > 0 && (
          <div className={styles.eventsList}>
            <h4>Recent Events ({events.length}):</h4>
            {events.map((event, index) => (
              <div key={index} className={styles.eventItem}>
                <span className={styles.eventType}>{event.event_type}</span>
                <span className={styles.eventSeverity}>{event.severity}</span>
                <span className={styles.eventStatus}>{event.status}</span>
                <span className={styles.eventTimestamp}>
                  {new Date(event.frontend_timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className={styles.section}>
        <h3>📊 Event Statistics</h3>
        <div className={styles.buttonGroup}>
          <button onClick={handleRefreshStats} disabled={statsLoading} className={styles.button}>
            Refresh Statistics
          </button>
        </div>
        
        {statsLoading && <div className={styles.loading}>Loading statistics...</div>}
        
        {statistics && (
          <div className={styles.statistics}>
            <div className={styles.statItem}>
              <strong>Total Events:</strong> {statistics.total_events}
            </div>
            <div className={styles.statItem}>
              <strong>Security Alerts:</strong> {statistics.security_alerts}
            </div>
            <div className={styles.statCategories}>
              <strong>By Category:</strong>
              {Object.entries(statistics.events_by_category).map(([category, count]) => (
                <div key={category} className={styles.statCategory}>
                  {category}: {count}
                </div>
              ))}
            </div>
            <div className={styles.statSeverities}>
              <strong>By Severity:</strong>
              {Object.entries(statistics.events_by_severity).map(([severity, count]) => (
                <div key={severity} className={styles.statSeverity}>
                  {severity}: {count}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className={styles.securityNotice}>
        <h4>🔒 Security Notice</h4>
        <p>
          <strong>Frontend logging is informational only.</strong> All events are validated and 
          enforced by the backend API. The frontend provides visibility and user experience, 
          but security decisions are made exclusively in the backend.
        </p>
      </div>
    </div>
  );
};