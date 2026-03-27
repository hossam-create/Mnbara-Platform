/**
 * Trust, Safety & Moderation Service
 * Platform safety layer service (visual + workflow only)
 */

import {
  UserReport,
  ModerationCase,
  ContentFlag,
  TrustScore,
  AccountBadge,
  UserWarning,
  SafetyMetrics,
  ModerationQueue,
  VerificationChecklist,
  EscalationLink,
  ReportType,
  ReportStatus,
  ModerationAction,
  TrustLevel,
  AccountStatus,
  VerificationStatus,
  FlagType,
  FlagSeverity
} from '../types/trustSafety.types';

// Mock data for demonstration
const mockReports: UserReport[] = [
  {
    id: 'report_001',
    reporterId: 'user_001',
    reportedUserId: 'user_002',
    type: ReportType.INAPPROPRIATE_CONTENT,
    description: 'User posted inappropriate content in listing description',
    evidence: ['screenshot_001.png', 'listing_001.png'],
    status: ReportStatus.PENDING,
    priority: 'MEDIUM',
    createdAt: '2025-01-17T10:30:00Z',
    updatedAt: '2025-01-17T10:30:00Z'
  },
  {
    id: 'report_002',
    reporterId: 'user_003',
    reportedListingId: 'listing_002',
    type: ReportType.FRAUDULENT_LISTING,
    description: 'Listing appears to be fraudulent with fake product images',
    evidence: ['listing_002.png', 'product_images.zip'],
    status: ReportStatus.UNDER_REVIEW,
    priority: 'HIGH',
    createdAt: '2025-01-16T14:20:00Z',
    updatedAt: '2025-01-17T09:15:00Z',
    reviewedBy: 'moderator_001',
    reviewedAt: '2025-01-17T09:15:00Z'
  },
  {
    id: 'report_003',
    reporterId: 'user_004',
    reportedUserId: 'user_005',
    type: ReportType.HARASSMENT,
    description: 'User sending harassing messages through platform',
    evidence: ['messages_001.pdf', 'user_profile_005.png'],
    status: ReportStatus.ESCALATED,
    priority: 'URGENT',
    createdAt: '2025-01-15T16:45:00Z',
    updatedAt: '2025-01-16T11:30:00Z',
    reviewedBy: 'moderator_002',
    reviewedAt: '2025-01-16T11:30:00Z',
    escalatedToDispute: true
  }
];

const mockTrustScores: TrustScore[] = [
  {
    userId: 'user_001',
    overallScore: 85.5,
    breakdown: {
      verificationScore: 90,
      transactionScore: 88,
      behaviorScore: 82,
      communityScore: 82
    },
    level: TrustLevel.HIGH,
    lastUpdated: '2025-01-17T12:00:00Z',
    factors: [
      {
        type: 'VERIFICATION',
        weight: 0.3,
        score: 90,
        description: 'ID and address verified',
        positive: true
      },
      {
        type: 'TRANSACTION',
        weight: 0.4,
        score: 88,
        description: '127 successful transactions',
        positive: true
      },
      {
        type: 'BEHAVIOR',
        weight: 0.2,
        score: 82,
        description: 'Good community behavior',
        positive: true
      },
      {
        type: 'COMMUNITY',
        weight: 0.1,
        score: 82,
        description: 'Positive community feedback',
        positive: true
      }
    ]
  },
  {
    userId: 'user_002',
    overallScore: 45.2,
    breakdown: {
      verificationScore: 60,
      transactionScore: 35,
      behaviorScore: 40,
      communityScore: 46
    },
    level: TrustLevel.LOW,
    lastUpdated: '2025-01-17T12:00:00Z',
    factors: [
      {
        type: 'VERIFICATION',
        weight: 0.3,
        score: 60,
        description: 'Partial verification completed',
        positive: false
      },
      {
        type: 'TRANSACTION',
        weight: 0.4,
        score: 35,
        description: '3 successful transactions, 2 disputes',
        positive: false
      },
      {
        type: 'BEHAVIOR',
        weight: 0.2,
        score: 40,
        description: 'Multiple community reports',
        positive: false
      },
      {
        type: 'COMMUNITY',
        weight: 0.1,
        score: 46,
        description: 'Mixed community feedback',
        positive: false
      }
    ]
  }
];

const mockAccountBadges: AccountBadge[] = [
  {
    id: 'badge_001',
    userId: 'user_001',
    type: 'VERIFIED',
    label: 'Verified User',
    description: 'Identity and address verified',
    icon: '✓',
    color: '#10b981',
    isActive: true,
    issuedAt: '2024-06-15T10:00:00Z'
  },
  {
    id: 'badge_002',
    userId: 'user_001',
    type: 'TRUSTED',
    label: 'Trusted Traveler',
    description: 'High trust score with good community standing',
    icon: '🛡️',
    color: '#3b82f6',
    isActive: true,
    issuedAt: '2024-08-20T14:30:00Z'
  },
  {
    id: 'badge_003',
    userId: 'user_002',
    type: 'WARNING',
    label: 'Under Review',
    description: 'Account currently under review',
    icon: '⚠️',
    color: '#f59e0b',
    isActive: true,
    issuedAt: '2025-01-17T09:00:00Z',
    expiresAt: '2025-01-24T09:00:00Z'
  }
];

const mockVerificationChecklists: VerificationChecklist[] = [
  {
    userId: 'user_001',
    items: [
      {
        id: 'verify_001',
        type: 'ID_VERIFICATION',
        label: 'Government ID Verification',
        description: 'Verify government-issued identification',
        required: true,
        status: VerificationStatus.VERIFIED,
        evidence: 'passport_001.pdf',
        verifiedAt: '2024-06-15T10:00:00Z',
        expiresAt: '2025-06-15T10:00:00Z'
      },
      {
        id: 'verify_002',
        type: 'ADDRESS_VERIFICATION',
        label: 'Address Verification',
        description: 'Verify residential or business address',
        required: true,
        status: VerificationStatus.VERIFIED,
        evidence: 'utility_bill_001.pdf',
        verifiedAt: '2024-06-15T11:30:00Z',
        expiresAt: '2025-06-15T11:30:00Z'
      },
      {
        id: 'verify_003',
        type: 'PHONE_VERIFICATION',
        label: 'Phone Number Verification',
        description: 'Verify mobile phone number',
        required: true,
        status: VerificationStatus.VERIFIED,
        verifiedAt: '2024-06-14T16:20:00Z'
      },
      {
        id: 'verify_004',
        type: 'EMAIL_VERIFICATION',
        label: 'Email Verification',
        description: 'Verify email address',
        required: true,
        status: VerificationStatus.VERIFIED,
        verifiedAt: '2024-06-14T15:45:00Z'
      },
      {
        id: 'verify_005',
        type: 'BACKGROUND_CHECK',
        label: 'Background Check',
        description: 'Complete background verification',
        required: false,
        status: VerificationStatus.VERIFIED,
        evidence: 'background_check_001.pdf',
        verifiedAt: '2024-06-16T09:00:00Z',
        expiresAt: '2025-06-16T09:00:00Z'
      }
    ],
    overallStatus: VerificationStatus.VERIFIED,
    completedAt: '2024-06-16T09:00:00Z',
    lastUpdated: '2024-06-16T09:00:00Z'
  }
];

export const trustSafetyService = {
  /**
   * Get user reports
   */
  async getUserReports(filters: {
    status?: ReportStatus;
    type?: ReportType;
    priority?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ reports: UserReport[], total: number }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let filteredReports = [...mockReports];
    
    // Apply filters
    if (filters.status) {
      filteredReports = filteredReports.filter(report => report.status === filters.status);
    }
    
    if (filters.type) {
      filteredReports = filteredReports.filter(report => report.type === filters.type);
    }
    
    if (filters.priority) {
      filteredReports = filteredReports.filter(report => report.priority === filters.priority);
    }
    
    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      reports: filteredReports.slice(startIndex, endIndex),
      total: filteredReports.length
    };
  },

  /**
   * Get moderation cases
   */
  async getModerationCases(filters: {
    status?: ReportStatus;
    assignedTo?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ cases: ModerationCase[], total: number }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock moderation cases based on reports
    const cases: ModerationCase[] = mockReports.map(report => ({
      id: `case_${report.id}`,
      reportId: report.id,
      type: report.type,
      status: report.status,
      assignedTo: report.reviewedBy,
      actions: report.status === ReportStatus.RESOLVED ? [ModerationAction.WARNING_ISSUED] : [],
      notes: [],
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      resolvedAt: report.reviewedAt
    }));
    
    let filteredCases = cases;
    
    if (filters.status) {
      filteredCases = filteredCases.filter(c => c.status === filters.status);
    }
    
    if (filters.assignedTo) {
      filteredCases = filteredCases.filter(c => c.assignedTo === filters.assignedTo);
    }
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      cases: filteredCases.slice(startIndex, endIndex),
      total: filteredCases.length
    };
  },

  /**
   * Get trust score for user
   */
  async getTrustScore(userId: string): Promise<TrustScore | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return mockTrustScores.find(score => score.userId === userId) || null;
  },

  /**
   * Get account badges for user
   */
  async getAccountBadges(userId: string): Promise<AccountBadge[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return mockAccountBadges.filter(badge => badge.userId === userId);
  },

  /**
   * Get user warnings
   */
  async getUserWarnings(userId: string): Promise<UserWarning[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock warnings based on account status
    const warnings: UserWarning[] = [];
    
    const userBadges = mockAccountBadges.filter(badge => badge.userId === userId);
    const hasWarning = userBadges.some(badge => badge.type === 'WARNING');
    
    if (hasWarning) {
      warnings.push({
        id: 'warning_001',
        userId,
        type: 'COMMUNITY_GUIDELINES',
        severity: 'MEDIUM',
        message: 'Multiple community reports received. Please review our community guidelines.',
        issuedBy: 'system',
        issuedAt: '2025-01-17T09:00:00Z',
        expiresAt: '2025-01-24T09:00:00Z'
      });
    }
    
    return warnings;
  },

  /**
   * Get verification checklist
   */
  async getVerificationChecklist(userId: string): Promise<VerificationChecklist | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return mockVerificationChecklists.find(checklist => checklist.userId === userId) || null;
  },

  /**
   * Get safety metrics
   */
  async getSafetyMetrics(): Promise<SafetyMetrics> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const totalReports = mockReports.length;
    const pendingReports = mockReports.filter(r => r.status === ReportStatus.PENDING).length;
    const resolvedReports = mockReports.filter(r => r.status === ReportStatus.RESOLVED).length;
    const escalatedReports = mockReports.filter(r => r.status === ReportStatus.ESCALATED).length;
    
    return {
      totalReports,
      pendingReports,
      resolvedReports,
      escalatedReports,
      averageResolutionTime: 24.5, // hours
      topReportTypes: [
        { type: ReportType.INAPPROPRIATE_CONTENT, count: 1 },
        { type: ReportType.FRAUDULENT_LISTING, count: 1 },
        { type: ReportType.HARASSMENT, count: 1 }
      ],
      trustScoreDistribution: [
        { level: TrustLevel.HIGH, count: 1 },
        { level: TrustLevel.LOW, count: 1 }
      ]
    };
  },

  /**
   * Get moderation queues
   */
  async getModerationQueues(): Promise<ModerationQueue[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return [
      {
        id: 'queue_pending',
        type: 'REPORT',
        priority: 'MEDIUM',
        itemCount: mockReports.filter(r => r.status === ReportStatus.PENDING).length,
        oldestItem: '2025-01-17T10:30:00Z',
        assignedModerators: ['moderator_001', 'moderator_002']
      },
      {
        id: 'queue_urgent',
        type: 'REPORT',
        priority: 'URGENT',
        itemCount: mockReports.filter(r => r.priority === 'URGENT').length,
        oldestItem: '2025-01-15T16:45:00Z',
        assignedModerators: ['moderator_002']
      }
    ];
  },

  /**
   * Submit user report (UI only)
   */
  async submitReport(report: Omit<UserReport, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<UserReport | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Create new report (UI only)
    const newReport: UserReport = {
      ...report,
      id: `report_${Date.now()}`,
      status: ReportStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to mock data (UI only)
    mockReports.push(newReport);
    
    return newReport;
  },

  /**
   * Update report status (UI only)
   */
  async updateReportStatus(reportId: string, status: ReportStatus, reviewedBy?: string, resolution?: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const report = mockReports.find(r => r.id === reportId);
    if (report) {
      report.status = status;
      report.updatedAt = new Date().toISOString();
      if (reviewedBy) {
        report.reviewedBy = reviewedBy;
        report.reviewedAt = new Date().toISOString();
      }
      if (resolution) {
        report.resolution = resolution;
      }
      return true;
    }
    return false;
  },

  /**
   * Create escalation link to disputes
   */
  async createEscalationLink(reportId: string, reason: string, escalatedBy: string): Promise<EscalationLink | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const escalation: EscalationLink = {
      id: `escalation_${Date.now()}`,
      reportId,
      reason,
      escalatedBy,
      escalatedAt: new Date().toISOString(),
      status: 'PENDING'
    };
    
    return escalation;
  },

  /**
   * Format trust score
   */
  formatTrustScore: (score: number): string => {
    return score.toFixed(1);
  },

  /**
   * Get trust level color
   */
  getTrustLevelColor: (level: TrustLevel): string => {
    switch (level) {
      case TrustLevel.VERY_HIGH:
        return '#059669'; // Green
      case TrustLevel.HIGH:
        return '#10b981'; // Light Green
      case TrustLevel.MEDIUM:
        return '#f59e0b'; // Yellow
      case TrustLevel.LOW:
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  },

  /**
   * Get account status color
   */
  getAccountStatusColor: (status: AccountStatus): string => {
    switch (status) {
      case AccountStatus.ACTIVE:
        return '#10b981'; // Green
      case AccountStatus.WARNING:
        return '#f59e0b'; // Yellow
      case AccountStatus.SUSPENDED:
        return '#f97316'; // Orange
      case AccountStatus.UNDER_REVIEW:
        return '#3b82f6'; // Blue
      case AccountStatus.BANNED:
        return '#dc2626'; // Red
      default:
        return '#6b7280'; // Gray
    }
  }
};
