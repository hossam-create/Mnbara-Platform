/**
 * Moderation Dashboard
 * Admin control center for trust, safety & moderation (READ-ONLY)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { trustSafetyService, UserReport, ModerationCase, SafetyMetrics, ReportStatus, ReportType } from '../../services/trustSafetyService';
import styles from './ModerationDashboard.module.css';

export default function ModerationDashboard() {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [metrics, setMetrics] = useState<SafetyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'cases' | 'metrics'>('reports');
  const [filters, setFilters] = useState({
    status: '' as ReportStatus | '',
    type: '' as ReportType | '',
    priority: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [reportsData, casesData, metricsData] = await Promise.all([
        trustSafetyService.getUserReports(filters),
        trustSafetyService.getModerationCases(filters),
        trustSafetyService.getSafetyMetrics()
      ]);
      
      setReports(reportsData.reports);
      setCases(casesData.cases);
      setMetrics(metricsData);
    } catch (err) {
      setError('Failed to load moderation data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleStatusUpdate = async (reportId: string, status: ReportStatus) => {
    try {
      await trustSafetyService.updateReportStatus(reportId, status, 'current_moderator');
      await loadDashboardData();
    } catch (err) {
      setError('Failed to update report status');
      console.error(err);
    }
  };

  const getReportTypeColor = (type: ReportType): string => {
    switch (type) {
      case ReportType.INAPPROPRIATE_CONTENT:
        return '#f59e0b'; // Yellow
      case ReportType.FRAUDULENT_LISTING:
      case ReportType.SCAM:
      case ReportType.COUNTERFEIT_GOODS:
        return '#ef4444'; // Red
      case ReportType.HARASSMENT:
      case ReportType.IMPERSONATION:
        return '#dc2626'; // Dark Red
      case ReportType.VIOLATION_OF_TERMS:
        return '#f97316'; // Orange
      case ReportType.SPAM:
        return '#6b7280'; // Gray
      case ReportType.DANGEROUS_GOODS:
        return '#991b1b'; // Dark Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getReportTypeLabel = (type: ReportType): string => {
    switch (type) {
      case ReportType.INAPPROPRIATE_CONTENT:
        return 'Inappropriate Content';
      case ReportType.FRAUDULENT_LISTING:
        return 'Fraudulent Listing';
      case ReportType.HARASSMENT:
        return 'Harassment';
      case ReportType.SCAM:
        return 'Scam';
      case ReportType.VIOLATION_OF_TERMS:
        return 'Terms Violation';
      case ReportType.SPAM:
        return 'Spam';
      case ReportType.IMPERSONATION:
        return 'Impersonation';
      case ReportType.DANGEROUS_GOODS:
        return 'Dangerous Goods';
      case ReportType.COUNTERFEIT_GOODS:
        return 'Counterfeit Goods';
      default:
        return 'Unknown';
    }
  };

  const getReportStatusColor = (status: ReportStatus): string => {
    switch (status) {
      case ReportStatus.PENDING:
        return '#f59e0b'; // Yellow
      case ReportStatus.UNDER_REVIEW:
        return '#3b82f6'; // Blue
      case ReportStatus.RESOLVED:
        return '#10b981'; // Green
      case ReportStatus.DISMISSED:
        return '#6b7280'; // Gray
      case ReportStatus.ESCALATED:
        return '#dc2626'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getReportStatusLabel = (status: ReportStatus): string => {
    switch (status) {
      case ReportStatus.PENDING:
        return 'Pending';
      case ReportStatus.UNDER_REVIEW:
        return 'Under Review';
      case ReportStatus.RESOLVED:
        return 'Resolved';
      case ReportStatus.DISMISSED:
        return 'Dismissed';
      case ReportStatus.ESCALATED:
        return 'Escalated';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading moderation dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.error}>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={loadDashboardData} className={styles.retryButton}>
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
        <h1>Moderation Dashboard</h1>
        <p>Trust, Safety & Moderation Control Center</p>
        <div className={styles.readOnlyBadge}>READ-ONLY</div>
      </div>

      {/* Quick Stats */}
      {metrics && (
        <div className={styles.statsGrid}>
          <motion.div
            className={styles.statCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <h3>{metrics.totalReports}</h3>
              <p>Total Reports</p>
            </div>
          </motion.div>

          <motion.div
            className={styles.statCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statContent}>
              <h3>{metrics.pendingReports}</h3>
              <p>Pending</p>
            </div>
          </motion.div>

          <motion.div
            className={styles.statCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <h3>{metrics.resolvedReports}</h3>
              <p>Resolved</p>
            </div>
          </motion.div>

          <motion.div
            className={styles.statCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className={styles.statIcon}>🚨</div>
            <div className={styles.statContent}>
              <h3>{metrics.escalatedReports}</h3>
              <p>Escalated</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'reports' ? styles.active : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports ({reports.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'cases' ? styles.active : ''}`}
          onClick={() => setActiveTab('cases')}
        >
          Cases ({cases.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'metrics' ? styles.active : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filter}>
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={styles.select}
          >
            <option value="">All Status</option>
            <option value={ReportStatus.PENDING}>Pending</option>
            <option value={ReportStatus.UNDER_REVIEW}>Under Review</option>
            <option value={ReportStatus.RESOLVED}>Resolved</option>
            <option value={ReportStatus.DISMISSED}>Dismissed</option>
            <option value={ReportStatus.ESCALATED}>Escalated</option>
          </select>
        </div>

        <div className={styles.filter}>
          <label>Type</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className={styles.select}
          >
            <option value="">All Types</option>
            <option value={ReportType.INAPPROPRIATE_CONTENT}>Inappropriate Content</option>
            <option value={ReportType.FRAUDULENT_LISTING}>Fraudulent Listing</option>
            <option value={ReportType.HARASSMENT}>Harassment</option>
            <option value={ReportType.SCAM}>Scam</option>
            <option value={ReportType.VIOLATION_OF_TERMS}>Terms Violation</option>
            <option value={ReportType.SPAM}>Spam</option>
            <option value={ReportType.IMPERSONATION}>Impersonation</option>
            <option value={ReportType.DANGEROUS_GOODS}>Dangerous Goods</option>
            <option value={ReportType.COUNTERFEIT_GOODS}>Counterfeit Goods</option>
          </select>
        </div>

        <div className={styles.filter}>
          <label>Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className={styles.select}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'reports' && (
          <div className={styles.reportsList}>
            {reports.length === 0 ? (
              <div className={styles.noData}>
                <p>No reports found matching the current filters.</p>
              </div>
            ) : (
              reports.map((report, index) => (
                <motion.div
                  key={report.id}
                  className={styles.reportCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={styles.reportHeader}>
                    <div className={styles.reportInfo}>
                      <h4>Report #{report.id.slice(-6)}</h4>
                      <div className={styles.reportMeta}>
                        <span 
                          className={styles.reportType}
                          style={{ backgroundColor: getReportTypeColor(report.type) }}
                        >
                          {getReportTypeLabel(report.type)}
                        </span>
                        <span 
                          className={styles.reportStatus}
                          style={{ backgroundColor: getReportStatusColor(report.status) }}
                        >
                          {getReportStatusLabel(report.status)}
                        </span>
                        <span className={styles.reportPriority}>
                          {report.priority}
                        </span>
                      </div>
                    </div>
                    <div className={styles.reportActions}>
                      {report.status === ReportStatus.PENDING && (
                        <button
                          onClick={() => handleStatusUpdate(report.id, ReportStatus.UNDER_REVIEW)}
                          className={styles.actionButton}
                        >
                          Review
                        </button>
                      )}
                      {report.status === ReportStatus.UNDER_REVIEW && (
                        <button
                          onClick={() => handleStatusUpdate(report.id, ReportStatus.RESOLVED)}
                          className={styles.actionButton}
                        >
                          Resolve
                        </button>
                      )}
                      {report.escalatedToDispute && (
                        <span className={styles.escalatedBadge}>Escalated to Dispute</span>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.reportContent}>
                    <p>{report.description}</p>
                    {report.evidence.length > 0 && (
                      <div className={styles.evidence}>
                        <strong>Evidence:</strong> {report.evidence.join(', ')}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.reportFooter}>
                    <span>Created: {new Date(report.createdAt).toLocaleString()}</span>
                    {report.reviewedBy && (
                      <span>Reviewed by: {report.reviewedBy}</span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'cases' && (
          <div className={styles.casesList}>
            {cases.length === 0 ? (
              <div className={styles.noData}>
                <p>No cases found matching the current filters.</p>
              </div>
            ) : (
              cases.map((case_, index) => (
                <motion.div
                  key={case_.id}
                  className={styles.caseCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={styles.caseHeader}>
                    <h4>Case #{case_.id.slice(-6)}</h4>
                    <span 
                      className={styles.caseStatus}
                      style={{ backgroundColor: getReportStatusColor(case_.status) }}
                    >
                      {getReportStatusLabel(case_.status)}
                    </span>
                  </div>
                  <div className={styles.caseContent}>
                    <p><strong>Type:</strong> {getReportTypeLabel(case_.type)}</p>
                    <p><strong>Assigned to:</strong> {case_.assignedTo || 'Unassigned'}</p>
                    <p><strong>Created:</strong> {new Date(case_.createdAt).toLocaleString()}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'metrics' && metrics && (
          <div className={styles.metricsContent}>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <h3>Resolution Time</h3>
                <p>{metrics.averageResolutionTime} hours</p>
              </div>
              
              <div className={styles.metricCard}>
                <h3>Top Report Types</h3>
                <div className={styles.topTypes}>
                  {metrics.topReportTypes.map((type, index) => (
                    <div key={index} className={styles.topType}>
                      <span>{getReportTypeLabel(type.type)}</span>
                      <span>{type.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={styles.metricCard}>
                <h3>Trust Score Distribution</h3>
                <div className={styles.trustDistribution}>
                  {metrics.trustScoreDistribution.map((dist, index) => (
                    <div key={index} className={styles.trustLevel}>
                      <span>{dist.level}</span>
                      <span>{dist.count} users</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* UI Only Notice */}
      <div className={styles.uiOnlyNotice}>
        <div className={styles.noticeIcon}>👁️</div>
        <div className={styles.noticeContent}>
          <h4>READ-ONLY - No Automated Actions</h4>
          <p>This is a demonstration interface. No automated bans or financial actions will be taken. All actions require manual review.</p>
        </div>
      </div>
    </div>
  );
}
