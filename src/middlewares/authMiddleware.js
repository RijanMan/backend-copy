import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { errorResponse } from "../utils/responseHandler.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        return errorResponse(res, "Not authorized, token is missing", 401);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTimestamp) {
        return errorResponse(res, "Token has expired, please login again", 401);
      }

      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      if (error.name === "JsonWebTokenError") {
        return errorResponse(res, "Invalid token", 401);
      } else if (error.name === "TokenExpiredError") {
        return errorResponse(res, "Token has expired, please login again", 401);
      }
      errorResponse(res, "Not authorized", 401);
    }
  } else {
    errorResponse(res, "Not authorized, no token provided", 401);
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
