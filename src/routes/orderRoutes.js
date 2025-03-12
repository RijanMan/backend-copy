import express from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import {
  createOrder,
  getUserOrders,
  getOrderDetails,
  updateOrderStatus,
  getRestaurantOrders,
  cancelOrder,
  getSubscriptionOrders,
  getUpcomingSubscriptionOrders,
} from "../controllers/orderController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("user"),
  validate([
    body("restaurantId").isMongoId().withMessage("Invalid restaurant ID"),
    body("items").isArray().withMessage("Items must be an array"),
    body("items.*.itemId").isMongoId().withMessage("Invalid item ID"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    body("deliveryAddress")
      .isObject()
      .withMessage("Delivery address must be an object"),
    body("deliveryAddress.street").notEmpty().withMessage("Street is required"),
    body("deliveryAddress.city").notEmpty().withMessage("City is required"),
    body("deliveryAddress.state").notEmpty().withMessage("State is required"),
    body("deliveryAddress.zipCode")
      .notEmpty()
      .withMessage("Zip code is required"),
    body("paymentMethod")
      .isIn(["cash", "online"])
      .withMessage("Invalid payment method"),
  ]),
  createOrder
);

router.get("/user", protect, authorize("user"), getUserOrders);

router.get(
  "/subscription/:subscriptionId",
  protect,
  authorize("user"),
  getSubscriptionOrders
);

router.get(
  "/upcoming",
  protect,
  authorize("user"),
  getUpcomingSubscriptionOrders
);

router.get("/:id", protect, getOrderDetails);

router.post("/:id/cancel", protect, cancelOrder);

router.get(
  "/restaurant/:restaurantId",
  protect,
  authorize("vendor"),
  getRestaurantOrders
);

router.put(
  "/:id/status",
  protect,
  authorize("vendor"),
  validate([
    body("status")
      .isIn([
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ])
      .withMessage("Invalid status"),
    body("estimatedDeliveryTime")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format for estimated delivery time"),
  ]),
  updateOrderStatus
);

export default router;
