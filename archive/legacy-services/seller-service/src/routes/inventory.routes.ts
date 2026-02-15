import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';

const router = Router();
const controller = new InventoryController();

router.get('/:sellerId/inventory', controller.getOverview);
router.put('/:sellerId/inventory/:productId', controller.updateStock);
router.get('/:sellerId/inventory/low-stock', controller.getLowStock);
router.post('/:sellerId/inventory/bulk-update', controller.bulkUpdate);
router.put('/:sellerId/inventory/:productId/reorder', controller.setReorderPoint);

export default router;
