-- ============================================================
-- Rule Evaluation Pipeline - APPEND-ONLY Evaluation Logs
-- ============================================================

-- RuleEvaluationLog table - APPEND-ONLY audit trail
CREATE TABLE "RuleEvaluationLog" (
  id SERIAL PRIMARY KEY,
  
  -- Evaluation context
  evaluation_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  trigger_mode VARCHAR(50) NOT NULL, -- 'SCHEDULED' or 'ON_DEMAND'
  trigger_source VARCHAR(255), -- Cron job name or admin user ID
  
  -- Rule information
  rule_id VARCHAR(255) NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  
  -- Evaluation results
  matched BOOLEAN NOT NULL,
  output_type VARCHAR(50), -- Only populated if matched
  severity VARCHAR(50), -- Only populated if matched
  reason TEXT,
  
  -- Context
  user_id VARCHAR(255),
  actor_type VARCHAR(50),
  auction_id VARCHAR(255),
  traveler_id VARCHAR(255),
  
  -- Evaluation metadata
  conditions_evaluated INT NOT NULL DEFAULT 0,
  conditions_matched INT NOT NULL DEFAULT 0,
  evaluation_duration_ms INT NOT NULL,
  
  -- Immutability
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for querying
  INDEX idx_evaluation_id (evaluation_id),
  INDEX idx_trigger_mode (trigger_mode),
  INDEX idx_rule_id (rule_id),
  INDEX idx_matched (matched),
  INDEX idx_user_id (user_id),
  INDEX idx_auction_id (auction_id),
  INDEX idx_created_at (created_at),
  INDEX idx_trigger_source (trigger_source)
);

-- RuleEvaluationBatch table - Track batch evaluations
CREATE TABLE "RuleEvaluationBatch" (
  id SERIAL PRIMARY KEY,
  
  -- Batch information
  batch_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  trigger_mode VARCHAR(50) NOT NULL, -- 'SCHEDULED' or 'ON_DEMAND'
  trigger_source VARCHAR(255), -- Cron job name or admin user ID
  
  -- Batch results
  total_rules_evaluated INT NOT NULL,
  total_flags_produced INT NOT NULL,
  evaluation_duration_ms INT NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED', -- 'IN_PROGRESS', 'COMPLETED', 'FAILED'
  error_message TEXT,
  
  -- Immutability
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for querying
  INDEX idx_batch_id (batch_id),
  INDEX idx_trigger_mode (trigger_mode),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_trigger_source (trigger_source)
);

-- RuleEvaluationSchedule table - Track scheduled evaluations
CREATE TABLE "RuleEvaluationSchedule" (
  id SERIAL PRIMARY KEY,
  
  -- Schedule information
  schedule_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Cron configuration
  cron_expression VARCHAR(255) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Evaluation scope
  evaluation_scope VARCHAR(50) NOT NULL, -- 'ALL_USERS', 'ALL_AUCTIONS', 'CUSTOM'
  scope_filters JSON, -- Custom filters for evaluation
  
  -- Metadata
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for querying
  INDEX idx_schedule_id (schedule_id),
  INDEX idx_enabled (enabled),
  INDEX idx_created_at (created_at)
);

-- RuleEvaluationScheduleRun table - Track schedule executions
CREATE TABLE "RuleEvaluationScheduleRun" (
  id SERIAL PRIMARY KEY,
  
  -- Schedule information
  schedule_id UUID NOT NULL,
  
  -- Run information
  run_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'FAILED'
  
  -- Results
  total_rules_evaluated INT,
  total_flags_produced INT,
  evaluation_duration_ms INT,
  
  -- Error handling
  error_message TEXT,
  
  -- Immutability
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Indexes for querying
  INDEX idx_run_id (run_id),
  INDEX idx_schedule_id (schedule_id),
  INDEX idx_status (status),
  INDEX idx_started_at (started_at),
  FOREIGN KEY (schedule_id) REFERENCES "RuleEvaluationSchedule"(schedule_id)
);

-- Prevent updates to RuleEvaluationLog (APPEND-ONLY)
CREATE TRIGGER prevent_rule_evaluation_log_update
BEFORE UPDATE ON "RuleEvaluationLog"
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RuleEvaluationLog is append-only and cannot be updated';
END;

-- Prevent deletes from RuleEvaluationLog (APPEND-ONLY)
CREATE TRIGGER prevent_rule_evaluation_log_delete
BEFORE DELETE ON "RuleEvaluationLog"
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RuleEvaluationLog is append-only and cannot be deleted';
END;

-- Prevent updates to RuleEvaluationBatch (APPEND-ONLY)
CREATE TRIGGER prevent_rule_evaluation_batch_update
BEFORE UPDATE ON "RuleEvaluationBatch"
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RuleEvaluationBatch is append-only and cannot be updated';
END;

-- Prevent deletes from RuleEvaluationBatch (APPEND-ONLY)
CREATE TRIGGER prevent_rule_evaluation_batch_delete
BEFORE DELETE ON "RuleEvaluationBatch"
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RuleEvaluationBatch is append-only and cannot be deleted';
END;
