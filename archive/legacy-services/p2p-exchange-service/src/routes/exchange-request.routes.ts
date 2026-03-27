import { Router } from 'express';
import { ExchangeRequestController } from '../controllers/exchange-request.controller';
import {
  createRequestValidator,
  getRequestValidator,
  getUserRequestsValidator,
  cancelRequestValidator,
} from '../validators/exchange-request.validator';

const router = Router();
const controller = new ExchangeRequestController();

/**
 * @route   POST /api/v1/exchange/requests
 * @desc    Create a new exchange request
 * @access  Private
 */
router.post('/', createRequestValidator, controller.createRequest);

/**
 * @route   GET /api/v1/exchange/requests/:id
 * @desc    Get a single exchange request
 * @access  Private
 */
router.get('/:id', getRequestValidator, controller.getRequest);

/**
 * @route   GET /api/v1/exchange/requests
 * @desc    Get user's exchange requests
 * @access  Private
 */
router.get('/', getUserRequestsValidator, controller.getUserRequests);

/**
 * @route   DELETE /api/v1/exchange/requests/:id
 * @desc    Cancel an exchange request
 * @access  Private
 */
router.delete('/:id', cancelRequestValidator, controller.cancelRequest);

export default router;
