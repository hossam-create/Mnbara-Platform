import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();
const requestController = new RequestController(
  // Services would be injected via dependency injection
  {} as any, // RequestService
  {} as any, // ProductExtractionService
  {} as any  // StateTransitionService
);

// Public routes (no authentication required for viewing available requests)
router.get('/available', authenticate, requestController.getAvailableRequests.bind(requestController));

// Protected routes (authentication required)
router.use(authenticate);

// Request CRUD operations
router.post('/', validateRequest.createRequest, requestController.createRequest.bind(requestController));
router.get('/', requestController.getRequests.bind(requestController));
router.get('/:id', requestController.getRequestById.bind(requestController));
router.put('/:id', validateRequest.updateRequest, requestController.updateRequest.bind(requestController));
router.delete('/:id', requestController.cancelRequest.bind(requestController));

// Request lifecycle operations
router.post('/:id/accept', validateRequest.acceptRequest, requestController.acceptRequest.bind(requestController));
router.put('/:id/status', validateRequest.updateStatus, requestController.updateDeliveryStatus.bind(requestController));

// Request timeline
router.get('/:id/timeline', requestController.getRequestTimeline.bind(requestController));

export default router;
