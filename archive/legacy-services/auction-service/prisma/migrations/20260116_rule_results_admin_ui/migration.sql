-- ============================================================
-- Rule Results Admin UI - Flag Management & Audit Trail
-- ============================================================

-- RuleFlag table - Individual flags from rule evaluations
CREATE TABLE "RuleFlag" (
  id SERIAL PRIMARY KEY,
  
  -- Flag identification
  flag_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  evaluation_log_id INT NOT NULL,
  
  -- Rule information
  rule_id VARCHAR(255) NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  
  -- Flag details
  output_type VARCHAR(50) NOT NULL, -- FLAG_USER, FLAG_AUCTION, FLAG_TRAVELER, RATE_LIMIT, REQUIRE_MANUAL_REVIEW
  severity VARCHAR(50) NOT NULL, -- LOW, MEDIUM, HIGH
  reason TEXT NOT NULL,
  
  -- Context
  user_id VARCHAR(255),
  actor_type VARCHAR(50),
  auction_id VARCHAR(255),
  traveler_id VARCHAR(255),
  
  -- Flag status
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, ACKNOWLEDGED, OVERRIDDEN, RESOLVED
  
  -- Immutability
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for querying
  INDEX idx_flag_id (flag_id),
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  INDEX idx_auction_id (auction_id),
  INDEX idx_output_type (output_type),
  INDEX idx_severity (severity),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (evaluation_log_id) REFERENCES "RuleEvaluationLog"(id)
);

-- RuleFlagAcknowledgment table - APPEND-ONLY audit trail for acknowledgments
CREATE TABLE "RuleFlagAcknowledgment" (
  id SERIAL PRIMARY KEY,
  
  -- Acknowledgment identification
  acknowledgment_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL,
  
  -- Admin information
  acknowledged_by VARCHAR(255) NOT NULL, -- Admin user ID
  acknowledged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Notes
  notes TEXT,
  
  -- Immutability
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for querying
  INDEX idx_acknowledgment_id (acknowledgment_id),
  INDEX idx_flag_id (flag_id),
  INDEX idx_acknowledged_by (acknowledged_by),
  INDEX idx_acknowledged_at (acknowledged_at),
  FOREIGN KEY (flag_id) REFERENCES "RuleFlag"(flag_id)
);

-- RuleFlagOverride table - APPEND-ONLY audit trail for overrides
CREATE TABLE "RuleFlagOverride" (
  id SERIAL PRIMARY KEY,
  
  -- Override identification
  override_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL,
  
  -- Override details
  override_action VARCHAR(50) NOT NULL, -- DISMISS, ESCALATE, MANUAL_REVIEW
  override_reason TEXT NOT NULL,
  
  -- Admin information
  overridden_by VARCHAR(255) NOT NULL, -- Admin user ID
  overridden_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Approval (if required)
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  
  -- Immutability
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for querying
  INDEX idx_override_id (override_id),
  INDEX idx_flag_id (flag_id),
  INDEX idx_override_action (override_action),
  INDEX idx_overridden_by (overridden_by),
  INDEX idx_overridden_at (overridden_at),
  FOREIGN KEY (flag_id) REFERENCES "RuleFlag"(flag_id)
);

-- RuleFlagAuditLog table - APPEND-ONLY comprehensive audit trail
CREATE TABLE "RuleFlagAuditLog" (
  id SERIAL PRIMARY KEY,
  
  -- Audit identification
  audit_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL,
  
  -- Action information
  action VARCHAR(50) NOT NULL, -- CREATED, ACKNOWLEDGED, OVERRIDDEN, RESOLVED, ESCALATED
  actor_id VARCHAR(255) NOT NULL, -- Admin user ID or system
  actor_type VARCHAR(50) NOT NULL, -- ADMIN, SYSTEM
  
  -- Details
  details JSON,
  
  -- Immutability
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for querying
  INDEX idx_audit_id (audit_id),
  INDEX idx_flag_id (flag_id),
  INDEX idx_action (action),
  INDEX idx_actor_id (actor_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (flag_id) REFERENCES "RuleFlag"(flag_id)
);

-- Prevent updates to RuleFlag (APPEND-ONLY for status changes)
CREATE TRIGGER prevent_rule_flag_update
BEFORE UPDATE ON "RuleFlag"
FOR EACH ROW
BEGIN
  -- Allow status updates only
  IF OLD.status != NEW.status THEN
    -- Status update allowed
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RuleFlag is append-only and cannot be updated';
  END IF;
END;

-- Prevent deletes from RuleFlag (APPEND-ONLY)
CREATE TRIGGER prevent_rule_flag_delete
BEFORE DELETE ON "RuleFlag"
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RuleFlag is append-only and cannot be deleted';
END;

-- Prevent updates to RuleFlagAcknowledgment (APPEND-ONLY)
CREATE TRIGGER prevent_rule_flag_acknowledgment_update
BEFORE UPDATE ON "RuleFlagAcknowledgment"
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RuleFlagAcknowledgment is append-only and cannot be updated';
END;

-- Prevent deletes from RuleFlagAcknowledgment (APPEND-ONLY)
CREATE TRIGGER prevent_rule_flag_acknowledgment_delete
BEFORE DELETE ON "RuleFlagAcknowledgment"
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RuleFlagAcknowledgment is append-only and cannot be deleted';
END;

-- Prevent updates to RuleFlagOverride (APPEND-ONLY)
CREATE TRIGGER prevent_rule_flag_override_update
BEFORE UPDATE ON "RuleFlagOverride"
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RuleFlagOverride is append-only and cannot be updated';
END;

-- Prevent deletes from RuleFlagOverride (APPEND-ONLY)
CREATE TRIGGER prevent_rule_flag_override_delete
BEFORE DELETE ON "RuleFlagOverride"
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RuleFlagOverride is append-only and cannot be deleted';
END;

-- Prevent updates to RuleFlagAuditLog (APPEND-ONLY)
CREATE TRIGGER prevent_rule_flag_audit_log_update
BEFORE UPDATE ON "RuleFlagAuditLog"
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RuleFlagAuditLog is append-only and cannot be updated';
END;

-- Prevent deletes from RuleFlagAuditLog (APPEND-ONLY)
CREATE TRIGGER prevent_rule_flag_audit_log_delete
BEFORE DELETE ON "RuleFlagAuditLog"
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RuleFlagAuditLog is append-only and cannot be deleted';
END;
