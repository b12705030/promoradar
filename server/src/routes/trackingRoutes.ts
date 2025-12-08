import { Router } from 'express';
import { trackingController } from '../controllers/trackingController';

const router = Router();

router.post('/track', trackingController.track);

export default router;

