import mongoose, { Schema, Document, Types } from "mongoose";

interface ICartItem {
  quantity: number;
  product: Types.ObjectId; 
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  cartItems?: ICartItem[];
  role?: "customer" | "admin";
}

// User Schema Definition
const userSchema: Schema<IUser> = new Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    cartItems: [
      {
        quantity: {
          type: Number,
          default: 1,
        },
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product", // Reference to the Product model
          required: true,
        },
      },
    ],
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
