import { Router } from 'express';
import { promotionController } from '../controllers/promotionController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/', promotionController.list);
router.get('/dataset', promotionController.dataset);
router.get('/:id', promotionController.detail);
router.post('/:id/claim', requireAuth, promotionController.claim);

export default router;

