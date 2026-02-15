// Rule Routes - مسارات القواعد

import { Router } from 'express';
import { ruleController } from '../controllers/rule.controller';

const router = Router();

// Rule Management
router.get('/', ruleController.getRules);
router.post('/', ruleController.createRule);
router.put('/:ruleId', ruleController.updateRule);
router.delete('/:ruleId', ruleController.deleteRule);
router.patch('/:ruleId/toggle', ruleController.toggleRule);

export { router as ruleRoutes };
