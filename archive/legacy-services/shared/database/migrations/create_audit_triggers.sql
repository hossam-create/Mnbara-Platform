-- Audit Triggers for Automatic Logging
-- These triggers automatically create audit log entries for critical database changes

-- Function to log user status changes
CREATE OR REPLACE FUNCTION log_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if isActive status changed
  IF OLD.isActive IS DISTINCT FROM NEW.isActive THEN
    INSERT INTO "AuditLog" (
      action,
      severity,
      targetId,
      targetType,
      targetEmail,
      description,
      oldValues,
      newValues,
      success
    ) VALUES (
      CASE 
        WHEN NEW.isActive = false THEN 'USER_SUSPENDED'::AuditAction
        WHEN NEW.isActive = true THEN 'USER_REACTIVATED'::AuditAction
      END,
      CASE 
        WHEN NEW.isActive = false THEN 'WARNING'::AuditSeverity
        ELSE 'INFO'::AuditSeverity
      END,
      NEW.id,
      'User',
      NEW.email,
      CASE 
        WHEN NEW.isActive = false THEN 'User account deactivated'
        WHEN NEW.isActive = true THEN 'User account reactivated'
      END,
      jsonb_build_object('isActive', OLD.isActive),
      jsonb_build_object('isActive', NEW.isActive),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user status changes
DROP TRIGGER IF EXISTS user_status_change_audit ON "User";
CREATE TRIGGER user_status_change_audit
  AFTER UPDATE ON "User"
  FOR EACH ROW
  WHEN (OLD.isActive IS DISTINCT FROM NEW.isActive)
  EXECUTE FUNCTION log_user_status_change();

-- Function to log KYC status changes
CREATE OR REPLACE FUNCTION log_kyc_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log KYC verification status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO "AuditLog" (
      action,
      severity,
      targetId,
      targetType,
      description,
      oldValues,
      newValues,
      success
    ) VALUES (
      CASE 
        WHEN NEW.status = 'APPROVED' THEN 'KYC_APPROVED'::AuditAction
        WHEN NEW.status = 'REJECTED' THEN 'KYC_REJECTED'::AuditAction
        ELSE 'KYC_SUBMITTED'::AuditAction
      END,
      CASE 
        WHEN NEW.status = 'REJECTED' THEN 'WARNING'::AuditSeverity
        ELSE 'INFO'::AuditSeverity
      END,
      NEW.userId,
      'KycVerification',
      format('KYC status changed from %s to %s', OLD.status, NEW.status),
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status, 'reviewedBy', NEW.reviewedBy),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for KYC status changes
DROP TRIGGER IF EXISTS kyc_status_change_audit ON "KycVerification";
CREATE TRIGGER kyc_status_change_audit
  AFTER UPDATE ON "KycVerification"
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_kyc_status_change();

-- Function to log escrow status changes
CREATE OR REPLACE FUNCTION log_escrow_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log escrow status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO "AuditLog" (
      action,
      severity,
      targetId,
      targetType,
      description,
      oldValues,
      newValues,
      metadata,
      success
    ) VALUES (
      CASE 
        WHEN NEW.status = 'HELD' THEN 'ESCROW_HELD'::AuditAction
        WHEN NEW.status = 'RELEASED_TO_TRAVELER' THEN 'ESCROW_RELEASED'::AuditAction
        WHEN NEW.status = 'REFUNDED_TO_BUYER' THEN 'ESCROW_REFUNDED'::AuditAction
        ELSE 'ESCROW_CREATED'::AuditAction
      END,
      'INFO'::AuditSeverity,
      NEW.id,
      'Escrow',
      format('Escrow status changed from %s to %s for order %s', OLD.status, NEW.status, NEW.orderId),
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      jsonb_build_object('orderId', NEW.orderId, 'amount', NEW.amount, 'currency', NEW.currency),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for escrow status changes
DROP TRIGGER IF EXISTS escrow_status_change_audit ON "Escrow";
CREATE TRIGGER escrow_status_change_audit
  AFTER UPDATE ON "Escrow"
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_escrow_status_change();

-- Function to log dispute status changes
CREATE OR REPLACE FUNCTION log_dispute_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log dispute status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO "AuditLog" (
      action,
      severity,
      targetId,
      targetType,
      description,
      oldValues,
      newValues,
      metadata,
      success
    ) VALUES (
      CASE 
        WHEN NEW.status = 'UNDER_REVIEW' THEN 'DISPUTE_ASSIGNED'::AuditAction
        WHEN NEW.status IN ('RESOLVED_BUYER', 'RESOLVED_TRAVELER', 'RESOLVED_SPLIT') THEN 'DISPUTE_RESOLVED'::AuditAction
        WHEN NEW.status = 'CLOSED' THEN 'DISPUTE_CLOSED'::AuditAction
        ELSE 'DISPUTE_CREATED'::AuditAction
      END,
      'WARNING'::AuditSeverity,
      NEW.id,
      'Dispute',
      format('Dispute status changed from %s to %s', OLD.status, NEW.status),
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status, 'assignedTo', NEW.assignedTo),
      jsonb_build_object('escrowId', NEW.escrowId, 'raisedBy', NEW.raisedBy),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for dispute status changes
DROP TRIGGER IF EXISTS dispute_status_change_audit ON "Dispute";
CREATE TRIGGER dispute_status_change_audit
  AFTER UPDATE ON "Dispute"
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_dispute_status_change();

-- Function to log transaction status changes
CREATE OR REPLACE FUNCTION log_transaction_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log transaction status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO "AuditLog" (
      action,
      severity,
      targetId,
      targetType,
      description,
      oldValues,
      newValues,
      metadata,
      success
    ) VALUES (
      CASE 
        WHEN NEW.status = 'COMPLETED' THEN 'TRANSACTION_COMPLETED'::AuditAction
        WHEN NEW.status = 'FAILED' THEN 'TRANSACTION_FAILED'::AuditAction
        ELSE 'TRANSACTION_CREATED'::AuditAction
      END,
      CASE 
        WHEN NEW.status = 'FAILED' THEN 'ERROR'::AuditSeverity
        ELSE 'INFO'::AuditSeverity
      END,
      NEW.id,
      'Transaction',
      format('Transaction status changed from %s to %s', OLD.status, NEW.status),
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      jsonb_build_object(
        'userId', NEW.userId,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'type', NEW.type
      ),
      CASE WHEN NEW.status = 'FAILED' THEN false ELSE true END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for transaction status changes
DROP TRIGGER IF EXISTS transaction_status_change_audit ON "Transaction";
CREATE TRIGGER transaction_status_change_audit
  AFTER UPDATE ON "Transaction"
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_transaction_status_change();

-- Function to log consent changes
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields jsonb := '{}'::jsonb;
BEGIN
  -- Track which consent fields changed
  IF OLD.analyticsConsent IS DISTINCT FROM NEW.analyticsConsent THEN
    changed_fields := changed_fields || jsonb_build_object('analyticsConsent', NEW.analyticsConsent);
  END IF;
  
  IF OLD.personalizationConsent IS DISTINCT FROM NEW.personalizationConsent THEN
    changed_fields := changed_fields || jsonb_build_object('personalizationConsent', NEW.personalizationConsent);
  END IF;
  
  IF OLD.marketingConsent IS DISTINCT FROM NEW.marketingConsent THEN
    changed_fields := changed_fields || jsonb_build_object('marketingConsent', NEW.marketingConsent);
  END IF;
  
  -- Only log if something actually changed
  IF jsonb_object_keys(changed_fields) IS NOT NULL THEN
    INSERT INTO "AuditLog" (
      action,
      severity,
      targetId,
      targetType,
      description,
      oldValues,
      newValues,
      success
    ) VALUES (
      'CONSENT_UPDATED'::AuditAction,
      'INFO'::AuditSeverity,
      NEW.userId,
      'Consent',
      'User consent preferences updated',
      jsonb_build_object(
        'analyticsConsent', OLD.analyticsConsent,
        'personalizationConsent', OLD.personalizationConsent,
        'marketingConsent', OLD.marketingConsent
      ),
      changed_fields,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for consent changes
DROP TRIGGER IF EXISTS consent_change_audit ON "Consent";
CREATE TRIGGER consent_change_audit
  AFTER UPDATE ON "Consent"
  FOR EACH ROW
  EXECUTE FUNCTION log_consent_change();

-- Comments
COMMENT ON FUNCTION log_user_status_change() IS 'Automatically logs user account status changes (suspend/reactivate)';
COMMENT ON FUNCTION log_kyc_status_change() IS 'Automatically logs KYC verification status changes';
COMMENT ON FUNCTION log_escrow_status_change() IS 'Automatically logs escrow status changes';
COMMENT ON FUNCTION log_dispute_status_change() IS 'Automatically logs dispute status changes';
COMMENT ON FUNCTION log_transaction_status_change() IS 'Automatically logs transaction status changes';
COMMENT ON FUNCTION log_consent_change() IS 'Automatically logs user consent preference changes';
