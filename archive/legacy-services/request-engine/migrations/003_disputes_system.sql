-- Disputes & Refunds System Database Schema
-- Comprehensive dispute resolution and refund management

-- Disputes table
CREATE TABLE disputes (
  id VARCHAR(36) PRIMARY KEY,
  request_id UUID NOT NULL,
  opened_by VARCHAR(10) NOT NULL CHECK (opened_by IN ('BUYER', 'SELLER')),
  reason VARCHAR(20) NOT NULL CHECK (reason IN ('NOT_DELIVERED', 'WRONG_ITEM', 'DAMAGED', 'OTHER')),
  description TEXT NOT NULL,
  evidence_urls JSON,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED')),
  resolution VARCHAR(30) CHECK (resolution IN ('REFUND_BUYER', 'RELEASE_TO_SELLER', 'PARTIAL_REFUND')),
  resolution_percentage DECIMAL(5,2) CHECK (resolution_percentage >= 0 AND resolution_percentage <= 100),
  admin_notes TEXT,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by_admin_id UUID,
  resolved_by_admin_id UUID,
  stripe_refund_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_dispute_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_dispute_reviewed_by FOREIGN KEY (reviewed_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_dispute_resolved_by FOREIGN KEY (resolved_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT uq_dispute_request UNIQUE (request_id)
);

-- Dispute evidence table
CREATE TABLE dispute_evidence (
  id SERIAL PRIMARY KEY,
  dispute_id VARCHAR(36) NOT NULL,
  submitted_by VARCHAR(10) NOT NULL CHECK (submitted_by IN ('BUYER', 'SELLER')),
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('IMAGE', 'DOCUMENT')),
  file_size INTEGER NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_evidence_dispute FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_dispute_request_id ON disputes(request_id);
CREATE INDEX idx_dispute_status ON disputes(status);
CREATE INDEX idx_dispute_opened_at ON disputes(opened_at);
CREATE INDEX idx_dispute_opened_by ON disputes(opened_by);
CREATE INDEX idx_dispute_reviewed_by ON disputes(reviewed_by_admin_id);
CREATE INDEX idx_dispute_resolved_by ON disputes(resolved_by_admin_id);

CREATE INDEX idx_evidence_dispute_id ON dispute_evidence(dispute_id);
CREATE INDEX idx_evidence_submitted_by ON dispute_evidence(submitted_by);
CREATE INDEX idx_evidence_submitted_at ON dispute_evidence(submitted_at);

-- Trigger for updated_at
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE disputes IS 'Stores dispute information for delivered requests';
COMMENT ON TABLE dispute_evidence IS 'Stores evidence files uploaded by buyers and sellers';

COMMENT ON COLUMN disputes.opened_by IS 'Party who opened the dispute: BUYER or SELLER';
COMMENT ON COLUMN disputes.reason IS 'Reason for dispute: NOT_DELIVERED, WRONG_ITEM, DAMAGED, OTHER';
COMMENT ON COLUMN disputes.status IS 'Current status: OPEN, UNDER_REVIEW, RESOLVED, CLOSED';
COMMENT ON COLUMN disputes.resolution IS 'Resolution type: REFUND_BUYER, RELEASE_TO_SELLER, PARTIAL_REFUND';
COMMENT ON COLUMN disputes.resolution_percentage IS 'Percentage for PARTIAL_REFUND (0-100)';
COMMENT ON COLUMN disputes.evidence_urls IS 'JSON array of evidence file URLs';
COMMENT ON COLUMN disputes.stripe_refund_id IS 'Stripe refund ID if refund was processed';

COMMENT ON COLUMN dispute_evidence.submitted_by IS 'Party who submitted evidence: BUYER or SELLER';
COMMENT ON COLUMN dispute_evidence.file_type IS 'Type of file: IMAGE or DOCUMENT';
COMMENT ON COLUMN dispute_evidence.file_size IS 'File size in bytes';

