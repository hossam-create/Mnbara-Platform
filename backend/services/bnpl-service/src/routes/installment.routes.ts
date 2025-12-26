import { Router } from 'express';
import { installmentController } from '../controllers/installment.controller';

const router = Router();

/**
 * @route POST /api/v1/installments
 * @desc Create new installment plan
 * @access Public
 */
router.post('/', installmentController.createInstallment);

/**
 * @route GET /api/v1/installments/:userId
 * @desc Get user's installments
 * @access Public
 */
router.get('/user/:userId', installmentController.getUserInstallments);

/**
 * @route GET /api/v1/installments/:id
 * @desc Get installment details
 * @access Public
 */
router.get('/:id', installmentController.getInstallmentDetails);

/**
 * @route PUT /api/v1/installments/:id
 * @desc Update installment status
 * @access Public
 */
router.put('/:id', installmentController.updateInstallment);

/**
 * @route GET /api/v1/installments/stats/overview
 * @desc Get installment statistics
 * @access Public
 */
router.get('/stats/overview', installmentController.getInstallmentStats);

export default router;
