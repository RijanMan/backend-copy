import express from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  validate([
    body("recipient").isMongoId().withMessage("Invalid recipient ID"),
    body("type")
      .isIn(["order_update", "subscription_reminder", "promotion", "system"])
      .withMessage("Invalid notification type"),
    body("title").notEmpty().withMessage("Title is required"),
    body("message").notEmpty().withMessage("Message is required"),
    body("relatedOrder").optional().isMongoId().withMessage("Invalid order ID"),
    body("relatedSubscription")
      .optional()
      .isMongoId()
      .withMessage("Invalid subscription ID"),
  ]),
  createNotification
);

router.get("/", protect, getUserNotifications);

router.put("/:id/read", protect, markNotificationAsRead);

router.delete("/:id", protect, deleteNotification);

export default router;
