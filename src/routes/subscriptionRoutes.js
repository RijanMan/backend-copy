import express from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import {
  createSubscription,
  getUserSubscriptions,
  getSubscription,
  updateSubscription,
  cancelSubscription,
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("user"),
  validate([
    body("mealPlanId").isMongoId().withMessage("Invalid meal plan ID"),
    body("selectedDietType")
      .isIn(["vegetarian", "vegan", "non-vegetarian"])
      .withMessage("Invalid diet type"),
    body("selectedMealTimes")
      .isArray()
      .withMessage("Selected meal times must be an array"),
    body("selectedMealTimes.*")
      .isIn(["morning", "evening", "both"])
      .withMessage("Invalid meal time"),
    body("paymentMethod")
      .isIn(["credit card", "debit card", "online payment"])
      .withMessage("Invalid payment method"),
    body("deliveryAddress")
      .isObject()
      .withMessage("Delivery address must be an object"),
    body("deliveryAddress.street").notEmpty().withMessage("Street is required"),
    body("deliveryAddress.city").notEmpty().withMessage("City is required"),
    body("deliveryAddress.state").notEmpty().withMessage("State is required"),
    body("deliveryAddress.zipCode")
      .notEmpty()
      .withMessage("Zip code is required"),
    body("deliveryInstructions")
      .optional()
      .isString()
      .withMessage("Delivery instructions must be a string"),
  ]),
  createSubscription
);

router.get("/", protect, authorize("user"), getUserSubscriptions);

router.get("/:id", protect, authorize("user"), getSubscription);

router.put(
  "/:id",
  protect,
  authorize("user"),
  validate([
    body("selectedMealTimes")
      .optional()
      .isArray()
      .withMessage("Selected meal times must be an array"),
    body("selectedMealTimes.*")
      .optional()
      .isIn(["morning", "evening", "both"])
      .withMessage("Invalid meal time"),
    body("deliveryAddress")
      .optional()
      .isObject()
      .withMessage("Delivery address must be an object"),
    body("deliveryInstructions")
      .optional()
      .isString()
      .withMessage("Delivery instructions must be a string"),
  ]),
  updateSubscription
);

router.post("/:id/cancel", protect, authorize("user"), cancelSubscription);

export default router;
