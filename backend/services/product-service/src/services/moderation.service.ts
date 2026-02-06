/**
 * Moderation Service - Product Content Moderation
 * 
 * Handles content moderation, restricted keywords, and moderation workflows
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { ModerationStatus, ModerationAction } from '@prisma/client';

interface ModerationCheckResult {
    blocked: boolean;
    flagged: boolean;
    reason?: string;
}

interface ModerationLogParams {
    productId: string;
    action: ModerationAction;
    previousStatus?: ModerationStatus;
    newStatus: ModerationStatus;
    reason?: string;
    moderatorId?: string;
}

// Restricted keywords for automatic filtering
const RESTRICTED_KEYWORDS = [
    // Illegal items
    'drugs', 'weapons', 'counterfeit', 'stolen',
    // Prohibited content
    'adult', 'explicit', 'inappropriate',
    // Fraud indicators
    'scam', 'fake', 'replica', 'knockoff',
];

export class ModerationService {
    /**
     * Check content for violations
     */
    async checkContent(title: string, description: string): Promise<ModerationCheckResult> {
        const combined = `${title} ${description}`.toLowerCase();
        
        // Check for explicit violations
        const blockedKeywords = await this.getBlockedKeywords();
        for (const keyword of blockedKeywords) {
            if (combined.includes(keyword.toLowerCase())) {
                return {
                    blocked: true,
                    flagged: true,
                    reason: `Contains restricted keyword: ${keyword}`
                };
            }
        }

        // Check for suspicious patterns
        const suspiciousPatterns = await this.getSuspiciousPatterns();
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(combined)) {
                return {
                    blocked: false,
                    flagged: true,
                    reason: 'Content flagged for review due to suspicious patterns'
                };
            }
        }

        return { blocked: false, flagged: false };
    }

    /**
     * Check for restricted keywords
     */
    async checkRestrictedKeywords(text: string): Promise<ModerationCheckResult> {
        const lowerText = text.toLowerCase();
        
        const restricted = await prisma.restrictedProduct.findMany({
            where: { isActive: true },
        });

        for (const item of restricted) {
            if (lowerText.includes(item.keyword.toLowerCase())) {
                if (item.severity === 'BLOCK') {
                    return {
                        blocked: true,
                        flagged: true,
                        reason: `Blocked keyword: ${item.keyword}`
                    };
                } else if (item.severity === 'FLAG_FOR_REVIEW') {
                    return {
                        blocked: false,
                        flagged: true,
                        reason: `Flagged keyword: ${item.keyword}`
                    };
                }
            }
        }

        return { blocked: false, flagged: false };
    }

    /**
     * Get all blocked keywords
     */
    private async getBlockedKeywords(): Promise<string[]> {
        const restricted = await prisma.restrictedProduct.findMany({
            where: { isActive: true, severity: { in: ['BLOCK', 'FLAG_FOR_REVIEW'] } },
            select: { keyword: true }
        });
        return restricted.map(r => r.keyword);
    }

    /**
     * Get suspicious patterns for regex matching
     */
    private async getSuspiciousPatterns(): Promise<RegExp[]> {
        return [
            /\b(cheap|fake|replica)\s+(brand|watch|bag|shoe)/i,
            /\b(\$|USD)\s*0*[1-9]\d*/i, // Suspiciously low prices
            /\b(call\s*me|whatsapp|email)\s*(now|immediately)/i,
        ];
    }

    /**
     * Log moderation action
     */
    async logAction(params: ModerationLogParams): Promise<void> {
        await prisma.moderationLog.create({
            data: {
                productId: params.productId,
                action: params.action,
                previousStatus: params.previousStatus,
                newStatus: params.newStatus,
                reason: params.reason,
                moderatorId: params.moderatorId,
            }
        });

        logger.info('Moderation action logged', params);
    }

    /**
     * Approve product
     */
    async approveProduct(productId: string, moderatorId: string): Promise<void> {
        await prisma.$transaction([
            prisma.product.update({
                where: { id: productId },
                data: {
                    moderationStatus: ModerationStatus.APPROVED,
                    status: 'DRAFT', // Will be published after approval
                    restrictedFlag: false,
                }
            }),
            prisma.moderationLog.create({
                data: {
                    productId,
                    action: 'APPROVED',
                    newStatus: ModerationStatus.APPROVED,
                    moderatorId,
                }
            })
        ]);

        logger.info('Product approved', { productId, moderatorId });
    }

    /**
     * Reject product
     */
    async rejectProduct(productId: string, reason: string, moderatorId: string): Promise<void> {
        await prisma.$transaction([
            prisma.product.update({
                where: { id: productId },
                data: {
                    moderationStatus: ModerationStatus.REJECTED,
                    status: 'REJECTED',
                    moderationNote: reason,
                }
            }),
            prisma.moderationLog.create({
                data: {
                    productId,
                    action: 'REJECTED',
                    newStatus: ModerationStatus.REJECTED,
                    reason,
                    moderatorId,
                }
            })
        ]);

        logger.info('Product rejected', { productId, moderatorId, reason });
    }

    /**
     * Flag product for review
     */
    async flagProduct(productId: string, reason: string): Promise<void> {
        await prisma.$transaction([
            prisma.product.update({
                where: { id: productId },
                data: {
                    moderationStatus: ModerationStatus.FLAGGED,
                    restrictedFlag: true,
                    restrictedReason: reason,
                }
            }),
            prisma.moderationLog.create({
                data: {
                    productId,
                    action: 'FLAGGED',
                    newStatus: ModerationStatus.FLAGGED,
                    reason,
                }
            })
        ]);

        logger.info('Product flagged', { productId, reason });
    }

    /**
     * Get moderation stats
     */
    async getModerationStats(): Promise<{
        pending: number;
        approved: number;
        rejected: number;
        flagged: number;
    }> {
        const [pending, approved, rejected, flagged] = await Promise.all([
            prisma.product.count({ where: { moderationStatus: ModerationStatus.PENDING } }),
            prisma.product.count({ where: { moderationStatus: ModerationStatus.APPROVED } }),
            prisma.product.count({ where: { moderationStatus: ModerationStatus.REJECTED } }),
            prisma.product.count({ where: { moderationStatus: ModerationStatus.FLAGGED } }),
        ]);

        return { pending, approved, rejected, flagged };
    }

    /**
     * Get products pending moderation
     */
    async getPendingProducts(page: number = 1, limit: number = 20): Promise<any[]> {
        return prisma.product.findMany({
            where: {
                moderationStatus: ModerationStatus.PENDING
            },
            include: {
                images: { take: 1 },
                category: { select: { nameEn: true, nameAr: true } },
                seller: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    /**
     * Add restricted keyword
     */
    async addRestrictedKeyword(
        keyword: string,
        severity: 'WARN' | 'BLOCK' | 'FLAG_FOR_REVIEW',
        messageEn: string,
        messageAr: string,
        category?: string
    ): Promise<void> {
        await prisma.restrictedProduct.create({
            data: {
                keyword,
                severity,
                messageEn,
                messageAr,
                category,
                isActive: true,
            }
        });

        logger.info('Restricted keyword added', { keyword, severity });
    }

    /**
     * Get moderation logs for a product
     */
    async getProductLogs(productId: string): Promise<any[]> {
        return prisma.moderationLog.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
        });
    }
}

export const moderationService = new ModerationService();
