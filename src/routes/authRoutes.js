import express from "express";
import { register, login, verifyEmail } from "../controllers/authController.js";
import { validate } from "../middlewares/validationMiddleware.js";
import { body } from "express-validator";
import { authLimiter } from "../middlewares/rateLimitMiddleware.js";
import { userValidationRules } from "../middlewares/commonValidations.js";

const router = express.Router();

router.post(
  "/register",
  validate([
    ...userValidationRules,
    body("role")
      .isIn(["user", "vendor", "rider", "admin"])
      .withMessage("Invalid role"),
  ]),
  register
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

export default router;
