import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import { restaurantValidationRules } from "../middlewares/commonValidations.js";
import { uploadRestaurantImages } from "../middlewares/uploadMiddleware.js";
import {
  createRestaurant,
  getRestaurants,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant,
  searchRestaurants,
} from "../controllers/restaurantController.js";
import {
  getRestaurantAnalytics,
  getRestaurantReport,
  updateRestaurantHours,
} from "../controllers/vendorController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("vendor"),
  uploadRestaurantImages,
  validate(restaurantValidationRules),
  createRestaurant
);

router.get("/", getRestaurants);
router.get("/search", searchRestaurants);
router.get("/:id", getRestaurant);

router.put(
  "/:id",
  protect,
  authorize("vendor"),
  uploadRestaurantImages,
  validate(restaurantValidationRules),
  updateRestaurant
);

router.delete("/:id", protect, authorize("vendor"), deleteRestaurant);

router.get(
  "/:restaurantId/analytics",
  protect,
  authorize("vendor"),
  getRestaurantAnalytics
);

router.get(
  "/:restaurantId/report",
  protect,
  authorize("vendor"),
  getRestaurantReport
);

router.put(
  "/:restaurantId/hours",
  protect,
  authorize("vendor"),
  validate([
    // Add validation rules for opening hours
  ]),
  updateRestaurantHours
);
export default router;
