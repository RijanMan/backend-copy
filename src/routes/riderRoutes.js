import express from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import {
  updateAvailability,
  updateLocation,
  getAvailableOrders,
  acceptOrder,
  updateOrderStatus,
  getRiderEarnings,
} from "../controllers/riderController.js";

const router = express.Router();

router.put(
  "/availability",
  protect,
  authorize("rider"),
  validate([
    body("isAvailable")
      .isBoolean()
      .withMessage("isAvailable must be a boolean"),
  ]),
  updateAvailability
);

router.put(
  "/location",
  protect,
  authorize("rider"),
  validate([
    body("latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Invalid latitude"),
    body("longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid longitude"),
  ]),
  updateLocation
);

router.get(
  "/available-orders",
  protect,
  authorize("rider"),
  getAvailableOrders
);

router.post("/accept-order/:orderId", protect, authorize("rider"), acceptOrder);

router.put(
  "/update-order-status/:orderId",
  protect,
  authorize("rider"),
  validate([
    body("status")
      .isIn(["out_for_delivery", "delivered"])
      .withMessage("Invalid status"),
  ]),
  updateOrderStatus
);

router.get("/earnings", protect, authorize("rider"), getRiderEarnings);

export default router;
