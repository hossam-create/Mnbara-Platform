import { Router } from 'express';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { createAuditLog } from '../utils/audit';
import { AuthRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';

// Joi schema definitions
const kycSchemas = {
  uploadDocument: {
    type: (value: string) => {
      const validTypes = ['passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement'];
      if (!validTypes.includes(value)) {
        throw new Error('Invalid document type');
      }
      return value;
    },
    documentNumber: (value: string) => {
      if (value && value.length > 50) {
        throw new Error('Document number must be 50 characters or less');
      }
      return value;
    },
    issuingCountry: (value: string) => {
      if (value && value.length !== 2) {
        throw new Error('Issuing country must be 2 characters');
      }
      return value?.toUpperCase();
    },
    expiryDate: (value: string) => {
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('Invalid date format, expected YYYY-MM-DD');
      }
      return value;
    },
    fileUrl: (value: string) => {
      if (!value || !value.startsWith('http')) {
        throw new Error('Invalid file URL');
      }
      return value;
    },
    fileHash: (value: string) => {
      if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) {
        throw new Error('Invalid file hash, expected 64 character hex string');
      }
      return value;
    }
  }
};

const router = Router();

// Get KYC documents for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;
    const type = req.query.type as string;

    const where: any = { userId: req.user!.id };
    
    if (status) where.status = status;
    if (type) where.type = type;

    const [documents, total] = await Promise.all([
      prisma.kycDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.kycDocument.count({ where }),
    ]);

    await createAuditLog({
      userId: req.user!.id,
      action: 'KYC_DOCUMENTS_LIST_VIEWED',
      resourceType: 'KYC_DOCUMENT',
      metadata: { query: { page, limit, status, type } },
    });

    return res.json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error getting KYC documents:', error);
    return res.status(500).json({ error: 'Failed to retrieve KYC documents' });
  }
});

// Get specific KYC document
router.get('/:documentId', async (req: AuthRequest, res) => {
  try {
    const { documentId } = req.params;

    const document = await prisma.kycDocument.findFirst({
      where: {
        id: documentId,
        userId: req.user!.id,
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'KYC document not found' });
    }

    await createAuditLog({
      userId: req.user!.id,
      kycDocumentId: documentId,
      action: 'KYC_DOCUMENT_VIEWED',
      resourceType: 'KYC_DOCUMENT',
      resourceId: documentId,
    });

    return res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    logger.error('Error getting KYC document:', error);
    return res.status(500).json({ error: 'Failed to retrieve KYC document' });
  }
});

// Upload KYC document
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { type, documentNumber, issuingCountry, expiryDate, fileUrl, fileHash, metadata } = req.body;

    // Validate required fields
    if (!type || !fileUrl || !fileHash) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Missing required fields: type, fileUrl, fileHash',
      });
    }

    // Validate using embedded schemas
    try {
      kycSchemas.uploadDocument.type(type);
      if (documentNumber) kycSchemas.uploadDocument.documentNumber(documentNumber);
      if (issuingCountry) kycSchemas.uploadDocument.issuingCountry(issuingCountry);
      if (expiryDate) kycSchemas.uploadDocument.expiryDate(expiryDate);
      kycSchemas.uploadDocument.fileUrl(fileUrl);
      kycSchemas.uploadDocument.fileHash(fileHash);
    } catch (validationError) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationError instanceof Error ? validationError.message : 'Unknown validation error',
      });
    }

    // Check if user already has a pending document of this type
    const existingPending = await prisma.kycDocument.findFirst({
      where: {
        userId: req.user!.id,
        type,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      return res.status(409).json({
        error: 'You already have a pending document of this type',
      });
    }

    // Create KYC document
    const document = await prisma.kycDocument.create({
      data: {
        userId: req.user!.id,
        type,
        documentNumber,
        issuingCountry,
        expiryDate,
        fileUrl,
        fileHash,
        status: 'PENDING',
        metadata: metadata ? JSON.stringify(metadata) : Prisma.JsonNull,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      kycDocumentId: document.id,
      action: 'KYC_DOCUMENT_UPLOADED',
      resourceType: 'KYC_DOCUMENT',
      resourceId: document.id,
      metadata: { type, issuingCountry },
    });

    return res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    logger.error('Error uploading KYC document:', error);
    return res.status(500).json({ error: 'Failed to upload KYC document' });
  }
});

// Update KYC document (admin only)
router.put('/:documentId/status', async (req: AuthRequest, res) => {
  try {
    const { documentId } = req.params;
    const { status, rejectionReason } = req.body;

    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Validate status
    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const document = await prisma.kycDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ error: 'KYC document not found' });
    }

    // Update document status
    const updatedDocument = await prisma.kycDocument.update({
      where: { id: documentId },
      data: {
        status,
        rejectionReason,
        verifiedBy: req.user!.id,
        verifiedAt: new Date(),
      },
    });

    // If approved, update user's KYC status
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: document.userId },
        data: {
          kycStatus: 'VERIFIED',
          kycVerifiedAt: new Date(),
        },
      });
    }

    await createAuditLog({
      userId: req.user!.id,
      kycDocumentId: documentId,
      action: 'KYC_DOCUMENT_STATUS_UPDATED',
      resourceType: 'KYC_DOCUMENT',
      resourceId: documentId,
      metadata: {
        oldStatus: document.status,
        newStatus: status,
        rejectionReason,
      },
    });

    return res.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error) {
    logger.error('Error updating KYC document status:', error);
    return res.status(500).json({ error: 'Failed to update KYC document status' });
  }
});

// Get KYC statistics (admin only)
router.get('/stats/overview', async (req: AuthRequest, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await Promise.all([
      // Total documents by status
      prisma.kycDocument.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Total documents by type
      prisma.kycDocument.groupBy({
        by: ['type'],
        _count: true,
      }),
      // Documents pending review (last 30 days)
      prisma.kycDocument.count({
        where: {
          status: 'PENDING',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const [statusStats, typeStats, pendingCount] = stats;

    await createAuditLog({
      userId: req.user!.id,
      action: 'KYC_STATS_VIEWED',
      resourceType: 'KYC_DOCUMENT',
      metadata: { stats: { statusStats, typeStats, pendingCount } },
    });

    return res.json({
      success: true,
      data: {
        statusStats,
        typeStats,
        pendingCount,
      },
    });
  } catch (error) {
    logger.error('Error getting KYC statistics:', error);
    return res.status(500).json({ error: 'Failed to retrieve KYC statistics' });
  }
});

export default router;