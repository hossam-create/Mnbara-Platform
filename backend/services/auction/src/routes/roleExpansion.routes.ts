import { Router, Request, Response } from 'express';
import { roleExpansionService } from '../services/RoleExpansion.service';
import { SellerApplicationRequest, StoreCreationRequest, FulfillmentMethodRequest } from '../types/RoleExpansion.types';

/**
 * Role Expansion Routes - BACKEND ONLY
 * 
 * Implements ROLE EXPANSION inside marketplace
 * Buyer → Seller → Storefront Transition System
 * 
 * ABSOLUTE RULES:
 * - Frontend has ZERO authority
 * - Role transitions are BACKEND ONLY
 * - No wallet, escrow, or payout mutations here
 * - Seller identity is SEPARATE from buyer activity
 * - Every transition is logged
 * - No silent role upgrades
 */

const router = Router();

// ===== BUYER → SELLER ACTIVATION =====

/**
 * POST /api/v1/auction/role-expansion/seller-applications
 * 
 * Create seller application (Buyer → Seller activation)
 * Buyer requests to become Seller and submits basic seller profile info
 */
router.post('/seller-applications', async (req: Request, res: Response) => {
  try {
    const application: SellerApplicationRequest = {
      displayName: req.body.displayName,
      businessName: req.body.businessName,
      country: req.body.country,
      city: req.body.city,
      fulfillmentType: req.body.fulfillmentType,
      description: req.body.description,
      contactEmail: req.body.contactEmail,
      phone: req.body.phone,
      website: req.body.website,
      socialLinks: req.body.socialLinks
    };

    const userId = req.body.userId; // Would come from auth middleware

    // Validate required fields
    if (!application.displayName || !application.country || !application.contactEmail || !application.fulfillmentType) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: displayName, country, contactEmail, fulfillmentType'
      });
    }

    // Create seller application
    const result = roleExpansionService.createSellerApplication(application, userId);

    if (result.success) {
      res.status(201).json({
        success: true,
        sellerProfile: result.sellerProfile,
        requiresVerification: result.requiresVerification
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[RoleExpansion] Error creating seller application:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create seller application'
    });
  }
});

/**
 * GET /api/v1/auction/role-expansion/seller-profiles/:sellerId
 * 
 * Get seller profile by ID
 */
router.get('/seller-profiles/:sellerId', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const sellerProfile = roleExpansionService.getSellerProfile(sellerId);

    if (!sellerProfile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller profile not found'
      });
    }

    res.json({
      success: true,
      sellerProfile
    });

  } catch (error) {
    console.error('[RoleExpansion] Error getting seller profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve seller profile'
    });
  }
});

/**
 * GET /api/v1/auction/role-expansion/seller-profiles/user/:userId
 * 
 * Get seller profile by user ID
 */
router.get('/seller-profiles/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const sellerProfile = roleExpansionService.getSellerProfileByUserId(userId);

    if (!sellerProfile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller profile not found for this user'
      });
    }

    res.json({
      success: true,
      sellerProfile
    });

  } catch (error) {
    console.error('[RoleExpansion] Error getting seller profile by user ID:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve seller profile'
    });
  }
});

// ===== SELLER DASHBOARD (READ ONLY FINANCIAL) =====

/**
 * GET /api/v1/auction/role-expansion/seller-dashboard/:sellerId
 * 
 * Get seller dashboard (READ ONLY financial)
 * Seller capabilities: Create auctions, View listings, View sales status, View settlements (READ ONLY)
 */
router.get('/seller-dashboard/:sellerId', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const dashboard = roleExpansionService.getSellerDashboard(sellerId);

    if (!dashboard) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller dashboard not found'
      });
    }

    res.json({
      success: true,
      dashboard
    });

  } catch (error) {
    console.error('[RoleExpansion] Error getting seller dashboard:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve seller dashboard'
    });
  }
});

// ===== EXTERNAL SELLER / STORE MODE =====

/**
 * POST /api/v1/auction/role-expansion/stores
 * 
 * Create store (External Seller / Store mode)
 * External Seller can register as SELLER without buyer history and can create STORE entity
 */
router.post('/stores', async (req: Request, res: Response) => {
  try {
    const storeRequest: StoreCreationRequest = {
      ownerId: req.body.ownerId,
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description,
      logo: req.body.logo,
      banner: req.body.banner,
      country: req.body.country,
      city: req.body.city,
      address: req.body.address,
      contactEmail: req.body.contactEmail,
      phone: req.body.phone,
      website: req.body.website,
      fulfillmentType: req.body.fulfillmentType,
      settings: req.body.settings
    };

    // Validate required fields
    if (!storeRequest.name || !storeRequest.slug || !storeRequest.description || 
        !storeRequest.country || !storeRequest.contactEmail || !storeRequest.fulfillmentType) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: name, slug, description, country, contactEmail, fulfillmentType'
      });
    }

    // Create store
    const result = roleExpansionService.createStore(storeRequest);

    if (result.success) {
      res.status(201).json({
        success: true,
        store: result.store,
        requiresVerification: result.requiresVerification
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[RoleExpansion] Error creating store:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create store'
    });
  }
});

/**
 * GET /api/v1/auction/role-expansion/stores/:storeId
 * 
 * Get store by ID
 */
router.get('/stores/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const store = roleExpansionService.getStore(storeId);

    if (!store) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Store not found'
      });
    }

    res.json({
      success: true,
      store
    });

  } catch (error) {
    console.error('[RoleExpansion] Error getting store:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve store'
    });
  }
});

/**
 * GET /api/v1/auction/role-expansion/stores/slug/:slug
 * 
 * Get store by slug
 */
router.get('/stores/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const store = roleExpansionService.getStoreBySlug(slug);

    if (!store) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Store not found'
      });
    }

    res.json({
      success: true,
      store
    });

  } catch (error) {
    console.error('[RoleExpansion] Error getting store by slug:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve store'
    });
  }
});

/**
 * GET /api/v1/auction/role-expansion/stores/owner/:ownerId
 * 
 * Get stores by owner
 */
router.get('/stores/owner/:ownerId', async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;
    const stores = roleExpansionService.getStoresByOwner(ownerId);

    res.json({
      success: true,
      stores,
      count: stores.length
    });

  } catch (error) {
    console.error('[RoleExpansion] Error getting stores by owner:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve stores'
    });
  }
});

// ===== SHIPPING & FULFILLMENT SIGNALS (NO LOGIC) =====

/**
 * POST /api/v1/auction/role-expansion/fulfillment-methods
 * 
 * Create fulfillment method signal (Shipping & Fulfillment signals - NO LOGIC)
 * Seller defines fulfillment method: Traveler delivery, Direct shipping
 * NO shipping cost calculation, NO label generation, NO logistics automation
 */
router.post('/fulfillment-methods', async (req: Request, res: Response) => {
  try {
    const fulfillmentRequest: FulfillmentMethodRequest = {
      sellerId: req.body.sellerId,
      listingId: req.body.listingId,
      method: req.body.method,
      configuration: req.body.configuration,
      restrictions: req.body.restrictions
    };

    // Validate required fields
    if (!fulfillmentRequest.sellerId || !fulfillmentRequest.listingId || !fulfillmentRequest.method) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: sellerId, listingId, method'
      });
    }

    // Create fulfillment method signal
    const result = roleExpansionService.createFulfillmentMethodSignal(fulfillmentRequest);

    if (result.success) {
      res.status(201).json({
        success: true,
        fulfillmentMethod: result.fulfillmentMethod
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[RoleExpansion] Error creating fulfillment method signal:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create fulfillment method signal'
    });
  }
});

/**
 * GET /api/v1/auction/role-expansion/fulfillment-methods/:signalId
 * 
 * Get fulfillment method by ID
 */
router.get('/fulfillment-methods/:signalId', async (req: Request, res: Response) => {
  try {
    const { signalId } = req.params;
    const fulfillmentMethod = roleExpansionService.getFulfillmentMethod(signalId);

    if (!fulfillmentMethod) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Fulfillment method not found'
      });
    }

    res.json({
      success: true,
      fulfillmentMethod
    });

  } catch (error) {
    console.error('[RoleExpansion] Error getting fulfillment method:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve fulfillment method'
    });
  }
});

/**
 * GET /api/v1/auction/role-expansion/fulfillment-methods/seller/:sellerId
 * 
 * Get fulfillment methods by seller
 */
router.get('/fulfillment-methods/seller/:sellerId', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const fulfillmentMethods = roleExpansionService.getFulfillmentMethodsBySeller(sellerId);

    res.json({
      success: true,
      fulfillmentMethods,
      count: fulfillmentMethods.length
    });

  } catch (error) {
    console.error('[RoleExpansion] Error getting fulfillment methods by seller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve fulfillment methods'
    });
  }
});

/**
 * GET /api/v1/auction/role-expansion/fulfillment-methods/listing/:listingId
 * 
 * Get fulfillment methods by listing
 */
router.get('/fulfillment-methods/listing/:listingId', async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;
    const fulfillmentMethods = roleExpansionService.getFulfillmentMethodsByListing(listingId);

    res.json({
      success: true,
      fulfillmentMethods,
      count: fulfillmentMethods.length
    });

  } catch (error) {
    console.error('[RoleExpansion] Error getting fulfillment methods by listing:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve fulfillment methods'
    });
  }
});

// ===== ADMIN VISIBILITY (READ ONLY) =====

/**
 * GET /api/v1/auction/role-expansion/admin/seller-profiles
 * 
 * Get all seller profiles (admin only)
 * View seller profiles, NO editing, NO role forcing, NO financial actions
 */
router.get('/admin/seller-profiles', async (req: Request, res: Response) => {
  try {
    const { state, limit } = req.query;
    
    // This would be implemented in service to get all profiles with filtering
    const profiles = []; // Placeholder - would get from service
    
    // Filter by state if provided
    if (state) {
      // profiles = profiles.filter(profile => profile.state === state);
    }
    
    // Apply limit if provided
    if (limit) {
      // profiles = profiles.slice(0, parseInt(limit as string));
    }

    res.json({
      success: true,
      profiles,
      count: profiles.length
    });

  } catch (error) {
    console.error('[RoleExpansion] Error getting seller profiles:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve seller profiles'
    });
  }
});

/**
 * GET /api/v1/auction/role-expansion/admin/stores
 * 
 * Get all stores (admin only)
 * View stores, NO editing, NO role forcing, NO financial actions
 */
router.get('/admin/stores', async (req: Request, res: Response) => {
  try {
    const { state, limit } = req.query;
    
    // This would be implemented in service to get all stores with filtering
    const stores = []; // Placeholder - would get from service
    
    // Filter by state if provided
    if (state) {
      // stores = stores.filter(store => store.state === state);
    }
    
    // Apply limit if provided
    if (limit) {
      // stores = stores.slice(0, parseInt(limit as string));
    }

    res.json({
      success: true,
      stores,
      count: stores.length
    });

  } catch (error) {
    console.error('[RoleExpansion] Error getting stores:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve stores'
    });
  }
});

/**
 * POST /api/v1/auction/role-expansion/admin/seller-profiles/:sellerId/activate
 * 
 * Activate seller profile (admin only)
 */
router.post('/admin/seller-profiles/:sellerId/activate', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const { approvedBy } = req.body;

    // Validate required fields
    if (!approvedBy) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: approvedBy'
      });
    }

    // Activate seller
    const result = roleExpansionService.activateSeller(sellerId, approvedBy);

    if (result.success) {
      res.json({
        success: true,
        message: 'Seller profile activated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[RoleExpansion] Error activating seller profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to activate seller profile'
    });
  }
});

/**
 * POST /api/v1/auction/role-expansion/admin/stores/:storeId/activate
 * 
 * Activate store (admin only)
 */
router.post('/admin/stores/:storeId/activate', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { approvedBy } = req.body;

    // Validate required fields
    if (!approvedBy) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: approvedBy'
      });
    }

    // Activate store
    const result = roleExpansionService.activateStore(storeId, approvedBy);

    if (result.success) {
      res.json({
        success: true,
        message: 'Store activated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[RoleExpansion] Error activating store:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to activate store'
    });
  }
});

/**
 * POST /api/v1/auction/role-expansion/admin/seller-profiles/:sellerId/suspend
 * 
 * Suspend seller profile (admin only)
 */
router.post('/admin/seller-profiles/:sellerId/suspend', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;

    // Validate required fields
    if (!reason) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: reason'
      });
    }

    // Suspend seller
    const result = roleExpansionService.suspendSeller(sellerId, reason);

    if (result.success) {
      res.json({
        success: true,
        message: 'Seller profile suspended successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[RoleExpansion] Error suspending seller profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to suspend seller profile'
    });
  }
});

/**
 * GET /api/v1/auction/role-expansion/admin/statistics
 * 
 * Get role expansion statistics (admin only)
 */
router.get('/admin/statistics', async (_req: Request, res: Response) => {
  try {
    const statistics = roleExpansionService.getStatistics();
    
    res.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('[RoleExpansion] Error getting statistics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve role expansion statistics'
    });
  }
});

/**
 * GET /api/v1/auction/role-expansion/admin/events
 * 
 * Get role expansion event log (admin only)
 */
router.get('/admin/events', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const events = roleExpansionService.getEventLog(limit);
    
    res.json({
      success: true,
      events,
      count: events.length
    });

  } catch (error) {
    console.error('[RoleExpansion] Error getting events:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve role expansion events'
    });
  }
});

/**
 * GET /api/v1/auction/role-expansion/health
 * 
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const statistics = roleExpansionService.getStatistics();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      statistics: {
        totalSellers: statistics.totalSellers,
        activeSellers: statistics.activeSellers,
        totalStores: statistics.totalStores,
        activeStores: statistics.activeStores,
        pendingSellerApplications: statistics.pendingSellerApplications,
        pendingStoreApplications: statistics.pendingStoreApplications
      }
    });

  } catch (error) {
    console.error('[RoleExpansion] Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: 'Health check failed'
    });
  }
});

export default router;
