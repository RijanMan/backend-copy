import express from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import {
  createCustomizationRequest,
  getUserCustomizationRequests,
  getRestaurantCustomizationRequests,
  getCustomizationRequestDetails,
  updateCustomizationRequestStatus,
  createCustomMealPlan,
} from "../controllers/customizationRequestController.js";

const router = express.Router();

// User routes
router.post(
  "/",
  protect,
  authorize("user"),
  validate([
    body("restaurantId").isMongoId().withMessage("Invalid restaurant ID"),
    body("dietaryPreferences")
      .isArray()
      .withMessage("Dietary preferences must be an array"),
    body("dietaryPreferences.*")
      .isIn(["vegetarian", "vegan", "non-vegetarian"])
      .withMessage("Invalid dietary preference"),
    body("allergies")
      .optional()
      .isArray()
      .withMessage("Allergies must be an array"),
    body("mealTimes").isArray().withMessage("Meal times must be an array"),
    body("mealTimes.*")
      .isIn(["morning", "evening", "both"])
      .withMessage("Invalid meal time"),
    body("additionalRequirements")
      .optional()
      .isString()
      .withMessage("Additional requirements must be a string"),
    body("caloriePreference")
      .optional()
      .isIn(["low", "medium", "high", "none"])
      .withMessage("Invalid calorie preference"),
  ]),
  createCustomizationRequest
);

router.get("/", protect, authorize("user"), getUserCustomizationRequests);
router.get("/:id", protect, getCustomizationRequestDetails);

// Vendor routes
router.get(
  "/restaurant/:restaurantId",
  protect,
  authorize("vendor"),
  getRestaurantCustomizationRequests
);
router.put(
  "/:id/status",
  protect,
  authorize("vendor"),
  validate([
    body("status").isIn(["approved", "rejected"]).withMessage("Invalid status"),
    body("rejectionReason")
      .if(body("status").equals("rejected"))
      .notEmpty()
      .withMessage("Rejection reason is required"),
  ]),
  updateCustomizationRequestStatus
);

router.post(
  "/:customizationRequestId/meal-plan",
  protect,
  authorize("vendor"),
  validate([
    body("name").notEmpty().withMessage("Meal plan name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("duration")
      .optional()
      .isIn(["weekly", "monthly"])
      .withMessage("Invalid duration"),
    body("weeklyMenu").isArray().withMessage("Weekly menu must be an array"),
  ]),
  createCustomMealPlan
);

export default router;
