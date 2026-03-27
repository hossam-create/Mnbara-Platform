import { Router } from 'express';
import { LanguageController } from '../controllers/language.controller';

const router = Router();
const languageController = new LanguageController();

// Language CRUD
router.post('/', languageController.createLanguage.bind(languageController));
router.get('/', languageController.getLanguages.bind(languageController));
router.get('/default', languageController.getDefaultLanguage.bind(languageController));
router.get('/:code', languageController.getLanguage.bind(languageController));
router.put('/:code', languageController.updateLanguage.bind(languageController));
router.delete('/:code', languageController.deleteLanguage.bind(languageController));

// Toggle
router.post('/:code/toggle', languageController.toggleLanguage.bind(languageController));

export default router;
