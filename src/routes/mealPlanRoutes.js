import express from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import {
  createMealPlan,
  getMealPlans,
  getMealPlan,
  updateMealPlan,
  deleteMealPlan,
} from "../controllers/mealPlanController.js";

const router = express.Router();

router.post(
  "/:restaurantId",
  protect,
  authorize("vendor"),
  upload.single("image"),
  validate([
    body("name").notEmpty().withMessage("Name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("duration")
      .isIn(["weekly", "monthly"])
      .withMessage("Invalid duration"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("mealOptions").isArray().withMessage("Meal options must be an array"),
    body("mealOptions.*")
      .isIn(["morning", "evening", "both"])
      .withMessage("Invalid meal option"),
    body("dietaryOptions")
      .optional()
      .isArray()
      .withMessage("Dietary options must be an array"),
    body("dietaryOptions.*")
      .optional()
      .isIn(["vegetarian", "vegan", "lactose-free", "gluten-free"])
      .withMessage("Invalid dietary option"),
    body("customizationAllowed")
      .optional()
      .isBoolean()
      .withMessage("Customization allowed must be a boolean"),
    body("maxSubscribers")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max subscribers must be at least 1"),
  ]),
  createMealPlan
);

router.get("/:restaurantId", getMealPlans);
router.get("/detail/:id", getMealPlan);

router.put(
  "/:id",
  protect,
  authorize("vendor"),
  upload.single("image"),
  validate([
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("description")
      .optional()
      .notEmpty()
      .withMessage("Description cannot be empty"),
    body("duration")
      .optional()
      .isIn(["weekly", "monthly"])
      .withMessage("Invalid duration"),
    body("price").optional().isNumeric().withMessage("Price must be a number"),
    body("mealOptions")
      .optional()
      .isArray()
      .withMessage("Meal options must be an array"),
    body("mealOptions.*")
      .optional()
      .isIn(["morning", "evening", "both"])
      .withMessage("Invalid meal option"),
    body("dietaryOptions")
      .optional()
      .isArray()
      .withMessage("Dietary options must be an array"),
    body("dietaryOptions.*")
      .optional()
      .isIn(["vegetarian", "vegan", "lactose-free", "gluten-free"])
      .withMessage("Invalid dietary option"),
    body("customizationAllowed")
      .optional()
      .isBoolean()
      .withMessage("Customization allowed must be a boolean"),
    body("maxSubscribers")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max subscribers must be at least 1"),
  ]),
  updateMealPlan
);

router.delete("/:id", protect, authorize("vendor"), deleteMealPlan);

export default router;
