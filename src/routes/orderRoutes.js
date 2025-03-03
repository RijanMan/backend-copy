import express from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import {
  createOrder,
  getUserOrders,
  getRestaurantOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("user"),
  validate([
    body("restaurantId").isMongoId().withMessage("Invalid restaurant ID"),
    body("items").isArray().withMessage("Items should be an array"),
    body("items.*.menuItem").isMongoId().withMessage("Invalid menu item ID"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    body("items.*.price").isNumeric().withMessage("Price must be a number"),
    body("totalAmount")
      .isNumeric()
      .withMessage("Total amount must be a number"),
    body("paymentMethod")
      .isIn(["cash", "credit card", "debit card", "online payment"])
      .withMessage("Invalid payment method"),
    body("deliveryAddress.street").notEmpty().withMessage("Street is required"),
    body("deliveryAddress.city").notEmpty().withMessage("City is required"),
    body("deliveryAddress.state").notEmpty().withMessage("State is required"),
    body("deliveryAddress.zipCode")
      .notEmpty()
      .withMessage("Zip code is required"),
  ]),
  createOrder
);

router.get("/user", protect, authorize("user"), getUserOrders);

router.get(
  "/restaurant/:restaurantId",
  protect,
  authorize("vendor"),
  getRestaurantOrders
);

router.put(
  "/:orderId/status",
  protect,
  authorize("vendor"),
  validate([
    body("status")
      .isIn(["pending", "preparing", "on the way", "delivered", "cancelled"])
      .withMessage("Invalid order status"),
  ]),
  updateOrderStatus
);

export default router;
