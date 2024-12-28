import mongoose from "mongoose";
import Product from "../models/productModel";
import { Request,Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const addCartItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (!user.cartItems) {
            user.cartItems = [];
        }

        const cartItem = user.cartItems.find(
            (item) => item.product.toString() === productId
        );

        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            user.cartItems.push({ product: productId, quantity: 1 });
        }

        await user.save();
        res.json(user.cartItems);

    } catch (error) {
        console.error('Add cart item error:', error);
        
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ message: 'Invalid data provided' });
        }
        
        res.status(500).json({ message: 'Error adding item to cart' });
    }
};

export const removeCartItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        if (!user.cartItems) {
            return res.status(400).json({ message: 'No items in cart' });
        }

        user.cartItems = user.cartItems.filter(
            (item) => item.product.toString() !== productId
        );

        await user.save();
        res.json(user.cartItems);

    } catch (error) {
        console.error('Remove cart item error:', error);
        
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ message: 'Invalid data provided' });
        }
        
        res.status(500).json({ message: 'Error removing item from cart' });
    }
};

export const removeAllCartItems = async (req: AuthenticatedRequest, res: Response) => {
    try{
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        user.cartItems = [];
        await user.save();
        res.json(user.cartItems);
    }catch(error){
        console.error('Remove all cart items error:', error);
        
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ message: 'Invalid data provided' });
        }
        
        res.status(500).json({ message: 'Error removing all items from cart' });
    }
};

export const updateQuantity = async (req: AuthenticatedRequest, res: Response) => {
    try{
        const { id: productId } = req.params;
        const { quantity } = req.body;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        if (!user.cartItems) {
            return res.status(400).json({ message: 'No items in cart' });
        }

        const existingCartItem = user.cartItems.find(
            (item) => item.product.toString() === productId
        );

        if(existingCartItem){
            if(quantity === 0){
                user.cartItems = user.cartItems.filter((item) => item.product.toString() !== productId);
                await user.save();
				return res.json(user.cartItems);
			}
            existingCartItem.quantity = quantity;
            await user.save();
            return res.json(user.cartItems);
        }else{
            return res.status(404).json({ message: 'Item not found in cart' });
        }
            
    }catch(error){
        console.error('Update quantity error:', error);
        
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ message: 'Invalid data provided' });
        }
        
        res.status(500).json({ message: 'Error updating item quantity' });
    }
};

export const getCartItems = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
  
      if (!user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      if (!user.cartItems || user.cartItems.length === 0) {
        return res.status(400).json({ message: 'No items in cart' });
      }
  
      const productIds = user.cartItems.map(item => item.product);
      const products = await Product.find({ _id: { $in: productIds } }).lean();
      console.log(products);
  
      const cartItems = user.cartItems.map((item) => {
        const product = products.find((product) => product._id.toString() === item.product.toString());
        return { ...item, product };
      });
  
      res.json(cartItems);
    } catch (error) {
      console.error('Get cart items error:', error);
      res.status(500).json({ message: 'Error getting cart items' });
    }
};