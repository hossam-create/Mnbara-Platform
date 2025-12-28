import { Router } from 'express';
import { SeoController } from '../controllers/SeoController';

const router = Router();
const controller = new SeoController();

// Google Bot entry point
router.get('/sitemap.xml', (req, res) => controller.getSitemapIndex(req, res));
router.get('/sitemap/:id.xml', (req, res) => controller.getUrlSet(req, res));

export default router;
