import express from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import {
  createPayment,
  getPaymentById,
  getUserPayments,
  updatePaymentStatus,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("user"),
  validate([
    body("amount").isNumeric().withMessage("Amount must be a number"),
    body("paymentMethod")
      .isIn(["credit card", "debit card", "online payment"])
      .withMessage("Invalid payment method"),
    body("relatedOrder").optional().isMongoId().withMessage("Invalid order ID"),
    body("relatedSubscription")
      .optional()
      .isMongoId()
      .withMessage("Invalid subscription ID"),
  ]),
  createPayment
);

router.get("/user", protect, authorize("user"), getUserPayments);

router.get("/:id", protect, getPaymentById);

router.put(
  "/:id/status",
  protect,
  authorize("admin"),
  validate([
    body("status")
      .isIn(["pending", "completed", "failed"])
      .withMessage("Invalid payment status"),
  ]),
  updatePaymentStatus
);

export default router;
