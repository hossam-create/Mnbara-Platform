"use strict";
/**
 * DecisionAuthorityClient - Thin HTTP client for Decision Authority Service
 *
 * RULES:
 * - NO business logic
 * - NO knowledge of Custodii
 * - NO shared databases
 * - Feature-flag driven (DECISION_AUTHORITY_ENABLED)
 * - Minimal, reversible integration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionAuthorityClient = exports.AssetType = exports.DecisionStatus = void 0;
const axios_1 = __importDefault(require("axios"));
var DecisionStatus;
(function (DecisionStatus) {
    DecisionStatus["PENDING"] = "PENDING";
    DecisionStatus["APPROVED"] = "APPROVED";
    DecisionStatus["REJECTED"] = "REJECTED";
    DecisionStatus["EXPIRED"] = "EXPIRED";
    DecisionStatus["CANCELLED"] = "CANCELLED";
})(DecisionStatus || (exports.DecisionStatus = DecisionStatus = {}));
var AssetType;
(function (AssetType) {
    AssetType["LISTING"] = "LISTING";
    AssetType["AUCTION"] = "AUCTION";
    AssetType["ESCROW_RELEASE"] = "ESCROW_RELEASE";
})(AssetType || (exports.AssetType = AssetType = {}));
class DecisionAuthorityClient {
    constructor(config) {
        this.enabled = config.enabled;
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Check if Decision Authority integration is enabled
     */
    isEnabled() {
        return this.enabled;
    }
    /**
     * Request a decision for an asset
     * Returns null if integration is disabled
     */
    async requestDecision(request) {
        if (!this.enabled) {
            return null;
        }
        try {
            const response = await this.client.post('/api/v1/decisions', request);
            return response.data;
        }
        catch (error) {
            // Log error but don't throw - allow fallback behavior
            console.error('[DecisionAuthorityClient] Request failed:', error);
            throw error;
        }
    }
    /**
     * Get decision by ID
     * Returns null if integration is disabled
     */
    async getDecision(id) {
        if (!this.enabled) {
            return null;
        }
        try {
            const response = await this.client.get(`/api/v1/decisions/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('[DecisionAuthorityClient] Get decision failed:', error);
            throw error;
        }
    }
    /**
     * Get decision by decision ID (source decision ID)
     * Returns null if integration is disabled
     */
    async getDecisionByDecisionId(decisionId) {
        if (!this.enabled) {
            return null;
        }
        try {
            const response = await this.client.get(`/api/v1/decisions/by-decision-id/${decisionId}`);
            return response.data;
        }
        catch (error) {
            console.error('[DecisionAuthorityClient] Get decision by decisionId failed:', error);
            throw error;
        }
    }
    /**
     * Get decisions for an asset
     * Returns empty array if integration is disabled
     */
    async getDecisionsByAsset(assetType, assetId) {
        if (!this.enabled) {
            return [];
        }
        try {
            const response = await this.client.get(`/api/v1/decisions/asset/${assetType}/${assetId}`);
            return response.data;
        }
        catch (error) {
            console.error('[DecisionAuthorityClient] Get decisions by asset failed:', error);
            throw error;
        }
    }
}
exports.DecisionAuthorityClient = DecisionAuthorityClient;
