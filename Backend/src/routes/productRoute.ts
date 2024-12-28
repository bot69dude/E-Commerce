import express from 'express';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getRecommendedProducts,
  toggleFeaturedProduct,
} from '../controller/productController';
import { adminRoute, authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/', authMiddleware, adminRoute, asyncHandler(getAllProducts));
router.get('/featured', asyncHandler(getFeaturedProducts));
router.get('/category/:category', asyncHandler(getProductsByCategory));
router.get('/recommendations', asyncHandler(getRecommendedProducts));
router.post('/', authMiddleware, adminRoute, asyncHandler(createProduct));
router.patch('/:id', authMiddleware, adminRoute, asyncHandler(toggleFeaturedProduct));
router.delete('/:id', authMiddleware, adminRoute, asyncHandler(deleteProduct));

export default router;