import { Router, Request, Response } from 'express';
import { DataRoomService } from '../services/data-room/DataRoomService';
import { DataRoomPackGenerator } from '../services/data-room/DataRoomPackGenerator';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const dataRoomService = new DataRoomService();
const dataRoomPackGenerator = new DataRoomPackGenerator();

// Middleware to check data room access
const checkDataRoomAccess = async (req: Request, res: Response, next: any) => {
  try {
    const userId = (req as any).user?.id;
    const businessAccountId = req.params.businessAccountId || req.body.businessAccountId;
    
    if (!userId || !businessAccountId) {
      return res.status(401).json({ error: 'Unauthorized - Missing user or business account' });
    }
    
    const access = await dataRoomService.getDataRoomAccess(userId, businessAccountId);
    
    if (!access) {
      return res.status(403).json({ error: 'Forbidden - No data room access granted' });
    }
    
    // Update last accessed timestamp
    await dataRoomService.updateLastAccessed(userId, businessAccountId);
    
    // Attach access to request for later use
    (req as any).dataRoomAccess = access;
    next();
  } catch (error) {
    console.error('Data room access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Data Room Structure Routes
router.post('/structure', authenticateToken, requireRole(['admin', 'data_room_admin']), async (req: Request, res: Response) => {
  try {
    const { businessAccountId } = req.body;
    
    await dataRoomService.generateDataRoomStructure(businessAccountId, (req as any).user.id);
    
    res.status(201).json({ message: 'Data room structure generated successfully' });
  } catch (error) {
    console.error('Generate data room structure error:', error);
    res.status(500).json({ error: 'Failed to generate data room structure' });
  }
});

router.post('/folders', authenticateToken, requireRole(['admin', 'data_room_admin']), checkDataRoomAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).dataRoomAccess;
    
    if (!access.canUploadDocuments) {
      return res.status(403).json({ error: 'Forbidden - No upload access' });
    }
    
    const folder = await dataRoomService.createFolder({
      ...req.body,
      businessAccountId: req.params.businessAccountId,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(folder);
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

router.get('/business-accounts/:businessAccountId/folders', authenticateToken, checkDataRoomAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).dataRoomAccess;
    
    // Check folder type access based on permissions
    let folderType = req.query.folderType as string;
    if (folderType) {
      const hasAccess = 
        (folderType === 'financial' && access.canViewFinancial) ||
        (folderType === 'legal' && access.canViewLegal) ||
        (folderType === 'operational' && access.canViewOperational) ||
        (folderType === 'governance' && access.canViewGovernance) ||
        (folderType === 'contracts' && access.canViewContracts) ||
        (folderType === 'tax' && access.canViewTax) ||
        (folderType === 'risk' && access.canViewRisk) ||
        (folderType === 'kpi' && access.canViewKpi);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Forbidden - No access to this folder type' });
      }
    }
    
    const folders = await dataRoomService.getFolders(req.params.businessAccountId, req.query);
    res.json(folders);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to get folders' });
  }
});

// Document Management Routes
router.post('/documents', authenticateToken, requireRole(['admin', 'data_room_admin']), checkDataRoomAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).dataRoomAccess;
    
    if (!access.canUploadDocuments) {
      return res.status(403).json({ error: 'Forbidden - No upload access' });
    }
    
    const document = await dataRoomService.uploadDocument({
      ...req.body,
      businessAccountId: req.params.businessAccountId,
      uploadedBy: (req as any).user.id
    });
    
    // Log activity
    await dataRoomService.logActivity({
      businessAccountId: req.params.businessAccountId,
      activityType: 'document_uploaded',
      activityDescription: `Document uploaded: ${document.documentName}`,
      entityType: 'document',
      entityId: document.id,
      entityName: document.documentName,
      performedBy: (req as any).user.id,
      userRole: access.accessRole,
      dataVolumeBytes: document.fileSizeBytes,
      accessMethod: 'direct'
    });
    
    res.status(201).json(document);
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.get('/business-accounts/:businessAccountId/documents', authenticateToken, checkDataRoomAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).dataRoomAccess;
    
    const documents = await dataRoomService.getDocuments(req.params.businessAccountId, req.query);
    
    // Filter based on access permissions
    const filteredDocuments = documents.filter(doc => {
      if (doc.dataClassification === 'financial' && !access.canViewFinancial) return false;
      if (doc.dataClassification === 'legal' && !access.canViewLegal) return false;
      if (doc.dataClassification === 'operational' && !access.canViewOperational) return false;
      if (doc.dataClassification === 'governance' && !access.canViewGovernance) return false;
      return true;
    });
    
    res.json(filteredDocuments);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

// Evidence Pack Management Routes
router.post('/evidence-packs', authenticateToken, requireRole(['admin', 'data_room_admin']), checkDataRoomAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).dataRoomAccess;
    
    if (!access.canDownloadDocuments) {
      return res.status(403).json({ error: 'Forbidden - No pack generation access' });
    }
    
    const packId = await dataRoomService.generateEvidencePack({
      ...req.body,
      businessAccountId: req.params.businessAccountId,
      generatedBy: (req as any).user.id
    });
    
    res.status(201).json({ packId });
  } catch (error) {
    console.error('Generate evidence pack error:', error);
    res.status(500).json({ error: 'Failed to generate evidence pack' });
  }
});

router.get('/business-accounts/:businessAccountId/evidence-packs', authenticateToken, checkDataRoomAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).dataRoomAccess;
    
    if (!access.canDownloadDocuments) {
      return res.status(403).json({ error: 'Forbidden - No pack access' });
    }
    
    const evidencePacks = await dataRoomService.getEvidencePacks(req.params.businessAccountId, req.query);
    res.json(evidencePacks);
  } catch (error) {
    console.error('Get evidence packs error:', error);
    res.status(500).json({ error: 'Failed to get evidence packs' });
  }
});

// Generate Data Room Pack
router.post('/generate-pack', authenticateToken, checkDataRoomAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).dataRoomAccess;
    
    if (!access.canDownloadDocuments) {
      return res.status(403).json({ error: 'Forbidden - No pack generation access' });
    }
    
    const { packType, language = 'en' } = req.body;
    
    // Generate pack content
    const packContent = await dataRoomPackGenerator.generatePackContent(
      req.params.businessAccountId,
      packType,
      language
    );
    
    res.status(201).json({
      packContent,
      generatedAt: new Date().toISOString(),
      language,
      generatedBy: (req as any).user.id
    });
  } catch (error) {
    console.error('Generate data room pack error:', error);
    res.status(500).json({ error: 'Failed to generate data room pack' });
  }
});

// External Access Routes
router.post('/external-access', authenticateToken, requireRole(['admin', 'data_room_admin']), checkDataRoomAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).dataRoomAccess;
    
    if (!access.canShareDocuments) {
      return res.status(403).json({ error: 'Forbidden - No external sharing access' });
    }
    
    const { folderId, documentId, accessLevel, expiresHours, accessTitle } = req.body;
    
    const accessToken = await dataRoomService.generateExternalAccessToken(
      req.params.businessAccountId,
      folderId,
      documentId,
      accessLevel,
      expiresHours,
      accessTitle,
      (req as any).user.id
    );
    
    const accessLink = `${process.env['BASE_URL'] || 'http://localhost:3000'}/data-room/share/${accessToken}`;
    
    res.status(201).json({
      accessToken,
      accessLink,
      expiresAt: new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString(),
      accessLevel
    });
  } catch (error) {
    console.error('Generate external access error:', error);
    res.status(500).json({ error: 'Failed to generate external access' });
  }
});

// Public Share Link Access (no authentication required)
router.get('/share/:accessToken', async (req: Request, res: Response) => {
  try {
    const accessToken = req.params.accessToken;
    
    const externalAccess = await dataRoomService.getExternalAccessByToken(accessToken);
    
    if (!externalAccess) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }
    
    // Check if expired
    if (new Date(externalAccess.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Share link expired' });
    }
    
    // Log access
    await dataRoomService.logActivity({
      businessAccountId: externalAccess.businessAccountId,
      activityType: 'external_link_accessed',
      activityDescription: `External share link accessed: ${externalAccess.accessTitle}`,
      entityType: 'external_link',
      entityId: externalAccess.id,
      entityName: externalAccess.accessTitle,
      accessMethod: 'external_link',
      externalAccessToken: accessToken
    });
    
    res.json({
      externalAccess,
      accessLevel: externalAccess.accessLevel,
      expiresAt: externalAccess.expiresAt
    });
  } catch (error) {
    console.error('Access external link error:', error);
    res.status(500).json({ error: 'Failed to access external link' });
  }
});

// Access Control Management Routes (Admin only)
router.post('/access-control', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const access = await dataRoomService.grantDataRoomAccess({
      ...req.body,
      grantedBy: (req as any).user.id
    });
    
    res.status(201).json(access);
  } catch (error) {
    console.error('Grant data room access error:', error);
    res.status(500).json({ error: 'Failed to grant data room access' });
  }
});

router.get('/access-control/:userId/:businessAccountId', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const access = await dataRoomService.getDataRoomAccess(req.params.userId, req.params.businessAccountId);
    res.json(access);
  } catch (error) {
    console.error('Get data room access error:', error);
    res.status(500).json({ error: 'Failed to get data room access' });
  }
});

// Analytics and Reporting Routes
router.get('/business-accounts/:businessAccountId/document-summary', authenticateToken, checkDataRoomAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).dataRoomAccess;
    
    // Check if user has any view access
    const hasViewAccess = access.canViewFinancial || access.canViewLegal || access.canViewOperational || 
                        access.canViewGovernance || access.canViewContracts || access.canViewTax || 
                        access.canViewRisk || access.canViewKpi;
    
    if (!hasViewAccess) {
      return res.status(403).json({ error: 'Forbidden - No view access' });
    }
    
    const documentSummary = await dataRoomService.getDocumentSummary(req.params.businessAccountId);
    res.json(documentSummary);
  } catch (error) {
    console.error('Get document summary error:', error);
    res.status(500).json({ error: 'Failed to get document summary' });
  }
});

router.get('/business-accounts/:businessAccountId/access-summary', authenticateToken, checkDataRoomAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).dataRoomAccess;
    
    if (!access.canViewGovernance) {
      return res.status(403).json({ error: 'Forbidden - No governance access' });
    }
    
    const accessSummary = await dataRoomService.getAccessSummary(req.params.businessAccountId);
    res.json(accessSummary);
  } catch (error) {
    console.error('Get access summary error:', error);
    res.status(500).json({ error: 'Failed to get access summary' });
  }
});

router.get('/business-accounts/:businessAccountId/activity-summary', authenticateToken, checkDataRoomAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).dataRoomAccess;
    
    if (!access.canViewGovernance) {
      return res.status(403).json({ error: 'Forbidden - No governance access' });
    }
    
    const activitySummary = await dataRoomService.getActivitySummary(req.params.businessAccountId, req.query);
    res.json(activitySummary);
  } catch (error) {
    console.error('Get activity summary error:', error);
    res.status(500).json({ error: 'Failed to get activity summary' });
  }
});

// Refresh Analytics (Admin only)
router.post('/refresh-analytics', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    await dataRoomService.refreshDataRoomAnalytics();
    res.json({ message: 'Data room analytics refreshed successfully' });
  } catch (error) {
    console.error('Refresh data room analytics error:', error);
    res.status(500).json({ error: 'Failed to refresh data room analytics' });
  }
});

// Data Room Dashboard Summary
router.get('/business-accounts/:businessAccountId/dashboard', authenticateToken, checkDataRoomAccess, async (req: Request, res: Response) => {
  try {
    const businessAccountId = req.params.businessAccountId;
    const access = (req as any).dataRoomAccess;
    
    // Get dashboard data based on access permissions
    const dashboard: any = {};
    
    // Document summary (if any view access)
    const hasViewAccess = access.canViewFinancial || access.canViewLegal || access.canViewOperational || 
                        access.canViewGovernance || access.canViewContracts || access.canViewTax || 
                        access.canViewRisk || access.canViewKpi;
    
    if (hasViewAccess) {
      dashboard.documentSummary = await dataRoomService.getDocumentSummary(businessAccountId);
    }
    
    // Access summary (governance access required)
    if (access.canViewGovernance) {
      dashboard.accessSummary = await dataRoomService.getAccessSummary(businessAccountId);
      dashboard.activitySummary = await dataRoomService.getActivitySummary(businessAccountId);
    }
    
    // Evidence packs (download access required)
    if (access.canDownloadDocuments) {
      dashboard.evidencePacks = await dataRoomService.getEvidencePacks(businessAccountId, { limit: 5 });
    }
    
    res.json(dashboard);
  } catch (error) {
    console.error('Get data room dashboard error:', error);
    res.status(500).json({ error: 'Failed to get data room dashboard data' });
  }
});

export default router;
