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
  pauseSubscription,
  resumeSubscription,
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("user"),
  validate([
    body("mealPlanId").isMongoId().withMessage("Invalid meal plan ID"),
    body("selectedMealOptions")
      .isArray()
      .withMessage("Selected meal options must be an array"),
    body("selectedMealOptions.*")
      .isIn(["morning", "evening"])
      .withMessage("Invalid meal option"),
    body("dietaryPreferences")
      .optional()
      .isArray()
      .withMessage("Dietary preferences must be an array"),
    body("dietaryPreferences.*")
      .optional()
      .isIn(["vegetarian", "vegan", "lactose-free", "gluten-free"])
      .withMessage("Invalid dietary preference"),
    body("allergies")
      .optional()
      .isArray()
      .withMessage("Allergies must be an array"),
    body("customizations")
      .optional()
      .isObject()
      .withMessage("Customizations must be an object"),
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
    body("selectedMealOptions")
      .optional()
      .isArray()
      .withMessage("Selected meal options must be an array"),
    body("selectedMealOptions.*")
      .optional()
      .isIn(["morning", "evening"])
      .withMessage("Invalid meal option"),
    body("dietaryPreferences")
      .optional()
      .isArray()
      .withMessage("Dietary preferences must be an array"),
    body("dietaryPreferences.*")
      .optional()
      .isIn(["vegetarian", "vegan", "lactose-free", "gluten-free"])
      .withMessage("Invalid dietary preference"),
    body("allergies")
      .optional()
      .isArray()
      .withMessage("Allergies must be an array"),
    body("customizations")
      .optional()
      .isObject()
      .withMessage("Customizations must be an object"),
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
router.post("/:id/pause", protect, authorize("user"), pauseSubscription);
router.post("/:id/resume", protect, authorize("user"), resumeSubscription);

export default router;
