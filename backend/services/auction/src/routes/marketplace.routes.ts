import { Router, Request, Response } from 'express';
import { marketplaceService } from '../services/Marketplace.service';
import { BuyerRequestRequest, TravelerAvailabilityRequest, TravelerOfferRequest } from '../types/Marketplace.types';

/**
 * Marketplace Routes - BACKEND ONLY
 * 
 * Implements CORE MARKETPLACE JOURNEYS for BUYER and TRAVELER
 * This is the CORE VALUE of the platform, not a feature
 * 
 * ABSOLUTE RULES:
 * - Frontend has ZERO authority
 * - All matching, state changes, and eligibility are BACKEND ONLY
 * - Frontend only submits intent and displays backend state
 * - No wallet, escrow, or settlement mutation here
 * - No silent automation — everything logged
 */

const router = Router();

/**
 * POST /api/v1/auction/marketplace/buyer-requests
 * 
 * Create buyer request
 * Buyer submits a PRODUCT REQUEST (product link or description)
 */
router.post('/buyer-requests', async (req: Request, res: Response) => {
  try {
    const buyerRequest: BuyerRequestRequest = {
      productLink: req.body.productLink,
      productDescription: req.body.productDescription,
      category: req.body.category,
      preferredDeliveryDate: req.body.preferredDeliveryDate ? new Date(req.body.preferredDeliveryDate) : undefined,
      maxBudget: req.body.maxBudget,
      currency: req.body.currency,
      destinationCountry: req.body.destinationCountry,
      destinationCity: req.body.destinationCity,
      specialInstructions: req.body.specialInstructions,
      requirements: req.body.requirements
    };

    const buyerId = req.body.buyerId; // Would come from auth middleware

    // Validate required fields
    if (!buyerRequest.productDescription || !buyerRequest.category || !buyerRequest.destinationCountry || !buyerRequest.currency) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: productDescription, category, destinationCountry, currency'
      });
    }

    // Create buyer request
    const result = marketplaceService.createBuyerRequest(buyerRequest, buyerId);

    if (result.success) {
      res.status(201).json({
        success: true,
        request: result.request,
        expiresAt: result.expiresAt
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[Marketplace] Error creating buyer request:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create buyer request'
    });
  }
});

/**
 * POST /api/v1/auction/marketplace/traveler-availabilities
 * 
 * Create traveler availability
 * Traveler registers AVAILABILITY (route, countries, dates, capacity)
 */
router.post('/traveler-availabilities', async (req: Request, res: Response) => {
  try {
    const availabilityRequest: TravelerAvailabilityRequest = {
      route: req.body.route,
      dates: req.body.dates,
      capacity: req.body.capacity,
      services: req.body.services,
      pricing: req.body.pricing,
      restrictions: req.body.restrictions
    };

    const travelerId = req.body.travelerId; // Would come from auth middleware

    // Validate required fields
    if (!availabilityRequest.route?.from?.country || !availabilityRequest.route?.to?.country || 
        !availabilityRequest.dates?.availableFrom || !availabilityRequest.dates?.availableTo ||
        !availabilityRequest.capacity || !availabilityRequest.pricing?.baseRate || !availabilityRequest.pricing?.currency) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: route (from/to countries), dates, capacity, pricing (baseRate, currency)'
      });
    }

    // Create traveler availability
    const result = marketplaceService.createTravelerAvailability(availabilityRequest, travelerId);

    if (result.success) {
      res.status(201).json({
        success: true,
        availability: result.availability
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[Marketplace] Error creating traveler availability:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create traveler availability'
    });
  }
});

/**
 * POST /api/v1/auction/marketplace/traveler-offers
 * 
 * Submit traveler offer
 * Traveler can SUBMIT OFFER to fulfill request
 */
router.post('/traveler-offers', async (req: Request, res: Response) => {
  try {
    const offerRequest: TravelerOfferRequest = {
      requestId: req.body.requestId,
      proposedPrice: req.body.proposedPrice,
      currency: req.body.currency,
      deliveryDate: new Date(req.body.deliveryDate),
      deliveryMethod: req.body.deliveryMethod,
      specialTerms: req.body.specialTerms,
      terms: req.body.terms,
      communication: req.body.communication
    };

    const travelerId = req.body.travelerId; // Would come from auth middleware

    // Validate required fields
    if (!offerRequest.requestId || !offerRequest.proposedPrice || !offerRequest.currency || !offerRequest.deliveryDate || !offerRequest.deliveryMethod) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: requestId, proposedPrice, currency, deliveryDate, deliveryMethod'
      });
    }

    // Submit traveler offer
    const result = marketplaceService.submitTravelerOffer(offerRequest, travelerId);

    if (result.success) {
      res.status(201).json({
        success: true,
        offer: result.offer,
        expiresAt: result.expiresAt
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[Marketplace] Error submitting traveler offer:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to submit traveler offer'
    });
  }
});

/**
 * POST /api/v1/auction/marketplace/offers/:offerId/accept
 * 
 * Accept traveler offer
 * Buyer can ACCEPT or REJECT traveler offers
 */
router.post('/offers/:offerId/accept', async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params;
    const { requestId, buyerId } = req.body;

    // Validate required fields
    if (!requestId || !buyerId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: requestId, buyerId'
      });
    }

    // Accept offer
    const result = marketplaceService.acceptOffer(requestId, offerId, buyerId);

    if (result.success) {
      res.json({
        success: true,
        match: result.match
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[Marketplace] Error accepting offer:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to accept offer'
    });
  }
});

/**
 * POST /api/v1/auction/marketplace/offers/:offerId/reject
 * 
 * Reject traveler offer
 */
router.post('/offers/:offerId/reject', async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params;
    const { buyerId } = req.body;

    // Validate required fields
    if (!buyerId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: buyerId'
      });
    }

    // Reject offer
    const result = marketplaceService.rejectOffer(offerId, buyerId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Offer rejected successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[Marketplace] Error rejecting offer:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reject offer'
    });
  }
});

// ===== ADMIN VISIBILITY ENDPOINTS (READ ONLY) =====

/**
 * GET /api/v1/auction/marketplace/admin/buyer-requests
 * 
 * Get all buyer requests (admin only)
 */
router.get('/admin/buyer-requests', async (req: Request, res: Response) => {
  try {
    const { buyerId, state, limit } = req.query;
    
    let requests = Array.from(marketplaceService.getEventLog().length > 0 ? [] : []); // This would be implemented in service
    
    // Filter by buyer ID if provided
    if (buyerId) {
      requests = marketplaceService.getRequestsForBuyer(buyerId as string);
    }
    
    // Filter by state if provided
    if (state) {
      requests = requests.filter(req => req.state === state);
    }
    
    // Apply limit if provided
    if (limit) {
      requests = requests.slice(0, parseInt(limit as string));
    }

    res.json({
      success: true,
      requests,
      count: requests.length
    });

  } catch (error) {
    console.error('[Marketplace] Error getting buyer requests:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve buyer requests'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/admin/traveler-availabilities
 * 
 * Get all traveler availabilities (admin only)
 */
router.get('/admin/traveler-availabilities', async (req: Request, res: Response) => {
  try {
    const { travelerId, state, limit } = req.query;
    
    let availabilities = [];
    
    // Filter by traveler ID if provided
    if (travelerId) {
      availabilities = marketplaceService.getAvailabilitiesForTraveler(travelerId as string);
    }
    
    // Filter by state if provided
    if (state) {
      availabilities = availabilities.filter(avail => avail.state === state);
    }
    
    // Apply limit if provided
    if (limit) {
      availabilities = availabilities.slice(0, parseInt(limit as string));
    }

    res.json({
      success: true,
      availabilities,
      count: availabilities.length
    });

  } catch (error) {
    console.error('[Marketplace] Error getting traveler availabilities:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve traveler availabilities'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/admin/offers
 * 
 * Get all offers (admin only)
 */
router.get('/admin/offers', async (req: Request, res: Response) => {
  try {
    const { requestId, travelerId, state, limit } = req.query;
    
    let offers = [];
    
    // Filter by request ID if provided
    if (requestId) {
      offers = marketplaceService.getOffersForRequest(requestId as string);
    } else if (travelerId) {
      // Filter by traveler ID if provided
      offers = marketplaceService.getOffersForTraveler(travelerId as string);
    }
    
    // Filter by state if provided
    if (state) {
      offers = offers.filter(offer => offer.state === state);
    }
    
    // Apply limit if provided
    if (limit) {
      offers = offers.slice(0, parseInt(limit as string));
    }

    res.json({
      success: true,
      offers,
      count: offers.length
    });

  } catch (error) {
    console.error('[Marketplace] Error getting offers:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve offers'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/admin/matches
 * 
 * Get all matches (admin only)
 */
router.get('/admin/matches', async (req: Request, res: Response) => {
  try {
    const { buyerId, travelerId, state, limit } = req.query;
    
    let matches = [];
    
    // Filter by buyer ID if provided
    if (buyerId) {
      matches = marketplaceService.getMatchesForBuyer(buyerId as string);
    } else if (travelerId) {
      // Filter by traveler ID if provided
      matches = marketplaceService.getMatchesForTraveler(travelerId as string);
    }
    
    // Filter by state if provided
    if (state) {
      matches = matches.filter(match => match.state === state);
    }
    
    // Apply limit if provided
    if (limit) {
      matches = matches.slice(0, parseInt(limit as string));
    }

    res.json({
      success: true,
      matches,
      count: matches.length
    });

  } catch (error) {
    console.error('[Marketplace] Error getting matches:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve matches'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/admin/statistics
 * 
 * Get marketplace statistics (admin only)
 */
router.get('/admin/statistics', async (_req: Request, res: Response) => {
  try {
    const statistics = marketplaceService.getStatistics();
    
    res.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('[Marketplace] Error getting statistics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve marketplace statistics'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/admin/events
 * 
 * Get marketplace event log (admin only)
 */
router.get('/admin/events', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const events = marketplaceService.getEventLog(limit);
    
    res.json({
      success: true,
      events,
      count: events.length
    });

  } catch (error) {
    console.error('[Marketplace] Error getting events:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve marketplace events'
    });
  }
});

// ===== USER ENDPOINTS =====

/**
 * GET /api/v1/auction/marketplace/buyer-requests/:requestId
 * 
 * Get buyer request by ID
 */
router.get('/buyer-requests/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const request = marketplaceService.getBuyerRequest(requestId);

    if (!request) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Buyer request not found'
      });
    }

    res.json({
      success: true,
      request
    });

  } catch (error) {
    console.error('[Marketplace] Error getting buyer request:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve buyer request'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/buyer-requests/my/:buyerId
 * 
 * Get requests for buyer
 */
router.get('/buyer-requests/my/:buyerId', async (req: Request, res: Response) => {
  try {
    const { buyerId } = req.params;
    const requests = marketplaceService.getRequestsForBuyer(buyerId);

    res.json({
      success: true,
      requests,
      count: requests.length
    });

  } catch (error) {
    console.error('[Marketplace] Error getting buyer requests:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve buyer requests'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/pending-requests
 * 
 * Get pending requests for travelers
 */
router.get('/pending-requests', async (_req: Request, res: Response) => {
  try {
    const requests = marketplaceService.getPendingRequests();

    res.json({
      success: true,
      requests,
      count: requests.length
    });

  } catch (error) {
    console.error('[Marketplace] Error getting pending requests:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve pending requests'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/traveler-availabilities/:availabilityId
 * 
 * Get traveler availability by ID
 */
router.get('/traveler-availabilities/:availabilityId', async (req: Request, res: Response) => {
  try {
    const { availabilityId } = req.params;
    const availability = marketplaceService.getTravelerAvailability(availabilityId);

    if (!availability) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Traveler availability not found'
      });
    }

    res.json({
      success: true,
      availability
    });

  } catch (error) {
    console.error('[Marketplace] Error getting traveler availability:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve traveler availability'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/traveler-availabilities/my/:travelerId
 * 
 * Get availabilities for traveler
 */
router.get('/traveler-availabilities/my/:travelerId', async (req: Request, res: Response) => {
  try {
    const { travelerId } = req.params;
    const availabilities = marketplaceService.getAvailabilitiesForTraveler(travelerId);

    res.json({
      success: true,
      availabilities,
      count: availabilities.length
    });

  } catch (error) {
    console.error('[Marketplace] Error getting traveler availabilities:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve traveler availabilities'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/offers/request/:requestId
 * 
 * Get offers for request
 */
router.get('/offers/request/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const offers = marketplaceService.getOffersForRequest(requestId);

    res.json({
      success: true,
      offers,
      count: offers.length
    });

  } catch (error) {
    console.error('[Marketplace] Error getting offers for request:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve offers'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/offers/my/:travelerId
 * 
 * Get offers for traveler
 */
router.get('/offers/my/:travelerId', async (req: Request, res: Response) => {
  try {
    const { travelerId } = req.params;
    const offers = marketplaceService.getOffersForTraveler(travelerId);

    res.json({
      success: true,
      offers,
      count: offers.length
    });

  } catch (error) {
    console.error('[Marketplace] Error getting offers for traveler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve offers'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/matches/my/:buyerId
 * 
 * Get matches for buyer
 */
router.get('/matches/my/:buyerId', async (req: Request, res: Response) => {
  try {
    const { buyerId } = req.params;
    const matches = marketplaceService.getMatchesForBuyer(buyerId);

    res.json({
      success: true,
      matches,
      count: matches.length
    });

  } catch (error) {
    console.error('[Marketplace] Error getting matches for buyer:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve matches'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/matches/traveler/:travelerId
 * 
 * Get matches for traveler
 */
router.get('/matches/traveler/:travelerId', async (req: Request, res: Response) => {
  try {
    const { travelerId } = req.params;
    const matches = marketplaceService.getMatchesForTraveler(travelerId);

    res.json({
      success: true,
      matches,
      count: matches.length
    });

  } catch (error) {
    console.error('[Marketplace] Error getting matches for traveler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve matches'
    });
  }
});

/**
 * POST /api/v1/auction/marketplace/process-expired
 * 
 * Process expired requests and offers (system endpoint)
 */
router.post('/process-expired', async (_req: Request, res: Response) => {
  try {
    marketplaceService.processExpiredItems();

    res.json({
      success: true,
      message: 'Expired items processed successfully'
    });

  } catch (error) {
    console.error('[Marketplace] Error processing expired items:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process expired items'
    });
  }
});

/**
 * GET /api/v1/auction/marketplace/health
 * 
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const statistics = marketplaceService.getStatistics();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      statistics: {
        totalBuyerRequests: statistics.totalBuyerRequests,
        activeBuyerRequests: statistics.activeBuyerRequests,
        totalTravelerAvailabilities: statistics.totalTravelerAvailabilities,
        activeTravelerAvailabilities: statistics.activeTravelerAvailabilities,
        totalOffers: statistics.totalOffers,
        totalMatches: statistics.totalMatches
      }
    });

  } catch (error) {
    console.error('[Marketplace] Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: 'Health check failed'
    });
  }
});

export default router;
