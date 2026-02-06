/**
 * Image Routes - Integration with file-storage-service
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// POST /images/upload - Get presigned URL for upload
router.post('/upload', asyncHandler(async (req: Request, res: Response) => {
    const { fileName, contentType, productId } = req.body;

    // Return mock presigned URL for now
    res.json({
        success: true,
        data: {
            uploadUrl: `https://mock-storage.example.com/upload/${productId}/${fileName}`,
            fileUrl: `https://mock-storage.example.com/files/${productId}/${fileName}`,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
        }
    });
}));

// POST /images/thumbnail - Generate thumbnail
router.post('/thumbnail', asyncHandler(async (req: Request, res: Response) => {
    const { imageUrl, width, height } = req.body;

    res.json({
        success: true,
        data: {
            thumbnailUrl: imageUrl + '?w=' + (width || 200) + '&h=' + (height || 200),
        }
    });
}));

// DELETE /images/:productId/:imageId - Delete image
router.delete('/:productId/:imageId', asyncHandler(async (req: Request, res: Response) => {
    const { productId, imageId } = req.params;

    res.json({
        success: true,
        message: 'Image deleted',
        data: { productId, imageId }
    });
}));

export { router as imageRoutes };
