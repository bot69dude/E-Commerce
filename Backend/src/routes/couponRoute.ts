import express from 'express';
import { getCoupons, validateCoupon, createCoupon, deleteCoupon } from '../controller/couponController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/', authMiddleware, asyncHandler(getCoupons));
router.post('/validate', authMiddleware, asyncHandler(validateCoupon));
router.post('/', authMiddleware, asyncHandler(createCoupon));
router.delete('/:id', authMiddleware, asyncHandler(deleteCoupon));

export default router;