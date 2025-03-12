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
} from "../controllers/vendorController.js";

const router = express.Router();

//create restaurant
router.post(
  "/",
  protect,
  authorize("vendor"),
  uploadRestaurantImages,
  validate(restaurantValidationRules),
  createRestaurant
);

//get all restaurants 
router.get("/", getRestaurants);

//search restaurants
router.get("/search", searchRestaurants);

//get restaurant by id(admin and vendor)
router.get("/:id", getRestaurant);

//update restaurant (vendor only)
router.put(
  "/:id",
  protect,
  authorize("vendor"),
  uploadRestaurantImages,
  validate(restaurantValidationRules),
  updateRestaurant
);

//delete restaurant by id (vendor only)
router.delete("/:id", protect, authorize("vendor"), deleteRestaurant);

//get restaurant analytics
router.get(
  "/:restaurantId/analytics",
  protect,
  authorize("vendor"),
  getRestaurantAnalytics
);

//get restaurant report (vendor only)
router.get(
  "/:restaurantId/report",
  protect,
  authorize("vendor"),
  getRestaurantReport
);

export default router;
