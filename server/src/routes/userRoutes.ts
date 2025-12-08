import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { userController } from '../controllers/userController';

const router = Router();

router.use(requireAuth);

router.get('/profile', userController.profile);
router.get('/favorites/brands', userController.listBrandFavorites);
router.post('/favorites/brands', userController.addBrandFavorite);
router.delete('/favorites/brands', userController.clearBrandFavorites);
router.delete('/favorites/brands/:brandName', userController.removeBrandFavorite);

router.get('/favorites/promotions', userController.listPromotionFavorites);
router.post('/favorites/promotions', userController.addPromotionFavorite);
router.delete('/favorites/promotions', userController.clearPromotionFavorites);
router.delete('/favorites/promotions/:promoId', userController.removePromotionFavorite);
router.get('/admin-brands', userController.adminBrands);
router.get('/promotion-usage', userController.promotionUsage);
router.get('/rankings', userController.userRankings);

export default router;


