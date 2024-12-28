import express from 'express';
import { createPayment, verifyPayment, getPaymentStatus, refundPayment } from '../controller/paymentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/create-payment', authMiddleware, asyncHandler(createPayment));
router.post('/verify-payment', asyncHandler(verifyPayment));
router.get('/payment-status/:paymentId', authMiddleware, asyncHandler(getPaymentStatus));
router.post('/refund-payment/:paymentId', authMiddleware, asyncHandler(refundPayment));

export default router;