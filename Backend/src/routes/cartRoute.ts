import express,{ Request,Response,NextFunction } from 'express';
import { adminRoute, authMiddleware } from '../middleware/authMiddleware';
import { addCartItem, removeCartItem,removeAllCartItems,getCartItems,updateQuantity } from '../controller/cartController';

const router = express.Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/', authMiddleware, asyncHandler(getCartItems));
router.post('/add', authMiddleware, asyncHandler(addCartItem));
router.post('/remove', authMiddleware, asyncHandler(removeCartItem));
router.post('/remove_all', authMiddleware, asyncHandler(removeAllCartItems));
router.post('/update_quantity', authMiddleware, asyncHandler(updateQuantity));

export default router;