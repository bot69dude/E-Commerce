import { Request, Response } from 'express';
import * as crypto from 'crypto';
import Order from '../models/orderModel';
import { razorpayInstance } from '../lib/razorpay';
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

export const createPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, currency = 'INR', notes = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const receipt = `rcpt_${Date.now().toString().slice(-8)}_${req.user?._id?.toString().slice(-8)}`;

    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt,
      notes: {
        ...notes,
        userId: req.user?._id?.toString() || '',
      },
    });

    res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      order_id: order.id,
      prefill: {
        name: req.user?.username,
        email: req.user?.email,
      },
      notes: order.notes
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Payment creation failed'
    });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const [payment, order] = await Promise.all([
      razorpayInstance.payments.fetch(razorpay_payment_id),
      razorpayInstance.orders.fetch(razorpay_order_id)
    ]);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const newOrder = await Order.create([{
        user: order.notes?.userId,
        products: [], // Add products if necessary
        totalAmount: Number(order.amount) / 100, // Ensure amount is a number
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: payment.status,
        paymentStatus: 'paid',
        createdAt: new Date()
      }], { session });

      await session.commitTransaction();
      res.status(200).json({
        success: true,
        order: newOrder[0]._id,
        status: payment.status
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Payment verification failed'
    });
  }
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const payment = await razorpayInstance.payments.fetch(paymentId);

    res.status(200).json({
      status: payment.status,
      amount: Number(payment.amount) / 100, // Ensure amount is a number
      currency: payment.currency,
      method: payment.method
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch payment status'
    });
  }
};

export const refundPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { amount, notes } = req.body;

    const refund = await razorpayInstance.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
      notes
    });

    const order = await Order.findOneAndUpdate(
      { razorpayPaymentId: paymentId },
      { $set: { status: 'refunded', refundId: refund.id } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      refundId: refund.id,
      status: refund.status,
      order: order?._id
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Refund failed'
    });
  }
};