import { Router } from 'express';
import { TranslationController } from '../controllers/translation.controller';

const router = Router();
const translationController = new TranslationController();

// Translation CRUD
router.post('/', translationController.upsertTranslation.bind(translationController));
router.get('/:key', translationController.getTranslation.bind(translationController));
router.delete('/:key', translationController.deleteTranslation.bind(translationController));

// Namespace translations
router.get('/namespace/:namespace', translationController.getNamespaceTranslations.bind(translationController));

// All translations
router.get('/', translationController.getAllTranslations.bind(translationController));

// Translate
router.post('/translate', translationController.translate.bind(translationController));
router.post('/translate/batch', translationController.batchTranslate.bind(translationController));

// Search
router.get('/search', translationController.searchTranslations.bind(translationController));

// Missing translations
router.get('/missing', translationController.getMissingTranslations.bind(translationController));

// Statistics
router.get('/stats', translationController.getStatistics.bind(translationController));

export default router;
