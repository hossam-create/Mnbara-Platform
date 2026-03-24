import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SubscriptionGate } from '../../subscription-service/src/SubscriptionGate';

const prisma = new PrismaClient();

/**
 * Request item from traveler - with subscription gate
 * This endpoint requires premium subscription
 */
export const requestItemFromTraveler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { travelerId, productId, message } = req.body;

    // Check subscription access for this feature
    const accessCheck = await SubscriptionGate.checkFeatureAccess(
      userId, 
      'request-item-from-traveler'
    );

    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Subscription required',
        message: accessCheck.message || 'Upgrade to Premium to request items from travelers',
        action: 'upgrade',
        requiredPlan: accessCheck.requiredPlan,
        currentPlan: accessCheck.currentPlan,
        upgradeUrl: '/upgrade'
      });
    }

    // User has access - proceed with the request
    const { travelerId, productId, message } = req.body;

    // Validate input
    if (!travelerId || !productId) {
      return res.status(400).json({
        success: false,
        error: 'Traveler ID and Product ID are required'
      });
    }

    // Check if traveler exists and is available
    const traveler = await prisma.traveler.findFirst({
      where: {
        id: travelerId,
        isActive: true,
        // Add other availability checks here
      }
    });

    if (!traveler) {
      return res.status(404).json({
        success: false,
        error: 'Traveler not found or unavailable'
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Create the request
    const request = await prisma.itemRequest.create({
      data: {
        userId,
        travelerId,
        productId,
        message: message || '',
        status: 'PENDING',
        createdAt: new Date()
      },
      include: {
        traveler: {
          select: {
            id: true,
            name: true,
            rating: true,
            avatar: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
      }
    });

    // Record feature usage for analytics
    await SubscriptionGate.recordFeatureUsage(userId, 'request-item-from-traveler');

    res.status(201).json({
      success: true,
      data: request,
      message: 'Request sent successfully to traveler'
    });

  } catch (error) {
    console.error('Error requesting item from traveler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send request to traveler'
    });
  }
};

/**
 * Get user's item requests
 */
export const getUserItemRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, status } = req.query;

    const where: any = { userId };
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.itemRequest.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          traveler: {
            select: {
              id: true,
              name: true,
              rating: true,
              avatar: true
            }
          },
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              images: {
                where: { isPrimary: true },
                take: 1
              }
            }
          }
        }
      }),
      prisma.itemRequest.count({ where })
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests'
    });
  }
};

/**
 * Traveler responds to item request
 */
export const respondToItemRequest = async (req: Request, res: Response) => {
  try {
    const travelerId = (req as any).user.id;
    const { requestId, response, message } = req.body;

    // Validate input
    if (!requestId || !response || !['ACCEPTED', 'REJECTED'].includes(response)) {
      return res.status(400).json({
        success: false,
        error: 'Valid request ID and response (ACCEPTED/REJECTED) are required'
      });
    }

    // Find the request and verify it belongs to this traveler
    const request = await prisma.itemRequest.findFirst({
      where: {
        id: requestId,
        travelerId
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found or not authorized'
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Request has already been responded to'
      });
    }

    // Update the request
    const updatedRequest = await prisma.itemRequest.update({
      where: { id: requestId },
      data: {
        status: response,
        responseMessage: message,
        respondedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: `Request ${response.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error('Error responding to request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to respond to request'
    });
  }
};