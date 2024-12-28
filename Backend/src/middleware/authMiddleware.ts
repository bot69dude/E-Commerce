import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { IUser } from '../models/userModel';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

interface CustomJwtPayload extends JwtPayload {
  userId: string;
}

export const authMiddleware: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      res.status(401).json({ message: 'Unauthorized - No access token provided' });
      return;
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET as string) as CustomJwtPayload;
      
      if (!decoded.userId) {
        res.status(401).json({ message: 'Unauthorized - Invalid token payload' });
        return;
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        res.status(401).json({ message: 'Unauthorized - User not found' });
        return;
      }

      req.user = user;
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({ message: 'Unauthorized - Access token expired' });
        return;
      }

      console.error('JWT verification error:', error.message);
      res.status(401).json({ message: 'Unauthorized - Invalid access token' });
      return;
    }
  } catch (error: any) {
    console.error('Error in authMiddleware:', error.message);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const adminRoute = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden - Admin access required' });
  }
};