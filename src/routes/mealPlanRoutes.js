import express from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import {
  createMealPlan,
  getMealPlans,
  getMealPlanDetails,
  updateMealPlan,
  toggleMealPlanStatus,
  deleteMealPlan,
  getUserCustomMealPlans,
  createCustomMealPlan,
} from "../controllers/mealPlanController.js";

const router = express.Router();

// Public routes
router.get("/restaurant/:restaurantId", getMealPlans);
router.get("/:id", getMealPlanDetails);

// User routes
router.get("/custom/user", protect, authorize("user"), getUserCustomMealPlans);

// Vendor routes
router.post(
  "/restaurant/:restaurantId",
  protect,
  authorize("vendor"),
  upload.single("mealPlanImage"),
  validate([
    body("name").notEmpty().withMessage("Meal plan name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("tier")
      .isIn(["regular", "custom", "business"])
      .withMessage("Invalid tier"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("duration")
      .optional()
      .isIn(["weekly", "monthly"])
      .withMessage("Invalid duration"),
    body("maxSubscribers")
      .optional()
      .isNumeric()
      .withMessage("Max subscribers must be a number"),
    body("weeklyMenu").isArray().withMessage("Weekly menu must be an array"),
  ]),
  createMealPlan
);

router.post(
  "/custom/:customizationRequestId",
  protect,
  authorize("vendor"),
  upload.single("mealPlanImage"),
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

router.put(
  "/:id",
  protect,
  authorize("vendor"),
  upload.single("image"),
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
  updateMealPlan
);

router.put(
  "/:id/toggle-status",
  protect,
  authorize("vendor"),
  toggleMealPlanStatus
);

router.delete("/:id", protect, authorize("vendor"), deleteMealPlan);

export default router;
