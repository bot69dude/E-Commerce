import { redis } from "../lib/redis";
import Product from "../models/productModel";
import cloudinary from "../lib/cloudinary";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        console.error("Get products error:", error);
    
        res.status(500).json({
            message: "Server error during get products",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getFeaturedProducts = async (req: Request, res: Response) => {
    try {
        let featuredProducts = await redis.get("featuredProducts");

        if (featuredProducts) {
            return res.json(JSON.parse(featuredProducts));
        }

        const products = await Product.find({ isFeatured: true });

        if (!products){
            return res.status(404).json({ message: "No featured products found" });
        }

        await redis.set("featuredProducts", JSON.stringify(products), "EX", 60); // Cache for Future Use

        res.status(200).json(products);
    } catch (error) {
        console.error("Get featured products error:", error);
    
        res.status(500).json({
            message: "Server error during get featured products",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, price, countInStock, ImageUrl, Category, isFeatured } = req.body;

    let cloudinaryResponse = null;

    if (ImageUrl) {
      try {
        cloudinaryResponse = await cloudinary.uploader.upload(ImageUrl, { folder: 'products' });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(400).json({
          message: 'Image upload failed. Please provide a valid image URL.',
          error: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        });
      }
    }

    const product = new Product({
      name,
      description,
      price,
      countInStock,
      ImageUrl: cloudinaryResponse?.secure_url || '',
      Category,
      isFeatured,
    });

    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      message: 'Server error during product creation',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.ImageUrl) {
            const publicId = product.ImageUrl ? product.ImageUrl.split("/").pop()?.split(".")[0] : "";
			try {
				await cloudinary.uploader.destroy(`products/${publicId}`);
				console.log("deleted image from cloduinary");
			} catch (error) {
				console.log("error deleting image from cloduinary", error);
			}
		}

        const Deleteproduct = await Product.findByIdAndDelete(req.params.id);

        res.json({ message: "Product removed", product: Deleteproduct });
    } catch (error) {
        console.error("Delete product error:", error);
    
        res.status(500).json({
            message: "Server error during delete product",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

export const getRecommendedProducts = async (req: Request, res: Response) => {
    try{
        const products = await Product.aggregate([
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					name: 1,
					description: 1,
					ImageUrl: 1,
					price: 1,
				},
			},
		]);

		res.json(products);
	}catch(error){
        console.error("Get recommended products error:", error);
    
        res.status(500).json({
            message: "Server error during get recommended products",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
    try {
        const { category } = req.params;
        const products = await Product.find({ Category: category });
        res.json(products);
    } catch (error) {
        console.error("Get products by category error:", error);
    
        res.status(500).json({
            message: "Server error during get products by category",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const toggleFeaturedProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.isFeatured = !product.isFeatured;

        const updatedProduct = await product.save();

        res.json(updatedProduct);
    } catch (error) {
        console.error("Toggle featured product error:", error);
    
        res.status(500).json({
            message: "Server error during toggle featured product",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(product);
    } catch (error) {
        console.error("Get product by id error:", error);
    
        res.status(500).json({
            message: "Server error during get product by id",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const updateFeaturedProductsCache = async (req: Request, res: Response) => {
    try{
        const products = await Product.find({ isFeatured: true }).lean();

        if (!products){
            return res.status(404).json({ message: "No featured products found" });
        }

        await redis.set("featuredProducts", JSON.stringify(products)); // Cache for Future Use

        res.status(200).json(products);
    }catch(error){
        console.error("Update featured products cache error:", error);
    
        res.status(500).json({
            message: "Server error during update featured products cache",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};