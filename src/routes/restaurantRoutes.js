import express from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
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
  validate([
    body("name").notEmpty().withMessage("Restaurant name is required"),
    body("cuisine").notEmpty().withMessage("Cuisine type is required"),
    body("address.street").notEmpty().withMessage("Street address is required"),
    body("address.city").notEmpty().withMessage("City is required"),
    body("address.state").notEmpty().withMessage("State is required"),
    body("address.zipCode").notEmpty().withMessage("Zip code is required"),
    body("phone").notEmpty().withMessage("Phone number is required"),
  ]),
  createRestaurant
);

router.get("/", getRestaurants);
router.get("/search", searchRestaurants);
router.get("/:id", getRestaurant);

router.put(
  "/:id",
  protect,
  authorize("vendor"),
  validate([
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Restaurant name cannot be empty"),
    body("cuisine")
      .optional()
      .notEmpty()
      .withMessage("Cuisine type cannot be empty"),
    body("address.street")
      .optional()
      .notEmpty()
      .withMessage("Street address cannot be empty"),
    body("address.city")
      .optional()
      .notEmpty()
      .withMessage("City cannot be empty"),
    body("address.state")
      .optional()
      .notEmpty()
      .withMessage("State cannot be empty"),
    body("address.zipCode")
      .optional()
      .notEmpty()
      .withMessage("Zip code cannot be empty"),
    body("phone")
      .optional()
      .notEmpty()
      .withMessage("Phone number cannot be empty"),
  ]),
  updateRestaurant
);

router.delete("/:id", protect, authorize("vendor"), deleteRestaurant);

export default router;
