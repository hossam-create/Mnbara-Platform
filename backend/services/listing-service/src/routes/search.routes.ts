import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';

const router = Router();
const searchController = new SearchController();

// Search listings
router.get('/', (req, res) => searchController.search(req, res));

export default router;
