import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
    _id: mongoose.Types.ObjectId;
    code: string;
    discountPercentage: number;
    userId: mongoose.Schema.Types.ObjectId;
    isActive: boolean;
    expirationDate: Date;
}

const couponSchema: Schema<ICoupon> = new Schema({
  code: { type: String, required: true },
  discountPercentage: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  isActive: { type: Boolean, default: true },
  expirationDate: { type: Date, required: true },
});

const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);
export default Coupon;