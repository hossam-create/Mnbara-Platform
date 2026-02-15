import { Router } from 'express';
import { ImageController } from '../controllers/image.controller';
import { uploadMemory } from '../config/multer.config';

const router = Router();
const imageController = new ImageController();

// Upload routes
router.post('/upload/single', uploadMemory.single('image'), imageController.uploadSingle.bind(imageController));
router.post('/upload/multiple', uploadMemory.array('images', 10), imageController.uploadMultiple.bind(imageController));

// Processing routes
router.post('/thumbnails', uploadMemory.single('image'), imageController.generateThumbnails.bind(imageController));
router.post('/optimize', uploadMemory.single('image'), imageController.optimize.bind(imageController));
router.post('/convert', uploadMemory.single('image'), imageController.convert.bind(imageController));
router.post('/crop', uploadMemory.single('image'), imageController.crop.bind(imageController));
router.post('/rotate', uploadMemory.single('image'), imageController.rotate.bind(imageController));
router.post('/blur', uploadMemory.single('image'), imageController.blur.bind(imageController));
router.post('/grayscale', uploadMemory.single('image'), imageController.grayscale.bind(imageController));

// Metadata route
router.post('/metadata', uploadMemory.single('image'), imageController.getMetadata.bind(imageController));

export default router;
