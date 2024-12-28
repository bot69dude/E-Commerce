import express, { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { registerUser,loginUser, logoutUser, refreshToken } from '../controller/userController';

const router = express.Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/register', asyncHandler(registerUser));
router.post('/login', asyncHandler(loginUser));
router.post('/logout',authMiddleware, asyncHandler(logoutUser));
router.post('/refresh_token', asyncHandler(refreshToken));

export default router;