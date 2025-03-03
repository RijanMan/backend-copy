import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  getSystemAnalytics,
  getAllUsers,
  updateUserStatus,
  getAllRestaurants,
  updateRestaurantStatus,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/analytics", protect, authorize("admin"), getSystemAnalytics);
router.get("/users", protect, authorize("admin"), getAllUsers);
router.put(
  "/users/:userId/status",
  protect,
  authorize("admin"),
  updateUserStatus
);
router.get("/restaurants", protect, authorize("admin"), getAllRestaurants);
router.put(
  "/restaurants/:restaurantId/status",
  protect,
  authorize("admin"),
  updateRestaurantStatus
);

export default router;
