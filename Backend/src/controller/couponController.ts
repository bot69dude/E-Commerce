import Coupon from "../models/couponModel";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const getCoupons = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const coupons = await Coupon.find({ userId: req.user._id, isActive: true });
    res.json(coupons);
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ message: 'Error getting coupons' });
  }
};

export const validateCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const coupon = await Coupon.findOne({ code, userId: req.user._id, isActive: true });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found or inactive' });
    }

    res.json(coupon);
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ message: 'Error validating coupon' });
  }
};

export const createCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, discountPercentage, expirationDate } = req.body;
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const newCoupon = new Coupon({
      code,
      discountPercentage,
      expirationDate,
      userId: req.user._id,
    });

    await newCoupon.save();
    res.status(201).json(newCoupon);
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ message: 'Error creating coupon' });
  }
};

export const deleteCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    await Coupon.findByIdAndDelete(id);
    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ message: 'Error deleting coupon' });
  }
};