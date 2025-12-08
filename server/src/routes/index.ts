import { Router } from 'express';
import authRoutes from './authRoutes';
import promotionRoutes from './promotionRoutes';
import userRoutes from './userRoutes';
import adminRoutes from './adminRoutes';
import trackingRoutes from './trackingRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/promotions', promotionRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/', trackingRoutes); // trackingRoutes 已經有 /track 路徑

export default router;

