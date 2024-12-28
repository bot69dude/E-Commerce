import mongoose from "mongoose";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../lib/redis";
import { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {AuthenticatedRequest} from "../middleware/authMiddleware";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  isAdmin: z.boolean().optional(),
  role: z.string().optional()
});

const generateToken = (userId: mongoose.Types.ObjectId) => {

  const accesstoken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: "15m",
  });

  const refreshtoken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: "7d",
  });

  return { accesstoken, refreshtoken };
};

const storeRefreshToken = async (
  userId: mongoose.Types.ObjectId,
  refreshToken: string
): Promise<void> => {
  try {
    await redis.set(
      `refresh_token:${userId}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60
    );
  } catch (error) {
    throw new Error("Failed to store refresh token in Redis");
  }
};

const setCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password,isAdmin,role } = registerSchema.parse(req.body);

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or username already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser: IUser = new User({ username, email, password: hashedPassword,isAdmin,role });
    await newUser.save();

    const { accesstoken, refreshtoken } = generateToken(newUser._id as mongoose.Types.ObjectId);

    await storeRefreshToken(newUser._id as mongoose.Types.ObjectId, refreshtoken as string);

    setCookies(res, accesstoken, refreshtoken);

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
      tokens: { accesstoken, refreshtoken },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({
      message: "Server error during registration",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if(user && await bcrypt.compare(password, user.password)){
      const { accesstoken, refreshtoken } = generateToken(user._id as mongoose.Types.ObjectId);

      await storeRefreshToken(user._id as mongoose.Types.ObjectId, refreshtoken as string);

      setCookies(res, accesstoken, refreshtoken);

      res.status(200).json({
        message: "Login successful",
        user: { id: user._id, username: user.username, email: user.email },
        tokens: { accesstoken, refreshtoken },
      });
    }
    else{
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error during login",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken ;
    if(refreshToken){
      const userId = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as JwtPayload;
      await redis.del(`refresh_token:${userId}`);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);

    res.status(500).json({
      message: "Server error during logout",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const { userId } = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as JwtPayload;

    const storedRefreshToken = await redis.get(`refresh_token:${userId}`);

    if (refreshToken !== storedRefreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const { accesstoken, refreshtoken } = generateToken(userId);

    await storeRefreshToken(userId, refreshtoken);

    setCookies(res, accesstoken, refreshtoken);

    res.status(200).json({ message: "Token refreshed" });
  } catch (error) {
    console.error("Refresh token error:", error);

    res.status(500).json({
      message: "Server error during token refresh",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export const getProfile = async (req:AuthenticatedRequest, res:Response) => {
	try {
		res.json(req.user);
	} catch (error) {
    console.error("Get profile error:", error);

		res.status(500).json({
      message: "Server error during token refresh",
      error: error instanceof Error ? error.message : "Unknown error",
    });
	}
};
