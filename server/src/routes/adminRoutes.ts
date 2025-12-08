import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { adminController } from '../controllers/adminController';

const router = Router();

router.use(requireAuth);

router.get('/brands', adminController.listBrands);
router.post('/brands', adminController.createBrand);
router.put('/brands/:brandKey', adminController.updateBrand);

router.get('/stores', adminController.listStores);
router.post('/stores', adminController.createStore);
router.put('/stores/:storeId', adminController.updateStore);

router.get('/promotions', adminController.listPromotions);
router.post('/promotions', adminController.createPromotion);
router.put('/promotions/:promoId', adminController.updatePromotion);
router.post('/promotions/:promoId/publish', adminController.publishPromotion);
router.post('/promotions/:promoId/cancel', adminController.cancelPromotion);
router.get('/promotions/:promoId/quota', adminController.promotionQuota);
router.get('/promotions/:promoId/exclusions', adminController.getPromotionExclusions);
router.put('/promotions/:promoId/exclusions', adminController.setPromotionExclusions);

export default router;


