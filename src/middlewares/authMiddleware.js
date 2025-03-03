import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { errorResponse } from "../utils/responseHandler.js"; // Centralized response handling

export const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1]; // Extract token
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from DB (excluding password)
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return errorResponse(res, "Token expired, please log in again", 401);
      } else {
        return errorResponse(res, "Invalid token", 401);
      }
    }
  }

  // If no token, return an error immediately
  if (!token) {
    return errorResponse(res, "Not authorized to access this route", 401);
  }
};

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

export const adminOnly = (req, res, next) => {
  if (req.user.role === "admin") {
    next();
  } else {
    errorResponse(res, "Not authorized as an admin", 403);
  }
};
