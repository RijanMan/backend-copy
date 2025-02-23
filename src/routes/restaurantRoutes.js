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

export default router;
