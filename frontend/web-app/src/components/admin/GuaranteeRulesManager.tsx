/**
 * Guarantee Rules Manager
 * Admin interface for viewing and configuring guarantee rules
 * NO execution logic - read-only configuration only
 */

import React, { useState, useEffect } from 'react';
import styles from './GuaranteeRulesManager.module.css';
import { guaranteeRulesService } from '../../services/admin/guaranteeRulesService';

interface GuaranteeRule {
  id: string;
  name: string;
  appliesTo: 'CATEGORY' | 'ORDER_TYPE' | 'TRAVELER' | 'ALL';
  coverage: number; // percentage
  maxAmount: number;
  autoActions: {
    autoEscalate: boolean;
    autoRefund: boolean;
    autoRelease: boolean;
  };
  conditions: {
    minOrderAmount?: number;
    maxOrderAmount?: number;
    categories?: string[];
    orderTypes?: string[];
    travelerVerified?: boolean;
  };
  thresholds: {
    disputeThreshold: number; // days
    escalationThreshold: number; // days
    evidenceRequired: boolean;
  };
  escalation: {
    autoEscalateAfter: number; // days
    escalationLevel: 'TIER_1' | 'TIER_2' | 'TIER_3';
    requiresApproval: boolean;
  };
  priority: number;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function GuaranteeRulesManager() {
  const [rules, setRules] = useState<GuaranteeRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<GuaranteeRule | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<GuaranteeRule | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await guaranteeRulesService.getAll();
      setRules(data);
    } catch (error) {
      console.error('Failed to load guarantee rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    try {
      const updatedRule = await guaranteeRulesService.update(ruleId, { 
        enabled: !rule.enabled 
      });
      
      setRules(prev => prev.map(r => 
        r.id === ruleId ? updatedRule : r
      ));
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handlePriorityChange = async (ruleId: string, newPriority: number) => {
    try {
      // Optimistic update
      const newRules = [...rules];
      const ruleIndex = newRules.findIndex(r => r.id === ruleId);
      if (ruleIndex === -1) return;
      
      const [movedRule] = newRules.splice(ruleIndex, 1);
      newRules.splice(newPriority - 1, 0, movedRule);
      
      // Update priorities locally
      const updatedRules = newRules.map((r, index) => ({
        ...r,
        priority: index + 1
      }));
      setRules(updatedRules);

      // Persist change for the specific rule
      // Note: In a real app, we'd want a bulk reorder endpoint
      await guaranteeRulesService.update(ruleId, { priority: newPriority });
      
    } catch (error) {
      console.error('Failed to update priority:', error);
      loadRules(); // Revert on error
    }
  };

  const handleEditRule = (rule: GuaranteeRule) => {
    setEditingRule({ ...rule });
    setSelectedRule(rule);
    setIsDrawerOpen(true);
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;
    
    try {
      let savedRule: GuaranteeRule;
      if (editingRule.id.startsWith('new_')) {
        // Create new
        const { id, createdAt, updatedAt, ...createDto } = editingRule;
        savedRule = await guaranteeRulesService.create(createDto);
        setRules(prev => [...prev, savedRule]);
      } else {
        // Update existing
        savedRule = await guaranteeRulesService.update(editingRule.id, editingRule);
        setRules(prev => prev.map(rule => 
          rule.id === savedRule.id ? savedRule : rule
        ));
      }
      
      setIsDrawerOpen(false);
      setEditingRule(null);
      setSelectedRule(null);
      loadRules(); // Refresh to ensure sort order
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getAppliesToLabel = (appliesTo: string) => {
    switch (appliesTo) {
      case 'CATEGORY': return 'Categories';
      case 'ORDER_TYPE': return 'Order Types';
      case 'TRAVELER': return 'Traveler Verified';
      case 'ALL': return 'All Orders';
      default: return appliesTo;
    }
  };

  const getEscalationLevelLabel = (level: string) => {
    switch (level) {
      case 'TIER_1': return 'Tier 1 (Basic)';
      case 'TIER_2': return 'Tier 2 (Advanced)';
      case 'TIER_3': return 'Tier 3 (Executive)';
      default: return level;
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading guarantee rules...</p>
      </div>
    );
  }

  return (
    <div className={styles.guaranteeRulesManager}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Guarantee Rules Configuration</h2>
        <p className={styles.subtitle}>
          Configure guarantee coverage and auto-actions. Rules are read-only for execution - Control Center handles all decisions.
        </p>
      </div>

      {/* Rules Table */}
      <div className={styles.rulesTable}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow}>
            <div className={styles.columnHeader}>Priority</div>
            <div className={styles.columnHeader}>Rule Name</div>
            <div className={styles.columnHeader}>Applies To</div>
            <div className={styles.columnHeader}>Coverage</div>
            <div className={styles.columnHeader}>Max Amount</div>
            <div className={styles.columnHeader}>Auto Actions</div>
            <div className={styles.columnHeader}>Status</div>
            <div className={styles.columnHeader}>Actions</div>
          </div>
        </div>

        <div className={styles.tableBody}>
          {rules.map((rule, index) => (
            <div key={rule.id} className={styles.tableRow}>
              <div className={styles.priorityCell}>
                <div className={styles.priorityControls}>
                  <button
                    onClick={() => handlePriorityChange(rule.id, Math.max(1, rule.priority - 1))}
                    disabled={rule.priority === 1}
                    className={styles.priorityButton}
                  >
                    ↑
                  </button>
                  <span className={styles.priorityNumber}>{rule.priority}</span>
                  <button
                    onClick={() => handlePriorityChange(rule.id, Math.min(rules.length, rule.priority + 1))}
                    disabled={rule.priority === rules.length}
                    className={styles.priorityButton}
                  >
                    ↓
                  </button>
                </div>
              </div>
              
              <div className={styles.nameCell}>
                <div className={styles.ruleName}>{rule.name}</div>
                <div className={styles.ruleId}>ID: {rule.id}</div>
              </div>
              
              <div className={styles.appliesToCell}>
                <span className={styles.appliesToBadge}>
                  {getAppliesToLabel(rule.appliesTo)}
                </span>
              </div>
              
              <div className={styles.coverageCell}>
                <span className={styles.coverageValue}>{rule.coverage}%</span>
              </div>
              
              <div className={styles.amountCell}>
                <span className={styles.amountValue}>{formatCurrency(rule.maxAmount)}</span>
              </div>
              
              <div className={styles.autoActionsCell}>
                <div className={styles.autoActionBadges}>
                  {rule.autoActions.autoEscalate && (
                    <span className={styles.actionBadge}>Escalate</span>
                  )}
                  {rule.autoActions.autoRefund && (
                    <span className={styles.actionBadge}>Refund</span>
                  )}
                  {rule.autoActions.autoRelease && (
                    <span className={styles.actionBadge}>Release</span>
                  )}
                </div>
              </div>
              
              <div className={styles.statusCell}>
                <button
                  onClick={() => handleToggleRule(rule.id)}
                  className={`${styles.toggleButton} ${rule.enabled ? styles.enabled : styles.disabled}`}
                >
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              
              <div className={styles.actionsCell}>
                <button
                  onClick={() => handleEditRule(rule)}
                  className={styles.editButton}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rule Detail Drawer */}
      {isDrawerOpen && selectedRule && (
        <div className={styles.drawerBackdrop} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>Rule Configuration</h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div className={styles.drawerContent}>
              {editingRule && (
                <>
                  <div className={styles.formSection}>
                    <h4>Basic Information</h4>
                    <div className={styles.formGroup}>
                      <label>Rule Name</label>
                      <input
                        type="text"
                        value={editingRule.name}
                        onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Applies To</label>
                      <select
                        value={editingRule.appliesTo}
                        onChange={(e) => setEditingRule({ ...editingRule, appliesTo: e.target.value as any })}
                        className={styles.select}
                      >
                        <option value="CATEGORY">Categories</option>
                        <option value="ORDER_TYPE">Order Types</option>
                        <option value="TRAVELER">Traveler Verified</option>
                        <option value="ALL">All Orders</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <h4>Coverage Settings</h4>
                    <div className={styles.formGroup}>
                      <label>Coverage Percentage</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editingRule.coverage}
                        onChange={(e) => setEditingRule({ ...editingRule, coverage: parseInt(e.target.value) })}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Maximum Amount</label>
                      <input
                        type="number"
                        min="0"
                        value={editingRule.maxAmount}
                        onChange={(e) => setEditingRule({ ...editingRule, maxAmount: parseFloat(e.target.value) })}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <h4>Auto Actions (Labels Only)</h4>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={editingRule.autoActions.autoEscalate}
                          onChange={(e) => setEditingRule({ 
                            ...editingRule, 
                            autoActions: { ...editingRule.autoActions, autoEscalate: e.target.checked }
                          })}
                        />
                        Auto Escalate
                      </label>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={editingRule.autoActions.autoRefund}
                          onChange={(e) => setEditingRule({ 
                            ...editingRule, 
                            autoActions: { ...editingRule.autoActions, autoRefund: e.target.checked }
                          })}
                        />
                        Auto Refund
                      </label>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={editingRule.autoActions.autoRelease}
                          onChange={(e) => setEditingRule({ 
                            ...editingRule, 
                            autoActions: { ...editingRule.autoActions, autoRelease: e.target.checked }
                          })}
                        />
                        Auto Release
                      </label>
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <h4>Thresholds</h4>
                    <div className={styles.formGroup}>
                      <label>Dispute Threshold (days)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingRule.thresholds.disputeThreshold}
                        onChange={(e) => setEditingRule({ 
                          ...editingRule, 
                          thresholds: { ...editingRule.thresholds, disputeThreshold: parseInt(e.target.value) }
                        })}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Escalation Threshold (days)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingRule.thresholds.escalationThreshold}
                        onChange={(e) => setEditingRule({ 
                          ...editingRule, 
                          thresholds: { ...editingRule.thresholds, escalationThreshold: parseInt(e.target.value) }
                        })}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <h4>Escalation Behavior</h4>
                    <div className={styles.formGroup}>
                      <label>Auto Escalate After (days)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingRule.escalation.autoEscalateAfter}
                        onChange={(e) => setEditingRule({ 
                          ...editingRule, 
                          escalation: { ...editingRule.escalation, autoEscalateAfter: parseInt(e.target.value) }
                        })}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Escalation Level</label>
                      <select
                        value={editingRule.escalation.escalationLevel}
                        onChange={(e) => setEditingRule({ 
                          ...editingRule, 
                          escalation: { ...editingRule.escalation, escalationLevel: e.target.value as any }
                        })}
                        className={styles.select}
                      >
                        <option value="TIER_1">Tier 1 (Basic)</option>
                        <option value="TIER_2">Tier 2 (Advanced)</option>
                        <option value="TIER_3">Tier 3 (Executive)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              <div className={styles.previewContent}>
                <p><strong>Read-Only Preview:</strong> This rule configuration will:</p>
                <ul className={styles.previewList}>
                  <li>Apply to {getAppliesToLabel(selectedRule.appliesTo)}</li>
                  <li>Provide {selectedRule.coverage}% coverage up to {formatCurrency(selectedRule.maxAmount)}</li>
                  <li>Auto-actions: {selectedRule.autoActions.autoEscalate ? 'Escalate' : 'No escalation'}, {selectedRule.autoActions.autoRefund ? 'Refund' : 'No refund'}, {selectedRule.autoActions.autoRelease ? 'Release' : 'No release'}</li>
                  <li>Escalate to {getEscalationLevelLabel(selectedRule.escalation.escalationLevel)} after {selectedRule.escalation.autoEscalateAfter} days</li>
                  <li>Dispute threshold: {selectedRule.thresholds.disputeThreshold} days</li>
                </ul>
                <div className={styles.previewNote}>
                  <strong>Important:</strong> This is configuration only. All execution decisions are made by Control Center.
                </div>
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                className={styles.saveButton}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
