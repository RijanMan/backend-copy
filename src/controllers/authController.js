import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendVerificationEmail } from "../utils/mailer.js";
import crypto from "crypto";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

const ALLOWED_ROLES = ["user", "vendor", "rider", "admin"];

/**
 * Generates a JWT token for authentication.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" }); // Shortened expiry for better security
};

/**
 * Registers a new user.
 * Sends a verification email after registration.
 */
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

    // Check if the role is admin and if the request is comming from an existing admin
    if (role === "admin") {
      if (!req.user || req.user.role !== "admin") {
        return errorResponse(
          res,
          "Only an existing admin can create a new admin",
          403
        );
      }
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

/**
 * Logs in an existing user.
 */
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
    return successResponse(
      res,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
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

    return successResponse(res, {}, "Email verified successfully");
  } catch (error) {
    console.error("Email verification error:", error);
    return errorResponse(res, "Server error", 500);
  }
};
