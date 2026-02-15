// ============================================================
// Communication Types
// ============================================================

export interface CommunicationLog {
  id: number;
  matchId: number;
  senderId: number;
  recipientId: number;
  message: string;
  flagged: boolean;
  flagReason?: string | null;
  createdAt: Date;
}

export interface SendMessageInput {
  matchId: number;
  senderId: number;
  recipientId: number;
  message: string;
}

export interface FlagMessageInput {
  messageId: number;
  reason: string;
}

export interface MessageValidationResult {
  valid: boolean;
  containsExternalContact: boolean;
  detectedPatterns: string[];
}

export interface GetMessagesFilters {
  matchId: number;
  limit?: number;
  offset?: number;
}
