// Supplier Routes - Wholesale B2B
// مسارات الموردين - البيع بالجملة

import { Router } from 'express';
import { supplierController } from '../controllers/supplier.controller';

const router = Router();

// Supplier CRUD
router.post('/register', supplierController.register.bind(supplierController));
router.get('/', supplierController.list.bind(supplierController));
router.get('/search', supplierController.search.bind(supplierController));
router.get('/user/:userId', supplierController.getByUserId.bind(supplierController));
router.get('/:id', supplierController.getById.bind(supplierController));
router.put('/:id', supplierController.update.bind(supplierController));

// Verification
router.post('/:id/verification', supplierController.submitVerification.bind(supplierController));
router.post('/:id/verify', supplierController.verify.bind(supplierController));

// Dashboard
router.get('/:id/dashboard', supplierController.getDashboard.bind(supplierController));

export default router;
