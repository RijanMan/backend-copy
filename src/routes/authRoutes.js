import express from "express";
import {
  register,
  registerAdmin,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { validate } from "../middlewares/validationMiddleware.js";
import { body } from "express-validator";
import { authLimiter } from "../middlewares/rateLimitMiddleware.js";
import { userValidationRules } from "../middlewares/commonValidations.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  validate([
    ...userValidationRules,
    body("role").isIn(["user", "vendor", "rider"]).withMessage("Invalid role"),
  ]),
  register
);

router.post(
  "/register-admin",
  protect,
  adminOnly,
  validate(userValidationRules),
  registerAdmin
);

router.post(
  "/login",
  authLimiter,
  validate([
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  login
);

router.get("/verify-email/:token", verifyEmail);

router.post("/forgot-password", forgotPassword);

router.post(
  "/reset-password/:token",
  validate([
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ]),
  resetPassword
);

export default router;
