import express from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import {
  updateAvailability,
  getAvailableOrders,
  acceptOrder,
  updateOrderStatus,
  getRiderOrders,
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

router.get(
  "/available-orders",
  protect,
  authorize("rider"),
  getAvailableOrders
);

router.post("/accept-order/:orderId", protect, authorize("rider"), acceptOrder);

router.get("/orders", protect, authorize("rider"), getRiderOrders);

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

export default router;
