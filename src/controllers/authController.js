import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/mailer.js";
import crypto from "crypto";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

const ALLOWED_ROLES = ["user", "vendor", "rider"];

//  Generates a JWT token for authentication.
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" }); // Shortened expiry for better security
};

//  Registers a new user.

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if all required fields are provided
    if (!name || !email || !password) {
      return errorResponse(res, "Please provide all required fields", 400);
    }

    // Check if the role is valid
    if (!ALLOWED_ROLES.includes(role)) {
      return errorResponse(res, "Invalid role", 400);
    }

    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return errorResponse(res, "User already exists", 400);
    }

    // Create a new user
    const user = new User({ name, email, password, role });
    const verificationToken = user.generateVerificationToken();
    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    return successResponse(
      res,
      {
        message:
          "User registered successfully. Please check your email to verify your account.",
      },
      201
    );
  } catch (error) {
    return errorResponse(res, "Server error", 500);
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, "Please provide all required fields", 400);
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return errorResponse(res, "User already exists", 400);
    }

    const user = new User({ name, email, password, role: "admin" });
    const verificationToken = user.generateVerificationToken();
    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    successResponse(
      res,
      {
        message:
          "Admin registered successfully. Please check your email to verify your account.",
      },
      201
    );
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return errorResponse(res, "Invalid credentials", 401);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, "Invalid credentials", 401);
    }

    if (!user.isEmailVerified) {
      return errorResponse(
        res,
        "Please verify your email before logging in",
        401
      );
    }

    const token = generateToken(user._id);

    let restaurantInfo = null;
    if (user.role === "vendor") {
      const restaurant = await Restaurant.findOne({ owner: user._id });
      restaurantInfo = restaurant
        ? { id: restaurant._id, name: restaurant.name }
        : null;
    }

    return successResponse(
      res,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
        restaurantInfo,
      },
      "Login successful"
    );
  } catch (error) {
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * Verifies a user's email using a token.
 */
export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, "Invalid or expired verification token", 400);
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    successResponse(res, { message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    return errorResponse(res, "Server error", 500);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    successResponse(res, { message: "Password reset email sent" });
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, "Invalid or expired reset token", 400);
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    successResponse(res, { message: "Password reset successful" });
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};
