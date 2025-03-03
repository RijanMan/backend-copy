import express from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import {
  createReview,
  getReviews,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("user"),
  validate([
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment").notEmpty().withMessage("Comment is required"),
    body("reviewedItem").isMongoId().withMessage("Invalid reviewed item ID"),
    body("itemType")
      .isIn(["Restaurant", "MealPlan", "Order"])
      .withMessage("Invalid item type"),
  ]),
  createReview
);

router.get("/:itemType/:itemId", getReviews);

router.put(
  "/:id",
  protect,
  authorize("user"),
  validate([
    body("rating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment")
      .optional()
      .notEmpty()
      .withMessage("Comment cannot be empty"),
  ]),
  updateReview
);

router.delete("/:id", protect, authorize("user"), deleteReview);

export default router;
