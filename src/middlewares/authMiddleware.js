import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { errorResponse } from "../utils/responseHandler.js"; // Centralized response handling

/**
 * Middleware to protect routes that require authentication.
 * Verifies the JWT token and attaches the user to the request object.
 */
export const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return errorResponse(res, "Not authorized, no token", 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB (excluding password)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return errorResponse(res, "User not found", 404);
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return errorResponse(res, "Token expired, please log in again", 401);
    } else {
      return errorResponse(res, "Invalid token", 401);
    }
  }
};

/**
 * Middleware to restrict access to specific roles.
 * @param {...string} roles - The roles allowed to access the route.
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `User role ${req.user?.role} is not authorized to access this route`,
        403
      );
    }
    next();
  };
};
